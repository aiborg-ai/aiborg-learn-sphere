-- Create AI generation logs table for tracking blog post generation and costs
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- 'blog_post', 'image', etc.
  input_data JSONB NOT NULL, -- Original request data
  output_data JSONB, -- Generated content
  model TEXT NOT NULL, -- 'gpt-4-turbo-preview', 'gpt-3.5-turbo', etc.
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6), -- Cost in USD
  generation_time_ms INTEGER, -- Time taken in milliseconds
  error_message TEXT, -- If generation failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for querying
CREATE INDEX idx_ai_generation_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_generation_logs_created_at ON ai_generation_logs(created_at DESC);
CREATE INDEX idx_ai_generation_logs_type ON ai_generation_logs(generation_type);

-- RLS policies
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own AI generation logs"
  ON ai_generation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert logs (used by Edge Functions)
CREATE POLICY "Service role can insert AI generation logs"
  ON ai_generation_logs
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "Admins can view all AI generation logs"
  ON ai_generation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE ai_generation_logs IS 'Tracks AI content generation requests, tokens used, and costs for monitoring and billing purposes';
