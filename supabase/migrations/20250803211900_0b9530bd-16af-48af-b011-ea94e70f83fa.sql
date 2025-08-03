-- Fix RLS policy for public access to approved reviews
DROP POLICY IF EXISTS "Users can view approved reviews" ON public.reviews;

-- Create a policy that allows anyone (including anonymous users) to view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT 
USING (approved = true);

-- Also ensure we can join with profiles and courses for display
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

-- Create another policy specifically for public access
CREATE POLICY "Public can view approved reviews" ON public.reviews
FOR SELECT TO anon, authenticated
USING (approved = true);