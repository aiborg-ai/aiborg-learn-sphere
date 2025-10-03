-- Script to populate IRT difficulty values for existing assessment questions
-- This assigns difficulty values based on question metadata and difficulty_level

-- =====================================================
-- 1. SET IRT DIFFICULTY BASED ON difficulty_level
-- =====================================================

-- Map text difficulty levels to IRT scale (-3.0 to +3.0)
-- easy: -1.0 to -0.5
-- medium: -0.3 to 0.3
-- hard: 0.5 to 1.5
-- very_hard: 1.5 to 2.5

UPDATE assessment_questions
SET irt_difficulty = CASE
  WHEN difficulty_level = 'easy' THEN -0.75 + (RANDOM() * 0.5)
  WHEN difficulty_level = 'medium' THEN -0.15 + (RANDOM() * 0.6)
  WHEN difficulty_level = 'hard' THEN 0.75 + (RANDOM() * 1.0)
  WHEN difficulty_level = 'very_hard' THEN 1.75 + (RANDOM() * 0.75)
  ELSE 0.0
END
WHERE irt_difficulty = 0.0 OR irt_difficulty IS NULL;

-- =====================================================
-- 2. ADJUST BASED ON QUESTION TYPE
-- =====================================================

-- Multiple choice questions are typically easier than open-ended
UPDATE assessment_questions
SET irt_difficulty = irt_difficulty - 0.2
WHERE question_type = 'single_choice'
  AND difficulty_level IN ('medium', 'hard');

-- Multiple answer questions are harder
UPDATE assessment_questions
SET irt_difficulty = irt_difficulty + 0.3
WHERE question_type = 'multiple_choice'
  AND difficulty_level IN ('easy', 'medium');

-- =====================================================
-- 3. ENSURE VALUES ARE WITHIN VALID RANGE
-- =====================================================

UPDATE assessment_questions
SET irt_difficulty = GREATEST(-3.0, LEAST(3.0, irt_difficulty))
WHERE irt_difficulty < -3.0 OR irt_difficulty > 3.0;

-- =====================================================
-- 4. VIEW DISTRIBUTION
-- =====================================================

-- Check the distribution of IRT difficulty values
SELECT
  difficulty_level,
  question_type,
  COUNT(*) as question_count,
  ROUND(AVG(irt_difficulty)::numeric, 2) as avg_irt_difficulty,
  ROUND(MIN(irt_difficulty)::numeric, 2) as min_irt_difficulty,
  ROUND(MAX(irt_difficulty)::numeric, 2) as max_irt_difficulty
FROM assessment_questions
WHERE is_active = true
GROUP BY difficulty_level, question_type
ORDER BY difficulty_level, question_type;

-- =====================================================
-- 5. SHOW SAMPLE QUESTIONS WITH IRT VALUES
-- =====================================================

SELECT
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

This script adds some randomization to create variety within each difficulty band.
This prevents all "medium" questions from having identical IRT values.

To refine these values over time:
- Monitor the assessment_answer_performance table
- Calculate actual success rates for each question
- Adjust IRT values based on observed performance
- Use IRT calibration algorithms for precision
*/
