-- Prediction Feature Calculation Functions
-- Calculates engineered features for ML predictions

-- ============================================================================
-- Function to calculate prediction features for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_prediction_features(
  p_user_id UUID DEFAULT NULL,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  course_id INTEGER,
  days_since_last_activity INTEGER,
  total_time_spent_minutes INTEGER,
  avg_session_duration_minutes DECIMAL,
  sessions_count INTEGER,
  active_days_count INTEGER,
  active_days_last_7d INTEGER,
  active_days_last_30d INTEGER,
  progress_percentage DECIMAL,
  progress_velocity DECIMAL,
  modules_completed INTEGER,
  modules_total INTEGER,
  avg_assessment_score DECIMAL,
  assessment_trend VARCHAR,
  assignments_submitted INTEGER,
  assignments_on_time INTEGER,
  assignments_late INTEGER,
  assignments_overdue INTEGER,
  login_streak_days INTEGER,
  longest_inactive_period_days INTEGER,
  engagement_momentum DECIMAL,
  performance_consistency DECIMAL,
  learning_efficiency DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_activity AS (
    SELECT
      up.user_id,
      up.course_id,
      up.progress_percentage,
      up.time_spent_minutes,
      up.last_accessed,
      EXTRACT(EPOCH FROM (NOW() - up.last_accessed)) / 86400 AS days_since_last_access,
      up.completed_at
    FROM user_progress up
    WHERE (p_user_id IS NULL OR up.user_id = p_user_id)
      AND (p_course_id IS NULL OR up.course_id = p_course_id)
  ),
  engagement_stats AS (
    SELECT
      ee.user_id,
      COUNT(DISTINCT DATE(ee.created_at)) AS total_active_days,
      COUNT(DISTINCT CASE
        WHEN ee.created_at >= NOW() - INTERVAL '7 days'
        THEN DATE(ee.created_at)
      END) AS active_days_7d,
      COUNT(DISTINCT CASE
        WHEN ee.created_at >= NOW() - INTERVAL '30 days'
        THEN DATE(ee.created_at)
      END) AS active_days_30d,
      COUNT(*) AS total_sessions,
      AVG(EXTRACT(EPOCH FROM (ee.updated_at - ee.created_at)) / 60) AS avg_session_minutes
    FROM engagement_events ee
    WHERE (p_user_id IS NULL OR ee.user_id = p_user_id)
      AND ee.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY ee.user_id
  ),
  assignment_stats AS (
    SELECT
      hs.user_id,
      hs.course_id,
      AVG(hs.score) AS avg_score,
      STDDEV(hs.score) AS score_stddev,
      COUNT(*) AS total_submitted,
      COUNT(CASE WHEN hs.submitted_at <= ha.due_date THEN 1 END) AS on_time_count,
      COUNT(CASE WHEN hs.submitted_at > ha.due_date THEN 1 END) AS late_count,
      COUNT(CASE WHEN hs.submitted_at IS NULL AND ha.due_date < NOW() THEN 1 END) AS overdue_count
    FROM homework_submissions hs
    LEFT JOIN homework_assignments ha ON ha.id = hs.assignment_id
    WHERE (p_user_id IS NULL OR hs.user_id = p_user_id)
      AND (p_course_id IS NULL OR hs.course_id = p_course_id)
    GROUP BY hs.user_id, hs.course_id
  ),
  streak_calc AS (
    SELECT
      user_id,
      -- Calculate login streak (consecutive days)
      COUNT(*) FILTER (
        WHERE rn = EXTRACT(EPOCH FROM (NOW()::DATE - DATE(created_at))) / 86400
      ) AS login_streak
    FROM (
      SELECT
        user_id,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY DATE(created_at) DESC) AS rn
      FROM engagement_events
      WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND created_at >= NOW() - INTERVAL '90 days'
    ) ranked_events
    GROUP BY user_id
  )
  SELECT
    ua.user_id,
    ua.course_id,
    FLOOR(ua.days_since_last_access)::INTEGER AS days_since_last_activity,
    COALESCE(ua.time_spent_minutes, 0)::INTEGER AS total_time_spent_minutes,
    COALESCE(es.avg_session_minutes, 0)::DECIMAL AS avg_session_duration_minutes,
    COALESCE(es.total_sessions, 0)::INTEGER AS sessions_count,
    COALESCE(es.total_active_days, 0)::INTEGER AS active_days_count,
    COALESCE(es.active_days_7d, 0)::INTEGER AS active_days_last_7d,
    COALESCE(es.active_days_30d, 0)::INTEGER AS active_days_last_30d,
    COALESCE(ua.progress_percentage, 0)::DECIMAL AS progress_percentage,
    -- Progress velocity: progress / days enrolled
    CASE
      WHEN ua.days_since_last_access > 0
      THEN (ua.progress_percentage / GREATEST(ua.days_since_last_access, 1))::DECIMAL
      ELSE 0
    END AS progress_velocity,
    0 AS modules_completed, -- Placeholder - would calculate from course structure
    100 AS modules_total, -- Placeholder
    COALESCE(ast.avg_score, 0)::DECIMAL AS avg_assessment_score,
    CASE
      WHEN ast.score_stddev < 5 THEN 'stable'::VARCHAR
      WHEN ast.avg_score > 70 THEN 'improving'::VARCHAR
      ELSE 'declining'::VARCHAR
    END AS assessment_trend,
    COALESCE(ast.total_submitted, 0)::INTEGER AS assignments_submitted,
    COALESCE(ast.on_time_count, 0)::INTEGER AS assignments_on_time,
    COALESCE(ast.late_count, 0)::INTEGER AS assignments_late,
    COALESCE(ast.overdue_count, 0)::INTEGER AS assignments_overdue,
    COALESCE(sc.login_streak, 0)::INTEGER AS login_streak_days,
    FLOOR(GREATEST(ua.days_since_last_access, 0))::INTEGER AS longest_inactive_period_days,
    -- Engagement momentum: change in activity over time
    CASE
      WHEN es.active_days_7d > es.active_days_30d / 4 THEN 5.0::DECIMAL
      WHEN es.active_days_7d < es.active_days_30d / 8 THEN -5.0::DECIMAL
      ELSE 0.0::DECIMAL
    END AS engagement_momentum,
    COALESCE(ast.score_stddev, 0)::DECIMAL AS performance_consistency,
    -- Learning efficiency: progress per hour
    CASE
      WHEN ua.time_spent_minutes > 0
      THEN (ua.progress_percentage / (ua.time_spent_minutes / 60.0))::DECIMAL
      ELSE 0
    END AS learning_efficiency
  FROM user_activity ua
  LEFT JOIN engagement_stats es ON es.user_id = ua.user_id
  LEFT JOIN assignment_stats ast ON ast.user_id = ua.user_id AND ast.course_id = ua.course_id
  LEFT JOIN streak_calc sc ON sc.user_id = ua.user_id
  WHERE ua.progress_percentage > 0 OR ua.time_spent_minutes > 0; -- Only active users
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_prediction_features IS
'Calculates engineered features for ML predictions from user activity data';

