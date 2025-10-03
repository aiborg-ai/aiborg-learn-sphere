-- Drop and recreate the recommendation function with correct types
-- Run this in Supabase SQL Editor

-- Drop all versions of the function
DROP FUNCTION IF EXISTS get_recommended_questions(TEXT, TEXT, TEXT[], INTEGER);
DROP FUNCTION IF EXISTS get_recommended_questions;

-- Recreate with correct types
CREATE FUNCTION get_recommended_questions(
  p_audience_type TEXT,
  p_experience_level TEXT DEFAULT 'basic',
  p_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  category_name TEXT,
  difficulty_level TEXT,
  relevance_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id AS question_id,
    q.question_text,
    c.name::TEXT AS category_name,
    q.difficulty_level::TEXT AS difficulty_level,
    -- Calculate relevance score based on multiple factors
    (
      CASE
        -- Perfect audience match
        WHEN q.audience_filters IS NULL OR p_audience_type = ANY(q.audience_filters) THEN 20
        ELSE 0
      END +
      CASE
        -- Experience level match
        WHEN q.recommended_experience_level = p_experience_level THEN 15
        WHEN q.recommended_experience_level = 'none' THEN 10
        WHEN p_experience_level = 'advanced' THEN 12
        ELSE 5
      END +
      CASE
        -- Goal alignment (check if any tags match goals)
        WHEN p_goals && q.tags THEN 15
        ELSE 0
      END
    )::INTEGER AS relevance_score
  FROM assessment_questions q
  JOIN assessment_categories c ON q.category_id = c.id
  WHERE q.is_active = true
    AND (
      q.audience_filters IS NULL
      OR p_audience_type = ANY(q.audience_filters)
    )
  ORDER BY relevance_score DESC, q.order_index ASC
  LIMIT p_limit;
END;
$$;

-- Verify function was created
SELECT 'Function created successfully!' as status;

-- Test with a sample query
SELECT
  question_text,
  category_name,
  difficulty_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'professional',
  p_experience_level := 'basic',
  p_goals := ARRAY['automation', 'productivity'],
  p_limit := 5
);
