-- ============================================================================
-- Quick Check: Current RLS Policies Status
-- ============================================================================
-- Run this to see exactly what policies are active right now
-- ============================================================================

-- Check RLS status on courses and events
SELECT
  'RLS STATUS' as check_type,
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as rls_status
FROM pg_tables
WHERE tablename IN ('courses', 'events')
  AND schemaname = 'public';

-- Check courses policies
SELECT
  'COURSES POLICIES' as table_name,
  policyname as policy_name,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation,
  roles,
  CASE
    WHEN roles = '{public}' THEN '✓ Works for everyone'
    WHEN roles = '{authenticated}' THEN '⚠ Only logged-in users'
    WHEN roles = '{anon}' THEN '⚠ Only anonymous users'
    ELSE roles::text
  END as who_can_access
FROM pg_policies
WHERE tablename = 'courses'
  AND schemaname = 'public'
ORDER BY policyname;

-- Check events policies
SELECT
  'EVENTS POLICIES' as table_name,
  policyname as policy_name,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation,
  roles,
  CASE
    WHEN roles = '{public}' THEN '✓ Works for everyone'
    WHEN roles = '{authenticated}' THEN '⚠ Only logged-in users'
    WHEN roles = '{anon}' THEN '⚠ Only anonymous users'
    ELSE roles::text
  END as who_can_access
FROM pg_policies
WHERE tablename = 'events'
  AND schemaname = 'public'
ORDER BY policyname;

-- Test if you can SELECT courses
SELECT
  'TEST: Can SELECT courses' as test,
  COUNT(*) as active_courses,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Courses accessible'
    ELSE '✗ No courses found or blocked by RLS'
  END as status
FROM public.courses
WHERE is_active = true AND display = true;

-- Test if you can SELECT events
SELECT
  'TEST: Can SELECT events' as test,
  COUNT(*) as active_events,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Events accessible'
    ELSE '✗ No events found or blocked by RLS'
  END as status
FROM public.events
WHERE is_active = true;

-- ============================================================================
-- WHAT TO LOOK FOR:
-- ============================================================================
--
-- RLS STATUS:
--   - Both tables should show "✓ ENABLED"
--
-- POLICIES:
--   - Should have at least one policy with "✓ Works for everyone" (roles = {public})
--   - If you only see "⚠ Only logged-in users" or "⚠ Only anonymous users",
--     that's the problem!
--
-- TEST RESULTS:
--   - Should show "✓ Courses accessible" and "✓ Events accessible"
--   - If you see "✗ No courses/events found or blocked by RLS", policies are wrong
--
-- ============================================================================
