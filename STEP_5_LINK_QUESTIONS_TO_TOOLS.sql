-- =====================================================
-- STEP 5: Link Questions to Assessment Tools
-- =====================================================

-- Link AI-Awareness questions to AI-Awareness tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE is_active = true
  AND ('primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters))
  AND category_id IN (
    SELECT id FROM assessment_categories
    WHERE name IN ('AI Fundamentals', 'AI Applications', 'AI Ethics')
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;

-- Link AI-Fluency questions to AI-Fluency tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-fluency'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE is_active = true
  AND ('primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters))
  AND category_id IN (
    SELECT id FROM assessment_categories
    WHERE name IN ('AI Tools & Frameworks', 'Prompt Engineering', 'Machine Learning Fundamentals')
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;

-- Update question pool counts
UPDATE assessment_tools
SET total_questions_pool = (
  SELECT COUNT(*)
  FROM assessment_question_pools
  WHERE tool_id = assessment_tools.id AND is_active = true
)
WHERE slug IN ('ai-awareness', 'ai-fluency');

-- Verify the linkage worked
SELECT
  t.name,
  t.slug,
  t.total_questions_pool,
  COUNT(aqp.id) as questions_in_pool
FROM assessment_tools t
LEFT JOIN assessment_question_pools aqp ON t.id = aqp.tool_id AND aqp.is_active = true
WHERE t.is_active = true
GROUP BY t.id, t.name, t.slug, t.total_questions_pool
ORDER BY t.display_order;
