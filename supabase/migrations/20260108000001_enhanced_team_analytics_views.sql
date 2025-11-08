-- Enhanced Team Analytics: Views and Functions
-- Created: 2025-01-08
-- Purpose: Database views and functions for 8 new team analytics metrics

-- ============================================================================
-- METRIC 1: Skills Gap Analysis
-- VIEW: skills_gap_by_organization
-- ============================================================================
CREATE OR REPLACE VIEW public.skills_gap_by_organization AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  cs.skill_name,
  cs.skill_level,
  cs.skill_category,
  COUNT(DISTINCT om.user_id) as total_members,
  COUNT(DISTINCT CASE
    WHEN up.completed_at IS NOT NULL THEN om.user_id
  END) as members_with_skill,
  COUNT(DISTINCT om.user_id) - COUNT(DISTINCT CASE
    WHEN up.completed_at IS NOT NULL THEN om.user_id
  END) as members_without_skill,
  CASE
    WHEN COUNT(DISTINCT om.user_id) > 0
    THEN ((COUNT(DISTINCT om.user_id) - COUNT(DISTINCT CASE
      WHEN up.completed_at IS NOT NULL THEN om.user_id
    END))::DECIMAL / COUNT(DISTINCT om.user_id) * 100)::DECIMAL(5,2)
    ELSE 0
  END as gap_percentage,
  jsonb_agg(DISTINCT jsonb_build_object(
    'course_id', c.id,
    'course_title', c.title,
    'course_level', c.level
  )) as related_courses
FROM public.organizations o
CROSS JOIN public.course_skills cs
JOIN public.courses c ON cs.course_id = c.id
LEFT JOIN public.organization_members om ON o.id = om.organization_id
LEFT JOIN public.user_progress up ON om.user_id = up.user_id
  AND cs.course_id = up.course_id
  AND up.completed_at IS NOT NULL
WHERE om.user_id IS NOT NULL
GROUP BY o.id, o.name, cs.skill_name, cs.skill_level, cs.skill_category;

-- ============================================================================
-- METRIC 2: Team Momentum Score
-- VIEW: team_momentum_weekly
-- ============================================================================
CREATE OR REPLACE VIEW public.team_momentum_weekly AS
WITH weekly_completions AS (
  SELECT
    om.organization_id,
    DATE_TRUNC('week', up.completed_at)::DATE as week_start,
    COUNT(*) as completions
  FROM public.user_progress up
  JOIN public.organization_members om ON up.user_id = om.user_id
  WHERE up.completed_at IS NOT NULL
    AND up.completed_at >= NOW() - INTERVAL '12 weeks'
  GROUP BY om.organization_id, DATE_TRUNC('week', up.completed_at)::DATE
),
momentum_calc AS (
  SELECT
    organization_id,
    week_start,
    completions,
    LAG(completions, 1) OVER (PARTITION BY organization_id ORDER BY week_start) as prev_week_completions,
    LAG(completions, 2) OVER (PARTITION BY organization_id ORDER BY week_start) as two_weeks_ago_completions,
    LAG(completions, 3) OVER (PARTITION BY organization_id ORDER BY week_start) as three_weeks_ago_completions
  FROM weekly_completions
)
SELECT
  mc.organization_id,
  o.name as organization_name,
  mc.week_start,
  mc.completions as current_week_completions,
  mc.prev_week_completions,
  CASE
    WHEN mc.prev_week_completions > 0
    THEN ((mc.completions - mc.prev_week_completions)::DECIMAL / mc.prev_week_completions * 100)::DECIMAL(6,2)
    ELSE 0
  END as week_over_week_change,
  (mc.completions + COALESCE(mc.prev_week_completions, 0) +
   COALESCE(mc.two_weeks_ago_completions, 0) + COALESCE(mc.three_weeks_ago_completions, 0)) / 4.0 as four_week_avg,
  CASE
    WHEN mc.completions > COALESCE(mc.prev_week_completions, 0) * 1.1 THEN 'accelerating'
    WHEN mc.completions < COALESCE(mc.prev_week_completions, 0) * 0.9 THEN 'decelerating'
    ELSE 'stable'
  END as momentum_trend
FROM momentum_calc mc
JOIN public.organizations o ON mc.organization_id = o.id
WHERE mc.prev_week_completions IS NOT NULL;

