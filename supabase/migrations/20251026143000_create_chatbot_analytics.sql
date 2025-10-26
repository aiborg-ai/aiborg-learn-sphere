-- AI Chatbot Analytics and Monitoring Tables
-- Created: 2025-10-26
-- Purpose: Track usage, costs, and performance of the AI chatbot

-- ============================================================================
-- TABLE: chatbot_conversations
-- Purpose: Track individual chatbot conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- Client-generated session ID for anonymous tracking
  audience TEXT NOT NULL CHECK (audience IN ('primary', 'secondary', 'professional', 'business', 'default')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: chatbot_messages
-- Purpose: Track individual messages and API calls
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  audience TEXT NOT NULL,

  -- API Response Metadata
  model TEXT DEFAULT 'gpt-4-turbo-preview',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  response_time_ms INTEGER, -- Time taken for API response

  -- Cost Calculation (GPT-4 Turbo: $0.01/1K prompt, $0.03/1K completion)
  cost_usd DECIMAL(10, 6),

  -- Error Tracking
  is_error BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  is_fallback BOOLEAN DEFAULT FALSE, -- TRUE if fallback response was used

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: chatbot_daily_stats
-- Purpose: Aggregated daily statistics for quick reporting
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chatbot_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- Volume Metrics
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,

  -- Token Usage
  total_prompt_tokens INTEGER DEFAULT 0,
  total_completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost Metrics
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,
  avg_cost_per_message_usd DECIMAL(10, 6) DEFAULT 0,

  -- Performance Metrics
  avg_response_time_ms INTEGER,
  p95_response_time_ms INTEGER, -- 95th percentile
  p99_response_time_ms INTEGER, -- 99th percentile

  -- Error Tracking
  total_errors INTEGER DEFAULT 0,
  total_fallbacks INTEGER DEFAULT 0,
  error_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- Audience Breakdown
  primary_messages INTEGER DEFAULT 0,
  secondary_messages INTEGER DEFAULT 0,
  professional_messages INTEGER DEFAULT 0,
  business_messages INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: chatbot_cost_alerts
-- Purpose: Track cost alerts and thresholds
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chatbot_cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('daily', 'weekly', 'monthly', 'threshold')),
  threshold_usd DECIMAL(10, 2) NOT NULL,
  current_amount_usd DECIMAL(10, 2) DEFAULT 0,
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id
  ON public.chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id
  ON public.chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_started_at
  ON public.chatbot_conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_audience
  ON public.chatbot_conversations(audience);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id
  ON public.chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at
  ON public.chatbot_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_is_error
  ON public.chatbot_messages(is_error) WHERE is_error = TRUE;
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_is_fallback
  ON public.chatbot_messages(is_fallback) WHERE is_fallback = TRUE;

-- Daily stats indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_daily_stats_date
  ON public.chatbot_daily_stats(date DESC);

-- ============================================================================
-- FUNCTION: Calculate Cost
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_chatbot_message_cost(
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
) RETURNS DECIMAL(10, 6) AS $$
DECLARE
  v_prompt_cost DECIMAL(10, 6);
  v_completion_cost DECIMAL(10, 6);
  v_total_cost DECIMAL(10, 6);
BEGIN
  -- GPT-4 Turbo Preview pricing (as of 2024)
  -- Prompt: $0.01 per 1K tokens
  -- Completion: $0.03 per 1K tokens

  IF p_model = 'gpt-4-turbo-preview' OR p_model = 'gpt-4-turbo' THEN
    v_prompt_cost := (p_prompt_tokens / 1000.0) * 0.01;
    v_completion_cost := (p_completion_tokens / 1000.0) * 0.03;
  -- GPT-3.5 Turbo pricing
  ELSIF p_model = 'gpt-3.5-turbo' THEN
    v_prompt_cost := (p_prompt_tokens / 1000.0) * 0.0005;
    v_completion_cost := (p_completion_tokens / 1000.0) * 0.0015;
  ELSE
    -- Default to GPT-4 Turbo pricing
    v_prompt_cost := (p_prompt_tokens / 1000.0) * 0.01;
    v_completion_cost := (p_completion_tokens / 1000.0) * 0.03;
  END IF;

  v_total_cost := v_prompt_cost + v_completion_cost;
  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Update Daily Stats
