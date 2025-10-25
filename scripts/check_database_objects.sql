-- =====================================================
-- DATABASE OBJECTS DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose 404 errors
-- =====================================================

-- 1. Check if required tables exist
SELECT
  'Table/View Check' as check_name,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'courses',
    'courses_with_audiences',
    'course_audiences',
    'events',
    'reviews',
    'assessment_tools'
  )
ORDER BY table_name;

-- Expected output: 6 rows (5 tables + 1 view)

-- 2. Check if RLS is enabled and policies exist
SELECT
  'RLS Policy Check' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('courses', 'events', 'reviews', 'assessment_tools', 'course_audiences')
ORDER BY tablename, policyname;

-- Expected output: Multiple rows showing SELECT policies for 'anon' role

-- 3. Check if the view grants exist
SELECT
  'View Permission Check' as check_name,
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_name = 'courses_with_audiences'
  AND grantee IN ('anon', 'authenticated');

-- Expected output: SELECT permissions for anon and authenticated

-- 4. Check if RPC functions exist
SELECT
  'RPC Function Check' as check_name,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_assessment_tools_for_audience',
    'get_attempt_history',
    'get_latest_attempt_for_tool',
    'get_course_audiences'
  )
ORDER BY routine_name;

-- Expected output: 4 functions

-- 5. Test if courses_with_audiences view works
SELECT
  'View Test' as check_name,
  COUNT(*) as total_courses
FROM courses_with_audiences
WHERE is_active = true AND display = true;

-- Expected output: Should return a count of active courses
