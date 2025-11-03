-- ============================================================================
-- Make All Active Courses Visible
-- ============================================================================
-- Problem: Courses might have display = false, preventing them from showing
-- Solution: Set display = true for all active courses
-- ============================================================================

-- First, check current status
SELECT
  'BEFORE UPDATE' as status,
  COUNT(*) as total_courses,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_courses,
  SUM(CASE WHEN display = true THEN 1 ELSE 0 END) as displayed_courses,
  SUM(CASE WHEN is_active = true AND display = true THEN 1 ELSE 0 END) as active_and_displayed
FROM public.courses;

-- Update all active courses to be displayed
UPDATE public.courses
SET
  display = true,
  updated_at = NOW()
WHERE is_active = true;

-- Check results after update
SELECT
  'AFTER UPDATE' as status,
  COUNT(*) as total_courses,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_courses,
  SUM(CASE WHEN display = true THEN 1 ELSE 0 END) as displayed_courses,
  SUM(CASE WHEN is_active = true AND display = true THEN 1 ELSE 0 END) as active_and_displayed
FROM public.courses;

-- Show all courses that are now visible
SELECT
  id,
  title,
  start_date,
  is_active,
  display,
  CASE
    WHEN is_active = true AND display = true THEN '✓ Will show on website'
    WHEN is_active = true AND display = false THEN '✗ Active but hidden'
    WHEN is_active = false THEN '✗ Inactive'
  END as display_status
FROM public.courses
WHERE is_active = true
ORDER BY sort_order;

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- BEFORE UPDATE: Check how many courses were hidden
-- AFTER UPDATE: active_and_displayed should equal active_courses
-- All courses should show "✓ Will show on website"
-- ============================================================================
