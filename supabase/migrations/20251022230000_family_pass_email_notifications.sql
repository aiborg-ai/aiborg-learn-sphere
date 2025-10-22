-- ============================================================================
-- FAMILY PASS EMAIL NOTIFICATIONS
-- ============================================================================
-- Automatic email notifications for Family Pass admin grant events
-- Created: October 22, 2025
-- ============================================================================

-- Update notification preferences to include Family Pass types
DO $$
BEGIN
  -- Add Family Pass notification preferences to existing profiles
  UPDATE public.profiles
  SET notification_preferences = jsonb_set(
    COALESCE(notification_preferences, '{}'::jsonb),
    '{family_pass_granted}',
    'true'::jsonb,
    true
  );

  UPDATE public.profiles
  SET notification_preferences = jsonb_set(
    notification_preferences,
    '{family_pass_revoked}',
    'true'::jsonb,
    true
  );

  UPDATE public.profiles
  SET notification_preferences = jsonb_set(
    notification_preferences,
    '{family_pass_expiring}',
    'true'::jsonb,
    true
  );

  UPDATE public.profiles
  SET notification_preferences = jsonb_set(
    notification_preferences,
    '{family_pass_extended}',
    'true'::jsonb,
    true
  );
END$$;

-- ============================================================================
-- NOTIFICATION HELPER FUNCTIONS
-- ============================================================================

