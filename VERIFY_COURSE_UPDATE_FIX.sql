-- Verification script for course update fix
-- Run this in Supabase SQL Editor to verify the policy is correct

-- 1. Check that the policy exists with both USING and WITH CHECK
SELECT
  policyname,
  tablename,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'courses'
  AND policyname = 'Admins can update courses';

-- Expected Result:
-- policyname: "Admins can update courses"
-- tablename: "courses"
-- cmd: "UPDATE"
-- using_clause: Should contain "auth.uid() IN ..."
-- with_check_clause: Should contain "auth.uid() IN ..." (NOT NULL)

-- 2. List all policies on courses table
SELECT
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN '✓ USING' ELSE '✗ USING' END as has_using,
  CASE WHEN with_check IS NOT NULL THEN '✓ WITH CHECK' ELSE '✗ WITH CHECK' END as has_with_check
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY cmd, policyname;

-- Expected policies:
-- SELECT: "Anyone can view active courses" - ✓ USING, ✗ WITH CHECK (normal for SELECT)
-- SELECT: "Anyone can view active and displayed courses" - ✓ USING, ✗ WITH CHECK (normal)
-- INSERT: "Admins can insert courses" - ✓ USING, ✓ WITH CHECK
-- UPDATE: "Admins can update courses" - ✓ USING, ✓ WITH CHECK ← THIS SHOULD BE FIXED NOW
-- DELETE: "Admins can delete courses" - ✓ USING, ✗ WITH CHECK (normal for DELETE)

-- 3. Check if there are any conflicting policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'courses'
  AND cmd = 'UPDATE';

-- Expected: 1 (only one UPDATE policy should exist)

-- 4. Verify your admin user has the correct role
SELECT
  p.user_id,
  p.role,
  p.full_name,
  u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'admin';

-- This should show your admin user(s)
