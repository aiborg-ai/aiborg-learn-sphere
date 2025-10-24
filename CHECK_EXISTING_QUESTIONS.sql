-- Check if questions already exist
SELECT
  'AI-AWARENESS Questions' as assessment_type,
  COUNT(*) as question_count
FROM assessment_questions
WHERE question_text LIKE '%AI%'
  AND is_active = true
  AND ('primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters))
UNION ALL
SELECT
  'TOTAL Active Questions' as assessment_type,
  COUNT(*) as question_count
FROM assessment_questions
WHERE is_active = true;

-- Check categories
SELECT
  ac.name as category_name,
  COUNT(aq.id) as question_count
FROM assessment_categories ac
LEFT JOIN assessment_questions aq ON ac.id = aq.category_id AND aq.is_active = true
GROUP BY ac.name
ORDER BY question_count DESC;

-- Check if questions are already linked to tools
SELECT
  t.name as tool_name,
  t.slug,
  COUNT(aqp.id) as questions_linked
FROM assessment_tools t
LEFT JOIN assessment_question_pools aqp ON t.id = aqp.tool_id AND aqp.is_active = true
WHERE t.is_active = true
GROUP BY t.id, t.name, t.slug
ORDER BY t.display_order;
