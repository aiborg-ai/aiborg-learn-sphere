-- CORRECTED Script to populate IRT difficulty values for existing assessment questions
-- This assigns difficulty values based on the ACTUAL difficulty_level values in the database
-- Uses: foundational, applied, advanced, strategic (NOT easy/medium/hard)

-- =====================================================
-- 1. SET IRT DIFFICULTY BASED ON difficulty_level
-- =====================================================

-- Map actual difficulty levels to IRT scale (-3.0 to +3.0)
-- foundational: -1.0 to -0.5 (beginner/basic level)
-- applied:      -0.3 to 0.5  (intermediate/practical)
-- advanced:      0.5 to 1.5  (advanced/expert)
-- strategic:     1.5 to 2.5  (strategic/mastery)

UPDATE assessment_questions
SET irt_difficulty = CASE
  WHEN difficulty_level = 'foundational' THEN -0.75 + (RANDOM() * 0.5)
  WHEN difficulty_level = 'applied' THEN -0.15 + (RANDOM() * 0.8)
  WHEN difficulty_level = 'advanced' THEN 0.75 + (RANDOM() * 1.0)
  WHEN difficulty_level = 'strategic' THEN 1.75 + (RANDOM() * 0.75)
  ELSE 0.0
END
WHERE (irt_difficulty = 0.0 OR irt_difficulty IS NULL)
  AND is_active = true;

-- =====================================================
-- 2. ADJUST BASED ON QUESTION TYPE
-- =====================================================

-- Single choice questions are typically easier (more straightforward)
UPDATE assessment_questions
SET irt_difficulty = irt_difficulty - 0.2
WHERE question_type = 'single_choice'
  AND difficulty_level IN ('applied', 'advanced')
  AND is_active = true;

-- Multiple choice questions require more analysis
UPDATE assessment_questions
SET irt_difficulty = irt_difficulty + 0.3
WHERE question_type = 'multiple_choice'
  AND difficulty_level IN ('foundational', 'applied')
  AND is_active = true;

-- =====================================================
-- 3. ENSURE VALUES ARE WITHIN VALID RANGE
-- =====================================================

UPDATE assessment_questions
SET irt_difficulty = GREATEST(-3.0, LEAST(3.0, irt_difficulty))
WHERE irt_difficulty < -3.0 OR irt_difficulty > 3.0;

-- =====================================================
-- 4. VIEW DISTRIBUTION BY ACTUAL DIFFICULTY LEVELS
-- =====================================================

SELECT
  'Distribution by difficulty level' as report_type,
  difficulty_level,
  question_type,
  COUNT(*) as question_count,
  ROUND(AVG(irt_difficulty)::numeric, 2) as avg_irt_difficulty,
  ROUND(MIN(irt_difficulty)::numeric, 2) as min_irt_difficulty,
  ROUND(MAX(irt_difficulty)::numeric, 2) as max_irt_difficulty
FROM assessment_questions
WHERE is_active = true
GROUP BY difficulty_level, question_type
ORDER BY
  CASE difficulty_level
    WHEN 'foundational' THEN 1
    WHEN 'applied' THEN 2
    WHEN 'advanced' THEN 3
    WHEN 'strategic' THEN 4
    ELSE 5
  END,
  question_type;

-- =====================================================
-- 5. SHOW SAMPLE QUESTIONS WITH IRT VALUES
-- =====================================================

SELECT
  'Sample questions' as report_type,
  q.id,
  LEFT(q.question_text, 60) || '...' as question_preview,
  q.difficulty_level,
  q.question_type,
  ROUND(q.irt_difficulty::numeric, 2) as irt_difficulty,
  c.name as category
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE q.is_active = true
ORDER BY q.irt_difficulty
LIMIT 20;

-- =====================================================
-- 6. STATISTICS SUMMARY
-- =====================================================

SELECT
  'Summary statistics' as report_type,
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE irt_difficulty < -1.0) as very_easy_count,
  COUNT(*) FILTER (WHERE irt_difficulty >= -1.0 AND irt_difficulty < 0) as easy_count,
  COUNT(*) FILTER (WHERE irt_difficulty >= 0 AND irt_difficulty < 1.0) as medium_count,
  COUNT(*) FILTER (WHERE irt_difficulty >= 1.0 AND irt_difficulty < 2.0) as hard_count,
  COUNT(*) FILTER (WHERE irt_difficulty >= 2.0) as very_hard_count,
  ROUND(AVG(irt_difficulty)::numeric, 2) as avg_difficulty,
  ROUND(STDDEV(irt_difficulty)::numeric, 2) as difficulty_stddev
FROM assessment_questions
WHERE is_active = true;

-- =====================================================
-- 7. VERIFY NO ZEROS REMAIN
-- =====================================================

SELECT
  'Verification' as report_type,
  COUNT(*) FILTER (WHERE irt_difficulty = 0.0) as questions_with_zero_irt,
  COUNT(*) FILTER (WHERE irt_difficulty IS NULL) as questions_with_null_irt,
  COUNT(*) FILTER (WHERE irt_difficulty != 0.0) as questions_with_populated_irt,
  CASE
    WHEN COUNT(*) FILTER (WHERE irt_difficulty = 0.0) = 0 THEN '✅ All IRT values populated successfully'
    ELSE '⚠️ Some questions still have IRT = 0.0'
  END as status
FROM assessment_questions
WHERE is_active = true;

-- =====================================================
-- NOTES
-- =====================================================

/*
IRT Difficulty Scale Guide:
- -3.0 to -1.5: Very Easy (beginners with low ability can answer)
- -1.5 to -0.5: Easy (most beginners can answer)
- -0.5 to 0.5:  Medium (average difficulty, 50% success rate for average ability)
- 0.5 to 1.5:   Hard (requires above-average ability)
- 1.5 to 2.5:   Very Hard (only high-ability users succeed)
- 2.5 to 3.0:   Extremely Hard (expert-level only)

Mapping to your difficulty levels:
- foundational → Easy range (-1.0 to -0.5)
- applied      → Medium range (-0.3 to 0.5)
- advanced     → Hard range (0.5 to 1.5)
- strategic    → Very Hard range (1.5 to 2.5)

This script adds randomization to create variety within each difficulty band.
This prevents all questions of the same level from having identical IRT values.

To refine these values over time:
- Monitor the assessment_answer_performance table
- Calculate actual success rates for each question
- Adjust IRT values based on observed performance
- Use full IRT calibration algorithms for precision
*/
