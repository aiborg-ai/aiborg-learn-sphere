-- ============================================================================
-- ADMIN FAMILY PASS MANAGEMENT
-- ============================================================================
-- Allows admins to manually grant/revoke Family Pass access
-- Hybrid model: Admin can grant, but Stripe cancellations can revoke
-- Created: October 22, 2025
-- ============================================================================

-- Create admin_family_pass_grants table
CREATE TABLE IF NOT EXISTS public.admin_family_pass_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and admin relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Status and dates
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Timestamps
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  auto_renew BOOLEAN NOT NULL DEFAULT false,

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (end_date > start_date),
  CHECK (status = 'inactive' OR (status = 'active' AND end_date >= start_date)),
  CHECK (status = 'inactive' OR revoked_at IS NULL),
  CHECK (status = 'active' OR revoked_by IS NOT NULL OR revoked_at IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_admin_family_pass_grants_user_id
  ON public.admin_family_pass_grants(user_id);

CREATE INDEX idx_admin_family_pass_grants_status
  ON public.admin_family_pass_grants(status);

CREATE INDEX idx_admin_family_pass_grants_end_date
  ON public.admin_family_pass_grants(end_date)
  WHERE status = 'active';

CREATE INDEX idx_admin_family_pass_grants_granted_by
  ON public.admin_family_pass_grants(granted_by);

-- Partial unique index: Only one active grant per user at a time
CREATE UNIQUE INDEX idx_admin_family_pass_grants_unique_active_user
  ON public.admin_family_pass_grants(user_id)
  WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.admin_family_pass_grants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all family pass grants"
  ON public.admin_family_pass_grants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert family pass grants"
  ON public.admin_family_pass_grants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update family pass grants"
  ON public.admin_family_pass_grants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view their own family pass grants"
  ON public.admin_family_pass_grants
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has active admin family pass grant
CREATE OR REPLACE FUNCTION public.check_admin_family_pass_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_family_pass_grants
    WHERE user_id = p_user_id
    AND status = 'active'
    AND start_date <= NOW()
    AND end_date >= NOW()
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$;

-- Function to get combined membership status (Stripe OR admin grant)
CREATE OR REPLACE FUNCTION public.get_combined_membership_status(p_user_id UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  source TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stripe_access BOOLEAN;
  v_stripe_expires TIMESTAMP WITH TIME ZONE;
  v_admin_access BOOLEAN;
  v_admin_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check Stripe subscription
  SELECT
    EXISTS (
      SELECT 1
      FROM public.membership_subscriptions
      WHERE user_id = p_user_id
      AND status IN ('trialing', 'active')
      AND (
        (trial_end IS NOT NULL AND trial_end > NOW())
        OR (current_period_end IS NOT NULL AND current_period_end > NOW())
      )
    ),
    COALESCE(
      (SELECT trial_end FROM public.membership_subscriptions
       WHERE user_id = p_user_id AND status IN ('trialing', 'active')
       ORDER BY created_at DESC LIMIT 1),
      (SELECT current_period_end FROM public.membership_subscriptions
       WHERE user_id = p_user_id AND status IN ('trialing', 'active')
       ORDER BY created_at DESC LIMIT 1)
    )
  INTO v_stripe_access, v_stripe_expires;

  -- Check admin grant
  SELECT
    EXISTS (
      SELECT 1
      FROM public.admin_family_pass_grants
      WHERE user_id = p_user_id
      AND status = 'active'
      AND start_date <= NOW()
      AND end_date >= NOW()
    ),
    (SELECT end_date FROM public.admin_family_pass_grants
     WHERE user_id = p_user_id AND status = 'active'
     ORDER BY created_at DESC LIMIT 1)
  INTO v_admin_access, v_admin_expires;

  -- Return combined result
  IF v_stripe_access THEN
    RETURN QUERY SELECT true, 'stripe'::TEXT, v_stripe_expires;
  ELSIF v_admin_access THEN
    RETURN QUERY SELECT true, 'admin_grant'::TEXT, v_admin_expires;
  ELSE
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$;

-- Function to automatically revoke expired grants (call via cron or trigger)
CREATE OR REPLACE FUNCTION public.auto_revoke_expired_grants()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  UPDATE public.admin_family_pass_grants
  SET
    status = 'inactive',
    revoked_at = NOW(),
    updated_at = NOW()
  WHERE status = 'active'
  AND end_date < NOW();

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

  RETURN v_revoked_count;
END;
$$;

-- Function to sync Stripe cancellations with admin grants (hybrid logic)
CREATE OR REPLACE FUNCTION public.sync_stripe_cancellations_to_admin_grants()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  -- Revoke admin grants if user's Stripe subscription is canceled/past_due
  UPDATE public.admin_family_pass_grants ag
  SET
    status = 'inactive',
    revoked_at = NOW(),
    updated_at = NOW(),
    notes = COALESCE(ag.notes || E'\n\n', '') ||
            'Auto-revoked due to Stripe subscription cancellation on ' ||
            NOW()::TEXT
  FROM public.membership_subscriptions ms
  WHERE ag.user_id = ms.user_id
  AND ag.status = 'active'
  AND ms.status IN ('canceled', 'past_due', 'unpaid', 'incomplete_expired')
  AND ms.canceled_at IS NOT NULL;

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

  RETURN v_revoked_count;
END;
$$;

-- Function to grant family pass (used by admin UI)
CREATE OR REPLACE FUNCTION public.grant_admin_family_pass(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_notes TEXT DEFAULT NULL,
  p_auto_renew BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_grant_id UUID;
  v_existing_grant_id UUID;
BEGIN
  -- Get admin user ID
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_admin_id AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: admin role required';
  END IF;

  -- Verify dates
  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;

  -- Check if user already has an active grant
  SELECT id INTO v_existing_grant_id
  FROM public.admin_family_pass_grants
  WHERE user_id = p_user_id AND status = 'active';

  IF v_existing_grant_id IS NOT NULL THEN
    -- Deactivate existing grant
    UPDATE public.admin_family_pass_grants
    SET
      status = 'inactive',
      revoked_by = v_admin_id,
      revoked_at = NOW(),
      updated_at = NOW(),
      notes = COALESCE(notes || E'\n\n', '') ||
              'Replaced by new grant on ' || NOW()::TEXT
    WHERE id = v_existing_grant_id;
  END IF;

  -- Insert new grant
  INSERT INTO public.admin_family_pass_grants (
    user_id,
    granted_by,
    status,
    start_date,
    end_date,
    notes,
    auto_renew,
    granted_at
  ) VALUES (
    p_user_id,
    v_admin_id,
    'active',
    p_start_date,
    p_end_date,
    p_notes,
    p_auto_renew,
    NOW()
  ) RETURNING id INTO v_grant_id;

  RETURN v_grant_id;
END;
$$;

-- Function to revoke family pass grant
CREATE OR REPLACE FUNCTION public.revoke_admin_family_pass(
  p_grant_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get admin user ID
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_admin_id AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: admin role required';
  END IF;

  -- Update grant
  UPDATE public.admin_family_pass_grants
  SET
    status = 'inactive',
    revoked_by = v_admin_id,
    revoked_at = NOW(),
    updated_at = NOW(),
    notes = COALESCE(notes || E'\n\n', '') ||
            COALESCE('Revoked: ' || p_reason, 'Revoked by admin on ' || NOW()::TEXT)
  WHERE id = p_grant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grant not found: %', p_grant_id;
  END IF;
END;
$$;

-- Function to update grant dates
CREATE OR REPLACE FUNCTION public.update_admin_family_pass_dates(
  p_grant_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get admin user ID
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_admin_id AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: admin role required';
  END IF;

  -- Verify dates
  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;

  -- Update grant
  UPDATE public.admin_family_pass_grants
  SET
    start_date = p_start_date,
    end_date = p_end_date,
    updated_at = NOW()
  WHERE id = p_grant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grant not found: %', p_grant_id;
  END IF;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_family_pass_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_admin_family_pass_timestamp
  BEFORE UPDATE ON public.admin_family_pass_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_family_pass_timestamp();

-- Add comments
COMMENT ON TABLE public.admin_family_pass_grants IS
  'Admin-controlled Family Pass grants - allows manual activation independent of Stripe subscriptions';

COMMENT ON COLUMN public.admin_family_pass_grants.status IS
  'Grant status: active (user has access), inactive (revoked or expired)';

COMMENT ON COLUMN public.admin_family_pass_grants.auto_renew IS
  'If true, grant should be automatically extended monthly (requires manual implementation)';

COMMENT ON FUNCTION public.check_admin_family_pass_access IS
  'Returns true if user has an active admin-granted Family Pass within the date range';

COMMENT ON FUNCTION public.get_combined_membership_status IS
  'Returns combined membership status checking both Stripe subscriptions and admin grants';

COMMENT ON FUNCTION public.auto_revoke_expired_grants IS
  'Automatically deactivates expired grants - call via cron job';

COMMENT ON FUNCTION public.sync_stripe_cancellations_to_admin_grants IS
  'Hybrid logic: Revokes admin grants when Stripe subscription is canceled - call via webhook or cron';

COMMENT ON FUNCTION public.grant_admin_family_pass IS
  'Grants Family Pass access to a user - replaces any existing active grant';

COMMENT ON FUNCTION public.revoke_admin_family_pass IS
  'Revokes an admin-granted Family Pass';

COMMENT ON FUNCTION public.update_admin_family_pass_dates IS
  'Updates start and end dates for an existing grant';
