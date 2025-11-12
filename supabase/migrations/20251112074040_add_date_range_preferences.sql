-- Migration: Add Date Range Preferences to Analytics
-- Phase 4: Date Range Filters Enhancement
-- Created: 2025-11-12

-- Add columns to analytics_preferences table for date range tracking
ALTER TABLE public.analytics_preferences
  ADD COLUMN IF NOT EXISTS last_used_date_range JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS comparison_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.analytics_preferences.last_used_date_range IS
  'Stores the last used date range as JSON: {preset: string, startDate: string, endDate: string, lastUpdated: string}';
COMMENT ON COLUMN public.analytics_preferences.comparison_enabled IS
  'Whether comparison mode is enabled by default for this user';

-- Create index for faster queries on date range preferences
CREATE INDEX IF NOT EXISTS idx_analytics_preferences_date_range
  ON public.analytics_preferences USING GIN (last_used_date_range);

-- Validation function for date range JSON structure
CREATE OR REPLACE FUNCTION validate_date_range_json(date_range JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if required fields exist
  IF date_range IS NULL THEN
    RETURN true; -- NULL is valid (no preference set)
  END IF;

  IF NOT (date_range ? 'preset' AND date_range ? 'startDate' AND date_range ? 'endDate') THEN
    RETURN false;
  END IF;

  -- Validate date format (YYYY-MM-DD)
  IF NOT (
    date_range->>'startDate' ~ '^\d{4}-\d{2}-\d{2}$' AND
    date_range->>'endDate' ~ '^\d{4}-\d{2}-\d{2}$'
  ) THEN
    RETURN false;
  END IF;

  -- Validate preset is a string
  IF jsonb_typeof(date_range->'preset') != 'string' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to validate date range JSON structure
ALTER TABLE public.analytics_preferences
  ADD CONSTRAINT check_date_range_format
  CHECK (validate_date_range_json(last_used_date_range));

-- Helper function to get last used date range for a user
CREATE OR REPLACE FUNCTION get_last_used_date_range(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT last_used_date_range INTO result
  FROM public.analytics_preferences
  WHERE user_id = target_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to save last used date range
CREATE OR REPLACE FUNCTION save_last_used_date_range(
  target_user_id UUID,
  preset_value TEXT,
  start_date TEXT,
  end_date TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Ensure preferences exist for user
  INSERT INTO public.analytics_preferences (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the date range
  UPDATE public.analytics_preferences
  SET
    last_used_date_range = jsonb_build_object(
      'preset', preset_value,
      'startDate', start_date,
      'endDate', end_date,
      'lastUpdated', NOW()::text
    ),
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to toggle comparison mode
CREATE OR REPLACE FUNCTION toggle_comparison_mode(
  target_user_id UUID,
  enabled BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Ensure preferences exist for user
  INSERT INTO public.analytics_preferences (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update comparison setting
  UPDATE public.analytics_preferences
  SET
    comparison_enabled = enabled,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_last_used_date_range(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_last_used_date_range(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_comparison_mode(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_date_range_json(JSONB) TO authenticated;

-- Migration complete
