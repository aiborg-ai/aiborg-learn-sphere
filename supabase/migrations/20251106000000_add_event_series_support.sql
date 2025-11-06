-- Migration: Add Event Series Support
-- Description: Extends events table to support recurring event series with online meetings
-- Created: 2025-11-06

-- Add new columns to events table for series and online support
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS is_series BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS series_name TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;

-- Add index for series lookups
CREATE INDEX IF NOT EXISTS idx_events_series_name ON public.events(series_name) WHERE series_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_is_series ON public.events(is_series) WHERE is_series = true;

-- Add comment for documentation
COMMENT ON COLUMN public.events.meeting_url IS 'URL for online meetings (Zoom, Google Meet, Teams, etc.)';
COMMENT ON COLUMN public.events.is_series IS 'Indicates if this event is a recurring series parent';
COMMENT ON COLUMN public.events.series_name IS 'Unique identifier for the event series (e.g., forum-on-ai)';
COMMENT ON COLUMN public.events.recurrence_pattern IS 'JSON object storing recurrence rules: {day_of_week: 5, frequency: weekly, etc.}';
