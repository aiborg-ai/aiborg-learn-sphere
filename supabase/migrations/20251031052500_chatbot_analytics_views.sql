-- Migration: Chatbot Analytics Views
-- Creates views and indexes for efficient chatbot analytics queries

-- Create chatbot analytics daily view
CREATE OR REPLACE VIEW chatbot_analytics_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_conversations,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CASE WHEN satisfaction_rating IS NOT NULL THEN satisfaction_rating ELSE NULL END) as avg_satisfaction,
  COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) as resolved_count,
  COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as resolution_rate,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_duration_minutes,
  COUNT(message_count) as total_messages,
  AVG(message_count) as avg_messages_per_conversation
FROM chatbot_conversations
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create view for top queries
CREATE OR REPLACE VIEW chatbot_top_queries AS
SELECT
  primary_query_topic,
  COUNT(*) as query_count,
  AVG(satisfaction_rating) as avg_satisfaction,
  COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as resolution_rate
FROM chatbot_conversations
WHERE primary_query_topic IS NOT NULL
GROUP BY primary_query_topic
ORDER BY query_count DESC
LIMIT 10;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at
  ON chatbot_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id
  ON chatbot_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_satisfaction
  ON chatbot_conversations(satisfaction_rating)
  WHERE satisfaction_rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_resolution
  ON chatbot_conversations(resolution_status);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_query_topic
  ON chatbot_conversations(primary_query_topic)
  WHERE primary_query_topic IS NOT NULL;

-- Grant SELECT permissions to authenticated users (admin check in application layer)
GRANT SELECT ON chatbot_analytics_daily TO authenticated;
GRANT SELECT ON chatbot_top_queries TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW chatbot_analytics_daily IS 'Daily aggregated chatbot conversation metrics for analytics dashboard';
COMMENT ON VIEW chatbot_top_queries IS 'Top 10 most common query topics with satisfaction and resolution metrics';
