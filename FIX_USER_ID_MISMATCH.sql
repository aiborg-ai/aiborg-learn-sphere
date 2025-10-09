-- ====================================================================
-- FIX user_id MISMATCH FOR hirendra@gmail.com
-- This script fixes the profile.user_id to match the correct auth user
-- ====================================================================

-- ⚠️ IMPORTANT: Run DIAGNOSE_ADMIN_ISSUE.sql first to confirm the issue!
-- ====================================================================

-- BACKUP FIRST - Create a snapshot of current state
-- ====================================================================

-- Save current profile state before making changes
CREATE TEMP TABLE backup_profile_hirendra AS
SELECT * FROM profiles WHERE email = 'hirendra@gmail.com';

-- Verify backup was created
SELECT
  'BACKUP CREATED' as status,
  COUNT(*) as row_count,
  email,
  user_id as old_user_id,
  role
FROM backup_profile_hirendra
GROUP BY email, user_id, role;

-- ====================================================================

-- STEP 1: Identify the correct auth user_id
-- ====================================================================

-- Find the auth user ID for hirendra@gmail.com
SELECT
  'CORRECT AUTH USER ID' as info,
  id as auth_user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'hirendra@gmail.com';

-- COPY THE ID FROM THIS RESULT - You'll need it for verification

-- ====================================================================

-- STEP 2: Show current (incorrect) state
-- ====================================================================

SELECT
  'BEFORE FIX' as status,
  p.email,
  p.user_id as current_wrong_user_id,
  p.role,
  au.id as correct_auth_user_id,
  CASE
    WHEN p.user_id = au.id THEN '✅ Already correct'
    ELSE '❌ Will be fixed'
  END as needs_fix
FROM profiles p
CROSS JOIN auth.users au
WHERE p.email = 'hirendra@gmail.com'
  AND au.email = 'hirendra@gmail.com';

-- ====================================================================

-- STEP 3: FIX THE MISMATCH
-- Update profile.user_id to match the correct auth user
-- ====================================================================

-- This is the actual fix
UPDATE profiles
SET
  user_id = (
    SELECT id
    FROM auth.users
    WHERE email = 'hirendra@gmail.com'
    LIMIT 1
  ),
  updated_at = now()
WHERE email = 'hirendra@gmail.com';

-- Expected output: UPDATE 1

-- ====================================================================

-- STEP 4: VERIFY THE FIX
-- ====================================================================

-- Check that user_id now matches
SELECT
  'AFTER FIX - VERIFICATION' as status,
  p.email,
  p.user_id as profile_user_id,
  au.id as auth_user_id,
  p.role,
  CASE
    WHEN p.user_id = au.id THEN '✅ FIXED SUCCESSFULLY'
    ELSE '❌ STILL MISMATCHED - Check query'
  END as fix_status,
  p.updated_at as last_updated
FROM profiles p
JOIN auth.users au ON au.email = p.email
WHERE p.email = 'hirendra@gmail.com';

-- Expected: fix_status = '✅ FIXED SUCCESSFULLY'

-- ====================================================================

-- STEP 5: Verify profile can be fetched correctly now
-- This simulates what the useAuth hook does
-- ====================================================================

SELECT
  'PROFILE FETCH TEST' as test_name,
  p.*
FROM profiles p
WHERE p.user_id = (
  SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com'
);

-- Expected: One row returned with role = 'admin'
-- This is exactly how the frontend fetches the profile

-- ====================================================================

-- ADDITIONAL CHECKS
-- ====================================================================

-- Check if there are any duplicate profiles for this email
SELECT
  'DUPLICATE CHECK' as check_type,
  email,
  COUNT(*) as profile_count,
  array_agg(id) as profile_ids,
  array_agg(user_id) as user_ids
FROM profiles
WHERE email = 'hirendra@gmail.com'
GROUP BY email;

-- Expected: profile_count = 1
-- If > 1, you have duplicates that should be cleaned up

-- ====================================================================

-- CLEANUP: Delete duplicate profiles if any exist
-- (Only run this if STEP above shows profile_count > 1)
-- ====================================================================

