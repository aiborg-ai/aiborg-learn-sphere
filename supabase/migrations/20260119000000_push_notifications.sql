-- Push Notifications System
-- Migration: 20260119000000_push_notifications.sql
--
-- Creates tables for push notification subscriptions and user preferences

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  deadlines BOOLEAN DEFAULT true,
  course_updates BOOLEAN DEFAULT true,
  achievements BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT true,
  reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log table (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  error TEXT
);

-- Create indexes for notification log
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at DESC);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for notification_log
CREATE POLICY "Users can view own notification log"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all notifications (for edge functions)
CREATE POLICY "Service role can manage push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage notification log"
  ON notification_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get users with upcoming deadlines
CREATE OR REPLACE FUNCTION get_users_with_upcoming_deadlines(
  hours_ahead INTEGER DEFAULT 24
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  deadline_count BIGINT,
  earliest_deadline TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    u.email,
    COUNT(*)::BIGINT as deadline_count,
    MIN(a.due_date) as earliest_deadline
  FROM enrollments e
  JOIN auth.users u ON e.user_id = u.id
  JOIN assignments a ON a.course_id = e.course_id
  WHERE
    a.due_date > NOW()
    AND a.due_date <= NOW() + (hours_ahead || ' hours')::INTERVAL
    AND e.status = 'active'
    -- Check user has notifications enabled
    AND EXISTS (
      SELECT 1 FROM notification_preferences np
      WHERE np.user_id = e.user_id
      AND np.deadlines = true
    )
    -- Check user has push subscription
    AND EXISTS (
      SELECT 1 FROM push_subscriptions ps
      WHERE ps.user_id = e.user_id
    )
  GROUP BY e.user_id, u.email;
END;
$$;

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT ON notification_log TO authenticated;

-- Comments
COMMENT ON TABLE push_subscriptions IS 'Web Push notification subscriptions for each user device';
COMMENT ON TABLE notification_preferences IS 'User preferences for different notification types';
COMMENT ON TABLE notification_log IS 'Log of all sent notifications for analytics and debugging';
COMMENT ON FUNCTION get_users_with_upcoming_deadlines IS 'Get users who should receive deadline reminder notifications';
