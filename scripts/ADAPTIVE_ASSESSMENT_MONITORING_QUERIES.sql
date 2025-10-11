-- ============================================================================
-- Adaptive Assessment Monitoring Queries
-- Production deployment monitoring and analytics
-- ============================================================================

-- ============================================================================
-- 1. REAL-TIME ENGAGEMENT METRICS
-- ============================================================================

-- Overall engagement snapshot (last 7 days)
SELECT
  COUNT(*) as total_assessments,
  COUNT(*) FILTER (WHERE is_complete = true) as completed,
  COUNT(*) FILTER (WHERE is_complete = false) as abandoned,
  ROUND(COUNT(*) FILTER (WHERE is_complete = true)::numeric / NULLIF(COUNT(*), 0), 3) as completion_rate,
  ROUND(AVG(questions_answered_count), 1) as avg_questions,
  ROUND(AVG(current_ability_estimate), 2) as avg_ability,
  ROUND(AVG(CASE
    WHEN is_complete AND started_at IS NOT NULL AND completed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
    ELSE NULL
  END), 1) as avg_completion_minutes
FROM user_ai_assessments
WHERE is_adaptive = true
  AND started_at >= NOW() - INTERVAL '7 days';

-- ============================================================================
-- 2. DAILY TRENDS (Last 30 days)
-- ============================================================================

SELECT
  DATE(started_at) as assessment_date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_complete = true) as completed,
  COUNT(*) FILTER (WHERE is_complete = false) as abandoned,
  ROUND(AVG(questions_answered_count), 1) as avg_questions,
  ROUND(AVG(current_ability_estimate), 2) as avg_ability
FROM user_ai_assessments
WHERE is_adaptive = true
  AND started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY assessment_date DESC;

-- ============================================================================
-- 3. USER ENGAGEMENT LEVELS
-- ============================================================================

-- Users by engagement level
WITH user_stats AS (
  SELECT
    user_id,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE is_complete = true) as completed_attempts,
    MAX(started_at) as last_attempt,
    ROUND(AVG(current_ability_estimate), 2) as avg_ability
  FROM user_ai_assessments
  WHERE is_adaptive = true
  GROUP BY user_id
)
SELECT
  p.display_name,
  p.email,
  us.total_attempts,
  us.completed_attempts,
  us.avg_ability,
  us.last_attempt,
  CASE
    WHEN us.completed_attempts::float / us.total_attempts >= 0.8 AND us.total_attempts >= 2 THEN 'high'
    WHEN us.completed_attempts::float / us.total_attempts >= 0.5 OR us.total_attempts >= 2 THEN 'medium'
    ELSE 'low'
  END as engagement_level
FROM user_stats us
JOIN profiles p ON us.user_id = p.user_id
ORDER BY us.total_attempts DESC, us.completed_attempts DESC
LIMIT 50;

-- ============================================================================
-- 4. ABILITY DISTRIBUTION
-- ============================================================================

-- Current ability distribution
SELECT
  CASE
    WHEN current_ability_estimate < -1.0 THEN 'Beginner'
    WHEN current_ability_estimate < 0.5 THEN 'Intermediate'
    WHEN current_ability_estimate < 1.5 THEN 'Advanced'
    ELSE 'Expert'
  END as proficiency_level,
  COUNT(*) as user_count,
  ROUND(AVG(current_ability_estimate), 2) as avg_ability,
  ROUND(AVG(questions_answered_count), 1) as avg_questions
FROM user_ai_assessments
WHERE is_adaptive = true
  AND is_complete = true
  AND started_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY
  CASE
    WHEN current_ability_estimate < -1.0 THEN 1
    WHEN current_ability_estimate < 0.5 THEN 2
    WHEN current_ability_estimate < 1.5 THEN 3
    ELSE 4
  END;

-- ============================================================================
-- 5. QUESTION PERFORMANCE ANALYSIS
-- ============================================================================

-- Most frequently shown questions
SELECT
  q.question_text,
  q.difficulty_level,
  q.irt_difficulty,
  COUNT(ap.id) as times_shown,
  ROUND(AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END), 3) as success_rate,
  ROUND(AVG(ap.time_spent_seconds), 1) as avg_time_seconds
FROM assessment_questions q
JOIN assessment_answer_performance ap ON q.id = ap.question_id
WHERE ap.created_at >= NOW() - INTERVAL '7 days'
GROUP BY q.id, q.question_text, q.difficulty_level, q.irt_difficulty
ORDER BY times_shown DESC
LIMIT 20;

-- Questions with unusual performance
SELECT
  q.question_text,
  q.difficulty_level,
  q.irt_difficulty,
  COUNT(ap.id) as times_shown,
  ROUND(AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END), 3) as success_rate,
  CASE
    WHEN AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END) < 0.3 THEN 'Too Hard'
    WHEN AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END) > 0.8 THEN 'Too Easy'
    ELSE 'Balanced'
  END as difficulty_assessment
