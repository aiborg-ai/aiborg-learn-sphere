-- Migration: Custom Dashboard Views
-- Creates table for storing user-specific dashboard configurations

-- Create custom_dashboard_views table
CREATE TABLE IF NOT EXISTS custom_dashboard_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique view names per user
  CONSTRAINT unique_user_view_name UNIQUE (user_id, name),

  -- Validate name length
  CONSTRAINT valid_view_name CHECK (char_length(name) > 0 AND char_length(name) <= 100)
);

-- Add index for efficient user queries
CREATE INDEX idx_custom_dashboard_views_user_id_created_at
  ON custom_dashboard_views(user_id, created_at DESC);

-- Create function to enforce 10 view limit per user
CREATE OR REPLACE FUNCTION check_custom_view_limit()
RETURNS TRIGGER AS $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM custom_dashboard_views
  WHERE user_id = NEW.user_id;

  IF view_count >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 custom dashboard views per user exceeded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit on INSERT
CREATE TRIGGER enforce_custom_view_limit
  BEFORE INSERT ON custom_dashboard_views
  FOR EACH ROW
  EXECUTE FUNCTION check_custom_view_limit();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_view_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp on UPDATE
CREATE TRIGGER update_custom_dashboard_views_timestamp
  BEFORE UPDATE ON custom_dashboard_views
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_view_timestamp();

-- Enable Row Level Security
ALTER TABLE custom_dashboard_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own custom views
CREATE POLICY "Users can view own custom dashboard views"
  ON custom_dashboard_views
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own custom views
CREATE POLICY "Users can create own custom dashboard views"
  ON custom_dashboard_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own custom views
CREATE POLICY "Users can update own custom dashboard views"
  ON custom_dashboard_views
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own custom views
CREATE POLICY "Users can delete own custom dashboard views"
  ON custom_dashboard_views
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_dashboard_views TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE custom_dashboard_views IS 'Stores user-specific admin dashboard configurations (max 10 per user)';
COMMENT ON COLUMN custom_dashboard_views.config IS 'JSON configuration: { dateRange, filters, visibleMetrics, chartTypes, autoRefresh, activeTab }';
COMMENT ON CONSTRAINT unique_user_view_name ON custom_dashboard_views IS 'Ensures view names are unique per user';
COMMENT ON FUNCTION check_custom_view_limit() IS 'Enforces maximum of 10 custom views per user';
COMMENT ON FUNCTION update_custom_view_timestamp() IS 'Automatically updates updated_at timestamp on record modification';
