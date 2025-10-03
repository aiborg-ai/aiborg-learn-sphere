-- =====================================================
-- OPTION B: HARD DELETE DUPLICATES (PERMANENT)
-- =====================================================
-- WARNING: This permanently deletes duplicate question records
-- Make sure you have a backup before running this!
-- =====================================================

BEGIN;

-- Create backup table first (REQUIRED)
CREATE TABLE IF NOT EXISTS assessment_questions_backup_20251003 AS
SELECT * FROM assessment_questions;

-- Create backup of options table too
CREATE TABLE IF NOT EXISTS assessment_question_options_backup_20251003 AS
SELECT * FROM assessment_question_options;

-- Create backup of user answers
CREATE TABLE IF NOT EXISTS user_assessment_answers_backup_20251003 AS
SELECT * FROM user_assessment_answers;

SELECT 'Backups created successfully' as status;

-- Create temporary table with questions to keep (first occurrence)
CREATE TEMP TABLE questions_to_keep AS
SELECT DISTINCT ON (question_text)
  id,
  question_text
FROM assessment_questions
WHERE is_active = true
ORDER BY question_text, id ASC;

-- Create temporary table with IDs to delete
CREATE TEMP TABLE questions_to_delete AS
SELECT id
FROM assessment_questions q
WHERE q.is_active = true
  AND q.id NOT IN (SELECT id FROM questions_to_keep);

-- Show what will be deleted
SELECT
  q.id,
  q.question_text,
  q.category_id,
  COUNT(o.id) as option_count,
  COUNT(ua.id) as user_answers_count
FROM assessment_questions q
LEFT JOIN assessment_question_options o ON o.question_id = q.id
LEFT JOIN user_assessment_answers ua ON ua.question_id = q.id
WHERE q.id IN (SELECT id FROM questions_to_delete)
GROUP BY q.id, q.question_text, q.category_id
ORDER BY q.question_text;

-- Confirm counts
SELECT
  'Questions to keep' as status,
  COUNT(*) as count
FROM questions_to_keep

UNION ALL

SELECT
  'Questions to DELETE' as status,
  COUNT(*) as count
FROM questions_to_delete;

-- WARNING: Uncomment to execute PERMANENT deletion:
--
-- -- Step 1: Delete associated question options
-- DELETE FROM assessment_question_options
-- WHERE question_id IN (SELECT id FROM questions_to_delete);
--
-- -- Step 2: Update user answers to point to kept questions (if needed)
-- -- This is complex and may not be appropriate for all cases
-- -- Consider if you want to delete user answers or migrate them
--
-- -- Step 3: Delete duplicate questions
-- DELETE FROM assessment_questions
-- WHERE id IN (SELECT id FROM questions_to_delete);

-- Clean up temp tables
DROP TABLE questions_to_keep;
DROP TABLE questions_to_delete;

-- Verify the result (after uncommenting delete statements)
SELECT
  'Questions remaining' as status,
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
-- TO RESTORE FROM BACKUP (if something goes wrong):
--
-- DROP TABLE assessment_questions;
-- DROP TABLE assessment_question_options;
-- DROP TABLE user_assessment_answers;
--
-- CREATE TABLE assessment_questions AS
-- SELECT * FROM assessment_questions_backup_20251003;
--
-- CREATE TABLE assessment_question_options AS
-- SELECT * FROM assessment_question_options_backup_20251003;
--
-- CREATE TABLE user_assessment_answers AS
-- SELECT * FROM user_assessment_answers_backup_20251003;
-- =====================================================
