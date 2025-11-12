# Apply Phase 4 Migrations - Step by Step Guide

## Issue

The error `relation "public.analytics_preferences" does not exist` means the base table hasn't been
created yet.

## Solution

Apply migrations in the correct order:

### Step 1: Apply Base Analytics Preferences Migration

**Open Supabase Dashboard → SQL Editor**

Copy and paste this SQL:

```sql
-- ============================================================================
-- Migration 1: Create analytics_preferences table
-- From: supabase/migrations/20260111000002_create_analytics_preferences.sql
-- ============================================================================

-- Create analytics_preferences table
CREATE TABLE IF NOT EXISTS public.analytics_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Global settings
    real_time_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_refresh_interval INTEGER NOT NULL DEFAULT 180000 CHECK (auto_refresh_interval >= 120000 AND auto_refresh_interval <= 300000),

    -- Per-page settings
    chatbot_analytics_refresh BOOLEAN NOT NULL DEFAULT true,
    learner_analytics_refresh BOOLEAN NOT NULL DEFAULT true,
    manager_dashboard_refresh BOOLEAN NOT NULL DEFAULT true,

    -- UI preferences
    show_refresh_indicator BOOLEAN NOT NULL DEFAULT true,
    show_real_time_notifications BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one preferences row per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_preferences_user_id
    ON public.analytics_preferences(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_analytics_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_preferences_updated_at
    BEFORE UPDATE ON public.analytics_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_analytics_preferences_updated_at();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_analytics_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.analytics_preferences (
        user_id,
        real_time_enabled,
        auto_refresh_interval,
        chatbot_analytics_refresh,
        learner_analytics_refresh,
        manager_dashboard_refresh,
        show_refresh_indicator,
        show_real_time_notifications
    ) VALUES (
        NEW.id,
        true,
        180000,
        true,
        true,
        true,
        true,
        false
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when user is created
CREATE TRIGGER create_analytics_preferences_on_user_creation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_analytics_preferences();

-- Row Level Security Policies
ALTER TABLE public.analytics_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own analytics preferences"
    ON public.analytics_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own analytics preferences"
    ON public.analytics_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own analytics preferences"
    ON public.analytics_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own analytics preferences"
    ON public.analytics_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create default preferences for existing users
INSERT INTO public.analytics_preferences (
    user_id,
    real_time_enabled,
    auto_refresh_interval,
    chatbot_analytics_refresh,
    learner_analytics_refresh,
    manager_dashboard_refresh,
    show_refresh_indicator,
    show_real_time_notifications
)
SELECT
    id,
    true,
    180000,
    true,
    true,
    true,
    true,
    false
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.analytics_preferences WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE public.analytics_preferences IS 'User preferences for analytics dashboards auto-refresh and real-time updates';
COMMENT ON COLUMN public.analytics_preferences.real_time_enabled IS 'Enable real-time WebSocket subscriptions for immediate updates';
COMMENT ON COLUMN public.analytics_preferences.auto_refresh_interval IS 'Auto-refresh interval in milliseconds (2-5 minutes: 120000-300000)';
```

**Click "Run"** ✅

### Step 2: Verify Table Creation

Run this verification query:

```sql
-- Should return the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_preferences'
ORDER BY ordinal_position;
```

**Expected Result:** You should see columns like `id`, `user_id`, `real_time_enabled`, etc.

### Step 3: Apply Phase 4 Date Range Enhancement

**In the same SQL Editor**, paste this SQL:

```sql
-- ============================================================================
-- Migration 2: Add Date Range Preferences to Analytics
-- From: supabase/migrations/20251112074040_add_date_range_preferences.sql
-- ============================================================================

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
    RETURN true;
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
  DROP CONSTRAINT IF EXISTS check_date_range_format;

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
```

**Click "Run"** ✅

### Step 4: Verify Phase 4 Migration

Run this verification query:

```sql
-- Should show the new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analytics_preferences'
  AND column_name IN ('last_used_date_range', 'comparison_enabled');

-- Should return 2 rows
```

Test the functions:

```sql
-- Test save function (replace with your user ID)
SELECT save_last_used_date_range(
  auth.uid(),
  'last30days',
  '2025-11-12',
  '2025-12-12'
);

-- Verify saved data
SELECT
  user_id,
  last_used_date_range,
  comparison_enabled
FROM analytics_preferences
WHERE user_id = auth.uid();
```

**Expected Result:** You should see your saved date range in JSONB format.

---

## Alternative: Use Supabase CLI

If you prefer using the CLI:

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Apply the base migration first
npx supabase db push --include "20260111000002_create_analytics_preferences.sql"

# Then apply Phase 4 migration
npx supabase db push --include "20251112074040_add_date_range_preferences.sql"
```

---

## Verification Checklist

After applying both migrations:

- [ ] Table `analytics_preferences` exists
- [ ] Column `last_used_date_range` exists (JSONB type)
- [ ] Column `comparison_enabled` exists (BOOLEAN type)
- [ ] Functions exist:
  - `validate_date_range_json()`
  - `get_last_used_date_range()`
  - `save_last_used_date_range()`
  - `toggle_comparison_mode()`
- [ ] Can save and retrieve date range preferences
- [ ] No errors in Supabase logs

---

## Final Verification Query

Run this comprehensive check:

```sql
-- Check table exists
SELECT
  'Table exists' as check_type,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_name = 'analytics_preferences'

UNION ALL

-- Check new columns exist
SELECT
  'Date range columns' as check_type,
  CASE WHEN COUNT(*) = 2 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'analytics_preferences'
  AND column_name IN ('last_used_date_range', 'comparison_enabled')

UNION ALL

-- Check functions exist
SELECT
  'Helper functions' as check_type,
  CASE WHEN COUNT(*) >= 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_proc
WHERE proname IN (
  'validate_date_range_json',
  'get_last_used_date_range',
  'save_last_used_date_range',
  'toggle_comparison_mode'
);
```

**Expected Result:** All rows should show `✅ PASS`

---

## Troubleshooting

### If you get "permission denied" errors:

Make sure you're using the Supabase Dashboard SQL Editor with admin privileges.

### If you get "function already exists" errors:

The migrations use `CREATE OR REPLACE FUNCTION`, so this is safe. It means the function was already
created.

### If constraint check fails:

```sql
-- Remove constraint temporarily
ALTER TABLE analytics_preferences DROP CONSTRAINT IF EXISTS check_date_range_format;

-- Re-add after fixing data
ALTER TABLE analytics_preferences
  ADD CONSTRAINT check_date_range_format
  CHECK (validate_date_range_json(last_used_date_range));
```

---

## Success!

Once both migrations are applied successfully, your Phase 4 features will work:

- ✅ URL parameter persistence
- ✅ Comparison mode
- ✅ Last-used preferences

You can then build and deploy your frontend changes!
