-- Email Notifications System Migration

-- Add email notification columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "course_enrollment": true,
  "assignment_due": true,
  "assignment_graded": true,
  "course_update": true,
  "new_announcement": true,
  "deadline_reminder": true,
  "certificate_ready": true,
  "discussion_reply": true
}'::jsonb;

-- Create email notifications log table
CREATE TABLE IF NOT EXISTS public.email_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  email_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_log_user_email ON public.email_notifications_log(user_email);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON public.email_notifications_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON public.email_notifications_log(notification_type);

-- Enable RLS
ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_notifications_log
CREATE POLICY "Users can view their own email logs"
  ON public.email_notifications_log
  FOR SELECT
  TO authenticated
  USING (user_email = auth.email());

CREATE POLICY "Service role can insert email logs"
  ON public.email_notifications_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create function to send email notification
CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_user_email TEXT,
  p_type TEXT,
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Call the edge function via HTTP
  SELECT content::jsonb INTO v_result
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/send-email-notification',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'))],
    'application/json',
    jsonb_build_object(
      'to', p_user_email,
      'type', p_type,
      'data', p_data
    )::text
  )::http_request);

  RETURN v_result;
END;
$$;

-- Create function to automatically send enrollment email
CREATE OR REPLACE FUNCTION public.send_enrollment_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_course_name TEXT;
  v_course_duration TEXT;
  v_instructor_name TEXT;
BEGIN
  -- Get user email and name
  SELECT email, display_name INTO v_user_email, v_user_name
  FROM auth.users
  JOIN public.profiles ON auth.users.id = public.profiles.id
  WHERE auth.users.id = NEW.user_id;

  -- Get course details
  SELECT title, duration INTO v_course_name, v_course_duration
  FROM public.courses
  WHERE id = NEW.course_id;

  -- Get instructor name (placeholder)
  v_instructor_name := 'Aiborg Team';

  -- Send email notification
  PERFORM public.send_email_notification(
    v_user_email,
    'course_enrollment',
    jsonb_build_object(
      'studentName', COALESCE(v_user_name, 'Student'),
      'courseName', v_course_name,
      'instructorName', v_instructor_name,
      'duration', COALESCE(v_course_duration, 'Self-paced'),
      'startDate', NEW.enrolled_at::date::text,
      'courseUrl', current_setting('app.settings.app_url') || '/course/' || NEW.course_id,
      'dashboardUrl', current_setting('app.settings.app_url') || '/dashboard',
      'settingsUrl', current_setting('app.settings.app_url') || '/profile#notifications'
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for enrollment emails (commented out - enable after testing)
-- DROP TRIGGER IF EXISTS on_enrollment_send_email ON public.enrollments;
-- CREATE TRIGGER on_enrollment_send_email
--   AFTER INSERT ON public.enrollments
--   FOR EACH ROW
--   EXECUTE FUNCTION public.send_enrollment_email();

-- Comment out the trigger by default to avoid sending emails during development
COMMENT ON FUNCTION public.send_enrollment_email() IS 'Trigger function to send enrollment confirmation emails. Enable the trigger in production.';
