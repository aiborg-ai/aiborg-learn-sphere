-- AIBORGLingo Notification System
-- Handles push notification subscriptions and email preferences for streak reminders

-- First, add session_id to lingo_analytics if it doesn't exist
ALTER TABLE lingo_analytics
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Table for storing notification preferences and push subscriptions
CREATE TABLE IF NOT EXISTS lingo_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT false,
  email_reminder_time TIME DEFAULT '09:00:00',  -- Default 9 AM
  email_timezone TEXT DEFAULT 'UTC',

  -- Push notifications
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,  -- Web Push subscription object
  push_reminder_time TIME DEFAULT '09:00:00',

  -- Notification preferences
  streak_reminder BOOLEAN DEFAULT true,        -- Remind about maintaining streak
  goal_reminder BOOLEAN DEFAULT true,          -- Remind if daily goal not met
  achievement_notifications BOOLEAN DEFAULT true, -- Notify on achievements
  weekly_summary BOOLEAN DEFAULT false,        -- Weekly progress email

  -- Tracking
  last_notification_sent TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for notification history/log
CREATE TABLE IF NOT EXISTS lingo_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,  -- 'streak_reminder', 'goal_reminder', 'achievement', 'weekly_summary'
  channel TEXT NOT NULL,            -- 'push', 'email'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',       -- 'sent', 'failed', 'clicked'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON lingo_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON lingo_notification_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON lingo_notification_log(notification_type, sent_at DESC);

-- RLS policies - users can only access their own notification settings
ALTER TABLE lingo_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo_notification_log ENABLE ROW LEVEL SECURITY;

-- Policy for notification settings
CREATE POLICY "Users can view own notification settings"
  ON lingo_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON lingo_notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON lingo_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings"
  ON lingo_notification_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for notification log
CREATE POLICY "Users can view own notification log"
  ON lingo_notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert notifications (for edge functions)
CREATE POLICY "Service can insert notification log"
  ON lingo_notification_log FOR INSERT
  WITH CHECK (true);

-- Function to get users who need streak reminders
-- Called by the edge function to find users to notify
CREATE OR REPLACE FUNCTION get_users_needing_streak_reminder()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  push_subscription JSONB,
  streak INTEGER,
  last_session_date DATE,
  push_enabled BOOLEAN,
  email_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ns.user_id,
    p.email,
    ns.push_subscription,
    COALESCE(up.streak, 0) as streak,
    up.last_session_date,
    ns.push_enabled,
    ns.email_enabled
  FROM lingo_notification_settings ns
  JOIN profiles p ON p.id = ns.user_id
  LEFT JOIN lingo_user_progress up ON up.user_id = ns.user_id
  WHERE
    (ns.push_enabled = true OR ns.email_enabled = true)
    AND ns.streak_reminder = true
    AND (
      -- User hasn't played today
      up.last_session_date IS NULL
      OR up.last_session_date < CURRENT_DATE
    )
    AND (
      -- Haven't sent notification in last 20 hours
      ns.last_notification_sent IS NULL
      OR ns.last_notification_sent < NOW() - INTERVAL '20 hours'
    );
END;
$$;

-- Function to update last notification sent timestamp
CREATE OR REPLACE FUNCTION update_notification_sent(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE lingo_notification_settings
  SET
    last_notification_sent = NOW(),
    notification_count = notification_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION get_users_needing_streak_reminder() TO service_role;
GRANT EXECUTE ON FUNCTION update_notification_sent(UUID) TO service_role;
