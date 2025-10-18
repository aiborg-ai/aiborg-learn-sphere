-- ============================================================================
-- TEAM ANALYTICS VIEWS AND FUNCTIONS
-- ============================================================================
-- This migration creates database views and functions for team analytics
-- and reporting. These provide aggregated data for dashboards and reports.
--
-- Views:
-- - team_progress_summary: High-level metrics for organizations
-- - member_activity_summary: Per-member activity and progress
-- - assignment_completion_summary: Course assignment statistics
-- - team_learning_trends: Time-series data for trend analysis
--
-- Features:
-- - Pre-aggregated data for dashboard performance
-- - Materialized views for expensive queries
-- - Helper functions for common analytics queries
-- - Optimized for read-heavy workloads
-- ============================================================================

-- ============================================================================
-- VIEW: team_progress_summary
-- High-level organization metrics
-- ============================================================================

CREATE OR REPLACE VIEW public.team_progress_summary AS
SELECT
    o.id as organization_id,
    o.name as organization_name,
    o.industry,
    o.size_range,

    -- Member metrics
    COUNT(DISTINCT om.user_id) as total_members,
    COUNT(DISTINCT CASE
        WHEN p.last_login > NOW() - INTERVAL '7 days'
        THEN om.user_id
    END) as active_members_7d,
    COUNT(DISTINCT CASE
        WHEN p.last_login > NOW() - INTERVAL '30 days'
        THEN om.user_id
    END) as active_members_30d,

    -- Enrollment metrics
    COUNT(DISTINCT e.id) as total_enrollments,
    COUNT(DISTINCT CASE
        WHEN e.completed_at IS NOT NULL
        THEN e.id
    END) as completed_enrollments,
    COUNT(DISTINCT CASE
        WHEN e.progress_percentage > 0 AND e.completed_at IS NULL
        THEN e.id
    END) as in_progress_enrollments,

    -- Completion rate
    ROUND(
        COALESCE(
            COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END)::DECIMAL /
            NULLIF(COUNT(DISTINCT e.id), 0) * 100,
            0
        ),
        2
    ) as completion_rate_percentage,

    -- Average progress
    ROUND(
        COALESCE(AVG(e.progress_percentage), 0),
        2
    ) as avg_progress_percentage,

    -- Assignment metrics
    COUNT(DISTINCT tca.id) as total_assignments,
    COUNT(DISTINCT CASE
        WHEN tau.status = 'overdue'
        THEN tau.id
    END) as overdue_count,

    -- Assessment metrics
    COUNT(DISTINCT ta.id) as total_team_assessments,
    ROUND(
        COALESCE(AVG(tar.individual_score), 0),
        2
    ) as avg_assessment_score,

    -- Time metrics
    o.created_at as organization_created_at

FROM public.organizations o
LEFT JOIN public.organization_members om ON o.id = om.organization_id
LEFT JOIN public.profiles p ON om.user_id = p.user_id
LEFT JOIN public.enrollments e ON om.user_id = e.user_id
LEFT JOIN public.team_course_assignments tca ON o.id = tca.organization_id
LEFT JOIN public.team_assignment_users tau ON om.user_id = tau.user_id
LEFT JOIN public.team_assessments ta ON o.id = ta.organization_id
LEFT JOIN public.team_assessment_results tar ON ta.id = tar.team_assessment_id AND om.user_id = tar.user_id
GROUP BY o.id, o.name, o.industry, o.size_range, o.created_at;

COMMENT ON VIEW public.team_progress_summary IS 'High-level metrics for organization dashboards';

-- ============================================================================
-- VIEW: member_activity_summary
-- Per-member activity and progress within organizations
-- ============================================================================

