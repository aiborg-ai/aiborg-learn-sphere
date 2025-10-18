-- ============================================================================
-- EVENT INVITATIONS & MEMBERSHIP EVENT ACCESS
-- ============================================================================
-- Tracks event access and invitations for membership holders
-- Created: October 17, 2025
-- ============================================================================

-- Create attendance status enum
CREATE TYPE event_attendance_status AS ENUM (
  'invited',
  'registered',
  'confirmed',
  'attended',
  'missed',
  'cancelled'
);

-- Create event_invitations table
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  event_id UUID NOT NULL, -- References events table (assuming it exists)
  subscription_id UUID NOT NULL REFERENCES public.membership_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Invitation details
  invited_by UUID REFERENCES auth.users(id),
  invitation_type TEXT NOT NULL DEFAULT 'member_exclusive' CHECK (
    invitation_type IN ('member_exclusive', 'priority_access', 'early_bird', 'vip', 'family_invite')
  ),

  -- Attendance tracking
  attendance_status event_attendance_status NOT NULL DEFAULT 'invited',
  registered_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  attended_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  -- Ticket/Access details
  ticket_number TEXT UNIQUE,
  access_code TEXT,
  is_free_for_member BOOLEAN NOT NULL DEFAULT true,
  member_discount_percentage INTEGER DEFAULT 100 CHECK (member_discount_percentage >= 0 AND member_discount_percentage <= 100),

  -- Reminder tracking
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,

  -- Feedback
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_event_invitation UNIQUE (user_id, event_id)
);

-- Create indexes
CREATE INDEX idx_event_invitations_event_id ON public.event_invitations(event_id);
CREATE INDEX idx_event_invitations_subscription_id ON public.event_invitations(subscription_id);
CREATE INDEX idx_event_invitations_user_id ON public.event_invitations(user_id);
CREATE INDEX idx_event_invitations_attendance_status ON public.event_invitations(attendance_status);
CREATE INDEX idx_event_invitations_ticket_number ON public.event_invitations(ticket_number);

-- Enable RLS
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own event invitations"
  ON public.event_invitations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own event invitations"
  ON public.event_invitations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MEMBERSHIP EVENT BENEFITS
-- ============================================================================
-- Tracks what event benefits each membership plan includes

CREATE TABLE IF NOT EXISTS public.membership_event_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,

  -- Benefit details
  benefit_type TEXT NOT NULL CHECK (
    benefit_type IN ('free_monthly_seminars', 'priority_registration', 'member_discount', 'exclusive_events', 'vip_access')
  ),
  benefit_description TEXT NOT NULL,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  max_events_per_month INTEGER,
  early_access_hours INTEGER DEFAULT 24, -- Hours before public registration opens

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_plan_benefit_type UNIQUE (plan_id, benefit_type)
);

-- Create indexes
CREATE INDEX idx_membership_event_benefits_plan_id ON public.membership_event_benefits(plan_id);
CREATE INDEX idx_membership_event_benefits_benefit_type ON public.membership_event_benefits(benefit_type);

