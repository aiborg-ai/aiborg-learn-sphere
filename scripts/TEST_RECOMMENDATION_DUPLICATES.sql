-- Test if the recommendation function returns duplicate question_ids
SELECT
  question_id,
  COUNT(*) as occurrence_count
FROM get_recommended_questions(
  p_audience_type := 'professional',
  p_experience_level := 'basic',
  p_goals := ARRAY['automation', 'productivity'],
  p_limit := 10
)
GROUP BY question_id
HAVING COUNT(*) > 1;

-- If this returns any rows, we have duplicates from the function

-- Also check if there are duplicate questions in the database
SELECT
  question_text,
  COUNT(*) as count,
  array_agg(id) as question_ids
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;
