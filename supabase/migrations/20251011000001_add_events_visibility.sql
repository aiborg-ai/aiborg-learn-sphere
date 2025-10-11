-- Add is_visible column to events table for better visibility control
-- This allows admins to hide events from public view without deactivating them

-- Add the is_visible column (defaults to true for existing events)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Update the RLS policy to check both is_active AND is_visible
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

CREATE POLICY "Anyone can view active and visible events"
ON public.events
FOR SELECT
USING (is_active = true AND is_visible = true);

-- Ensure admins can still see all events (including hidden ones)
-- The existing "Admins can manage events" policy already covers this

-- Add helpful comment
COMMENT ON COLUMN public.events.is_visible IS 'Controls whether event is visible to public. Admins can still see all events.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(is_active, is_visible) WHERE is_active = true AND is_visible = true;
