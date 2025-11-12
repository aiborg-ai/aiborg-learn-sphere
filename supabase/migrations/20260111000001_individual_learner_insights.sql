-- Individual Learner Insights Schema
-- Phase 2.1: Comprehensive analytics for tracking individual learner performance

-- ============================================================================
-- Individual Learner Summary View
-- ============================================================================

CREATE OR REPLACE VIEW individual_learner_summary AS
SELECT
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.role,
    om.organization_id,
    om.department,

    -- Enrollment Statistics
    COUNT(DISTINCT e.id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN e.id END) as completed_courses,
    COUNT(DISTINCT CASE WHEN up.completed_at IS NULL AND e.enrolled_at IS NOT NULL THEN e.id END) as in_progress_courses,

    -- Progress Metrics
    COALESCE(AVG(up.progress_percentage), 0)::DECIMAL(5,2) as avg_progress_percentage,
    COALESCE(SUM(up.time_spent_minutes), 0) as total_time_spent_minutes,

    -- Assessment Performance
    COUNT(DISTINCT hs.id) as total_submissions,
    COUNT(DISTINCT CASE WHEN hs.submitted_at IS NOT NULL THEN hs.id END) as submitted_assignments,
    COALESCE(AVG(hs.score), 0)::DECIMAL(5,2) as avg_assignment_score,
    COALESCE(MAX(hs.score), 0)::DECIMAL(5,2) as highest_score,
    COALESCE(MIN(hs.score), 0)::DECIMAL(5,2) as lowest_score,

    -- Engagement Metrics
    MAX(up.last_accessed) as last_active_date,
    COUNT(DISTINCT DATE(ee.created_at)) as active_days_count,

    -- Achievement Metrics
    COUNT(DISTINCT ua.id) as total_achievements,

    -- Time-based Metrics
    MIN(e.enrolled_at) as first_enrollment_date,
    MAX(e.enrolled_at) as latest_enrollment_date,

    -- Current Status
    CASE
        WHEN MAX(up.last_accessed) > NOW() - INTERVAL '7 days' THEN 'active'
        WHEN MAX(up.last_accessed) > NOW() - INTERVAL '30 days' THEN 'inactive'
        ELSE 'dormant'
    END as learner_status

FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.user_id
LEFT JOIN enrollments e ON e.user_id = p.user_id
LEFT JOIN user_progress up ON up.user_id = p.user_id AND up.course_id = e.course_id
LEFT JOIN homework_submissions hs ON hs.user_id = p.user_id
LEFT JOIN engagement_events ee ON ee.user_id = p.user_id
LEFT JOIN user_achievements ua ON ua.user_id = p.user_id
WHERE p.role IN ('student', 'instructor')
GROUP BY p.id, p.user_id, p.full_name, p.avatar_url, p.role, om.organization_id, om.department;

-- ============================================================================
-- Individual Course Performance View
-- ============================================================================

CREATE OR REPLACE VIEW individual_course_performance AS
SELECT
    up.user_id,
    up.course_id,
    c.title as course_title,
    c.category,
    c.difficulty_level,
    p.full_name as learner_name,

    -- Progress Details
    up.progress_percentage,
    up.time_spent_minutes,
    up.last_accessed,
    up.completed_at,

    -- Enrollment Info
    e.enrolled_at,
    e.status as enrollment_status,

    -- Assignment Performance
    COUNT(DISTINCT hs.id) as assignment_count,
    COUNT(DISTINCT CASE WHEN hs.submitted_at IS NOT NULL THEN hs.id END) as submitted_count,
    COALESCE(AVG(hs.score), 0)::DECIMAL(5,2) as avg_assignment_score,

    -- Time Metrics
    EXTRACT(EPOCH FROM (up.completed_at - e.enrolled_at)) / 86400 as days_to_complete,
    EXTRACT(EPOCH FROM (NOW() - up.last_accessed)) / 86400 as days_since_last_access,

    -- Engagement Score (0-100)
    CASE
        WHEN up.completed_at IS NOT NULL THEN 100
        WHEN up.progress_percentage >= 75 THEN 80 + (up.progress_percentage - 75)
        WHEN up.progress_percentage >= 50 THEN 60 + (up.progress_percentage - 50)
        WHEN up.progress_percentage >= 25 THEN 40 + (up.progress_percentage - 25)
        ELSE up.progress_percentage
    END::INTEGER as engagement_score

FROM user_progress up
INNER JOIN courses c ON c.id = up.course_id
INNER JOIN profiles p ON p.user_id = up.user_id
INNER JOIN enrollments e ON e.user_id = up.user_id AND e.course_id = up.course_id
LEFT JOIN homework_submissions hs ON hs.user_id = up.user_id AND hs.course_id = up.course_id
GROUP BY
    up.user_id, up.course_id, c.title, c.category, c.difficulty_level,
    p.full_name, up.progress_percentage, up.time_spent_minutes,
    up.last_accessed, up.completed_at, e.enrolled_at, e.status;

