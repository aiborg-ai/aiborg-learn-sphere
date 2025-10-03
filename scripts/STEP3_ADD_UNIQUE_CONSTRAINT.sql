-- STEP 3: Add unique constraint to prevent future duplicates
DROP INDEX IF EXISTS idx_unique_active_question_text;
CREATE UNIQUE INDEX idx_unique_active_question_text
ON assessment_questions (question_text)
WHERE is_active = true;