-- ============================================================================
CREATE OR REPLACE FUNCTION update_chatbot_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Insert or update daily stats
  INSERT INTO public.chatbot_daily_stats (
    date,
    total_messages,
    total_api_calls,
    total_prompt_tokens,
    total_completion_tokens,
    total_tokens,
    total_cost_usd,
    total_errors,
    total_fallbacks
  )
  VALUES (
    v_today,
    1,
    CASE WHEN NEW.role = 'assistant' THEN 1 ELSE 0 END,
    COALESCE(NEW.prompt_tokens, 0),
    COALESCE(NEW.completion_tokens, 0),
    COALESCE(NEW.total_tokens, 0),
    COALESCE(NEW.cost_usd, 0),
    CASE WHEN NEW.is_error THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_fallback THEN 1 ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    total_messages = chatbot_daily_stats.total_messages + 1,
    total_api_calls = chatbot_daily_stats.total_api_calls +
      CASE WHEN NEW.role = 'assistant' THEN 1 ELSE 0 END,
    total_prompt_tokens = chatbot_daily_stats.total_prompt_tokens +
      COALESCE(NEW.prompt_tokens, 0),
    total_completion_tokens = chatbot_daily_stats.total_completion_tokens +
      COALESCE(NEW.completion_tokens, 0),
    total_tokens = chatbot_daily_stats.total_tokens +
      COALESCE(NEW.total_tokens, 0),
    total_cost_usd = chatbot_daily_stats.total_cost_usd +
      COALESCE(NEW.cost_usd, 0),
    total_errors = chatbot_daily_stats.total_errors +
      CASE WHEN NEW.is_error THEN 1 ELSE 0 END,
    total_fallbacks = chatbot_daily_stats.total_fallbacks +
      CASE WHEN NEW.is_fallback THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update daily stats on new message
-- ============================================================================
DROP TRIGGER IF EXISTS trg_update_daily_stats ON public.chatbot_messages;
CREATE TRIGGER trg_update_daily_stats
  AFTER INSERT ON public.chatbot_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_daily_stats();

-- ============================================================================
-- FUNCTION: Get Cost Summary
-- ============================================================================
CREATE OR REPLACE FUNCTION get_chatbot_cost_summary(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period TEXT,
  total_cost_usd DECIMAL(10, 4),
  total_messages INTEGER,
  total_tokens BIGINT,
  avg_cost_per_message DECIMAL(10, 6),
  error_rate DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Summary' AS period,
    SUM(ds.total_cost_usd)::DECIMAL(10, 4) AS total_cost_usd,
    SUM(ds.total_messages)::INTEGER AS total_messages,
    SUM(ds.total_tokens)::BIGINT AS total_tokens,
    CASE
      WHEN SUM(ds.total_messages) > 0
      THEN (SUM(ds.total_cost_usd) / SUM(ds.total_messages))::DECIMAL(10, 6)
      ELSE 0::DECIMAL(10, 6)
    END AS avg_cost_per_message,
    CASE
      WHEN SUM(ds.total_messages) > 0
      THEN ((SUM(ds.total_errors)::DECIMAL / SUM(ds.total_messages)) * 100)::DECIMAL(5, 2)
      ELSE 0::DECIMAL(5, 2)
    END AS error_rate
  FROM public.chatbot_daily_stats ds
  WHERE ds.date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_cost_alerts ENABLE ROW LEVEL SECURITY;

-- Admin can view all analytics
CREATE POLICY "Admin can view all conversations"
  ON public.chatbot_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view all messages"
  ON public.chatbot_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view daily stats"
  ON public.chatbot_daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view cost alerts"
  ON public.chatbot_cost_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert (for edge function)
CREATE POLICY "Service role can insert conversations"
  ON public.chatbot_conversations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert messages"
  ON public.chatbot_messages FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update conversations"
  ON public.chatbot_conversations FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Initial Setup: Create default cost alerts
-- ============================================================================
INSERT INTO public.chatbot_cost_alerts (alert_type, threshold_usd)
VALUES
  ('daily', 10.00),
  ('weekly', 50.00),
  ('monthly', 200.00),
  ('threshold', 5.00) -- Alert when daily spending exceeds $5
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================
COMMENT ON TABLE public.chatbot_conversations IS 'Tracks individual chatbot conversation sessions';
COMMENT ON TABLE public.chatbot_messages IS 'Stores all chatbot messages with API usage metrics';
COMMENT ON TABLE public.chatbot_daily_stats IS 'Aggregated daily statistics for reporting and alerting';
COMMENT ON TABLE public.chatbot_cost_alerts IS 'Cost alert thresholds and notifications';

COMMENT ON FUNCTION calculate_chatbot_message_cost IS 'Calculates the cost of a chatbot message based on token usage';
COMMENT ON FUNCTION get_chatbot_cost_summary IS 'Returns cost summary for a specified date range';