-- ============================================================================
-- Function to auto-refresh prediction features
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_prediction_features(
  p_user_id UUID DEFAULT NULL,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  rows_inserted INTEGER;
BEGIN
  -- Delete old features for the same user/course
  DELETE FROM prediction_features
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_course_id IS NULL OR course_id = p_course_id)
    AND features_calculated_at < NOW() - INTERVAL '1 day';

  -- Insert new features
  INSERT INTO prediction_features (
    user_id,
    course_id,
    days_since_last_activity,
    total_time_spent_minutes,
    avg_session_duration_minutes,
    sessions_count,
    active_days_count,
    active_days_last_7d,
    active_days_last_30d,
    progress_percentage,
    progress_velocity,
    modules_completed,
    modules_total,
    avg_assessment_score,
    assessment_trend,
    assignments_submitted,
    assignments_on_time,
    assignments_late,
    assignments_overdue,
    login_streak_days,
    longest_inactive_period_days,
    engagement_momentum,
    performance_consistency,
    learning_efficiency
  )
  SELECT * FROM calculate_prediction_features(p_user_id, p_course_id);

  GET DIAGNOSTICS rows_inserted = ROW_COUNT;
  RETURN rows_inserted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_prediction_features IS
'Refreshes prediction features for users, replacing old features older than 1 day';

-- ============================================================================
-- Scheduled job to refresh features daily
-- ============================================================================
-- Note: This requires pg_cron extension or external scheduler

-- Example cron job (if pg_cron is available):
-- SELECT cron.schedule('refresh-prediction-features', '0 2 * * *', $$ -- 2 AM daily
--   SELECT refresh_prediction_features(NULL, NULL);
-- $$);
