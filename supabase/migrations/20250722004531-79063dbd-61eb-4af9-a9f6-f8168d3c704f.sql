-- Security Fix: Remove dangerous permissive RLS policy and replace with secure policies
DROP POLICY IF EXISTS "Allow all operations for development" ON public.courses;

-- Create secure read-only policy for public course access
CREATE POLICY "Public can view active courses" ON public.courses
  FOR SELECT 
  USING (is_active = true);

-- Add admin policies for future implementation (currently no admin auth system)
-- These will be activated when admin authentication is implemented
CREATE POLICY "Admin can insert courses" ON public.courses
  FOR INSERT 
  WITH CHECK (false); -- Disabled until admin auth is implemented

CREATE POLICY "Admin can update courses" ON public.courses
  FOR UPDATE 
  USING (false); -- Disabled until admin auth is implemented

CREATE POLICY "Admin can delete courses" ON public.courses
  FOR DELETE 
  USING (false); -- Disabled until admin auth is implemented

-- Security Fix: Update database function with proper security configuration
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Ensure function has proper ownership and permissions
ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO postgres, anon, authenticated;