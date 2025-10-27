-- Create studio_drafts table for auto-saving wizard progress
CREATE TABLE IF NOT EXISTS studio_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('course', 'event', 'blog', 'announcement')),
  asset_id UUID,  -- NULL for new assets, populated when editing existing
  draft_data JSONB NOT NULL,  -- Complete wizard state
  current_step INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_studio_drafts_user_asset
ON studio_drafts(user_id, asset_type);

CREATE INDEX IF NOT EXISTS idx_studio_drafts_updated
ON studio_drafts(updated_at DESC);

-- Add RLS policies
ALTER TABLE studio_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own drafts
CREATE POLICY "Users can view their own drafts"
  ON studio_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
  ON studio_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON studio_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON studio_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Create asset_schedules table for advanced scheduling
CREATE TABLE IF NOT EXISTS asset_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  asset_id UUID NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,  -- NULL means permanent/no end date
  time_start TIME,  -- Optional time range restriction
  time_end TIME,
  recurring_pattern JSONB,  -- {type: 'weekly', days: [1,3,5], interval: 1}
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_asset_schedules_lookup
ON asset_schedules(asset_type, asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_schedules_dates
ON asset_schedules(start_date, end_date)
WHERE is_active = true;

-- Add RLS policies for asset_schedules
ALTER TABLE asset_schedules ENABLE ROW LEVEL SECURITY;

-- Everyone can view active schedules
CREATE POLICY "Anyone can view active schedules"
  ON asset_schedules FOR SELECT
  USING (is_active = true);

-- Only admins can manage schedules
CREATE POLICY "Admins can insert schedules"
  ON asset_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update schedules"
  ON asset_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete schedules"
  ON asset_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_studio_drafts_updated_at
  BEFORE UPDATE ON studio_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_schedules_updated_at
  BEFORE UPDATE ON asset_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add schedule_id column to existing tables (optional foreign key)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES asset_schedules(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES asset_schedules(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES asset_schedules(id);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES asset_schedules(id);

-- Add tags column to tables for drag-drop tag management
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