-- Function to send Family Pass granted email
CREATE OR REPLACE FUNCTION public.send_family_pass_granted_email(
  p_grant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_notes TEXT;
BEGIN
  -- Get grant and user details
  SELECT
    u.email,
    COALESCE(p.display_name, u.email),
    TO_CHAR(g.start_date, 'Mon DD, YYYY'),
    TO_CHAR(g.end_date, 'Mon DD, YYYY'),
    g.notes
  INTO v_user_email, v_user_name, v_start_date, v_end_date, v_notes
  FROM public.admin_family_pass_grants g
  JOIN auth.users u ON g.user_id = u.id
  LEFT JOIN public.profiles p ON g.user_id = p.id
  WHERE g.id = p_grant_id;

  -- Send email via edge function
  PERFORM public.send_email_notification(
    v_user_email,
    'family_pass_granted',
    jsonb_build_object(
      'userName', v_user_name,
      'startDate', v_start_date,
      'endDate', v_end_date,
      'notes', v_notes,
      'dashboardUrl', current_setting('app.settings.frontend_url', true) || '/dashboard',
      'coursesUrl', current_setting('app.settings.frontend_url', true) || '/courses'
    )
  );
END;
$$;

-- Function to send Family Pass revoked email
CREATE OR REPLACE FUNCTION public.send_family_pass_revoked_email(
  p_grant_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_revoked_date TEXT;
BEGIN
  -- Get grant and user details
  SELECT
    u.email,
    COALESCE(p.display_name, u.email),
    TO_CHAR(NOW(), 'Mon DD, YYYY')
  INTO v_user_email, v_user_name, v_revoked_date
  FROM public.admin_family_pass_grants g
  JOIN auth.users u ON g.user_id = u.id
  LEFT JOIN public.profiles p ON g.user_id = p.id
  WHERE g.id = p_grant_id;

  -- Send email
  PERFORM public.send_email_notification(
    v_user_email,
    'family_pass_revoked',
    jsonb_build_object(
      'userName', v_user_name,
      'revokedDate', v_revoked_date,
      'reason', p_reason,
      'dashboardUrl', current_setting('app.settings.frontend_url', true) || '/dashboard',
      'coursesUrl', current_setting('app.settings.frontend_url', true) || '/courses',
      'membershipUrl', current_setting('app.settings.frontend_url', true) || '/family-membership'
    )
  );
END;
$$;

-- Function to send Family Pass extended email
CREATE OR REPLACE FUNCTION public.send_family_pass_extended_email(
  p_grant_id UUID,
  p_previous_end_date TIMESTAMP WITH TIME ZONE,
  p_new_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_previous_end TEXT;
  v_new_end TEXT;
  v_additional_days INTEGER;
  v_notes TEXT;
BEGIN
  -- Get grant and user details
  SELECT
    u.email,
    COALESCE(p.display_name, u.email),
    TO_CHAR(p_previous_end_date, 'Mon DD, YYYY'),
    TO_CHAR(p_new_end_date, 'Mon DD, YYYY'),
    EXTRACT(DAY FROM (p_new_end_date - p_previous_end_date))::INTEGER,
    g.notes
  INTO v_user_email, v_user_name, v_previous_end, v_new_end, v_additional_days, v_notes
  FROM public.admin_family_pass_grants g
  JOIN auth.users u ON g.user_id = u.id
  LEFT JOIN public.profiles p ON g.user_id = p.id
  WHERE g.id = p_grant_id;

  -- Send email
  PERFORM public.send_email_notification(
    v_user_email,
    'family_pass_extended',
    jsonb_build_object(
      'userName', v_user_name,
      'previousEndDate', v_previous_end,
      'newEndDate', v_new_end,
      'additionalDays', v_additional_days,
      'notes', v_notes,
      'dashboardUrl', current_setting('app.settings.frontend_url', true) || '/dashboard',
      'coursesUrl', current_setting('app.settings.frontend_url', true) || '/courses'
    )
  );
END;
$$;

-- Function to send expiring warning emails (call via cron)
CREATE OR REPLACE FUNCTION public.send_family_pass_expiring_emails()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grant RECORD;
  v_sent_count INTEGER := 0;
  v_days_remaining INTEGER;
BEGIN
  -- Find grants expiring in 7 days
  FOR v_grant IN
    SELECT
      g.id,
      g.user_id,
      g.end_date,
      u.email,
      COALESCE(p.display_name, u.email) as user_name,
      EXTRACT(DAY FROM (g.end_date - NOW()))::INTEGER as days_remaining
    FROM public.admin_family_pass_grants g
    JOIN auth.users u ON g.user_id = u.id
    LEFT JOIN public.profiles p ON g.user_id = p.id
    WHERE g.status = 'active'
    AND g.end_date > NOW()
    AND g.end_date <= NOW() + INTERVAL '7 days'
    -- Only send once per grant (check if already sent in last 8 days)
    AND NOT EXISTS (
      SELECT 1 FROM public.email_notifications_log
      WHERE user_email = u.email
      AND notification_type = 'family_pass_expiring'
      AND sent_at > NOW() - INTERVAL '8 days'
    )
  LOOP
    -- Send email
    PERFORM public.send_email_notification(
      v_grant.email,
      'family_pass_expiring',
      jsonb_build_object(
        'userName', v_grant.user_name,
        'daysRemaining', v_grant.days_remaining,
        'expiryDate', TO_CHAR(v_grant.end_date, 'Mon DD, YYYY'),
        'dashboardUrl', current_setting('app.settings.frontend_url', true) || '/dashboard',
        'coursesUrl', current_setting('app.settings.frontend_url', true) || '/courses',
        'coursesInProgress', true,
        'enrolledCourses', (SELECT COUNT(*) FROM public.enrollments WHERE user_id = v_grant.user_id),
        'completedCourses', (SELECT COUNT(*) FROM public.enrollments WHERE user_id = v_grant.user_id AND completion_percentage >= 100),
        'inProgressCourses', (SELECT COUNT(*) FROM public.enrollments WHERE user_id = v_grant.user_id AND completion_percentage > 0 AND completion_percentage < 100)
      )
    );

    v_sent_count := v_sent_count + 1;
  END LOOP;

  RETURN v_sent_count;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ============================================================================

-- Trigger function for new grant
CREATE OR REPLACE FUNCTION public.trigger_family_pass_granted_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only send email if grant is active
  IF NEW.status = 'active' THEN
    -- Send email asynchronously (don't block the transaction)
    PERFORM public.send_family_pass_granted_email(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for revoked grant
CREATE OR REPLACE FUNCTION public.trigger_family_pass_revoked_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reason TEXT;
BEGIN
  -- Only send email if status changed from active to inactive
  IF OLD.status = 'active' AND NEW.status = 'inactive' THEN
    -- Extract reason from notes if available
    v_reason := COALESCE(NEW.notes, 'Administrative decision');

    -- Send email asynchronously
    PERFORM public.send_family_pass_revoked_email(NEW.id, v_reason);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for extended grant
CREATE OR REPLACE FUNCTION public.trigger_family_pass_extended_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only send email if end_date was extended (and status is still active)
  IF NEW.status = 'active' AND OLD.end_date < NEW.end_date THEN
    -- Send email asynchronously
    PERFORM public.send_family_pass_extended_email(NEW.id, OLD.end_date, NEW.end_date);
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_send_family_pass_granted_email
  AFTER INSERT ON public.admin_family_pass_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_family_pass_granted_email();

CREATE TRIGGER trigger_send_family_pass_revoked_email
  AFTER UPDATE ON public.admin_family_pass_grants
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_family_pass_revoked_email();

CREATE TRIGGER trigger_send_family_pass_extended_email
  AFTER UPDATE ON public.admin_family_pass_grants
  FOR EACH ROW
  WHEN (OLD.end_date IS DISTINCT FROM NEW.end_date)
  EXECUTE FUNCTION public.trigger_family_pass_extended_email();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.send_family_pass_granted_email IS
  'Sends welcome email when admin grants Family Pass access to a user';

COMMENT ON FUNCTION public.send_family_pass_revoked_email IS
  'Sends notification email when admin revokes Family Pass access';

COMMENT ON FUNCTION public.send_family_pass_extended_email IS
  'Sends congratulations email when admin extends Family Pass dates';

COMMENT ON FUNCTION public.send_family_pass_expiring_emails IS
  'Cron function: Sends expiring warning emails 7 days before expiration';
