-- =====================================================
-- ALL-IN-ONE DEDUPLICATION SCRIPT
-- =====================================================
-- This script will:
-- 1. Show duplicate analysis
-- 2. Deactivate duplicate questions (soft delete)
-- 3. Add unique constraint to prevent future duplicates
-- 4. Verify the results
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: ANALYSIS - Show current duplicates
-- =====================================================

SELECT '========== STEP 1: DUPLICATE ANALYSIS ==========' as step;

-- Show which questions are duplicated
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

-- Show counts
SELECT
  'Total active questions' as metric,
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
  'Duplicates to remove' as metric,
  COUNT(*) - COUNT(DISTINCT question_text) as count
FROM assessment_questions
WHERE is_active = true;

-- =====================================================
-- STEP 2: DEDUPLICATION - Mark duplicates as inactive
-- =====================================================

SELECT '========== STEP 2: DEDUPLICATION ==========' as step;

-- Create temporary table with questions to keep (first occurrence by ID)
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
  LEFT(q.question_text, 60) || '...' as question,
  q.category_id,
  'Will be deactivated' as action
FROM assessment_questions q
WHERE q.is_active = true
  AND q.id NOT IN (SELECT id FROM questions_to_keep)
ORDER BY q.question_text;

-- Execute deactivation
UPDATE assessment_questions
SET is_active = false,
    updated_at = NOW()
WHERE is_active = true
  AND id NOT IN (SELECT id FROM questions_to_keep);

-- Show how many were deactivated
SELECT
  'Questions kept active' as status,
  COUNT(*) as count
FROM questions_to_keep

UNION ALL

SELECT
  'Questions deactivated' as status,
  (SELECT COUNT(*) FROM assessment_questions WHERE is_active = false) as count;

-- Drop temp table
DROP TABLE questions_to_keep;

-- =====================================================
-- STEP 3: ADD UNIQUE CONSTRAINT
-- =====================================================

SELECT '========== STEP 3: ADDING UNIQUE CONSTRAINT ==========' as step;

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_unique_active_question_text;

-- Create unique partial index on question_text for active questions
CREATE UNIQUE INDEX idx_unique_active_question_text
ON assessment_questions (question_text)
WHERE is_active = true;

SELECT '✓ Unique constraint added' as status;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

SELECT '========== STEP 4: VERIFICATION ==========' as step;

-- Check for any remaining duplicates (should be 0)
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ No duplicates found - SUCCESS!'
    ELSE '✗ Still have duplicates - ERROR'
  END as duplicate_check
FROM (
  SELECT question_text
  FROM assessment_questions
  WHERE is_active = true
  GROUP BY question_text
  HAVING COUNT(*) > 1
) duplicates;

-- Show final counts
SELECT
  'Active questions' as metric,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true

UNION ALL

SELECT
  'Inactive questions' as metric,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = false;

-- Show sample of active questions
SELECT
  c.name as category,
  LEFT(q.question_text, 60) || '...' as question,
  q.difficulty_level
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE q.is_active = true
ORDER BY c.name, q.order_index
LIMIT 10;

-- Test the recommendation function with deduplicated data
SELECT '========== TESTING RECOMMENDATION FUNCTION ==========' as step;

SELECT
  LEFT(question_text, 60) || '...' as question,
  category_name,
  difficulty_level,
  relevance_score
FROM get_recommended_questions(
  'professional',
  'basic',
  ARRAY['automation', 'productivity'],
  10
);

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT
  '✅ DEDUPLICATION COMPLETE!' as status,
  'Reload your assessment page to see 10 unique questions' as next_step;

-- =====================================================
-- TO REVERSE (if needed):
--
-- UPDATE assessment_questions
-- SET is_active = true
-- WHERE is_active = false
--   AND question_text IN ('question text here');
-- =====================================================