-- ============================================================================
-- Learning Velocity View (Progress over time)
-- ============================================================================

CREATE OR REPLACE VIEW learning_velocity AS
SELECT
    user_id,
    DATE_TRUNC('week', last_accessed) as week_start,
    COUNT(DISTINCT course_id) as active_courses,
    SUM(time_spent_minutes) as weekly_time_spent,
    AVG(progress_percentage)::DECIMAL(5,2) as avg_progress,
    COUNT(DISTINCT DATE(last_accessed)) as active_days_in_week
FROM user_progress
WHERE last_accessed >= NOW() - INTERVAL '90 days'
GROUP BY user_id, DATE_TRUNC('week', last_accessed)
ORDER BY user_id, week_start DESC;

-- ============================================================================
-- Assessment Pattern Analysis
-- ============================================================================

CREATE OR REPLACE VIEW assessment_patterns AS
SELECT
    hs.user_id,
    p.full_name as learner_name,

    -- Submission Patterns
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN hs.submitted_at IS NOT NULL THEN 1 END) as submitted_count,
    COUNT(CASE WHEN hs.submitted_at IS NULL AND ha.due_date < NOW() THEN 1 END) as overdue_count,
    COUNT(CASE WHEN hs.submitted_at <= ha.due_date THEN 1 END) as on_time_count,
    COUNT(CASE WHEN hs.submitted_at > ha.due_date THEN 1 END) as late_count,

    -- Performance Metrics
    COALESCE(AVG(hs.score), 0)::DECIMAL(5,2) as avg_score,
    COALESCE(STDDEV(hs.score), 0)::DECIMAL(5,2) as score_stddev,

    -- Timing Analysis
    AVG(EXTRACT(EPOCH FROM (hs.submitted_at - hs.created_at)) / 3600)::DECIMAL(10,2) as avg_hours_to_submit,

    -- Improvement Trend (last 5 vs first 5 assignments)
    (
        SELECT AVG(score)
        FROM homework_submissions
        WHERE user_id = hs.user_id
            AND submitted_at IS NOT NULL
        ORDER BY submitted_at DESC
        LIMIT 5
    ) - (
        SELECT AVG(score)
        FROM homework_submissions
        WHERE user_id = hs.user_id
            AND submitted_at IS NOT NULL
        ORDER BY submitted_at ASC
        LIMIT 5
    ) as improvement_trend,

    -- Recent Performance
    (
        SELECT AVG(score)
        FROM homework_submissions
        WHERE user_id = hs.user_id
            AND submitted_at >= NOW() - INTERVAL '30 days'
    )::DECIMAL(5,2) as recent_avg_score

FROM homework_submissions hs
INNER JOIN profiles p ON p.user_id = hs.user_id
INNER JOIN homework_assignments ha ON ha.id = hs.assignment_id
GROUP BY hs.user_id, p.full_name;

-- ============================================================================
-- Engagement Timeline View
-- ============================================================================

CREATE OR REPLACE VIEW engagement_timeline AS
SELECT
    user_id,
    DATE(created_at) as activity_date,
    event_type,
    COUNT(*) as event_count,
    MIN(created_at) as first_event_time,
    MAX(created_at) as last_event_time,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as session_duration_minutes
FROM engagement_events
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY user_id, DATE(created_at), event_type
ORDER BY user_id, activity_date DESC, event_type;

-- ============================================================================
-- At-Risk Learners View
-- ============================================================================

CREATE OR REPLACE VIEW at_risk_learners AS
SELECT
    ils.user_id,
    ils.full_name,
    ils.organization_id,
    ils.department,
    ils.learner_status,

    -- Risk Indicators
    ils.avg_progress_percentage,
    ils.total_time_spent_minutes,
    EXTRACT(EPOCH FROM (NOW() - ils.last_active_date)) / 86400 as days_inactive,

    -- Risk Score (0-100, higher = more at risk)
    (
        CASE WHEN ils.learner_status = 'dormant' THEN 40 ELSE 0 END +
        CASE WHEN ils.learner_status = 'inactive' THEN 20 ELSE 0 END +
        CASE WHEN ils.avg_progress_percentage < 25 THEN 20 ELSE 0 END +
        CASE WHEN ils.avg_progress_percentage < 50 AND ils.avg_progress_percentage >= 25 THEN 10 ELSE 0 END +
        CASE WHEN ils.total_time_spent_minutes < 120 THEN 15 ELSE 0 END +
        CASE WHEN ils.in_progress_courses > 0 AND EXTRACT(EPOCH FROM (NOW() - ils.last_active_date)) / 86400 > 14 THEN 15 ELSE 0 END
    )::INTEGER as risk_score,

    -- Recommended Actions
    CASE
        WHEN ils.learner_status = 'dormant' THEN 'Send re-engagement email'
        WHEN ils.avg_progress_percentage < 25 THEN 'Provide learning support'
        WHEN EXTRACT(EPOCH FROM (NOW() - ils.last_active_date)) / 86400 > 14 THEN 'Check in with learner'
        ELSE 'Monitor progress'
    END as recommended_action,

    ils.in_progress_courses,
    ils.completed_courses

