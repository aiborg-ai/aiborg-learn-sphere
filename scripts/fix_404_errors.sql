-- =====================================================
-- FIX SCRIPT FOR 404 ERRORS
-- Apply this in Supabase SQL Editor to fix database access issues
-- =====================================================

-- STEP 1: Ensure RLS is enabled and public SELECT policy exists for COURSES
-- =====================================================

-- Enable RLS on courses if not already enabled
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Drop old policies that might conflict
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view active and displayed courses" ON public.courses;

-- Create fresh public SELECT policy for courses
CREATE POLICY "Anyone can view active and displayed courses"
ON public.courses
FOR SELECT
USING (is_active = true AND display = true);

-- STEP 2: Create course_audiences table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS public.course_audiences (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('Young Learners', 'Teenagers', 'Professionals', 'SMEs')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, audience)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_audiences_course_id ON public.course_audiences(course_id);
CREATE INDEX IF NOT EXISTS idx_course_audiences_audience ON public.course_audiences(audience);

-- Enable RLS
ALTER TABLE public.course_audiences ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view course audiences" ON public.course_audiences;
DROP POLICY IF EXISTS "Allow all operations for development" ON public.course_audiences;

-- Create RLS policies for course_audiences
CREATE POLICY "Anyone can view course audiences"
ON public.course_audiences
FOR SELECT
USING (true);

-- STEP 3: Create courses_with_audiences VIEW
-- =====================================================

DROP VIEW IF EXISTS public.courses_with_audiences;

CREATE OR REPLACE VIEW public.courses_with_audiences AS
SELECT
  c.*,
  COALESCE(
    ARRAY_AGG(ca.audience ORDER BY ca.audience) FILTER (WHERE ca.audience IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS audiences
FROM public.courses c
LEFT JOIN public.course_audiences ca ON c.id = ca.course_id
GROUP BY c.id;

-- Grant permissions on the view
GRANT SELECT ON public.courses_with_audiences TO anon, authenticated;

-- STEP 4: Fix EVENTS table RLS
-- =====================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Public can view active events" ON public.events;

CREATE POLICY "Anyone can view active events"
ON public.events
FOR SELECT
USING (is_active = true);

-- STEP 5: Fix REVIEWS table RLS
-- =====================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (approved = true);

-- STEP 6: Fix ASSESSMENT_TOOLS table RLS
-- =====================================================

ALTER TABLE public.assessment_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active assessment tools" ON public.assessment_tools;

CREATE POLICY "Public can view active assessment tools"
  ON public.assessment_tools FOR SELECT
  USING (is_active = true);

-- STEP 7: Migrate existing course data to course_audiences
-- =====================================================

INSERT INTO public.course_audiences (course_id, audience)
SELECT id, audience
FROM public.courses
WHERE audience IS NOT NULL
ON CONFLICT (course_id, audience) DO NOTHING;

-- STEP 8: Verify the fix worked
-- =====================================================

-- Test 1: Check if view returns data
SELECT
  'Test 1: courses_with_audiences' as test,
  COUNT(*) as count
FROM courses_with_audiences
WHERE is_active = true AND display = true;

-- Test 2: Check if events are accessible
SELECT
  'Test 2: events' as test,
  COUNT(*) as count
FROM events
WHERE is_active = true;

-- Test 3: Check if reviews are accessible
SELECT
  'Test 3: reviews' as test,
  COUNT(*) as count
FROM reviews
WHERE approved = true;

-- Test 4: Check if assessment_tools are accessible
SELECT
  'Test 4: assessment_tools' as test,
  COUNT(*) as count
FROM assessment_tools
WHERE is_active = true;

-- SUCCESS MESSAGE
SELECT '✅ FIX APPLIED SUCCESSFULLY! Refresh your browser.' as message;
