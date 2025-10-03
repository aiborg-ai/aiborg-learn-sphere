-- =====================================================
-- OPTION A: SOFT DELETE DUPLICATES (RECOMMENDED)
-- =====================================================
-- This marks duplicate questions as inactive (is_active = false)
-- Preserves all data and can be reversed if needed
-- =====================================================

BEGIN;

-- Create a temporary table with questions to keep (first occurrence)
CREATE TEMP TABLE questions_to_keep AS
SELECT DISTINCT ON (question_text)
  id,
  question_text
FROM assessment_questions
WHERE is_active = true
ORDER BY question_text, id ASC;

-- Show what will be deactivated
SELECT
  q.id,
  q.question_text,
  q.category_id,
  q.order_index,
  'Will be deactivated' as action
FROM assessment_questions q
WHERE q.is_active = true
  AND q.id NOT IN (SELECT id FROM questions_to_keep)
ORDER BY q.question_text;

-- Confirm the count
SELECT
  'Questions to keep' as status,
  COUNT(*) as count
FROM questions_to_keep

UNION ALL

SELECT
  'Questions to deactivate' as status,
  COUNT(*) as count
FROM assessment_questions q
WHERE q.is_active = true
  AND q.id NOT IN (SELECT id FROM questions_to_keep);

-- Execute deactivation (uncomment to run):
UPDATE assessment_questions
SET is_active = false
WHERE is_active = true
  AND id NOT IN (SELECT id FROM questions_to_keep);

-- Drop temp table
DROP TABLE questions_to_keep;

-- Verify the result
SELECT
  'Active questions after cleanup' as status,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true;

-- Check for any remaining duplicates
SELECT
  question_text,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;

-- If the above query returns 0 rows, deduplication was successful!

COMMIT;

-- =====================================================
-- TO REVERSE THIS (if needed):
-- UPDATE assessment_questions SET is_active = true
-- WHERE id IN (select the IDs you want to reactivate);
-- =====================================================
