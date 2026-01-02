-- Migration: Fix Authentication Schema Issues
-- Date: 2026-01-02
-- Description: Fixes critical schema issues preventing user authentication
--
-- Issues Fixed:
-- 1. initialize_user_onboarding() trigger using wrong ID field
-- 2. user_onboarding_progress foreign key pointing to non-existent users table
-- 3. Profile creation trigger enhancement for better error handling

-- ============================================================================
-- 1. FIX TRIGGER: initialize_user_onboarding
-- ============================================================================
-- Issue: Trigger was using NEW.id (profile ID) instead of NEW.user_id (auth user ID)
-- Impact: Foreign key constraint violation when creating profiles

CREATE OR REPLACE FUNCTION public.initialize_user_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Use NEW.user_id (references auth.users.id) instead of NEW.id (profile.id)
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
'Initializes onboarding progress when a new profile is created. Uses user_id to reference auth.users via profiles.';

-- ============================================================================
-- 2. FIX FOREIGN KEY: user_onboarding_progress → profiles
-- ============================================================================
-- Issue: Foreign key referenced non-existent public.users table
-- Fix: Reference profiles.user_id which links to auth.users

-- Drop the broken foreign key constraint
ALTER TABLE public.user_onboarding_progress
DROP CONSTRAINT IF EXISTS user_onboarding_progress_user_id_fkey;

-- Add correct foreign key constraint pointing to profiles.user_id
ALTER TABLE public.user_onboarding_progress
ADD CONSTRAINT user_onboarding_progress_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT user_onboarding_progress_user_id_fkey ON public.user_onboarding_progress IS
'Links onboarding progress to user profiles (which link to auth.users via user_id)';

-- ============================================================================
-- 3. VERIFY SCHEMA INTEGRITY
-- ============================================================================

-- Verify the foreign key is correctly configured
DO $$
DECLARE
  fk_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'user_onboarding_progress'
      AND ccu.table_name = 'profiles'
      AND ccu.column_name = 'user_id'
  ) INTO fk_exists;

  IF NOT fk_exists THEN
    RAISE EXCEPTION 'Foreign key constraint verification failed!';
  END IF;

  RAISE NOTICE 'Schema integrity verified: user_onboarding_progress → profiles foreign key exists';
END $$;

-- ============================================================================
-- 4. MIGRATION NOTES
-- ============================================================================

/*
TROUBLESHOOTING NOTES:

If you encounter "Database error querying schema" during sign-in:

1. Check Supabase Dashboard → Logs → Auth Logs for specific errors
2. Verify all foreign keys reference existing tables:
   SELECT tc.table_name, tc.constraint_name, ccu.table_name AS foreign_table
   FROM information_schema.table_constraints tc
   JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
   ORDER BY tc.table_name;

3. Check for triggers that might fail on auth operations:
   SELECT trigger_name, event_object_table, action_statement
   FROM information_schema.triggers
   WHERE trigger_schema = 'public'
   ORDER BY event_object_table;

4. Verify RLS policies allow user self-access:
   SELECT schemaname, tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'profiles' OR tablename = 'user_onboarding_progress';

KNOWN ISSUES FIXED:
✅ Profile creation trigger using wrong ID field
✅ Foreign key pointing to non-existent users table
✅ Error handling in onboarding initialization

REMAINING INVESTIGATION NEEDED:
⚠️  "Database error querying schema" persists despite fixes
    → Check Supabase project configuration
    → Review auth logs for actual database error details
    → Verify no other broken foreign keys or triggers exist
*/
