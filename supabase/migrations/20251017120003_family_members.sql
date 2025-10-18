-- ============================================================================
-- FAMILY MEMBERS TABLE
-- ============================================================================
-- Tracks family members associated with a subscription
-- Created: October 17, 2025
-- ============================================================================

-- Create relationship enum
CREATE TYPE family_relationship AS ENUM (
  'self',
  'spouse',
  'partner',
  'child',
  'parent',
  'grandparent',
  'grandchild',
  'sibling',
  'other'
);

-- Create family member status enum
CREATE TYPE family_member_status AS ENUM (
  'pending_invitation',
  'invitation_sent',
  'active',
  'inactive',
  'removed'
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  subscription_id UUID NOT NULL REFERENCES public.membership_subscriptions(id) ON DELETE CASCADE,
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who added them
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null until they accept

  -- Member details
  member_name TEXT NOT NULL,
  member_email TEXT NOT NULL,
  member_age INTEGER CHECK (member_age >= 5 AND member_age <= 120),
  member_date_of_birth DATE,
  relationship family_relationship NOT NULL,
  status family_member_status NOT NULL DEFAULT 'pending_invitation',

  -- Access control
  access_level TEXT NOT NULL DEFAULT 'member' CHECK (access_level IN ('admin', 'member', 'restricted')),
  can_manage_subscription BOOLEAN NOT NULL DEFAULT false,

  -- Invitation tracking
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  invitation_reminders_sent INTEGER DEFAULT 0,

  -- Activity tracking
  last_login_at TIMESTAMP WITH TIME ZONE,
  courses_enrolled_count INTEGER DEFAULT 0,
  courses_completed_count INTEGER DEFAULT 0,
  vault_items_viewed INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE
);

-- Create trigger function to enforce family member limit
CREATE OR REPLACE FUNCTION check_family_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_members INTEGER;
BEGIN
  -- Get the max_family_members from the subscription's plan
  SELECT mp.max_family_members INTO max_members
  FROM membership_subscriptions ms
  JOIN membership_plans mp ON ms.plan_id = mp.id
  WHERE ms.id = NEW.subscription_id;

  -- Count current active family members for this subscription
  SELECT COUNT(*) INTO current_count
  FROM family_members
  WHERE subscription_id = NEW.subscription_id
  AND status IN ('pending_invitation', 'invitation_sent', 'active')
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Check if adding this member would exceed the limit
  IF current_count >= max_members THEN
    RAISE EXCEPTION 'Cannot add family member: subscription limit of % members reached', max_members;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit on INSERT and UPDATE
CREATE TRIGGER enforce_family_member_limit
  BEFORE INSERT OR UPDATE ON public.family_members
  FOR EACH ROW
  WHEN (NEW.status IN ('pending_invitation', 'invitation_sent', 'active'))
  EXECUTE FUNCTION check_family_member_limit();

-- Create indexes
CREATE INDEX idx_family_members_subscription_id ON public.family_members(subscription_id);
CREATE INDEX idx_family_members_primary_user_id ON public.family_members(primary_user_id);
CREATE INDEX idx_family_members_member_user_id ON public.family_members(member_user_id);
CREATE INDEX idx_family_members_status ON public.family_members(status);
CREATE INDEX idx_family_members_invitation_token ON public.family_members(invitation_token);
CREATE INDEX idx_family_members_member_email ON public.family_members(member_email);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Primary users can view own family members"
  ON public.family_members
  FOR SELECT
  USING (auth.uid() = primary_user_id);

CREATE POLICY "Members can view their own record"
  ON public.family_members
  FOR SELECT
  USING (auth.uid() = member_user_id);

