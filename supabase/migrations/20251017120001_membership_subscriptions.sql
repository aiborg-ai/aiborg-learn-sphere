-- ============================================================================
-- MEMBERSHIP SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks user subscriptions to membership plans
-- Created: October 17, 2025
-- ============================================================================

-- Create subscription status enum type
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
  'incomplete',
  'incomplete_expired'
);

-- Create membership_subscriptions table
CREATE TABLE IF NOT EXISTS public.membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,

  -- Stripe details
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,

  -- Subscription status
  status subscription_status NOT NULL DEFAULT 'incomplete',

  -- Billing periods
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Cancellation
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancellation_feedback TEXT,

  -- Pause functionality
  paused_at TIMESTAMP WITH TIME ZONE,
  pause_reason TEXT,
  resume_at TIMESTAMP WITH TIME ZONE,

  -- Payment details
  payment_method_last4 TEXT,
  payment_method_brand TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_active_subscription UNIQUE (user_id, status)
    WHERE status IN ('trialing', 'active')
);

-- Create indexes
CREATE INDEX idx_membership_subscriptions_user_id ON public.membership_subscriptions(user_id);
CREATE INDEX idx_membership_subscriptions_plan_id ON public.membership_subscriptions(plan_id);
CREATE INDEX idx_membership_subscriptions_status ON public.membership_subscriptions(status);
CREATE INDEX idx_membership_subscriptions_stripe_subscription_id ON public.membership_subscriptions(stripe_subscription_id);
CREATE INDEX idx_membership_subscriptions_current_period_end ON public.membership_subscriptions(current_period_end);

-- Enable RLS
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions"
  ON public.membership_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.membership_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.membership_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has active membership
CREATE OR REPLACE FUNCTION public.check_membership_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.membership_subscriptions
    WHERE user_id = p_user_id
    AND status IN ('trialing', 'active')
    AND (
      (trial_end IS NOT NULL AND trial_end > NOW())
      OR (current_period_end IS NOT NULL AND current_period_end > NOW())
    )
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$;

-- Function to get active subscription for user
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  status subscription_status,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  max_family_members INTEGER,
  includes_vault_access BOOLEAN,
  includes_event_access BOOLEAN,
  includes_all_courses BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.id AS subscription_id,
    mp.name AS plan_name,
    ms.status,
    ms.current_period_end,
    ms.trial_end,
    ms.cancel_at_period_end,
    mp.max_family_members,
    mp.includes_vault_access,
    mp.includes_event_access,
    mp.includes_all_courses
  FROM public.membership_subscriptions ms
  JOIN public.membership_plans mp ON ms.plan_id = mp.id
  WHERE ms.user_id = p_user_id
  AND ms.status IN ('trialing', 'active')
  AND (
    (ms.trial_end IS NOT NULL AND ms.trial_end > NOW())
    OR (ms.current_period_end IS NOT NULL AND ms.current_period_end > NOW())
  )
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to calculate family savings
CREATE OR REPLACE FUNCTION public.calculate_family_savings(
  p_num_members INTEGER DEFAULT 4,
  p_courses_per_member INTEGER DEFAULT 1,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  individual_cost DECIMAL,
  family_pass_cost DECIMAL,
  monthly_savings DECIMAL,
  annual_savings DECIMAL,
  roi_percentage DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_course_price DECIMAL := 49.00;
  v_family_pass_price DECIMAL := 20.00;
  v_individual_monthly DECIMAL;
  v_family_monthly DECIMAL;
BEGIN
  -- Calculate costs
  v_individual_monthly := v_course_price * p_num_members * p_courses_per_member;
  v_family_monthly := v_family_pass_price;

  RETURN QUERY
  SELECT
    v_individual_monthly AS individual_cost,
    v_family_monthly AS family_pass_cost,
    (v_individual_monthly - v_family_monthly) AS monthly_savings,
    ((v_individual_monthly - v_family_monthly) * p_months) AS annual_savings,
    ROUND(((v_individual_monthly - v_family_monthly) / v_family_monthly * 100), 2) AS roi_percentage;
END;
$$;

-- Function to update subscription status (called by webhook)
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  p_stripe_subscription_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_canceled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.membership_subscriptions
  SET
    status = p_status::subscription_status,
    current_period_start = COALESCE(p_current_period_start, current_period_start),
    current_period_end = COALESCE(p_current_period_end, current_period_end),
    canceled_at = COALESCE(p_canceled_at, canceled_at),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_stripe_subscription_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_subscription_timestamp
  BEFORE UPDATE ON public.membership_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_timestamp();

-- Add comments
COMMENT ON TABLE public.membership_subscriptions IS 'Tracks user subscriptions to membership plans with Stripe integration';
COMMENT ON COLUMN public.membership_subscriptions.status IS 'Subscription status matching Stripe status values';
COMMENT ON COLUMN public.membership_subscriptions.cancel_at_period_end IS 'If true, subscription will cancel at period end (no auto-renewal)';
COMMENT ON FUNCTION public.check_membership_access IS 'Returns true if user has an active membership (trialing or active status)';
COMMENT ON FUNCTION public.get_active_subscription IS 'Returns active subscription details for a user';
COMMENT ON FUNCTION public.calculate_family_savings IS 'Calculates ROI and savings for family pass vs individual courses';
