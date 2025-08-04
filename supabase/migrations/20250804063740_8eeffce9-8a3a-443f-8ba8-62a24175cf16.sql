-- Add display column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN display boolean NOT NULL DEFAULT true;

-- Add display column to events table  
ALTER TABLE public.events
ADD COLUMN display boolean NOT NULL DEFAULT true;

-- Update RLS policies to filter by display column for reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved and displayed reviews" 
ON public.reviews 
FOR SELECT 
USING (approved = true AND display = true);

-- Update RLS policies to filter by display column for events
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

CREATE POLICY "Anyone can view active and displayed events" 
ON public.events 
FOR SELECT 
USING (is_active = true AND display = true);