CREATE OR REPLACE VIEW public.member_activity_summary AS
SELECT
    om.organization_id,
    o.name as organization_name,
    om.user_id,
    p.full_name,
    p.email,
    om.role as org_role,
    om.department,
    om.joined_at as member_since,
    p.last_login,

    -- Enrollment metrics
    COUNT(DISTINCT e.id) as courses_enrolled,
    COUNT(DISTINCT CASE
        WHEN e.completed_at IS NOT NULL
        THEN e.id
    END) as courses_completed,
    COUNT(DISTINCT CASE
        WHEN e.progress_percentage > 0 AND e.completed_at IS NULL
        THEN e.id
    END) as courses_in_progress,

    -- Progress
    ROUND(
        COALESCE(AVG(e.progress_percentage), 0),
        2
    ) as avg_course_progress,

    -- Assignment metrics
    COUNT(DISTINCT tau.id) as assignments_total,
    COUNT(DISTINCT CASE
        WHEN tau.status = 'completed'
        THEN tau.id
    END) as assignments_completed,
    COUNT(DISTINCT CASE
        WHEN tau.status = 'overdue'
        THEN tau.id
    END) as assignments_overdue,

    -- Assessment metrics
    COUNT(DISTINCT tar.id) as assessments_taken,
    ROUND(
        COALESCE(AVG(tar.individual_score), 0),
        2
    ) as avg_assessment_score,

    -- Recent activity
    MAX(e.updated_at) as last_course_activity,
    MAX(tau.last_activity_at) as last_assignment_activity

FROM public.organization_members om
JOIN public.organizations o ON om.organization_id = o.id
JOIN public.profiles p ON om.user_id = p.user_id
LEFT JOIN public.enrollments e ON om.user_id = e.user_id
LEFT JOIN public.team_assignment_users tau ON om.user_id = tau.user_id
LEFT JOIN public.team_assessment_results tar ON om.user_id = tar.user_id
GROUP BY
    om.organization_id, o.name, om.user_id, p.full_name, p.email,
    om.role, om.department, om.joined_at, p.last_login;

COMMENT ON VIEW public.member_activity_summary IS 'Per-member activity and progress metrics for team dashboards';

-- ============================================================================
-- VIEW: assignment_completion_summary
-- Course assignment statistics for reporting
-- ============================================================================

CREATE OR REPLACE VIEW public.assignment_completion_summary AS
SELECT
    tca.id as assignment_id,
    tca.organization_id,
    o.name as organization_name,
    tca.course_id,
    c.title as course_title,
    c.image as course_image,
    tca.title as assignment_title,
    tca.is_mandatory,
    tca.due_date,
    tca.created_at as assigned_at,
    p.full_name as assigned_by_name,

    -- Statistics
    tca.total_assigned,
    tca.total_started,
    tca.total_completed,
    tca.total_overdue,
    tca.avg_completion_percentage,

    -- Calculated metrics
    ROUND(
        COALESCE(
            tca.total_completed::DECIMAL / NULLIF(tca.total_assigned, 0) * 100,
            0
        ),
        2
    ) as completion_rate_percentage,

    ROUND(
        COALESCE(
            tca.total_started::DECIMAL / NULLIF(tca.total_assigned, 0) * 100,
            0
        ),
        2
    ) as engagement_rate_percentage,

    -- Status
    CASE
        WHEN tca.due_date IS NULL THEN 'no_due_date'
        WHEN tca.due_date < NOW() AND tca.total_completed < tca.total_assigned THEN 'overdue'
        WHEN tca.due_date < NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'on_track'
    END as status

FROM public.team_course_assignments tca
JOIN public.organizations o ON tca.organization_id = o.id
JOIN public.courses c ON tca.course_id = c.id
LEFT JOIN public.profiles p ON tca.assigned_by = p.user_id;

COMMENT ON VIEW public.assignment_completion_summary IS 'Course assignment completion statistics for reports and dashboards';

-- ============================================================================
-- VIEW: team_learning_trends
-- Time-series data for trend analysis (last 90 days)
-- ============================================================================

