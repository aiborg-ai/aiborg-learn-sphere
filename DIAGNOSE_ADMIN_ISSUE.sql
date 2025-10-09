-- ====================================================================
-- DIAGNOSE ADMIN ACCESS ISSUE - user_id Mismatch
-- This script identifies if profile.user_id doesn't match auth.users.id
-- ====================================================================

-- CRITICAL DIAGNOSTIC: Check hirendra@gmail.com specifically
-- ====================================================================

-- STEP 1: Find the auth user ID for hirendra@gmail.com
SELECT
  'AUTH USER' as source,
  id as auth_user_id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data->>'display_name' as display_name_from_auth
FROM auth.users
WHERE email = 'hirendra@gmail.com';

-- Expected: One row with the auth user UUID
-- Copy the 'id' value - this is the CORRECT user_id for the profile

-- ====================================================================

-- STEP 2: Find the profile for hirendra@gmail.com
SELECT
  'PROFILE' as source,
  id as profile_id,
  user_id as profile_user_id,
  email,
  display_name,
  role,
  created_at,
  updated_at
FROM profiles
WHERE email = 'hirendra@gmail.com';

-- Expected: One row with a user_id value
-- Compare profile_user_id with auth_user_id from STEP 1
-- IF DIFFERENT = MISMATCH FOUND (this is the problem!)

-- ====================================================================

-- STEP 3: Check if the profile is linked to the correct auth user
-- This query shows the mismatch directly
SELECT
  au.id as correct_auth_user_id,
  au.email as auth_email,
  p.id as profile_id,
  p.user_id as current_profile_user_id,
  p.email as profile_email,
  p.role,
  CASE
    WHEN au.id = p.user_id THEN '✅ LINKED CORRECTLY'
    WHEN au.id != p.user_id THEN '❌ MISMATCH - NEEDS FIX'
    WHEN p.user_id IS NULL THEN '⚠️ PROFILE HAS NULL user_id'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON p.email = au.email
WHERE au.email = 'hirendra@gmail.com';

-- Expected output showing the problem:
-- status = '❌ MISMATCH - NEEDS FIX'

-- ====================================================================

-- STEP 4: Find what auth user the profile is currently linked to
-- (if any)
SELECT
  p.email as profile_email,
  p.user_id as profile_user_id,
  p.role,
  au.id as linked_auth_user_id,
  au.email as linked_auth_email,
  CASE
    WHEN au.id IS NULL THEN '❌ ORPHANED - user_id points to non-existent user'
    WHEN au.email != p.email THEN '⚠️ LINKED TO DIFFERENT AUTH USER'
    ELSE '✅ Linked to matching auth user'
  END as linkage_status
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.email = 'hirendra@gmail.com';

-- This shows if the profile is orphaned or linked to wrong user

-- ====================================================================

-- STEP 5: Check ALL profiles and their linkage status
-- This gives you the full picture
SELECT
  p.email as profile_email,
  p.role,
  p.user_id as profile_user_id,
  au.id as correct_auth_user_id,
  CASE
    WHEN p.user_id = au.id THEN '✅ OK'
    WHEN p.user_id != au.id AND au.id IS NOT NULL THEN '❌ MISMATCH'
    WHEN au.id IS NULL THEN '⚠️ NO AUTH USER'
  END as status,
  p.created_at as profile_created,
  au.created_at as auth_created
FROM profiles p
LEFT JOIN auth.users au ON au.email = p.email
ORDER BY p.email;

-- This shows all profiles and highlights any mismatches

-- ====================================================================

-- STEP 6: Find duplicate auth users (same email)
SELECT
  email,
  COUNT(*) as auth_user_count,
  array_agg(id) as auth_user_ids,
  array_agg(created_at) as created_dates
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected: Empty (no duplicates)
-- If you see duplicates, this explains the mismatch!

-- ====================================================================

-- STEP 7: Find duplicate profiles (same email)
SELECT
  email,
  COUNT(*) as profile_count,
  array_agg(id) as profile_ids,
  array_agg(user_id) as user_ids,
  array_agg(role) as roles
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Expected: Empty (no duplicates)
-- If you see duplicates for hirendra@gmail.com, need to clean up

-- ====================================================================

-- STEP 8: Check if multiple profiles point to same user_id
SELECT
  user_id,
  COUNT(*) as profile_count,
  array_agg(email) as emails,
  array_agg(role) as roles
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Expected: Empty (one profile per user_id)
-- If not empty, indicates data integrity issue

-- ====================================================================

-- INTERPRETATION GUIDE
-- ====================================================================

/*

SCENARIO A: user_id Mismatch (MOST LIKELY)
------------------------------------------
STEP 1: Shows auth user id = "abc-123"
STEP 2: Shows profile user_id = "xyz-789"
STEP 3: Shows status = "❌ MISMATCH - NEEDS FIX"

ACTION: Run FIX_USER_ID_MISMATCH.sql


SCENARIO B: Orphaned Profile
-----------------------------
STEP 1: Shows auth user id = "abc-123"
STEP 2: Shows profile user_id = "xyz-789"
STEP 4: Shows "❌ ORPHANED - user_id points to non-existent user"

ACTION: Update profile.user_id to the correct auth user id from STEP 1


SCENARIO C: Duplicate Profiles
-------------------------------
STEP 7: Shows hirendra@gmail.com appears 2+ times with different user_ids

ACTION: Keep the profile linked to current auth user, delete others


SCENARIO D: Duplicate Auth Users
---------------------------------
STEP 6: Shows hirendra@gmail.com appears 2+ times in auth.users

ACTION: Identify which auth user you're currently signed in as,
        link profile to that one


SCENARIO E: Everything Looks Correct
------------------------------------
All steps show matching IDs and ✅ status

ACTION: Issue is elsewhere - check browser console logs,
        verify you're signed in as hirendra@gmail.com,
        clear browser cache and retry

*/

-- ====================================================================

-- QUICK SUMMARY FOR hirendra@gmail.com
-- Run this to see the problem at a glance
SELECT
  'SUMMARY FOR hirendra@gmail.com' as check_type,
  (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') as correct_auth_user_id,
  (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com') as current_profile_user_id,
  (SELECT role FROM profiles WHERE email = 'hirendra@gmail.com') as role,
  CASE
    WHEN (SELECT id FROM auth.users WHERE email = 'hirendra@gmail.com') =
         (SELECT user_id FROM profiles WHERE email = 'hirendra@gmail.com')
    THEN '✅ LINKED CORRECTLY - Issue is elsewhere'
    ELSE '❌ MISMATCH FOUND - Run FIX_USER_ID_MISMATCH.sql'
  END as diagnosis;

-- This single query tells you if the mismatch is the problem

-- ====================================================================
-- NEXT STEPS:
-- 1. Review the output of the queries above
-- 2. If you see "❌ MISMATCH", proceed to FIX_USER_ID_MISMATCH.sql
-- 3. If you see "✅ LINKED CORRECTLY", check browser console logs
-- 4. Save the query results for reference
-- ====================================================================
