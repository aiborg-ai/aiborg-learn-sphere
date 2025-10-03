-- =====================================================
-- PLAN: Deduplicate Assessment Questions in Database
-- =====================================================
-- This script will:
-- 1. Identify duplicate questions (same question_text)
-- 2. Keep the FIRST occurrence of each question (lowest ID)
-- 3. Update any references in related tables
-- 4. Delete duplicate question records
-- 5. Add a unique constraint to prevent future duplicates
-- =====================================================

-- STEP 1: Analyze duplicates (READ-ONLY)
-- Run this first to see what duplicates exist
SELECT
  question_text,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY id) as all_ids,
  (array_agg(id ORDER BY id))[1] as keep_id
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 2: Check how many questions will be affected
SELECT
  'Total questions' as metric,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true

UNION ALL

SELECT
  'Unique questions' as metric,
  COUNT(DISTINCT question_text) as count
FROM assessment_questions
WHERE is_active = true

UNION ALL

SELECT
  'Duplicate questions to delete' as metric,
  COUNT(*) - COUNT(DISTINCT question_text) as count
FROM assessment_questions
WHERE is_active = true;

-- STEP 3: Check if any user answers reference duplicate questions
-- This ensures we don't break user data
SELECT
  uaa.question_id,
  q.question_text,
  COUNT(*) as answer_count
FROM user_assessment_answers uaa
JOIN assessment_questions q ON uaa.question_id = q.id
WHERE q.question_text IN (
  SELECT question_text
  FROM assessment_questions
  WHERE is_active = true
  GROUP BY question_text
  HAVING COUNT(*) > 1
)
GROUP BY uaa.question_id, q.question_text
ORDER BY q.question_text, uaa.question_id;

-- STEP 4: Create backup table (SAFETY)
-- Uncomment to execute:
-- CREATE TABLE assessment_questions_backup_20251003 AS
-- SELECT * FROM assessment_questions;

-- STEP 5: Deduplication strategy
-- We have two options:

-- OPTION A: Soft delete duplicates (SAFER - Recommended)
-- Mark duplicates as inactive instead of deleting them
-- This preserves data and can be reversed

-- OPTION B: Hard delete duplicates (PERMANENT)
-- Actually delete duplicate records
-- Cannot be undone without backup

-- =====================================================
-- END OF PLAN
--
-- Next steps:
-- 1. Review the analysis output
-- 2. Choose Option A (soft delete) or Option B (hard delete)
-- 3. Run the appropriate execution script
-- =====================================================