/*
-- UNCOMMENT AND RUN ONLY IF YOU HAVE DUPLICATES

-- Keep the profile linked to the correct auth user, delete others
DELETE FROM profiles
WHERE email = 'hirendra@gmail.com'
  AND user_id != (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com');

-- Verify only one remains
SELECT COUNT(*) FROM profiles WHERE email = 'hirendra@gmail.com';
-- Expected: 1
*/

-- ====================================================================

-- FINAL SUMMARY
-- ====================================================================

SELECT
  'FINAL SUMMARY' as report,
  (SELECT COUNT(*) FROM profiles WHERE email = 'hirendra@gmail.com') as profile_count,
  (SELECT role FROM profiles WHERE email = 'hirendra@gmail.com') as role,
  (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com') as profile_user_id,
  (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') as auth_user_id,
  CASE
    WHEN (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com') =
         (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com')
    THEN '✅ FIX SUCCESSFUL - Ready to test /admin'
    ELSE '❌ FIX FAILED - Review queries'
  END as overall_status;

-- ====================================================================

-- ROLLBACK (if needed)
-- If something went wrong, you can restore from backup
-- ====================================================================

/*
-- UNCOMMENT TO ROLLBACK TO ORIGINAL STATE

-- Restore from backup
UPDATE profiles
SET
  user_id = (SELECT user_id FROM backup_profile_hirendra),
  updated_at = now()
WHERE email = 'hirendra@gmail.com';

-- Verify rollback
SELECT * FROM profiles WHERE email = 'hirendra@gmail.com';
*/

-- ====================================================================
-- NEXT STEPS AFTER RUNNING THIS FIX:
-- ====================================================================

/*

1. ✅ Verify the FINAL SUMMARY shows:
   - overall_status = '✅ FIX SUCCESSFUL'

2. 🔐 In the application:
   - Sign out completely
   - Close browser tab
   - Clear browser cache (optional but recommended)
   - Open new tab

3. 🔑 Sign in again:
   - Go to http://localhost:8080/auth
   - Sign in with hirendra@gmail.com
   - Wait for sign-in to complete

4. 🎯 Test /admin access:
   - Go to http://localhost:8080/admin
   - You should now see the admin dashboard
   - Check browser console (F12) for logs showing successful access

5. 📊 Expected console logs:
   [useAuth] Profile fetched successfully: { role: "admin", ... }
   [Admin] Auth loaded, checking admin access: { isAdmin: true }
   [Admin] Access granted - fetching admin data

6. ✅ SUCCESS!
   If you see the admin dashboard, the fix worked!

7. ❌ If still not working:
   - Check browser console for errors
   - Verify you're signed in as hirendra@gmail.com (not a different account)
   - Try incognito/private browsing mode
   - Re-run DIAGNOSE_ADMIN_ISSUE.sql to verify the fix persisted

*/

-- ====================================================================
-- TECHNICAL EXPLANATION:
-- ====================================================================

/*

WHY THIS FIX WORKS:

The useAuth hook fetches the profile like this:
  supabase.from('profiles')
    .select('*')
    .eq('user_id', userId)  // <-- Uses the auth user's ID
    .single();

If profile.user_id doesn't match the auth user's ID, the query returns
no results, setting profile to null.

This fix ensures:
  profile.user_id = auth.users.id

So the query can find the profile, load the role='admin', and grant access.

The key insight: The email can be the same, but if user_id is wrong,
the profile won't be found by the user_id lookup!

*/

-- ====================================================================

-- PREVENTION: Add a check to ensure this doesn't happen again
-- ====================================================================

-- This query can be run periodically to detect mismatches early
SELECT
  'MISMATCH DETECTOR' as check_name,
  p.email,
  p.role,
  CASE
    WHEN p.user_id != au.id THEN '⚠️ MISMATCH DETECTED'
    ELSE '✅ OK'
  END as status
FROM profiles p
JOIN auth.users au ON au.email = p.email
WHERE p.user_id != au.id;

-- Expected: No rows (no mismatches)
-- If any rows appear, run this fix script for those emails

-- ====================================================================
