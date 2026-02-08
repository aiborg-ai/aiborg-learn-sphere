-- Add guest fields to reviews table for public (no-login) reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Make user_id nullable so guest reviews don't need a user account
ALTER TABLE public.reviews
  ALTER COLUMN user_id DROP NOT NULL;

-- Create RPC function for anonymous public review submission
-- Uses SECURITY DEFINER to bypass RLS (same pattern as insert_contact_message_simple)
CREATE OR REPLACE FUNCTION public.submit_public_review(
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_course_id INTEGER,
  p_written_review TEXT,
  p_rating INTEGER,
  p_course_period TEXT,
  p_course_mode TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review_id UUID;
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Validate required fields
  IF p_guest_name IS NULL OR trim(p_guest_name) = '' THEN
    RAISE EXCEPTION 'Guest name is required';
  END IF;

  IF p_guest_email IS NULL OR trim(p_guest_email) = '' THEN
    RAISE EXCEPTION 'Guest email is required';
  END IF;

  IF p_written_review IS NULL OR length(trim(p_written_review)) < 20 THEN
    RAISE EXCEPTION 'Review must be at least 20 characters';
  END IF;

  INSERT INTO public.reviews (
    user_id,
    guest_name,
    guest_email,
    course_id,
    written_review,
    rating,
    course_period,
    course_mode,
    approved,
    display,
    review_type,
    display_name_option
  ) VALUES (
    NULL,
    trim(p_guest_name),
    trim(p_guest_email),
    p_course_id,
    trim(p_written_review),
    p_rating,
    p_course_period,
    p_course_mode,
    false,
    true,
    'written',
    'full_name'
  )
  RETURNING id INTO v_review_id;

  RETURN json_build_object('id', v_review_id, 'success', true);
END;
$$;

-- Grant execute to anon and public roles so unauthenticated users can call it
GRANT EXECUTE ON FUNCTION public.submit_public_review(TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_review(TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT, TEXT) TO public;
