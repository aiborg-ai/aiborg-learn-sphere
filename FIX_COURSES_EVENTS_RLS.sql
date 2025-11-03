-- ============================================================================
-- Fix RLS Policies for Courses and Events
-- ============================================================================
-- This script fixes Row Level Security policies that may be blocking
-- courses and events from loading for logged-in users
--
-- SYMPTOM: Courses and events don't load when logged in, but may work when logged out
-- CAUSE: RLS policies may be too restrictive or missing for authenticated users
--
-- HOW TO RUN:
-- 1. First run DIAGNOSE_DATA_LOADING_ISSUE.sql to identify the problem
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run"
-- ============================================================================

-- Fix 1: Courses Table RLS Policies
-- ============================================================================

-- Remove old/conflicting policies
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;

-- Create a comprehensive policy that works for both authenticated and anonymous users
CREATE POLICY "Everyone can view active and displayed courses"
ON public.courses
FOR SELECT
TO public  -- This allows both authenticated AND anonymous users
USING (is_active = true AND display = true);

-- Admin policy for full access
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- Fix 2: Events Table RLS Policies
-- ============================================================================

-- Remove old/conflicting policies
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view active and visible events" ON public.events;
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

-- Create a comprehensive policy that works for both authenticated and anonymous users
CREATE POLICY "Everyone can view active and visible events"
ON public.events
FOR SELECT
TO public  -- This allows both authenticated AND anonymous users
USING (
  is_active = true
  AND (
    -- Check if is_visible column exists
    NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
        AND column_name = 'is_visible'
    )
    OR is_visible = true
  )
);

-- Admin policy for full access
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- Fix 3: Ensure RLS is enabled (but not overly restrictive)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Fix 4: Grant necessary permissions
-- ============================================================================

-- Grant SELECT to anonymous users (not logged in)
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.events TO anon;

-- Grant SELECT to authenticated users (logged in)
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.events TO authenticated;

-- ============================================================================
-- Verify the fixes
-- ============================================================================

-- Check courses policies
SELECT
  'COURSES POLICIES' as info,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE tablename = 'courses'
  AND schemaname = 'public'
ORDER BY policyname;

-- Check events policies
SELECT
  'EVENTS POLICIES' as info,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE tablename = 'events'
  AND schemaname = 'public'
ORDER BY policyname;

-- Test data accessibility
SELECT
  'TEST: Active Courses Count' as test,
  COUNT(*) as result
FROM public.courses
WHERE is_active = true AND display = true;

SELECT
  'TEST: Active Events Count' as test,
  COUNT(*) as result
FROM public.events
WHERE is_active = true;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 1. You should see 2 policies for courses:
--    - "Everyone can view active and displayed courses" (SELECT to public)
--    - "Admins can manage courses" (ALL to authenticated)
--
-- 2. You should see 2 policies for events:
--    - "Everyone can view active and visible events" (SELECT to public)
--    - "Admins can manage events" (ALL to authenticated)
--
-- 3. Test results should show counts > 0 for courses and events
--
-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. After running this script, log out and log back into your application
-- 2. Check if courses and events load properly
-- 3. If still not working, check browser console for errors
-- 4. Run DIAGNOSE_DATA_LOADING_ISSUE.sql again to verify
-- ============================================================================
