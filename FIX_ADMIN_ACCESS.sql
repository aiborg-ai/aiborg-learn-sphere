-- ====================================================================
-- ADMIN ACCESS DIAGNOSTIC AND FIX SCRIPT
-- Run this in Supabase SQL Editor to diagnose and fix admin access
-- ====================================================================

-- STEP 1: Check all existing profiles
-- This shows ALL user profiles and their current roles
SELECT
  id,
  user_id,
  email,
  display_name,
  role,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC;

-- Expected output: List of all users with their roles
-- Look for your email and check the role column

-- ====================================================================

-- STEP 2: Check if your email has a profile
-- Replace 'YOUR_EMAIL@example.com' with your actual email
SELECT
  id,
  user_id,
  email,
  display_name,
  role,
  created_at
FROM profiles
WHERE email = 'YOUR_EMAIL@example.com';

-- Expected output: One row with your user info
-- If no rows: Your profile doesn't exist (see STEP 5)
-- If role != 'admin': You need to update it (see STEP 3)

-- ====================================================================

-- STEP 3: UPDATE YOUR ROLE TO ADMIN
-- Replace 'YOUR_EMAIL@example.com' with your actual email
UPDATE profiles
SET
  role = 'admin',
  updated_at = now()
WHERE email = 'YOUR_EMAIL@example.com';

-- Expected output: UPDATE 1
-- If UPDATE 0: Email not found in database

-- ====================================================================

-- STEP 4: VERIFY THE UPDATE
-- Replace 'YOUR_EMAIL@example.com' with your actual email
SELECT
  email,
  role,
  updated_at
FROM profiles
WHERE email = 'YOUR_EMAIL@example.com';

-- Expected output: role should be 'admin'

-- ====================================================================

-- STEP 5: If profile doesn't exist, check auth.users
-- This checks if you have an auth user but no profile
SELECT
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'YOUR_EMAIL@example.com';

-- Expected output:
-- - If profile_id is NULL: Profile missing, needs creation
-- - If profile_id exists: Profile exists, just needs role update

-- ====================================================================

-- STEP 6: Create profile if missing (ONLY if STEP 5 shows NULL profile_id)
-- Replace 'YOUR_EMAIL@example.com' and 'USER_ID_FROM_STEP_5' with actual values
INSERT INTO profiles (user_id, email, display_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', email),
  'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.users.id
  );

-- Expected output: INSERT 0 1 (if profile was created)
-- Or: INSERT 0 0 (if profile already exists)

-- ====================================================================

-- STEP 7: Check for duplicate profiles (troubleshooting)
-- This finds any emails with multiple profile entries
SELECT
  email,
  COUNT(*) as profile_count,
  array_agg(id) as profile_ids,
  array_agg(role) as roles
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected output: Empty (no duplicates)
-- If you see duplicates, keep the most recent one and delete others

-- ====================================================================

-- STEP 8: Final verification - Check RLS policies
-- This verifies the Row Level Security policies are set up correctly
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected output: List of policies including:
-- - "Users can view their own profile"
-- - "Admins can view all profiles"
-- - "Admins can update all profiles"

-- ====================================================================

-- QUICK FIX TEMPLATE
-- Copy this, replace YOUR_EMAIL, and run it:

/*
-- Quick fix: Update your account to admin
UPDATE profiles
SET role = 'admin', updated_at = now()
WHERE email = 'YOUR_EMAIL@example.com';

-- Verify it worked
SELECT email, role FROM profiles WHERE email = 'YOUR_EMAIL@example.com';
*/

-- ====================================================================
-- AFTER RUNNING THIS SCRIPT:
-- 1. Sign out of the application completely
-- 2. Close the browser tab
-- 3. Open a new tab and go to your app
-- 4. Sign in again
-- 5. Try accessing /admin
--
-- The sign-out/sign-in refreshes your session with the new admin role
-- ====================================================================
