-- Force drop and recreate the recommendation function
-- Run this in Supabase SQL Editor

-- Step 1: Check if function exists
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_recommended_questions';

-- Step 2: Drop with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS get_recommended_questions(TEXT, TEXT, TEXT[], INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_recommended_questions CASCADE;

-- Step 3: Verify it's gone
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ Function dropped successfully'
    ELSE '✗ Function still exists'
  END as status
FROM pg_proc
WHERE proname = 'get_recommended_questions';

-- Step 4: Recreate with explicit TEXT casting
CREATE OR REPLACE FUNCTION get_recommended_questions(
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
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    CAST(c.name AS TEXT),
    CAST(q.difficulty_level AS TEXT),
    CAST(
      (
        CASE
          WHEN q.audience_filters IS NULL OR p_audience_type = ANY(q.audience_filters) THEN 20
          ELSE 0
        END +
        CASE
          WHEN q.recommended_experience_level = p_experience_level THEN 15
          WHEN q.recommended_experience_level = 'none' THEN 10
          WHEN p_experience_level = 'advanced' THEN 12
          ELSE 5
        END +
        CASE
          WHEN p_goals && q.tags THEN 15
          ELSE 0
        END
      ) AS INTEGER
    ) AS relevance_score
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
$function$;

-- Step 5: Verify function was created
SELECT '✓ Function recreated successfully!' as status;

-- Step 6: Test it
SELECT
  LEFT(question_text, 60) || '...' as question,
  category_name,
  difficulty_level,
  relevance_score
FROM get_recommended_questions(
  'professional',
  'basic',
  ARRAY['automation', 'productivity'],
  5
);