FROM assessment_questions q
JOIN assessment_answer_performance ap ON q.id = ap.question_id
WHERE ap.created_at >= NOW() - INTERVAL '7 days'
GROUP BY q.id, q.question_text, q.difficulty_level, q.irt_difficulty
HAVING COUNT(ap.id) >= 5
  AND (AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END) < 0.3
    OR AVG(CASE WHEN ap.is_correct THEN 1.0 ELSE 0.0 END) > 0.8)
ORDER BY times_shown DESC;

-- ============================================================================
-- 6. COMPLETION TIME ANALYSIS
-- ============================================================================

-- Completion time distribution
SELECT
  CASE
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 5 THEN '< 5 min'
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 10 THEN '5-10 min'
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 15 THEN '10-15 min'
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 20 THEN '15-20 min'
    ELSE '> 20 min'
  END as duration_bucket,
  COUNT(*) as assessment_count,
  ROUND(AVG(questions_answered_count), 1) as avg_questions,
  ROUND(AVG(current_ability_estimate), 2) as avg_ability
FROM user_ai_assessments
WHERE is_adaptive = true
  AND is_complete = true
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY
  CASE
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 5 THEN 1
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 10 THEN 2
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 15 THEN 3
    WHEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 < 20 THEN 4
    ELSE 5
  END;

-- ============================================================================
-- 7. EARLY EXIT ANALYSIS
-- ============================================================================

-- Users who quit early (< 3 questions)
SELECT
  p.display_name,
  p.email,
  a.questions_answered_count,
  a.started_at,
  EXTRACT(EPOCH FROM (NOW() - a.started_at)) / 60 as minutes_since_start
FROM user_ai_assessments a
JOIN profiles p ON a.user_id = p.user_id
WHERE a.is_adaptive = true
  AND a.is_complete = false
  AND a.questions_answered_count <= 2
  AND a.started_at >= NOW() - INTERVAL '7 days'
ORDER BY a.started_at DESC
LIMIT 50;

-- Early exit rate by time of day
SELECT
  EXTRACT(HOUR FROM started_at) as hour_of_day,
  COUNT(*) as total_starts,
  COUNT(*) FILTER (WHERE questions_answered_count <= 2 AND is_complete = false) as early_exits,
  ROUND(COUNT(*) FILTER (WHERE questions_answered_count <= 2 AND is_complete = false)::numeric / NULLIF(COUNT(*), 0), 3) as early_exit_rate
FROM user_ai_assessments
WHERE is_adaptive = true
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY 1;

-- ============================================================================
-- 8. STOPPING CRITERION ANALYSIS
-- ============================================================================

-- Distribution of questions answered
SELECT
  questions_answered_count,
  COUNT(*) as assessment_count,
  ROUND(AVG(current_ability_estimate), 2) as avg_ability,
  ROUND(AVG(ability_standard_error), 3) as avg_standard_error,
  CASE
    WHEN questions_answered_count >= 15 THEN 'Max Questions'
    WHEN ability_standard_error <= 0.3 AND questions_answered_count >= 8 THEN 'Confident Stop'
    WHEN questions_answered_count >= 8 THEN 'Min Questions Met'
    ELSE 'In Progress'
  END as stop_reason
FROM user_ai_assessments
WHERE is_adaptive = true
  AND is_complete = true
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY questions_answered_count
ORDER BY questions_answered_count;

-- ============================================================================
-- 9. CONFIDENCE LEVEL ANALYSIS
-- ============================================================================

-- Assessment confidence distribution
SELECT
  CASE
    WHEN (1 - ability_standard_error / 1.5) * 100 >= 80 THEN 'High (≥80%)'
    WHEN (1 - ability_standard_error / 1.5) * 100 >= 60 THEN 'Medium (60-79%)'
    WHEN (1 - ability_standard_error / 1.5) * 100 >= 40 THEN 'Low (40-59%)'
    ELSE 'Very Low (<40%)'
  END as confidence_level,
  COUNT(*) as assessment_count,
  ROUND(AVG(questions_answered_count), 1) as avg_questions,
  ROUND(AVG(ability_standard_error), 3) as avg_sem
FROM user_ai_assessments
WHERE is_adaptive = true
  AND is_complete = true
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY
  CASE
    WHEN (1 - ability_standard_error / 1.5) * 100 >= 80 THEN 1
    WHEN (1 - ability_standard_error / 1.5) * 100 >= 60 THEN 2
    WHEN (1 - ability_standard_error / 1.5) * 100 >= 40 THEN 3
    ELSE 4
  END;

