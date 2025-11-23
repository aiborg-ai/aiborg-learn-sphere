-- Migration: Vault Subscription Claims System (CORRECTED)
-- Description: Allows FHOAI Vault subscribers to claim free Family Pass access
-- Instructions: Copy this entire file and paste it into Supabase Dashboard → SQL Editor → Run
-- Date: 2025-11-22

-- ============================================================================
-- TABLE: vault_subscribers
-- Description: Track verified FHOAI Vault subscribers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vault_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_vault_subscribers_email ON public.vault_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_vault_subscribers_active ON public.vault_subscribers(is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: vault_subscription_claims
-- Description: Store claim requests from vault subscribers for free Family Pass
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vault_subscription_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (may be null if not authenticated during submission)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,

  -- Vault subscription details
  vault_email TEXT NOT NULL,
  vault_subscription_end_date TIMESTAMP WITH TIME ZONE,
  declaration_accepted BOOLEAN NOT NULL DEFAULT false,

  -- Family members to be added (stored as JSON array)
  family_members JSONB DEFAULT '[]'::jsonb,

  -- Request status and workflow
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  admin_notes TEXT,
  rejection_reason TEXT,

  -- Admin actions
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Link to granted family pass (after approval)
  family_pass_grant_id UUID REFERENCES public.admin_family_pass_grants(id) ON DELETE SET NULL,

  -- Metadata for additional information
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate pending claims from same email (using partial unique index)
CREATE UNIQUE INDEX idx_unique_pending_claim_per_email
ON public.vault_subscription_claims(user_email)
WHERE status = 'pending';

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vault_claims_status ON public.vault_subscription_claims(status);
CREATE INDEX IF NOT EXISTS idx_vault_claims_user_email ON public.vault_subscription_claims(user_email);
CREATE INDEX IF NOT EXISTS idx_vault_claims_vault_email ON public.vault_subscription_claims(vault_email);
CREATE INDEX IF NOT EXISTS idx_vault_claims_created_at ON public.vault_subscription_claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_claims_reviewed_at ON public.vault_subscription_claims(reviewed_at DESC) WHERE reviewed_at IS NOT NULL;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_vault_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vault_claims_timestamp
  BEFORE UPDATE ON public.vault_subscription_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vault_claims_updated_at();

CREATE TRIGGER trigger_update_vault_subscribers_timestamp
  BEFORE UPDATE ON public.vault_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vault_claims_updated_at();

-- ============================================================================
-- FUNCTION: submit_vault_claim
-- Description: Create a new vault subscription claim request
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_vault_claim(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_name TEXT,
  p_vault_email TEXT,
  p_vault_subscription_end_date TIMESTAMP WITH TIME ZONE,
  p_family_members JSONB DEFAULT '[]'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_claim_id UUID;
  v_existing_claim UUID;
BEGIN
  -- Check if user already has a pending or approved claim
  SELECT id INTO v_existing_claim
  FROM public.vault_subscription_claims
  WHERE user_email = p_user_email
    AND status IN ('pending', 'approved')
  LIMIT 1;

  IF v_existing_claim IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an active claim request';
  END IF;

  -- Validate family members count (max 6)
  IF jsonb_array_length(p_family_members) > 6 THEN
    RAISE EXCEPTION 'Cannot add more than 6 family members';
  END IF;

  -- Create the claim
  INSERT INTO public.vault_subscription_claims (
    user_id,
    user_email,
    user_name,
    vault_email,
    vault_subscription_end_date,
    declaration_accepted,
    family_members,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_user_email,
    p_user_name,
    p_vault_email,
    p_vault_subscription_end_date,
    true,
    p_family_members,
    'pending',
    p_metadata
  )
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: approve_vault_claim
-- Description: Approve a claim and automatically grant Family Pass access
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_vault_claim(
  p_claim_id UUID,
  p_admin_user_id UUID,
  p_grant_end_date TIMESTAMP WITH TIME ZONE,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_claim RECORD;
  v_grant_id UUID;
  v_user_id UUID;
BEGIN
  -- Fetch the claim
  SELECT * INTO v_claim
  FROM public.vault_subscription_claims
  WHERE id = p_claim_id;

  IF v_claim IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.status != 'pending' THEN
    RAISE EXCEPTION 'Claim is not in pending status';
  END IF;

  -- Get or create user_id if not exists
  v_user_id := v_claim.user_id;

  -- If user_id is null, try to find user by email
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_claim.user_email
    LIMIT 1;
  END IF;

  -- Grant Family Pass using existing admin grant function
  IF v_user_id IS NOT NULL THEN
    -- Check if admin_family_pass_grants table exists and grant access
    INSERT INTO public.admin_family_pass_grants (
      user_id,
      granted_by,
      start_date,
      end_date,
      status,
      notes
    ) VALUES (
      v_user_id,
      p_admin_user_id,
      NOW(),
      p_grant_end_date,
      'active',
      COALESCE(p_admin_notes, 'Granted via FHOAI Vault subscription claim')
    )
    RETURNING id INTO v_grant_id;
  END IF;

  -- Update the claim status
  UPDATE public.vault_subscription_claims
  SET
    status = 'approved',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW(),
    admin_notes = p_admin_notes,
    family_pass_grant_id = v_grant_id
  WHERE id = p_claim_id;

  -- Add to vault_subscribers if not already there
  INSERT INTO public.vault_subscribers (
    email,
    subscription_end_date,
    is_active
  ) VALUES (
    v_claim.vault_email,
    v_claim.vault_subscription_end_date,
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    subscription_end_date = EXCLUDED.subscription_end_date,
    last_verified_at = NOW(),
    is_active = true;

  RETURN v_grant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: reject_vault_claim
-- Description: Reject a claim with reason
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_vault_claim(
  p_claim_id UUID,
  p_admin_user_id UUID,
  p_rejection_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_claim RECORD;
BEGIN
  -- Fetch the claim
  SELECT * INTO v_claim
  FROM public.vault_subscription_claims
  WHERE id = p_claim_id;

  IF v_claim IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.status != 'pending' THEN
    RAISE EXCEPTION 'Claim is not in pending status';
  END IF;

  -- Update the claim status
  UPDATE public.vault_subscription_claims
  SET
    status = 'rejected',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes
  WHERE id = p_claim_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: check_vault_subscription_status
-- Description: Check if a vault subscription is active
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_vault_subscription_status(p_email TEXT)
RETURNS TABLE (
  is_active BOOLEAN,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  has_pending_claim BOOLEAN,
  has_approved_claim BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(vs.is_active, false) AS is_active,
    vs.subscription_end_date,
    EXISTS(
      SELECT 1 FROM public.vault_subscription_claims
      WHERE vault_email = p_email AND status = 'pending'
    ) AS has_pending_claim,
    EXISTS(
      SELECT 1 FROM public.vault_subscription_claims
      WHERE vault_email = p_email AND status = 'approved'
    ) AS has_approved_claim
  FROM public.vault_subscribers vs
  WHERE vs.email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_pending_claims_count
-- Description: Get count of pending claims for admin dashboard badge
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pending_claims_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.vault_subscription_claims
    WHERE status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.vault_subscription_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own claims
CREATE POLICY "Users can view own claims" ON public.vault_subscription_claims
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'email' = user_email
  );

-- Policy: Users can insert their own claims
CREATE POLICY "Users can create claims" ON public.vault_subscription_claims
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.jwt() ->> 'email' = user_email OR
    auth.uid() IS NULL -- Allow unauthenticated submissions
  );

-- Policy: Admins can view all claims
CREATE POLICY "Admins can view all claims" ON public.vault_subscription_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update claims
CREATE POLICY "Admins can update claims" ON public.vault_subscription_claims
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can view all vault subscribers
CREATE POLICY "Admins can view vault subscribers" ON public.vault_subscribers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.submit_vault_claim TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_vault_claim TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_vault_claim TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_vault_subscription_status TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_claims_count TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.vault_subscription_claims IS 'Stores claim requests from FHOAI Vault subscribers for free Family Pass access';
COMMENT ON TABLE public.vault_subscribers IS 'Tracks verified FHOAI Vault subscribers for reference';
COMMENT ON FUNCTION public.submit_vault_claim IS 'Creates a new vault subscription claim request';
COMMENT ON FUNCTION public.approve_vault_claim IS 'Approves a claim and grants Family Pass access automatically';
COMMENT ON FUNCTION public.reject_vault_claim IS 'Rejects a claim with reason';
COMMENT ON FUNCTION public.check_vault_subscription_status IS 'Checks if a vault subscription email has active subscription and existing claims';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