-- Enable RLS
ALTER TABLE public.membership_event_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view active benefits
CREATE POLICY "Anyone can view active event benefits"
  ON public.membership_event_benefits
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create event invitation for member
CREATE OR REPLACE FUNCTION public.create_member_event_invitation(
  p_event_id UUID,
  p_invitation_type TEXT DEFAULT 'member_exclusive'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_id UUID;
  v_invitation_id UUID;
  v_ticket_number TEXT;
  v_access_code TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user has active membership
  SELECT id INTO v_subscription_id
  FROM public.membership_subscriptions
  WHERE user_id = v_user_id
  AND status IN ('trialing', 'active')
  AND (
    (trial_end IS NOT NULL AND trial_end > NOW())
    OR (current_period_end IS NOT NULL AND current_period_end > NOW())
  )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RAISE EXCEPTION 'No active membership found';
  END IF;

  -- Generate ticket number and access code
  v_ticket_number := 'TKT-' || UPPER(substring(encode(gen_random_bytes(6), 'hex'), 1, 12));
  v_access_code := UPPER(substring(encode(gen_random_bytes(4), 'hex'), 1, 8));

  -- Create invitation
  INSERT INTO public.event_invitations (
    event_id,
    subscription_id,
    user_id,
    invitation_type,
    attendance_status,
    ticket_number,
    access_code,
    is_free_for_member
  ) VALUES (
    p_event_id,
    v_subscription_id,
    v_user_id,
    p_invitation_type,
    'invited',
    v_ticket_number,
    v_access_code,
    true
  )
  ON CONFLICT (user_id, event_id) DO UPDATE
  SET
    attendance_status = 'invited',
    updated_at = NOW()
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$;

-- Function to register for event
CREATE OR REPLACE FUNCTION public.register_for_member_event(
  p_event_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_invitation_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find or create invitation
  SELECT id INTO v_invitation_id
  FROM public.event_invitations
  WHERE user_id = v_user_id
  AND event_id = p_event_id;

  IF v_invitation_id IS NULL THEN
    -- Create invitation first
    v_invitation_id := public.create_member_event_invitation(p_event_id);
  END IF;

  -- Update to registered status
  UPDATE public.event_invitations
  SET
    attendance_status = 'registered',
    registered_at = NOW(),
    updated_at = NOW()
  WHERE id = v_invitation_id;

  RETURN v_invitation_id;
END;
$$;

-- Function to mark attendance
CREATE OR REPLACE FUNCTION public.mark_event_attendance(
  p_event_id UUID,
  p_user_id UUID,
  p_attended BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.event_invitations
  SET
    attendance_status = CASE WHEN p_attended THEN 'attended' ELSE 'missed' END,
    attended_at = CASE WHEN p_attended THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  AND event_id = p_event_id;

  -- Update family member stats if applicable
  IF p_attended THEN
    UPDATE public.family_members
    SET events_attended = events_attended + 1
    WHERE member_user_id = p_user_id;
  END IF;
END;
$$;

-- Function to get member event statistics
CREATE OR REPLACE FUNCTION public.get_member_event_stats(
  p_user_id UUID
)
RETURNS TABLE (
  total_invitations INTEGER,
  total_registered INTEGER,
  total_attended INTEGER,
  total_missed INTEGER,
  attendance_rate DECIMAL,
  upcoming_events INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_invitations,
    COUNT(*) FILTER (WHERE attendance_status IN ('registered', 'confirmed', 'attended'))::INTEGER AS total_registered,
    COUNT(*) FILTER (WHERE attendance_status = 'attended')::INTEGER AS total_attended,
    COUNT(*) FILTER (WHERE attendance_status = 'missed')::INTEGER AS total_missed,
    CASE
      WHEN COUNT(*) FILTER (WHERE attendance_status IN ('registered', 'confirmed', 'attended')) > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE attendance_status = 'attended')::DECIMAL /
        COUNT(*) FILTER (WHERE attendance_status IN ('registered', 'confirmed', 'attended'))::DECIMAL * 100,
        2
      )
      ELSE 0.00
    END AS attendance_rate,
    COUNT(*) FILTER (WHERE attendance_status IN ('invited', 'registered', 'confirmed'))::INTEGER AS upcoming_events
  FROM public.event_invitations
  WHERE user_id = p_user_id;
END;
$$;

-- Function to submit event feedback
CREATE OR REPLACE FUNCTION public.submit_event_feedback(
  p_event_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Update invitation with feedback
  UPDATE public.event_invitations
  SET
    feedback_rating = p_rating,
    feedback_comment = p_comment,
    feedback_submitted_at = NOW(),
    updated_at = NOW()
  WHERE user_id = v_user_id
  AND event_id = p_event_id
  AND attendance_status = 'attended';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event invitation not found or event not attended';
  END IF;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_event_invitation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_event_invitation_timestamp
  BEFORE UPDATE ON public.event_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_invitation_timestamp();

-- ============================================================================
-- INSERT DEFAULT EVENT BENEFITS FOR FAMILY PASS
-- ============================================================================

INSERT INTO public.membership_event_benefits (plan_id, benefit_type, benefit_description, discount_percentage, max_events_per_month, early_access_hours)
SELECT
  id,
  'free_monthly_seminars',
  'Free access to all monthly seminars and workshops',
  100,
  NULL,
  48
FROM public.membership_plans
WHERE slug = 'family-pass'

UNION ALL

SELECT
  id,
  'priority_registration',
  'Register 48 hours before public registration opens',
  0,
  NULL,
  48
FROM public.membership_plans
WHERE slug = 'family-pass'

UNION ALL

SELECT
  id,
  'member_discount',
  '50% discount on premium conferences and special events',
  50,
  NULL,
  24
FROM public.membership_plans
WHERE slug = 'family-pass'

UNION ALL

SELECT
  id,
  'exclusive_events',
  'Access to member-only networking events and masterclasses',
  100,
  2,
  NULL
FROM public.membership_plans
WHERE slug = 'family-pass';

-- Add comments
COMMENT ON TABLE public.event_invitations IS 'Tracks event invitations and attendance for membership holders';
COMMENT ON TABLE public.membership_event_benefits IS 'Defines what event benefits each membership plan includes';
COMMENT ON COLUMN public.event_invitations.is_free_for_member IS 'Whether the event is free for this member (based on their plan benefits)';
COMMENT ON COLUMN public.event_invitations.member_discount_percentage IS 'Discount percentage applied to paid events (100 = free)';
COMMENT ON FUNCTION public.create_member_event_invitation IS 'Creates event invitation for member with ticket number and access code';
COMMENT ON FUNCTION public.register_for_member_event IS 'Registers user for an event and updates invitation status';
COMMENT ON FUNCTION public.mark_event_attendance IS 'Marks whether user attended event and updates family member stats';
COMMENT ON FUNCTION public.get_member_event_stats IS 'Returns aggregated event statistics for a user';
COMMENT ON FUNCTION public.submit_event_feedback IS 'Allows user to submit rating and feedback for attended event';
