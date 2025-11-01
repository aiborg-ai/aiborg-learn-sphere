-- Migration: Team Analytics Enhancements
-- Creates views and indexes for team performance analytics

-- Create team analytics summary view
CREATE OR REPLACE VIEW team_analytics_summary AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.created_at,
  COUNT(DISTINCT tm.user_id) as member_count,
  COUNT(DISTINCT te.enrollment_id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.id END) as completed_enrollments,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.id END)::FLOAT /
    NULLIF(COUNT(DISTINCT te.enrollment_id), 0) * 100 as completion_rate,
  AVG(up.progress_percentage) as avg_progress,
  COUNT(DISTINCT CASE WHEN up.last_accessed >= NOW() - INTERVAL '7 days' THEN tm.user_id END) as active_members_week,
  COUNT(DISTINCT CASE WHEN up.last_accessed >= NOW() - INTERVAL '30 days' THEN tm.user_id END) as active_members_month,
  -- Engagement score: weighted combination of activity and progress
  (
    (COUNT(DISTINCT CASE WHEN up.last_accessed >= NOW() - INTERVAL '7 days' THEN tm.user_id END)::FLOAT /
      NULLIF(COUNT(DISTINCT tm.user_id), 0) * 40) +
    (AVG(COALESCE(up.progress_percentage, 0)) * 0.6)
  ) as engagement_score,
  MAX(up.last_accessed) as last_activity
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN team_enrollments te ON t.id = te.team_id
LEFT JOIN user_progress up ON te.enrollment_id = up.id
GROUP BY t.id, t.name, t.created_at;

-- Create team performance trend view
CREATE OR REPLACE VIEW team_performance_trend AS
SELECT
  t.id as team_id,
  t.name as team_name,
  DATE(up.last_accessed) as date,
  COUNT(DISTINCT tm.user_id) as active_members,
  AVG(up.progress_percentage) as avg_progress,
  COUNT(DISTINCT CASE WHEN up.completed_at IS NOT NULL THEN up.id END) as completions
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN team_enrollments te ON t.id = te.team_id
LEFT JOIN user_progress up ON te.enrollment_id = up.id
WHERE up.last_accessed >= NOW() - INTERVAL '90 days'
GROUP BY t.id, t.name, DATE(up.last_accessed)
ORDER BY t.id, date DESC;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_created_at
  ON teams(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id
  ON team_members(team_id);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id
  ON team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_team_enrollments_team_id
  ON team_enrollments(team_id);

CREATE INDEX IF NOT EXISTS idx_team_enrollments_enrollment_id
  ON team_enrollments(enrollment_id);

-- Grant SELECT permissions to authenticated users (admin check in application layer)
GRANT SELECT ON team_analytics_summary TO authenticated;
GRANT SELECT ON team_performance_trend TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW team_analytics_summary IS 'Aggregated team performance metrics including engagement scores';
COMMENT ON VIEW team_performance_trend IS 'Daily team activity and progress trends for the last 90 days';
COMMENT ON COLUMN team_analytics_summary.engagement_score IS 'Weighted engagement score: 40% recent activity + 60% average progress';