-- ============================================================================
-- 10. SYSTEM HEALTH CHECKS
-- ============================================================================

-- Critical alerts check
WITH metrics AS (
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_complete = true) as completed,
    COUNT(*) FILTER (WHERE questions_answered_count <= 2 AND is_complete = false) as quick_exits,
    ROUND(AVG(CASE
      WHEN is_complete THEN (1 - ability_standard_error / 1.5) * 100
      ELSE NULL
    END), 1) as avg_confidence
  FROM user_ai_assessments
  WHERE is_adaptive = true
    AND started_at >= NOW() - INTERVAL '24 hours'
)
SELECT
  CASE
    WHEN completed::float / NULLIF(total, 0) < 0.5 THEN 'CRITICAL: Low completion rate (<50%)'
    WHEN completed::float / NULLIF(total, 0) < 0.7 THEN 'WARNING: Completion rate below target (<70%)'
    ELSE 'OK: Completion rate healthy'
  END as completion_status,
  CASE
    WHEN quick_exits::float / NULLIF(total, 0) > 0.3 THEN 'CRITICAL: High quick exit rate (>30%)'
    WHEN quick_exits::float / NULLIF(total, 0) > 0.2 THEN 'WARNING: Quick exit rate elevated (>20%)'
    ELSE 'OK: Quick exit rate normal'
  END as quick_exit_status,
  CASE
    WHEN avg_confidence < 60 THEN 'WARNING: Low confidence levels (<60%)'
    ELSE 'OK: Confidence levels healthy'
  END as confidence_status,
  total as assessments_24h,
  completed,
  quick_exits,
  avg_confidence
FROM metrics;

-- ============================================================================
-- 11. RETURN USER ANALYSIS
-- ============================================================================

-- Users who retake assessments
WITH user_attempts AS (
  SELECT
    user_id,
    COUNT(*) as attempt_count,
    MAX(started_at) as last_attempt,
    ROUND(AVG(current_ability_estimate), 2) as avg_ability,
    MAX(current_ability_estimate) - MIN(current_ability_estimate) as ability_growth
  FROM user_ai_assessments
  WHERE is_adaptive = true
    AND is_complete = true
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
SELECT
  p.display_name,
  p.email,
  ua.attempt_count,
  ua.avg_ability,
  ua.ability_growth,
  ua.last_attempt
FROM user_attempts ua
JOIN profiles p ON ua.user_id = p.user_id
ORDER BY ua.attempt_count DESC, ua.ability_growth DESC
LIMIT 50;

-- ============================================================================
-- 12. HOURLY ACTIVITY PATTERN
-- ============================================================================

-- Peak usage times
SELECT
  EXTRACT(HOUR FROM started_at) as hour,
  EXTRACT(DOW FROM started_at) as day_of_week,
  COUNT(*) as assessment_count,
  COUNT(*) FILTER (WHERE is_complete = true) as completed_count,
  ROUND(COUNT(*) FILTER (WHERE is_complete = true)::numeric / NULLIF(COUNT(*), 0), 3) as completion_rate
FROM user_ai_assessments
WHERE is_adaptive = true
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY assessment_count DESC
LIMIT 20;

-- ============================================================================
-- 13. PERFORMANCE BENCHMARKS
-- ============================================================================

-- Comparative metrics: Last 7 days vs Previous 7 days
WITH current_week AS (
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_complete = true) as completed,
    ROUND(AVG(questions_answered_count), 1) as avg_questions,
    ROUND(AVG(current_ability_estimate), 2) as avg_ability
  FROM user_ai_assessments
  WHERE is_adaptive = true
    AND started_at >= NOW() - INTERVAL '7 days'
),
previous_week AS (
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_complete = true) as completed,
    ROUND(AVG(questions_answered_count), 1) as avg_questions,
    ROUND(AVG(current_ability_estimate), 2) as avg_ability
  FROM user_ai_assessments
  WHERE is_adaptive = true
    AND started_at >= NOW() - INTERVAL '14 days'
    AND started_at < NOW() - INTERVAL '7 days'
)
SELECT
  'Current Week' as period,
  cw.total,
  cw.completed,
  cw.avg_questions,
  cw.avg_ability,
  ROUND((cw.total - pw.total)::numeric / NULLIF(pw.total, 0) * 100, 1) as total_change_pct,
  ROUND((cw.completed - pw.completed)::numeric / NULLIF(pw.completed, 0) * 100, 1) as completed_change_pct
FROM current_week cw, previous_week pw
UNION ALL
SELECT
  'Previous Week',
  pw.total,
  pw.completed,
  pw.avg_questions,
  pw.avg_ability,
  NULL,
  NULL
FROM previous_week pw;

-- ============================================================================
-- End of monitoring queries
-- Run these regularly to monitor adaptive assessment health
-- ============================================================================