CREATE POLICY "Primary users can manage family members"
  ON public.family_members
  FOR ALL
  USING (auth.uid() = primary_user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to add family member
CREATE OR REPLACE FUNCTION public.add_family_member(
  p_subscription_id UUID,
  p_member_name TEXT,
  p_member_email TEXT,
  p_member_age INTEGER,
  p_relationship TEXT,
  p_access_level TEXT DEFAULT 'member'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_member_count INTEGER;
  v_max_members INTEGER;
  v_member_id UUID;
  v_invitation_token TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if subscription belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.membership_subscriptions
    WHERE id = p_subscription_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Subscription not found or access denied';
  END IF;

  -- Get max allowed members for this subscription
  SELECT mp.max_family_members INTO v_max_members
  FROM public.membership_subscriptions ms
  JOIN public.membership_plans mp ON ms.plan_id = mp.id
  WHERE ms.id = p_subscription_id;

  -- Check current member count (including primary user)
  SELECT COUNT(*) + 1 INTO v_member_count
  FROM public.family_members
  WHERE subscription_id = p_subscription_id
  AND status IN ('pending_invitation', 'invitation_sent', 'active');

  IF v_member_count >= v_max_members THEN
    RAISE EXCEPTION 'Maximum family members limit reached (%)', v_max_members;
  END IF;

  -- Generate invitation token
  v_invitation_token := encode(gen_random_bytes(32), 'hex');

  -- Insert family member
  INSERT INTO public.family_members (
    subscription_id,
    primary_user_id,
    member_name,
    member_email,
    member_age,
    relationship,
    access_level,
    invitation_token,
    invitation_sent_at,
    invitation_expires_at,
    status
  ) VALUES (
    p_subscription_id,
    v_user_id,
    p_member_name,
    p_member_email,
    p_member_age,
    p_relationship::family_relationship,
    p_access_level,
    v_invitation_token,
    NOW(),
    NOW() + INTERVAL '7 days',
    'invitation_sent'
  ) RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

-- Function to accept family member invitation
CREATE OR REPLACE FUNCTION public.accept_family_invitation(
  p_invitation_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_member_email TEXT;
  v_user_email TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Find invitation
  SELECT id, member_email INTO v_member_id, v_member_email
  FROM public.family_members
  WHERE invitation_token = p_invitation_token
  AND status = 'invitation_sent'
  AND invitation_expires_at > NOW();

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Verify email matches
  IF LOWER(v_member_email) != LOWER(v_user_email) THEN
    RAISE EXCEPTION 'Invitation email does not match your account email';
  END IF;

  -- Update family member record
  UPDATE public.family_members
  SET
    member_user_id = v_user_id,
    status = 'active',
    invitation_accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = v_member_id;

  RETURN v_member_id;
END;
$$;

-- Function to remove family member
CREATE OR REPLACE FUNCTION public.remove_family_member(
  p_member_id UUID
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

  -- Check if user owns this family member
  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE id = p_member_id AND primary_user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Family member not found or access denied';
  END IF;

  -- Update member status to removed
  UPDATE public.family_members
  SET
    status = 'removed',
    removed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_member_id;
END;
$$;

-- Function to get subscription family members
CREATE OR REPLACE FUNCTION public.get_subscription_family_members(
  p_subscription_id UUID
)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  member_email TEXT,
  member_age INTEGER,
  relationship family_relationship,
  status family_member_status,
  last_login_at TIMESTAMP WITH TIME ZONE,
  courses_enrolled_count INTEGER,
  courses_completed_count INTEGER,
  vault_items_viewed INTEGER,
  events_attended INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.membership_subscriptions
    WHERE id = p_subscription_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Subscription not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    fm.id AS member_id,
    fm.member_name,
    fm.member_email,
    fm.member_age,
    fm.relationship,
    fm.status,
    fm.last_login_at,
    fm.courses_enrolled_count,
    fm.courses_completed_count,
    fm.vault_items_viewed,
    fm.events_attended,
    fm.created_at
  FROM public.family_members fm
  WHERE fm.subscription_id = p_subscription_id
  AND fm.status IN ('pending_invitation', 'invitation_sent', 'active')
  ORDER BY fm.created_at ASC;
END;
$$;

-- Function to sync family member activity stats
CREATE OR REPLACE FUNCTION public.sync_family_member_stats(
  p_member_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.family_members fm
  SET
    courses_enrolled_count = (
      SELECT COUNT(*) FROM public.enrollments
      WHERE user_id = p_member_user_id
    ),
    courses_completed_count = (
      SELECT COUNT(*) FROM public.enrollments
      WHERE user_id = p_member_user_id
      AND completion_percentage >= 100
    ),
    vault_items_viewed = (
      SELECT COUNT(DISTINCT content_id)
      FROM public.vault_content_access_log
      WHERE user_id = p_member_user_id
      AND action_type = 'view'
    ),
    last_login_at = (
      SELECT MAX(created_at) FROM public.profiles
      WHERE id = p_member_user_id
    ),
    updated_at = NOW()
  WHERE member_user_id = p_member_user_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_family_member_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_family_member_timestamp
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_family_member_timestamp();

-- Add comments
COMMENT ON TABLE public.family_members IS 'Tracks family members associated with a membership subscription';
COMMENT ON COLUMN public.family_members.primary_user_id IS 'User who owns the subscription and added this family member';
COMMENT ON COLUMN public.family_members.member_user_id IS 'Linked user account (null until invitation accepted)';
COMMENT ON COLUMN public.family_members.access_level IS 'Permission level: admin (can manage subscription), member (normal access), restricted (limited access)';
COMMENT ON FUNCTION public.add_family_member IS 'Adds a family member to a subscription and generates invitation';
COMMENT ON FUNCTION public.accept_family_invitation IS 'Accepts family invitation and links user account';
COMMENT ON FUNCTION public.remove_family_member IS 'Removes a family member from subscription';
COMMENT ON FUNCTION public.get_subscription_family_members IS 'Returns all family members for a subscription';
COMMENT ON FUNCTION public.sync_family_member_stats IS 'Updates activity statistics for a family member';