FROM individual_learner_summary ils
WHERE ils.role = 'student'
    AND (
        ils.learner_status IN ('inactive', 'dormant')
        OR ils.avg_progress_percentage < 50
        OR ils.in_progress_courses > 0
    );

-- ============================================================================
-- Learning Path Progress View
-- ============================================================================

CREATE OR REPLACE VIEW learning_path_progress_detailed AS
SELECT
    ulp.user_id,
    ulp.learning_path_id,
    lp.title as path_title,
    lp.description as path_description,
    p.full_name as learner_name,

    -- Progress Metrics
    ulp.current_step,
    ulp.progress_percentage,
    ulp.completed_at,
    ulp.started_at,

    -- Step Details
    COUNT(lps.id) as total_steps,
    COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) as completed_steps,

    -- Time Metrics
    EXTRACT(EPOCH FROM (NOW() - ulp.started_at)) / 86400 as days_in_progress,
    CASE
        WHEN ulp.completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (ulp.completed_at - ulp.started_at)) / 86400
        ELSE NULL
    END as days_to_complete,

    -- Estimated Completion
    CASE
        WHEN ulp.progress_percentage > 0 AND ulp.completed_at IS NULL
        THEN (
            EXTRACT(EPOCH FROM (NOW() - ulp.started_at)) / 86400 *
            (100.0 / ulp.progress_percentage)
        )::INTEGER
        ELSE NULL
    END as estimated_days_to_complete

FROM user_learning_paths ulp
INNER JOIN learning_paths lp ON lp.id = ulp.learning_path_id
INNER JOIN profiles p ON p.user_id = ulp.user_id
LEFT JOIN learning_path_steps lps ON lps.learning_path_id = lp.id
LEFT JOIN user_progress up ON up.user_id = ulp.user_id AND up.course_id = lps.course_id
GROUP BY
    ulp.user_id, ulp.learning_path_id, lp.title, lp.description,
    p.full_name, ulp.current_step, ulp.progress_percentage,
    ulp.completed_at, ulp.started_at;

-- ============================================================================
-- Skills Progress Tracking
-- ============================================================================

CREATE OR REPLACE VIEW skills_progress AS
SELECT
    up.user_id,
    p.full_name as learner_name,
    cs.skill_name,
    cs.skill_category,

    -- Skill Metrics
    COUNT(DISTINCT c.id) as courses_with_skill,
    COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN c.id END) as completed_courses_with_skill,
    AVG(up.progress_percentage)::DECIMAL(5,2) as avg_progress_in_skill,

    -- Proficiency Level
    CASE
        WHEN COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN c.id END) >= 5 THEN 'expert'
        WHEN COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN c.id END) >= 3 THEN 'advanced'
        WHEN COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN c.id END) >= 1 THEN 'intermediate'
        ELSE 'beginner'
    END as proficiency_level

FROM user_progress up
INNER JOIN courses c ON c.id = up.course_id
INNER JOIN course_skills cs ON cs.course_id = c.id
INNER JOIN profiles p ON p.user_id = up.user_id
GROUP BY up.user_id, p.full_name, cs.skill_name, cs.skill_category;

-- ============================================================================
-- Manager Direct Reports View
-- ============================================================================

CREATE OR REPLACE VIEW manager_direct_reports AS
SELECT
    om_manager.user_id as manager_id,
    p_manager.full_name as manager_name,

    -- Direct Report Info
    ils.user_id as report_user_id,
    ils.full_name as report_name,
    ils.department,
    ils.learner_status,

    -- Performance Summary
    ils.total_enrollments,
    ils.completed_courses,
    ils.in_progress_courses,
    ils.avg_progress_percentage,
    ils.avg_assignment_score,
    ils.total_time_spent_minutes,
    ils.last_active_date,

    -- Risk Assessment
    arl.risk_score,
    arl.recommended_action

FROM organization_members om_manager
INNER JOIN profiles p_manager ON p_manager.user_id = om_manager.user_id
INNER JOIN organization_members om_report ON om_report.organization_id = om_manager.organization_id
    AND om_report.manager_id = om_manager.user_id
