-- =====================================================================
-- PRODUCTION MIGRATION: Add is_past and is_visible columns to events
-- =====================================================================
-- Run this ONCE in your Production Supabase SQL Editor
-- This combines migrations: 20251009000000 + 20251011000001
-- =====================================================================

-- Step 1: Add is_past column (if not exists)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_past BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Add is_visible column (if not exists)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Step 3: Create event_photos table (if not exists)
CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Enable Row Level Security on event_photos
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop old RLS policies (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view active or past events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view active and visible events" ON public.events;

-- Step 6: Create NEW RLS policy that checks all conditions
CREATE POLICY "Public can view active visible or past events"
ON public.events
FOR SELECT
USING (
  (is_active = true AND is_visible = true) OR
  (is_past = true AND is_visible = true)
);

-- Step 7: Create policies for event_photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_photos'
    AND policyname = 'Anyone can view event photos'
  ) THEN
    CREATE POLICY "Anyone can view event photos"
    ON public.event_photos
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'event_photos'
    AND policyname = 'Admins can manage event photos'
  ) THEN
    CREATE POLICY "Admins can manage event photos"
    ON public.event_photos
    FOR ALL
    USING (auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ));
  END IF;
END $$;

-- Step 8: Create storage bucket for event photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Create storage policies for event photos (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname = 'Anyone can view event photos'
  ) THEN
    CREATE POLICY "Anyone can view event photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname = 'Admins can upload event photos'
  ) THEN
    CREATE POLICY "Admins can upload event photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'event-photos'
      AND auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname = 'Admins can update event photos'
  ) THEN
    CREATE POLICY "Admins can update event photos"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'event-photos'
      AND auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname = 'Admins can delete event photos'
  ) THEN
    CREATE POLICY "Admins can delete event photos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'event-photos'
      AND auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
    );
  END IF;
END $$;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_is_past ON public.events(is_past);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(is_active, is_visible)
  WHERE is_active = true AND is_visible = true;
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_display_order ON public.event_photos(display_order);

-- Step 11: Add helpful comments
COMMENT ON COLUMN public.events.is_past IS 'Indicates if the event is a past event with photos';
COMMENT ON COLUMN public.events.is_visible IS 'Controls whether event is visible to public. Admins can still see all events.';
COMMENT ON TABLE public.event_photos IS 'Stores photos for past events';

-- =====================================================================
-- VERIFICATION QUERY (run after migration completes)
-- =====================================================================
-- SELECT
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'events'
--   AND column_name IN ('is_past', 'is_visible')
-- ORDER BY column_name;
-- =====================================================================
