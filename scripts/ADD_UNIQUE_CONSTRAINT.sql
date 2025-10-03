-- =====================================================
-- Add Unique Constraint to Prevent Future Duplicates
-- =====================================================
-- Run this AFTER deduplication to prevent duplicates in the future
-- =====================================================

BEGIN;

-- First, verify no duplicates exist
SELECT
  question_text,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;

-- If the above returns any rows, run deduplication first!

-- Add a unique constraint on question_text where is_active = true
-- Note: PostgreSQL doesn't support conditional unique constraints directly
-- We need to use a unique partial index instead

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_unique_active_question_text;

-- Create unique partial index
CREATE UNIQUE INDEX idx_unique_active_question_text
ON assessment_questions (question_text)
WHERE is_active = true;

-- Verify the index was created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'assessment_questions'
  AND indexname = 'idx_unique_active_question_text';

SELECT '✅ Unique constraint added successfully!' as status;

-- Test: Try to insert a duplicate (should fail)
-- Uncomment to test:
-- INSERT INTO assessment_questions (
--   category_id,
--   question_text,
--   question_type,
--   is_active
-- )
-- VALUES (
--   (SELECT id FROM assessment_categories LIMIT 1),
--   (SELECT question_text FROM assessment_questions WHERE is_active = true LIMIT 1),
--   'single_choice',
--   true
-- );
-- Expected error: duplicate key value violates unique constraint

COMMIT;
