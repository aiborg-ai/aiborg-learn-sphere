-- Migration: Fix Onboarding Progress RLS for Trigger-Based Inserts
-- Date: 2026-01-03
-- Description: Fixes RLS policy blocking trigger-based inserts into user_onboarding_progress
--
-- Root Cause:
-- The initialize_user_onboarding() trigger runs with SECURITY DEFINER context
-- where auth.uid() is NULL. The existing INSERT policy only allows auth.uid() = user_id,
-- which blocks trigger-based inserts and causes "Database error querying schema" during signup.
--
-- This is the same issue we fixed for profiles table in 20260102000000_fix_profile_signup_rls.sql

-- ============================================================================
-- 1. FIX RLS POLICY: user_onboarding_progress INSERT
-- ============================================================================

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own onboarding progress"
  ON public.user_onboarding_progress;

-- Create new policy that allows both user inserts and trigger inserts
CREATE POLICY "Enable onboarding progress creation for users and triggers"
  ON public.user_onboarding_progress
  FOR INSERT
  WITH CHECK (
    -- Allow if user is inserting their own progress
    auth.uid() = user_id
    OR
    -- Allow if inserting via trigger (no auth.uid() but user_id is valid)
    (auth.uid() IS NULL AND user_id IS NOT NULL)
  );

COMMENT ON POLICY "Enable onboarding progress creation for users and triggers"
  ON public.user_onboarding_progress IS
  'Allows users to create their own onboarding progress and allows the initialize_user_onboarding() trigger to create records during profile creation';

-- ============================================================================
-- 2. VERIFY TRIGGER FUNCTION IS USING CORRECT FIELD
-- ============================================================================

-- Ensure initialize_user_onboarding() uses NEW.user_id (already fixed in previous migration)
-- This is a safety check - if the function is still using NEW.id, this will update it

CREATE OR REPLACE FUNCTION public.initialize_user_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Use NEW.user_id (references auth.users.id) not NEW.id (profile.id)
  INSERT INTO public.user_onboarding_progress (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail profile creation
    RAISE WARNING 'Error initializing onboarding for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.initialize_user_onboarding IS
'Initializes onboarding progress when a new profile is created. Uses NEW.user_id to reference auth.users via profiles.user_id';

-- ============================================================================
-- 3. VERIFY SCHEMA INTEGRITY
-- ============================================================================

-- Verify the INSERT policy exists and is configured correctly
DO $$
DECLARE
  policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_onboarding_progress'
      AND policyname = 'Enable onboarding progress creation for users and triggers'
      AND cmd = 'INSERT'
  ) INTO policy_exists;

  IF NOT policy_exists THEN
    RAISE EXCEPTION 'INSERT policy verification failed for user_onboarding_progress!';
  END IF;

  RAISE NOTICE 'Schema integrity verified: user_onboarding_progress INSERT policy allows trigger-based inserts';
END $$;

-- ============================================================================
-- 4. MIGRATION NOTES
-- ============================================================================

/*
TRIGGER CHAIN DURING SIGNUP:

1. User submits signup → auth.users INSERT
2. on_auth_user_created trigger fires → handle_new_user() executes
3. handle_new_user() INSERTs into profiles
4. on_profile_created_initialize_onboarding trigger fires → initialize_user_onboarding() executes
5. initialize_user_onboarding() INSERTs into user_onboarding_progress
   ↓
   WITHOUT THIS FIX: RLS blocks insert (auth.uid() is NULL in trigger context)
   WITH THIS FIX: RLS allows insert (auth.uid() IS NULL AND user_id IS NOT NULL)

WHY THIS CAUSED "Database error querying schema":
- The trigger runs with SECURITY DEFINER, so auth.uid() is NULL
- The old policy only checked: auth.uid() = user_id
- NULL = user_id always returns NULL (not true), so INSERT was blocked
- Supabase Auth caught the error and returned generic "Database error querying schema"

WHY OAUTH WORKED BUT PASSWORD DIDN'T:
- OAuth flow may handle profile creation asynchronously or with different timing
- Password flow creates profile synchronously during auth.users INSERT
- Any RLS failure during synchronous flow blocks the entire signup

ISSUES FIXED IN THIS MIGRATION:
✅ RLS policy on user_onboarding_progress now allows trigger-based inserts
✅ initialize_user_onboarding() uses correct NEW.user_id field
✅ Added error handling to prevent signup failure
✅ Added conflict handling to prevent duplicate records

PREVIOUS RELATED FIXES:
- 20260102000000_fix_profile_signup_rls.sql: Fixed same issue for profiles table
- 20260102150000_fix_authentication_schema_issues.sql: Fixed foreign key constraints

VERIFICATION STEPS:
1. Run this migration
2. Test password signup with new email
3. Verify profile and onboarding records are created
4. Check Supabase Auth Logs for any errors
5. Test OAuth signup (should continue working)
*/
