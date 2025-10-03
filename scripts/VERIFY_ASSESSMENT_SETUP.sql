-- =====================================================
-- VERIFICATION QUERIES FOR CURATED ASSESSMENT SYSTEM
-- Run these to verify everything is set up correctly
-- =====================================================

-- 1. Check total questions and categories
SELECT
  c.name AS category,
  COUNT(DISTINCT q.id) AS question_count,
  COUNT(o.id) AS option_count,
  c.weight,
  c.order_index
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.id, c.name, c.weight, c.order_index
ORDER BY c.order_index;

-- Expected Results:
-- Prompt Engineering: 25 questions, ~96 options
-- AI Agents: 5 questions, ~19 options
-- LLM Fundamentals: 6 questions, ~23 options
-- Development Platforms: 5 questions, ~15 options

-- 2. Check difficulty level distribution
SELECT
  c.name AS category,
  q.difficulty_level,
  COUNT(*) AS count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name, q.difficulty_level
ORDER BY c.name,
  CASE q.difficulty_level
    WHEN 'foundational' THEN 1
    WHEN 'applied' THEN 2
    WHEN 'advanced' THEN 3
    WHEN 'strategic' THEN 4
  END;

-- 3. Check experience level distribution
SELECT
  c.name AS category,
  q.recommended_experience_level,
  COUNT(*) AS count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name, q.recommended_experience_level
ORDER BY c.name,
  CASE q.recommended_experience_level
    WHEN 'none' THEN 1
    WHEN 'basic' THEN 2
    WHEN 'intermediate' THEN 3
    WHEN 'advanced' THEN 4
  END;

-- 4. Check audience filters
SELECT
  c.name AS category,
  UNNEST(q.audience_filters) AS audience,
  COUNT(*) AS question_count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
  AND q.audience_filters IS NOT NULL
GROUP BY c.name, audience
ORDER BY c.name, audience;

-- 5. Check tags
SELECT
  c.name AS category,
  UNNEST(q.tags) AS tag,
  COUNT(*) AS usage_count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
  AND q.tags IS NOT NULL AND array_length(q.tags, 1) > 0
GROUP BY c.name, tag
ORDER BY c.name, usage_count DESC;

-- 6. Sample questions with full metadata
SELECT
  c.name AS category,
  q.order_index,
  LEFT(q.question_text, 70) || '...' AS question,
  q.difficulty_level,
  q.recommended_experience_level,
  q.audience_filters,
  array_length(q.tags, 1) AS tag_count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
ORDER BY c.name, q.order_index
LIMIT 20;

-- 7. Verify correct answers are marked
SELECT
  c.name AS category,
  q.order_index,
  LEFT(q.question_text, 50) || '...' AS question,
  COUNT(*) AS total_options,
  COUNT(*) FILTER (WHERE o.is_correct = true) AS correct_answers
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name, q.id, q.order_index, q.question_text
HAVING COUNT(*) FILTER (WHERE o.is_correct = true) = 0  -- Show questions with NO correct answer
ORDER BY c.name, q.order_index;

-- If this returns any rows, those questions need correct answers marked!

-- 8. Test the recommendation function
SELECT '========== TEST 1: Professional with Intermediate Experience ==========' AS test_case;
SELECT
  question_text,
  category_name,
  difficulty_level,
  recommended_experience_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'professional',
  p_experience_level := 'intermediate',
  p_goals := ARRAY['automation', 'productivity'],
  p_limit := 10
);

SELECT '========== TEST 2: Secondary Student with Basic Experience ==========' AS test_case;
SELECT
  question_text,
  category_name,
  difficulty_level,
  recommended_experience_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'secondary',
  p_experience_level := 'basic',
  p_goals := ARRAY['learning', 'college-prep'],
  p_limit := 10
);

SELECT '========== TEST 3: Business Owner with No Experience ==========' AS test_case;
SELECT
  question_text,
  category_name,
  difficulty_level,
  recommended_experience_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'business',
  p_experience_level := 'none',
  p_goals := ARRAY['efficiency', 'cost-reduction'],
  p_limit := 10
);

-- 9. Check for any missing metadata
SELECT
  'Questions missing difficulty_level' AS issue,
  COUNT(*) AS count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
  AND q.difficulty_level IS NULL

UNION ALL

SELECT
  'Questions missing experience_level' AS issue,
  COUNT(*) AS count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
  AND q.recommended_experience_level IS NULL

UNION ALL

SELECT
  'Questions missing tags' AS issue,
  COUNT(*) AS count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
  AND (q.tags IS NULL OR array_length(q.tags, 1) = 0);

-- All counts should be 0!

-- 10. Overall summary
SELECT
  '✅ ASSESSMENT SYSTEM READY' AS status,
  COUNT(DISTINCT c.id) AS total_categories,
  COUNT(DISTINCT q.id) AS total_questions,
  COUNT(o.id) AS total_options,
  COUNT(*) FILTER (WHERE o.is_correct = true) AS correct_answers
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms');