-- ============================================================================
-- METRIC 3: Collaboration Metrics
-- VIEW: cross_team_collaboration
-- ============================================================================
CREATE OR REPLACE VIEW public.cross_team_collaboration AS
SELECT
  t1.organization_id,
  c.id as course_id,
  c.title as course_title,
  COUNT(DISTINCT t1.team_id) as teams_enrolled,
  COUNT(DISTINCT t1.user_id) as total_learners,
  jsonb_agg(DISTINCT jsonb_build_object(
    'team_id', t1.team_id,
    'team_name', teams1.name,
    'member_count', (
      SELECT COUNT(*) FROM public.team_members tm1
      JOIN public.enrollments e1 ON tm1.user_id = e1.user_id
      WHERE tm1.team_id = t1.team_id AND e1.course_id = c.id
    )
  )) as team_breakdown
FROM public.team_members t1
JOIN public.teams teams1 ON t1.team_id = teams1.id
JOIN public.enrollments e ON t1.user_id = e.user_id
JOIN public.courses c ON e.course_id = c.id
GROUP BY t1.organization_id, c.id, c.title
HAVING COUNT(DISTINCT t1.team_id) >= 2
ORDER BY COUNT(DISTINCT t1.team_id) DESC;

-- ============================================================================
-- METRIC 4: Learning Path Effectiveness
-- VIEW: learning_path_effectiveness
-- ============================================================================
CREATE OR REPLACE VIEW public.learning_path_effectiveness AS
SELECT
  lp.id as learning_path_id,
  lp.title as path_title,
  lp.difficulty_level,
  lp.estimated_hours,
  COUNT(DISTINCT ulp.user_id) as total_enrolled,
  COUNT(DISTINCT CASE WHEN ulp.completed_at IS NOT NULL THEN ulp.user_id END) as total_completed,
  CASE
    WHEN COUNT(DISTINCT ulp.user_id) > 0
    THEN (COUNT(DISTINCT CASE WHEN ulp.completed_at IS NOT NULL THEN ulp.user_id END)::DECIMAL
          / COUNT(DISTINCT ulp.user_id) * 100)::DECIMAL(5,2)
    ELSE 0
  END as completion_rate,
  AVG(ulp.progress_percentage) as avg_progress,
  AVG(CASE
    WHEN ulp.completed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ulp.completed_at - ulp.started_at)) / 86400.0
  END)::DECIMAL(6,2) as avg_days_to_complete,
  COUNT(DISTINCT lpc.course_id) as total_courses_in_path,
  -- Calculate dropout point
  (
    SELECT lpc2.order_index
    FROM public.learning_path_courses lpc2
    LEFT JOIN public.user_progress up ON lpc2.course_id = up.course_id
    LEFT JOIN public.user_learning_paths ulp2 ON up.user_id = ulp2.user_id
      AND ulp2.learning_path_id = lp.id
    WHERE lpc2.learning_path_id = lp.id
      AND ulp2.completed_at IS NULL
      AND up.completed_at IS NULL
    GROUP BY lpc2.order_index
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as common_dropout_index
FROM public.learning_paths lp
LEFT JOIN public.user_learning_paths ulp ON lp.id = ulp.learning_path_id
LEFT JOIN public.learning_path_courses lpc ON lp.id = lpc.learning_path_id
GROUP BY lp.id, lp.title, lp.difficulty_level, lp.estimated_hours;

-- ============================================================================
-- METRIC 5: Time-to-Competency
-- VIEW: time_to_competency_stats
-- ============================================================================
CREATE OR REPLACE VIEW public.time_to_competency_stats AS
WITH completion_times AS (
  SELECT
    om.organization_id,
    om.department,
    c.id as course_id,
    c.title as course_title,
    c.level as course_level,
    up.user_id,
    EXTRACT(EPOCH FROM (up.completed_at - e.enrolled_at)) / 86400.0 as days_to_complete
  FROM public.user_progress up
  JOIN public.enrollments e ON up.user_id = e.user_id AND up.course_id = e.course_id
  JOIN public.organization_members om ON up.user_id = om.user_id
  JOIN public.courses c ON up.course_id = c.id
  WHERE up.completed_at IS NOT NULL
    AND e.enrolled_at IS NOT NULL
)
SELECT
  organization_id,
  department,
  course_id,
  course_title,
  course_level,
  COUNT(*) as total_completions,
  AVG(days_to_complete)::DECIMAL(6,2) as avg_days,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY days_to_complete)::DECIMAL(6,2) as median_days,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days_to_complete)::DECIMAL(6,2) as p75_days,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY days_to_complete)::DECIMAL(6,2) as p90_days,
  MIN(days_to_complete)::DECIMAL(6,2) as fastest_completion_days,
  MAX(days_to_complete)::DECIMAL(6,2) as slowest_completion_days