CREATE OR REPLACE VIEW public.team_learning_trends AS
WITH date_series AS (
    SELECT generate_series(
        NOW() - INTERVAL '90 days',
        NOW(),
        INTERVAL '1 day'
    )::DATE as date
),
daily_activity AS (
    SELECT
        om.organization_id,
        e.created_at::DATE as activity_date,
        'enrollment' as activity_type,
        COUNT(*) as count
    FROM public.enrollments e
    JOIN public.organization_members om ON e.user_id = om.user_id
    WHERE e.created_at >= NOW() - INTERVAL '90 days'
    GROUP BY om.organization_id, e.created_at::DATE

    UNION ALL

    SELECT
        om.organization_id,
        e.completed_at::DATE as activity_date,
        'completion' as activity_type,
        COUNT(*) as count
    FROM public.enrollments e
    JOIN public.organization_members om ON e.user_id = om.user_id
    WHERE e.completed_at >= NOW() - INTERVAL '90 days'
    GROUP BY om.organization_id, e.completed_at::DATE

    UNION ALL

    SELECT
        tca.organization_id,
        tau.completed_at::DATE as activity_date,
        'assignment_completion' as activity_type,
        COUNT(*) as count
    FROM public.team_assignment_users tau
    JOIN public.team_course_assignments tca ON tau.assignment_id = tca.id
    WHERE tau.completed_at >= NOW() - INTERVAL '90 days'
    GROUP BY tca.organization_id, tau.completed_at::DATE
)
SELECT
    o.id as organization_id,
    o.name as organization_name,
    ds.date,
    COALESCE(SUM(CASE WHEN da.activity_type = 'enrollment' THEN da.count END), 0) as enrollments,
    COALESCE(SUM(CASE WHEN da.activity_type = 'completion' THEN da.count END), 0) as completions,
    COALESCE(SUM(CASE WHEN da.activity_type = 'assignment_completion' THEN da.count END), 0) as assignment_completions
FROM date_series ds
CROSS JOIN public.organizations o
LEFT JOIN daily_activity da ON da.organization_id = o.id AND da.activity_date = ds.date
GROUP BY o.id, o.name, ds.date
ORDER BY o.id, ds.date;

COMMENT ON VIEW public.team_learning_trends IS 'Time-series learning activity data for trend charts (last 90 days)';

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS QUERIES
-- ============================================================================

