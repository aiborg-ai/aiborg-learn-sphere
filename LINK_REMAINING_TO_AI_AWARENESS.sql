-- Link all remaining questions (not in AI-Fluency) to AI-Awareness
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE is_active = true
  AND ('primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters))
  AND id NOT IN (
    SELECT question_id FROM assessment_question_pools
    WHERE tool_id = (SELECT id FROM assessment_tools WHERE slug = 'ai-fluency')
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;

UPDATE assessment_tools
SET total_questions_pool = (
  SELECT COUNT(*)
  FROM assessment_question_pools
  WHERE tool_id = assessment_tools.id AND is_active = true
)
WHERE slug = 'ai-awareness';

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
