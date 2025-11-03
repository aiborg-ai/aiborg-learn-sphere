-- ============================================================================
-- Make All Active Events Visible
-- ============================================================================
-- Problem: All events have is_visible = false, so they don't show on website
-- Solution: Set is_visible = true for all active events
-- ============================================================================

-- First, check current status
SELECT
  'BEFORE UPDATE' as status,
  COUNT(*) as total_events,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_events,
  SUM(CASE WHEN is_visible = true THEN 1 ELSE 0 END) as visible_events,
  SUM(CASE WHEN is_active = true AND is_visible = true THEN 1 ELSE 0 END) as active_and_visible
FROM public.events;

-- Update all active events to be visible
UPDATE public.events
SET
  is_visible = true,
  updated_at = NOW()
WHERE is_active = true;

-- Check results after update
SELECT
  'AFTER UPDATE' as status,
  COUNT(*) as total_events,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_events,
  SUM(CASE WHEN is_visible = true THEN 1 ELSE 0 END) as visible_events,
  SUM(CASE WHEN is_active = true AND is_visible = true THEN 1 ELSE 0 END) as active_and_visible
FROM public.events;

-- Show first 5 events that are now visible
SELECT
  id,
  title,
  event_date,
  is_active,
  is_visible,
  CASE
    WHEN is_active = true AND is_visible = true THEN '✓ Will show on website'
    WHEN is_active = true AND is_visible = false THEN '✗ Active but hidden'
    WHEN is_active = false THEN '✗ Inactive'
  END as display_status
FROM public.events
WHERE is_active = true
ORDER BY event_date
LIMIT 5;

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- BEFORE UPDATE: active_and_visible should be 0
-- AFTER UPDATE: active_and_visible should equal active_events
-- Sample events should show "✓ Will show on website"
-- ============================================================================
