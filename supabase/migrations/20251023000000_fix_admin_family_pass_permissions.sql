-- ============================================================================
-- FIX ADMIN FAMILY PASS PERMISSIONS
-- ============================================================================
-- Fixes bug in admin role verification where functions were checking wrong column
-- Functions were checking profiles.id instead of profiles.user_id
-- Created: October 23, 2025
-- ============================================================================

-- Fix grant_admin_family_pass function
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

  -- Verify admin role (FIXED: changed id to user_id)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_admin_id AND role IN ('admin', 'super_admin')
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

-- Fix revoke_admin_family_pass function
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

  -- Verify admin role (FIXED: changed id to user_id)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_admin_id AND role IN ('admin', 'super_admin')
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

-- Fix update_admin_family_pass_dates function
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

  -- Verify admin role (FIXED: changed id to user_id)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = v_admin_id AND role IN ('admin', 'super_admin')
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

-- Add comment documenting the fix
COMMENT ON FUNCTION public.grant_admin_family_pass IS
  'Grants Family Pass access to a user - replaces any existing active grant. Fixed v2: corrects admin role check to use user_id instead of id';

COMMENT ON FUNCTION public.revoke_admin_family_pass IS
  'Revokes an admin-granted Family Pass. Fixed v2: corrects admin role check to use user_id instead of id';

COMMENT ON FUNCTION public.update_admin_family_pass_dates IS
  'Updates start and end dates for an existing grant. Fixed v2: corrects admin role check to use user_id instead of id';
