-- ============================================================================
-- Diagnostic Script: Courses and Events Not Loading When Logged In
-- ============================================================================
-- This script helps diagnose why courses and events don't load for logged-in users
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run"
-- ============================================================================

-- STEP 1: Check if RLS is enabled on courses and events tables
-- ============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('courses', 'events')
  AND schemaname = 'public';

-- STEP 2: Check current RLS policies on courses table
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'courses'
  AND schemaname = 'public'
ORDER BY policyname;

-- STEP 3: Check current RLS policies on events table
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'events'
  AND schemaname = 'public'
ORDER BY policyname;

-- STEP 4: Count visible courses
-- ============================================================================
SELECT
  'Total courses' as metric,
  COUNT(*) as count
FROM public.courses
UNION ALL
SELECT
  'Active courses',
  COUNT(*)
FROM public.courses
WHERE is_active = true
UNION ALL
SELECT
  'Active and displayed courses',
  COUNT(*)
FROM public.courses
WHERE is_active = true AND display = true;

-- STEP 5: Count visible events
-- ============================================================================
SELECT
  'Total events' as metric,
  COUNT(*) as count
FROM public.events
UNION ALL
SELECT
  'Active events',
  COUNT(*)
FROM public.events
WHERE is_active = true
UNION ALL
SELECT
  'Active and visible events',
  COUNT(*)
FROM public.events
WHERE is_active = true
  AND CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events'
        AND column_name = 'is_visible'
    )
    THEN is_visible = true
    ELSE true
  END;

-- STEP 6: Check if courses_with_audiences view exists
-- ============================================================================
SELECT
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'courses_with_audiences';

-- STEP 7: Sample courses data (first 3 active courses)
-- ============================================================================
SELECT
  id,
  title,
  is_active,
  display,
  audience,
  created_at
FROM public.courses
WHERE is_active = true
  AND display = true
ORDER BY sort_order
LIMIT 3;

-- STEP 8: Sample events data (first 3 active events)
-- ============================================================================
SELECT
  id,
  title,
  is_active,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events'
        AND column_name = 'is_visible'
    )
    THEN is_visible
    ELSE NULL
  END as is_visible,
  event_date,
  created_at
FROM public.events
WHERE is_active = true
ORDER BY event_date
LIMIT 3;

-- ============================================================================
-- POTENTIAL FIXES
-- ============================================================================

-- Fix 1: Ensure courses table has proper SELECT policy for everyone
-- ----------------------------------------------------------------------------
-- Run this if courses have RLS enabled but no public SELECT policy:

/*
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;

CREATE POLICY "Anyone can view active courses"
ON public.courses
FOR SELECT
USING (is_active = true AND display = true);
*/

-- Fix 2: Ensure events table has proper SELECT policy for everyone
-- ----------------------------------------------------------------------------
-- Run this if events have RLS enabled but no public SELECT policy:

/*
DROP POLICY IF EXISTS "Anyone can view active and visible events" ON public.events;

CREATE POLICY "Anyone can view active and visible events"
ON public.events
FOR SELECT
USING (
  is_active = true
  AND CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events'
        AND column_name = 'is_visible'
    )
    THEN is_visible = true
    ELSE true
  END
);
*/

-- Fix 3: If policies exist but data still doesn't load, disable RLS temporarily (NOT RECOMMENDED FOR PRODUCTION)
-- ----------------------------------------------------------------------------
/*
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- WHAT TO LOOK FOR IN RESULTS:
-- ============================================================================
--
-- STEP 1: Both tables should show rls_enabled = true
-- STEP 2: Should show at least one policy for SELECT with USING expression
-- STEP 3: Should show at least one policy for SELECT with USING expression
-- STEP 4: Should show >0 for "Active and displayed courses"
-- STEP 5: Should show >0 for "Active and visible events"
-- STEP 6: Should return 1 row if view exists, 0 rows if not (fallback is okay)
-- STEP 7: Should show 3 courses with data
-- STEP 8: Should show 3 events with data
--
-- If any of these fail, there's an issue with that specific area
-- ============================================================================
