-- Check what categories exist
SELECT name, id
FROM assessment_categories
ORDER BY name;

-- Check questions by category
SELECT
  ac.name as category_name,
  COUNT(aq.id) as question_count,
  STRING_AGG(DISTINCT aq.audience_filters::text, ', ') as audiences
FROM assessment_categories ac
LEFT JOIN assessment_questions aq ON ac.id = aq.category_id AND aq.is_active = true
GROUP BY ac.name
ORDER BY question_count DESC;

-- Check if there are questions with primary/secondary/professional audiences
SELECT
  COUNT(*) as total_questions,
  SUM(CASE WHEN 'primary' = ANY(audience_filters) THEN 1 ELSE 0 END) as primary_questions,
  SUM(CASE WHEN 'secondary' = ANY(audience_filters) THEN 1 ELSE 0 END) as secondary_questions,
  SUM(CASE WHEN 'professional' = ANY(audience_filters) THEN 1 ELSE 0 END) as professional_questions
FROM assessment_questions
WHERE is_active = true;