INNER JOIN individual_learner_summary ils ON ils.user_id = om_report.user_id
LEFT JOIN at_risk_learners arl ON arl.user_id = ils.user_id
WHERE p_manager.role IN ('manager', 'admin');

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on new tables (views inherit from base tables)
-- Views are read-only, so no INSERT/UPDATE/DELETE policies needed

-- Create policy for individual_learner_summary view
CREATE POLICY "Users can view their own learner summary"
    ON profiles FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')
        )
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid() AND manager_id IS NOT NULL
        )
    );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate learner health score
CREATE OR REPLACE FUNCTION calculate_learner_health_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_health_score INTEGER := 0;
    v_progress_avg DECIMAL;
    v_days_inactive INTEGER;
    v_completion_rate DECIMAL;
BEGIN
    -- Get metrics
    SELECT
        avg_progress_percentage,
        EXTRACT(EPOCH FROM (NOW() - last_active_date)) / 86400,
        CASE WHEN total_enrollments > 0
            THEN (completed_courses::DECIMAL / total_enrollments) * 100
            ELSE 0
        END
    INTO v_progress_avg, v_days_inactive, v_completion_rate
    FROM individual_learner_summary
    WHERE user_id = p_user_id;

    -- Calculate health score (0-100)
    v_health_score := GREATEST(0, LEAST(100,
        -- Base score from progress
        (v_progress_avg * 0.3)::INTEGER +
        -- Completion rate contribution
        (v_completion_rate * 0.3)::INTEGER +
        -- Activity recency
        CASE
            WHEN v_days_inactive <= 3 THEN 30
            WHEN v_days_inactive <= 7 THEN 20
            WHEN v_days_inactive <= 14 THEN 10
            ELSE 0
        END +
        -- Engagement bonus
        10
    ));

    RETURN v_health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get learner insights summary
CREATE OR REPLACE FUNCTION get_learner_insights(p_user_id UUID)
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT,
    metric_category TEXT,
    trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Total Enrollments'::TEXT,
        total_enrollments::TEXT,
        'Overview'::TEXT,
        CASE WHEN total_enrollments > 5 THEN 'high' ELSE 'normal' END
    FROM individual_learner_summary WHERE user_id = p_user_id

    UNION ALL

    SELECT
        'Average Progress'::TEXT,
        avg_progress_percentage::TEXT || '%',
        'Performance'::TEXT,
        CASE
            WHEN avg_progress_percentage >= 75 THEN 'excellent'
            WHEN avg_progress_percentage >= 50 THEN 'good'
            ELSE 'needs_improvement'
        END
    FROM individual_learner_summary WHERE user_id = p_user_id

    UNION ALL

    SELECT
        'Learning Velocity'::TEXT,
        COALESCE(weekly_time_spent::TEXT, '0') || ' min/week',
        'Engagement'::TEXT,
        CASE
            WHEN weekly_time_spent >= 300 THEN 'increasing'
            WHEN weekly_time_spent >= 120 THEN 'stable'
            ELSE 'decreasing'
        END
    FROM learning_velocity
    WHERE user_id = p_user_id
        AND week_start = DATE_TRUNC('week', NOW())

    UNION ALL

    SELECT
        'Risk Score'::TEXT,
        COALESCE(risk_score::TEXT, '0'),
        'Risk'::TEXT,
        CASE
            WHEN risk_score >= 70 THEN 'high_risk'
            WHEN risk_score >= 40 THEN 'medium_risk'
            ELSE 'low_risk'
        END
    FROM at_risk_learners WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_last_accessed
    ON user_progress(user_id, last_accessed DESC);

CREATE INDEX IF NOT EXISTS idx_homework_submissions_user_submitted
    ON homework_submissions(user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_events_user_date
    ON engagement_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
    ON user_achievements(user_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON VIEW individual_learner_summary IS 'Comprehensive summary of individual learner metrics and status';
COMMENT ON VIEW individual_course_performance IS 'Detailed performance metrics for each course enrollment';
COMMENT ON VIEW learning_velocity IS 'Weekly learning activity and progress trends';
COMMENT ON VIEW assessment_patterns IS 'Assignment submission patterns and performance analysis';
COMMENT ON VIEW engagement_timeline IS 'Daily engagement event tracking';
COMMENT ON VIEW at_risk_learners IS 'Identifies learners who may need intervention';
COMMENT ON VIEW learning_path_progress_detailed IS 'Detailed progress through learning paths';
COMMENT ON VIEW skills_progress IS 'Skill acquisition and proficiency tracking';
COMMENT ON VIEW manager_direct_reports IS 'Manager view of direct reports with performance metrics';
COMMENT ON FUNCTION calculate_learner_health_score IS 'Calculates overall learner health score (0-100)';
COMMENT ON FUNCTION get_learner_insights IS 'Returns key insights and trends for a learner';
