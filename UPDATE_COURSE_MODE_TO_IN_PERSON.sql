-- ====================================================================
-- UPDATE COURSE MODE FROM "Offline" TO "In-Person"
-- This script updates all courses with mode="Offline" to mode="In-Person"
-- ====================================================================

-- STEP 1: Check current courses with "Offline" mode
SELECT
  id,
  title,
  mode,
  created_at,
  updated_at
FROM courses
WHERE mode = 'Offline';

-- Expected: List of courses that will be updated

-- ====================================================================

-- STEP 2: UPDATE all "Offline" courses to "In-Person"
UPDATE courses
SET
  mode = 'In-Person',
  updated_at = now()
WHERE mode = 'Offline';

-- Expected output: UPDATE X (where X is the number of courses updated)

-- ====================================================================

-- STEP 3: VERIFY the update
SELECT
  id,
  title,
  mode,
  updated_at
FROM courses
WHERE mode = 'In-Person'
ORDER BY updated_at DESC;

-- Expected: All courses that were "Offline" now show "In-Person"

-- ====================================================================

-- STEP 4: Check that no "Offline" courses remain
SELECT COUNT(*) as offline_courses_remaining
FROM courses
WHERE mode = 'Offline';

-- Expected: offline_courses_remaining = 0

-- ====================================================================

-- STEP 5: Summary of all course modes
SELECT
  mode,
  COUNT(*) as course_count
FROM courses
GROUP BY mode
ORDER BY course_count DESC;

-- Expected: Shows distribution of Online, In-Person, and Hybrid courses

-- ====================================================================
-- NOTES:
-- - This update only affects the display text
-- - No course functionality is changed
-- - The mode field is used for filtering and display purposes
-- - "In-Person" is more professional than "Offline"
-- ====================================================================

-- Created: October 9, 2025
-- Purpose: Rebrand "Offline" mode to "In-Person" for better clarity
