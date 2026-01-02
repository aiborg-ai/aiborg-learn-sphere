-- Fix profile creation during user signup
-- Issue: The handle_new_user() trigger cannot insert profiles due to RLS policy
-- Solution: Add a policy that allows service role to bypass RLS for profile creation

-- ============================================================================
-- 1. DROP RESTRICTIVE INSERT POLICY
-- ============================================================================

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- ============================================================================
-- 2. CREATE MORE PERMISSIVE INSERT POLICY
-- ============================================================================

-- Allow authenticated users to insert their own profile
-- AND allow service role (used by triggers) to insert profiles
CREATE POLICY "Enable profile creation for authenticated users and triggers"
ON public.profiles
FOR INSERT
WITH CHECK (
  -- Allow if user is inserting their own profile
  auth.uid() = user_id
  OR
  -- Allow if inserting via trigger (no auth.uid() but user_id is valid)
  (auth.uid() IS NULL AND user_id IS NOT NULL)
);

-- ============================================================================
-- 3. ENSURE TRIGGER FUNCTION HAS PROPER SECURITY CONTEXT
-- ============================================================================

-- Recreate the handle_new_user function with proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'displayName', NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate inserts

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. ADD COMMENT FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Enable profile creation for authenticated users and triggers" ON public.profiles IS
'Allows users to create their own profiles and allows the handle_new_user() trigger to create profiles during signup';

COMMENT ON FUNCTION public.handle_new_user IS
'Automatically creates a user profile when a new user signs up. Runs with SECURITY DEFINER to bypass RLS.';