-- Function to get top performers in an organization
CREATE OR REPLACE FUNCTION public.get_top_performers(
    p_organization_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    department TEXT,
    courses_completed INTEGER,
    avg_progress DECIMAL,
    avg_assessment_score DECIMAL,
    performance_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mas.user_id,
        mas.full_name,
        mas.department,
        mas.courses_completed::INTEGER,
        mas.avg_course_progress,
        mas.avg_assessment_score,
        -- Calculate composite performance score
        ROUND(
            (
                (mas.courses_completed * 10) +
                (mas.avg_course_progress * 0.5) +
                (mas.avg_assessment_score * 0.5)
            ),
            2
        ) as performance_score
    FROM public.member_activity_summary mas
    WHERE mas.organization_id = p_organization_id
    ORDER BY performance_score DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_top_performers IS 'Returns top performing members in an organization based on composite score';

-- ============================================================================
-- Function to get department comparison
CREATE OR REPLACE FUNCTION public.get_department_comparison(
    p_organization_id UUID
)
RETURNS TABLE (
    department TEXT,
    member_count BIGINT,
    avg_courses_completed DECIMAL,
    avg_progress DECIMAL,
    avg_assessment_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(mas.department, 'Unassigned') as department,
        COUNT(DISTINCT mas.user_id) as member_count,
        ROUND(AVG(mas.courses_completed), 2) as avg_courses_completed,
        ROUND(AVG(mas.avg_course_progress), 2) as avg_progress,
        ROUND(AVG(mas.avg_assessment_score), 2) as avg_assessment_score
    FROM public.member_activity_summary mas
    WHERE mas.organization_id = p_organization_id
    GROUP BY COALESCE(mas.department, 'Unassigned')
    ORDER BY avg_courses_completed DESC;
END;
$$;

COMMENT ON FUNCTION public.get_department_comparison IS 'Compares learning metrics across departments within an organization';

-- ============================================================================
-- Function to get course popularity within organization
CREATE OR REPLACE FUNCTION public.get_popular_courses(
    p_organization_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    course_id UUID,
    course_title TEXT,
    enrollment_count BIGINT,
    completion_count BIGINT,
    avg_progress DECIMAL,
    completion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as course_id,
        c.title as course_title,
        COUNT(DISTINCT e.id) as enrollment_count,
        COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END) as completion_count,
        ROUND(AVG(e.progress_percentage), 2) as avg_progress,
        ROUND(
            COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END)::DECIMAL /
            NULLIF(COUNT(DISTINCT e.id), 0) * 100,
            2
        ) as completion_rate
    FROM public.courses c
    JOIN public.enrollments e ON c.id = e.course_id
    JOIN public.organization_members om ON e.user_id = om.user_id
    WHERE om.organization_id = p_organization_id
    GROUP BY c.id, c.title
    ORDER BY enrollment_count DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_popular_courses IS 'Returns most popular courses within an organization';

-- ============================================================================
-- Function to get learning velocity (courses completed per month)
CREATE OR REPLACE FUNCTION public.get_learning_velocity(
    p_organization_id UUID,
    p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
    month DATE,
    courses_completed INTEGER,
    members_active INTEGER,
    velocity DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT
            DATE_TRUNC('month', e.completed_at)::DATE as month,
            COUNT(DISTINCT e.id) as courses_completed,
            COUNT(DISTINCT e.user_id) as members_active
        FROM public.enrollments e
        JOIN public.organization_members om ON e.user_id = om.user_id
        WHERE om.organization_id = p_organization_id
        AND e.completed_at >= NOW() - (p_months || ' months')::INTERVAL
        AND e.completed_at IS NOT NULL
        GROUP BY DATE_TRUNC('month', e.completed_at)::DATE
    )
    SELECT
        md.month,
        md.courses_completed::INTEGER,
        md.members_active::INTEGER,
        ROUND(
            md.courses_completed::DECIMAL / NULLIF(md.members_active, 0),
            2
        ) as velocity
    FROM monthly_data md
    ORDER BY md.month;
END;
$$;

COMMENT ON FUNCTION public.get_learning_velocity IS 'Calculates average courses completed per active member per month';

-- ============================================================================
-- MATERIALIZED VIEWS (for expensive queries)
-- ============================================================================

-- Materialized view for organization dashboard (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.team_dashboard_cache AS
SELECT * FROM public.team_progress_summary;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_dashboard_cache_org_id
    ON public.team_dashboard_cache(organization_id);

COMMENT ON MATERIALIZED VIEW public.team_dashboard_cache IS 'Cached dashboard data for organizations. Refresh hourly.';

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_team_analytics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.team_dashboard_cache;
END;
$$;

COMMENT ON FUNCTION public.refresh_team_analytics_cache IS 'Refreshes materialized views for team analytics. Run hourly via cron.';

-- ============================================================================
-- INDEXES FOR VIEW PERFORMANCE
-- ============================================================================

-- Indexes to speed up view queries
CREATE INDEX IF NOT EXISTS idx_enrollments_org_lookup
    ON public.enrollments(user_id, completed_at, progress_percentage)
    WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_assignment_users_org_lookup
    ON public.team_assignment_users(user_id, status, completed_at);

CREATE INDEX IF NOT EXISTS idx_profiles_last_login
    ON public.profiles(user_id, last_login)
    WHERE last_login IS NOT NULL;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT on views to authenticated users (RLS still applies)
GRANT SELECT ON public.team_progress_summary TO authenticated;
GRANT SELECT ON public.member_activity_summary TO authenticated;
GRANT SELECT ON public.assignment_completion_summary TO authenticated;
GRANT SELECT ON public.team_learning_trends TO authenticated;
GRANT SELECT ON public.team_dashboard_cache TO authenticated;

-- Grant EXECUTE on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_top_performers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_department_comparison TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_courses TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_learning_velocity TO authenticated;
