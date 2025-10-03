-- STEP 4: Verify deduplication (should return 0 rows)
SELECT
  question_text,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;

-- Show total active questions
SELECT COUNT(*) as active_questions
FROM assessment_questions
WHERE is_active = true;