FROM completion_times
GROUP BY organization_id, department, course_id, course_title, course_level;

-- ============================================================================
-- METRIC 6: Team Health Score
-- VIEW: team_health_scores
-- ============================================================================
CREATE OR REPLACE VIEW public.team_health_scores AS
WITH org_metrics AS (
  SELECT
    o.id as organization_id,
    o.name as organization_name,
    -- Engagement: % of members active in last 7 days
    (COUNT(DISTINCT CASE WHEN p.last_login >= NOW() - INTERVAL '7 days'
      THEN om.user_id END)::DECIMAL / NULLIF(COUNT(DISTINCT om.user_id), 0) * 100) as engagement_score,
    -- Completion Rate: % of enrollments completed
    (COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN e.id END)::DECIMAL /
      NULLIF(COUNT(DISTINCT e.id), 0) * 100) as completion_rate,
    -- Activity Consistency: % with activity in last 30 days
    (COUNT(DISTINCT CASE WHEN up.last_accessed >= NOW() - INTERVAL '30 days'
      THEN om.user_id END)::DECIMAL / NULLIF(COUNT(DISTINCT om.user_id), 0) * 100) as activity_consistency,
    -- Overdue Rate: % of assignments overdue (inverted)
    100 - (COUNT(DISTINCT CASE WHEN tau.status = 'overdue' THEN tau.id END)::DECIMAL /
      NULLIF(COUNT(DISTINCT tau.id), 0) * 100) as on_time_rate,
    -- Learning Velocity: avg completions per member in last 30 days
    (COUNT(DISTINCT CASE WHEN up.completed_at >= NOW() - INTERVAL '30 days'
      THEN up.id END)::DECIMAL / NULLIF(COUNT(DISTINCT om.user_id), 0)) * 10 as velocity_score
  FROM public.organizations o
  LEFT JOIN public.organization_members om ON o.id = om.organization_id
  LEFT JOIN public.profiles p ON om.user_id = p.id
  LEFT JOIN public.enrollments e ON om.user_id = e.user_id
  LEFT JOIN public.user_progress up ON e.user_id = up.user_id AND e.course_id = up.course_id
  LEFT JOIN public.team_assignment_users tau ON om.user_id = tau.user_id
  GROUP BY o.id, o.name
)
SELECT
  organization_id,
  organization_name,
  engagement_score,
  completion_rate,
  activity_consistency,
  on_time_rate,
  velocity_score,
  -- Composite Health Score (weighted average, normalized to 0-100)
  (
    COALESCE(engagement_score, 0) * 0.30 +
    COALESCE(completion_rate, 0) * 0.25 +
    COALESCE(activity_consistency, 0) * 0.20 +
    COALESCE(on_time_rate, 0) * 0.15 +
    COALESCE(LEAST(velocity_score, 100), 0) * 0.10
  )::DECIMAL(5,2) as health_score,
  CASE
    WHEN (
      COALESCE(engagement_score, 0) * 0.30 +
      COALESCE(completion_rate, 0) * 0.25 +
      COALESCE(activity_consistency, 0) * 0.20 +
      COALESCE(on_time_rate, 0) * 0.15 +
      COALESCE(LEAST(velocity_score, 100), 0) * 0.10
    ) >= 80 THEN 'excellent'
    WHEN (
      COALESCE(engagement_score, 0) * 0.30 +
      COALESCE(completion_rate, 0) * 0.25 +
      COALESCE(activity_consistency, 0) * 0.20 +
      COALESCE(on_time_rate, 0) * 0.15 +
      COALESCE(LEAST(velocity_score, 100), 0) * 0.10
    ) >= 60 THEN 'good'
    WHEN (
      COALESCE(engagement_score, 0) * 0.30 +
      COALESCE(completion_rate, 0) * 0.25 +
      COALESCE(activity_consistency, 0) * 0.20 +
      COALESCE(on_time_rate, 0) * 0.15 +
      COALESCE(LEAST(velocity_score, 100), 0) * 0.10
    ) >= 40 THEN 'fair'
    ELSE 'poor'
  END as health_status
FROM org_metrics;

