-- Add is_past column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_past BOOLEAN NOT NULL DEFAULT false;

-- Create event_photos table for storing event photos
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

-- Enable Row Level Security
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for event_photos
CREATE POLICY "Anyone can view event photos"
ON public.event_photos
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage event photos"
ON public.event_photos
FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Create storage bucket for event photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event photos
CREATE POLICY "Anyone can view event photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

CREATE POLICY "Admins can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos'
  AND auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admins can update event photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-photos'
  AND auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admins can delete event photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos'
  AND auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- Update existing RLS policy to include past events
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

CREATE POLICY "Anyone can view active or past events"
ON public.events
FOR SELECT
USING (is_active = true OR is_past = true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_past ON public.events(is_past);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_display_order ON public.event_photos(display_order);

-- Add comment for documentation
COMMENT ON COLUMN public.events.is_past IS 'Indicates if the event is a past event with photos';
COMMENT ON TABLE public.event_photos IS 'Stores photos for past events';
