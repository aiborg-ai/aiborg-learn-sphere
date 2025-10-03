-- Simple deduplication script - run this in Supabase SQL Editor

-- Step 1: Show duplicates
SELECT
  question_text,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;

-- Step 2: Deactivate duplicates (keeps first occurrence)
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

-- Step 3: Add unique constraint
DROP INDEX IF EXISTS idx_unique_active_question_text;
CREATE UNIQUE INDEX idx_unique_active_question_text
ON assessment_questions (question_text)
WHERE is_active = true;

-- Step 4: Verify - should return 0 rows
SELECT
  question_text,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;

-- Step 5: Test the recommendation function
SELECT
  LEFT(question_text, 60) as question,
  category_name,
  difficulty_level,
  relevance_score
FROM get_recommended_questions(
  'professional',
  'basic',
  ARRAY['automation', 'productivity'],
  10
);