-- ============================================================================
-- METRIC 7: Manager Dashboard
-- VIEW: manager_team_rollup
-- ============================================================================
CREATE OR REPLACE VIEW public.manager_team_rollup AS
SELECT
  om_manager.user_id as manager_id,
  om_manager.organization_id,
  o.name as organization_name,
  p_manager.full_name as manager_name,
  om_manager.department as manager_department,
  -- Count direct reports (members in same department, role='member')
  COUNT(DISTINCT om_member.user_id) as direct_reports_count,
  -- Aggregate metrics for direct reports
  AVG(CASE WHEN e.id IS NOT NULL THEN
    (SELECT progress_percentage FROM public.user_progress up
     WHERE up.user_id = om_member.user_id AND up.course_id = e.course_id LIMIT 1)
  END)::DECIMAL(5,2) as avg_team_progress,
  COUNT(DISTINCT e.id) as total_team_enrollments,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN e.id END) as total_team_completions,
  (COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN e.id END)::DECIMAL /
    NULLIF(COUNT(DISTINCT e.id), 0) * 100)::DECIMAL(5,2) as team_completion_rate,
  COUNT(DISTINCT CASE WHEN p_member.last_login >= NOW() - INTERVAL '7 days'
    THEN om_member.user_id END) as active_members_week,
  COUNT(DISTINCT CASE WHEN tau.status = 'overdue' THEN tau.user_id END) as members_with_overdue,
  jsonb_agg(DISTINCT jsonb_build_object(
    'user_id', om_member.user_id,
    'name', p_member.full_name,
    'enrollments', (SELECT COUNT(*) FROM public.enrollments e2 WHERE e2.user_id = om_member.user_id),
    'completions', (SELECT COUNT(*) FROM public.user_progress up2
                    WHERE up2.user_id = om_member.user_id AND up2.completed_at IS NOT NULL),
    'last_active', p_member.last_login
  )) FILTER (WHERE om_member.user_id IS NOT NULL) as team_members_detail
FROM public.organization_members om_manager
JOIN public.profiles p_manager ON om_manager.user_id = p_manager.id
JOIN public.organizations o ON om_manager.organization_id = o.id
LEFT JOIN public.organization_members om_member ON om_manager.organization_id = om_member.organization_id
  AND om_manager.department = om_member.department
  AND om_member.role = 'member'
LEFT JOIN public.profiles p_member ON om_member.user_id = p_member.id
LEFT JOIN public.enrollments e ON om_member.user_id = e.user_id
LEFT JOIN public.user_progress up ON e.user_id = up.user_id AND e.course_id = up.course_id
LEFT JOIN public.team_assignment_users tau ON om_member.user_id = tau.user_id
WHERE om_manager.role = 'manager'
GROUP BY om_manager.user_id, om_manager.organization_id, o.name, p_manager.full_name, om_manager.department;

-- ============================================================================
-- METRIC 8: ROI Metrics
-- VIEW: roi_metrics_by_org
-- ============================================================================
CREATE OR REPLACE VIEW public.roi_metrics_by_org AS
WITH org_financials AS (
  SELECT
    om.organization_id,
    e.course_id,
    c.title as course_title,
    COUNT(DISTINCT e.id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN e.id END) as total_completions,
    SUM(e.payment_amount) as total_spent,
    AVG(e.payment_amount) as avg_payment_per_enrollment,
    SUM(CASE WHEN up.completed_at IS NOT NULL THEN e.payment_amount ELSE 0 END) as spend_on_completions,
    AVG(CASE WHEN up.completed_at IS NOT NULL THEN e.payment_amount END) as avg_cost_per_completion
  FROM public.enrollments e
  JOIN public.organization_members om ON e.user_id = om.user_id
  JOIN public.courses c ON e.course_id = c.id
  LEFT JOIN public.user_progress up ON e.user_id = up.user_id AND e.course_id = up.course_id
  WHERE e.payment_status = 'completed'
    AND e.payment_amount > 0
  GROUP BY om.organization_id, e.course_id, c.title
)
SELECT
  organization_id,
  o.name as organization_name,
  -- Overall metrics
  SUM(total_enrollments) as total_enrollments,
  SUM(total_completions) as total_completions,
  SUM(total_spent)::DECIMAL(10,2) as total_investment,
  (SUM(total_completions)::DECIMAL / NULLIF(SUM(total_enrollments), 0) * 100)::DECIMAL(5,2) as overall_completion_rate,
  (SUM(total_spent) / NULLIF(SUM(total_enrollments), 0))::DECIMAL(8,2) as cost_per_enrollment,
  (SUM(spend_on_completions) / NULLIF(SUM(total_completions), 0))::DECIMAL(8,2) as cost_per_completion,
  -- ROI calculation (completion-based)
  (SUM(total_completions)::DECIMAL / NULLIF(SUM(total_enrollments), 0))::DECIMAL(5,4) as roi_ratio,
  -- Top value courses (best ROI)
  jsonb_agg(
    jsonb_build_object(
      'course', course_title,
      'enrollments', total_enrollments,
      'completions', total_completions,
      'total_spent', total_spent,
      'cost_per_completion', avg_cost_per_completion,
      'completion_rate', (total_completions::DECIMAL / NULLIF(total_enrollments, 0) * 100)::DECIMAL(5,2)
    )
    ORDER BY (total_completions::DECIMAL / NULLIF(total_enrollments, 0)) DESC
  ) FILTER (WHERE course_title IS NOT NULL) as course_breakdown
