-- ============================================================================
-- Engagement Events Tracking Table
-- For monitoring user interactions and engagement metrics
-- ============================================================================

-- Create engagement_events table
CREATE TABLE IF NOT EXISTS engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_id ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_event_type ON engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_event_source ON engagement_events(event_source);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created_at ON engagement_events(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_engagement_events_source_type_date
  ON engagement_events(event_source, event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own events
CREATE POLICY "Users can view own engagement events"
  ON engagement_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own engagement events"
  ON engagement_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all events
CREATE POLICY "Admins can view all engagement events"
  ON engagement_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to track an engagement event
CREATE OR REPLACE FUNCTION track_engagement_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_source TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO engagement_events (user_id, event_type, event_source, metadata)
  VALUES (p_user_id, p_event_type, p_event_source, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Function to get engagement summary for a user
CREATE OR REPLACE FUNCTION get_user_engagement_summary(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
  event_source TEXT,
  event_type TEXT,
  event_count BIGINT,
  first_event TIMESTAMPTZ,
  last_event TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.event_source,
    e.event_type,
    COUNT(*) as event_count,
    MIN(e.created_at) as first_event,
    MAX(e.created_at) as last_event
  FROM engagement_events e
  WHERE e.user_id = p_user_id
    AND e.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY e.event_source, e.event_type
  ORDER BY event_count DESC;
END;
$$;

-- Function to get daily engagement metrics
CREATE OR REPLACE FUNCTION get_daily_engagement_metrics(
  p_event_source TEXT,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  event_date DATE,
  unique_users BIGINT,
  total_events BIGINT,
  events_per_user NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(e.created_at) as event_date,
    COUNT(DISTINCT e.user_id) as unique_users,
    COUNT(*) as total_events,
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT e.user_id), 0), 2) as events_per_user
  FROM engagement_events e
  WHERE e.event_source = p_event_source
    AND e.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(e.created_at)
  ORDER BY event_date DESC;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE engagement_events IS 'Tracks user engagement events for analytics and monitoring';
COMMENT ON COLUMN engagement_events.event_type IS 'Type of event (e.g., assessment_started, question_answered)';
COMMENT ON COLUMN engagement_events.event_source IS 'Source of event (e.g., adaptive_assessment, course_page)';
COMMENT ON COLUMN engagement_events.metadata IS 'Additional event data in JSON format';

COMMENT ON FUNCTION track_engagement_event IS 'Records a user engagement event';
COMMENT ON FUNCTION get_user_engagement_summary IS 'Gets engagement summary for a specific user';
COMMENT ON FUNCTION get_daily_engagement_metrics IS 'Gets daily engagement metrics for a specific event source';

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION track_engagement_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_engagement_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_engagement_metrics TO authenticated;
