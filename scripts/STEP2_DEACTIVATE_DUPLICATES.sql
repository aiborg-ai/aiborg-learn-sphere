-- STEP 2: Deactivate duplicate questions (keeps first occurrence by ID)
WITH questions_to_keep AS (
  SELECT DISTINCT ON (question_text)
    id
  FROM assessment_questions
  WHERE is_active = true
  ORDER BY question_text, id ASC
)
UPDATE assessment_questions
SET is_active = false
WHERE is_active = true
  AND id NOT IN (SELECT id FROM questions_to_keep);