FROM org_financials
JOIN public.organizations o ON org_financials.organization_id = o.id
GROUP BY organization_id, o.name;

-- ============================================================================
-- SQL FUNCTIONS
-- ============================================================================

-- Function 1: Get Skills Gap with filters
CREATE OR REPLACE FUNCTION public.get_skills_gap(
  p_organization_id UUID,
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  skill_name TEXT,
  skill_level TEXT,
  skill_category TEXT,
  total_members BIGINT,
  members_with_skill BIGINT,
  gap_percentage DECIMAL,
  related_courses JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sg.skill_name,
    sg.skill_level,
    sg.skill_category,
    sg.total_members,
    sg.members_with_skill,
    sg.gap_percentage,
    sg.related_courses
  FROM public.skills_gap_by_organization sg
  WHERE sg.organization_id = p_organization_id
    AND (p_department IS NULL OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = sg.organization_id
      AND om.department = p_department
    ))
  ORDER BY sg.gap_percentage DESC, sg.skill_name;
$$;

-- Function 2: Get Team Momentum
CREATE OR REPLACE FUNCTION public.get_team_momentum(
  p_organization_id UUID,
  p_weeks INTEGER DEFAULT 4
)
RETURNS TABLE (
  week_start DATE,
  current_completions BIGINT,
  prev_week_completions BIGINT,
  week_over_week_change DECIMAL,
  four_week_avg NUMERIC,
  trend TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tm.week_start,
    tm.current_week_completions,
    tm.prev_week_completions,
    tm.week_over_week_change,
    tm.four_week_avg,
    tm.momentum_trend
  FROM public.team_momentum_weekly tm
  WHERE tm.organization_id = p_organization_id
    AND tm.week_start >= CURRENT_DATE - (p_weeks * 7 || ' days')::INTERVAL
  ORDER BY tm.week_start DESC;
$$;

-- Function 3: Get Collaboration Metrics
CREATE OR REPLACE FUNCTION public.get_collaboration_metrics(
  p_organization_id UUID
)
RETURNS TABLE (
  course_id INTEGER,
  course_title TEXT,
  teams_enrolled BIGINT,
  total_learners BIGINT,
  team_breakdown JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cc.course_id,
    cc.course_title,
    cc.teams_enrolled,
    cc.total_learners,
    cc.team_breakdown
  FROM public.cross_team_collaboration cc
  WHERE cc.organization_id = p_organization_id
  ORDER BY cc.teams_enrolled DESC, cc.total_learners DESC;
$$;

-- Function 4: Get Learning Path Stats
CREATE OR REPLACE FUNCTION public.get_learning_path_stats(
  p_organization_id UUID
)
RETURNS TABLE (
  learning_path_id UUID,
  path_title TEXT,
  difficulty_level TEXT,
  total_enrolled BIGINT,
  total_completed BIGINT,
  completion_rate DECIMAL,
  avg_days_to_complete DECIMAL,
  common_dropout_index INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lpe.learning_path_id,
    lpe.path_title,
    lpe.difficulty_level,
    lpe.total_enrolled,
    lpe.total_completed,
    lpe.completion_rate,
    lpe.avg_days_to_complete,
    lpe.common_dropout_index
  FROM public.learning_path_effectiveness lpe
  WHERE EXISTS (
    SELECT 1 FROM public.user_learning_paths ulp
    JOIN public.organization_members om ON ulp.user_id = om.user_id
    WHERE om.organization_id = p_organization_id
    AND ulp.learning_path_id = lpe.learning_path_id
  )
  ORDER BY lpe.completion_rate DESC;
END;
$$;

-- Function 5: Get Time to Competency
CREATE OR REPLACE FUNCTION public.get_time_to_competency(
  p_organization_id UUID,
  p_department TEXT DEFAULT NULL,
  p_course_level TEXT DEFAULT NULL
)
RETURNS TABLE (
  course_id INTEGER,
  course_title TEXT,
  course_level TEXT,
  total_completions BIGINT,
  avg_days DECIMAL,
  median_days DECIMAL,
  p90_days DECIMAL,
  fastest_days DECIMAL
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ttc.course_id,
    ttc.course_title,
    ttc.course_level,
    ttc.total_completions,
    ttc.avg_days,
    ttc.median_days,
    ttc.p90_days,
    ttc.fastest_completion_days
  FROM public.time_to_competency_stats ttc
  WHERE ttc.organization_id = p_organization_id
    AND (p_department IS NULL OR ttc.department = p_department)
    AND (p_course_level IS NULL OR ttc.course_level = p_course_level)
  ORDER BY ttc.total_completions DESC;
$$;

-- Function 6: Calculate Team Health Score
CREATE OR REPLACE FUNCTION public.calculate_team_health(
  p_organization_id UUID
)
RETURNS TABLE (
  engagement_score NUMERIC,
  completion_rate NUMERIC,
  activity_consistency NUMERIC,
  on_time_rate NUMERIC,
  velocity_score NUMERIC,
  health_score DECIMAL,
  health_status TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ths.engagement_score,
    ths.completion_rate,
    ths.activity_consistency,
    ths.on_time_rate,
    ths.velocity_score,
    ths.health_score,
    ths.health_status
  FROM public.team_health_scores ths
  WHERE ths.organization_id = p_organization_id;
$$;

-- Function 7: Get Manager Dashboard
CREATE OR REPLACE FUNCTION public.get_manager_dashboard(
  p_manager_id UUID
)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  manager_department TEXT,
  direct_reports_count BIGINT,
  avg_team_progress DECIMAL,
  team_completion_rate DECIMAL,
  active_members_week BIGINT,
  members_with_overdue BIGINT,
  team_members_detail JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    mtr.organization_id,
    mtr.organization_name,
    mtr.manager_department,
    mtr.direct_reports_count,
    mtr.avg_team_progress,
    mtr.team_completion_rate,
    mtr.active_members_week,
    mtr.members_with_overdue,
    mtr.team_members_detail
  FROM public.manager_team_rollup mtr
  WHERE mtr.manager_id = p_manager_id;
$$;

-- Function 8: Get ROI Metrics
CREATE OR REPLACE FUNCTION public.get_roi_metrics(
  p_organization_id UUID
)
RETURNS TABLE (
  total_enrollments BIGINT,
  total_completions BIGINT,
  total_investment DECIMAL,
  overall_completion_rate DECIMAL,
  cost_per_enrollment DECIMAL,
  cost_per_completion DECIMAL,
  roi_ratio DECIMAL,
  course_breakdown JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    roi.total_enrollments,
    roi.total_completions,
    roi.total_investment,
    roi.overall_completion_rate,
    roi.cost_per_enrollment,
    roi.cost_per_completion,
    roi.roi_ratio,
    roi.course_breakdown
  FROM public.roi_metrics_by_org roi
  WHERE roi.organization_id = p_organization_id;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.skills_gap_by_organization TO authenticated;
GRANT SELECT ON public.team_momentum_weekly TO authenticated;
GRANT SELECT ON public.cross_team_collaboration TO authenticated;
GRANT SELECT ON public.learning_path_effectiveness TO authenticated;
GRANT SELECT ON public.time_to_competency_stats TO authenticated;
GRANT SELECT ON public.team_health_scores TO authenticated;
GRANT SELECT ON public.manager_team_rollup TO authenticated;
GRANT SELECT ON public.roi_metrics_by_org TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON VIEW public.skills_gap_by_organization IS 'Identifies skills gaps across organization members';
COMMENT ON VIEW public.team_momentum_weekly IS 'Tracks learning momentum with week-over-week changes';
COMMENT ON VIEW public.cross_team_collaboration IS 'Shows courses enrolled by multiple teams';
COMMENT ON VIEW public.learning_path_effectiveness IS 'Analyzes learning path completion rates and effectiveness';
COMMENT ON VIEW public.time_to_competency_stats IS 'Time metrics from enrollment to completion';
COMMENT ON VIEW public.team_health_scores IS 'Composite health score for organization learning culture';
COMMENT ON VIEW public.manager_team_rollup IS 'Manager dashboard with direct reports metrics';
COMMENT ON VIEW public.roi_metrics_by_org IS 'Financial ROI analysis for learning investments';
