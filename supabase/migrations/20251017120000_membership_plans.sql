-- ============================================================================
-- MEMBERSHIP PLANS TABLE
-- ============================================================================
-- Defines different membership tiers (Family Pass, Individual, Enterprise, etc.)
-- Created: October 17, 2025
-- ============================================================================

-- Create membership_plans table
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
  features JSONB NOT NULL DEFAULT '[]'::JSONB,
  max_family_members INTEGER DEFAULT 6,
  includes_vault_access BOOLEAN NOT NULL DEFAULT true,
  includes_event_access BOOLEAN NOT NULL DEFAULT true,
  includes_all_courses BOOLEAN NOT NULL DEFAULT true,
  trial_days INTEGER DEFAULT 30,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_membership_plans_slug ON public.membership_plans(slug);
CREATE INDEX idx_membership_plans_is_active ON public.membership_plans(is_active);
CREATE INDEX idx_membership_plans_stripe_price_id ON public.membership_plans(stripe_price_id);

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All users can view active plans
CREATE POLICY "Anyone can view active membership plans"
  ON public.membership_plans
  FOR SELECT
  USING (is_active = true);

-- Insert default plans
INSERT INTO public.membership_plans (
  name,
  slug,
  description,
  price,
  currency,
  billing_interval,
  features,
  max_family_members,
  includes_vault_access,
  includes_event_access,
  includes_all_courses,
  trial_days,
  is_active,
  is_featured,
  display_order
) VALUES
(
  'All Access - Family Membership Pass',
  'family-pass',
  'Unlimited learning for your entire family. Access all courses, exclusive vault content, and priority event invitations.',
  20.00,
  'GBP',
  'month',
  '[
    "Access to 50+ AI courses for all age groups",
    "Primary (Ages 8-11) courses",
    "Secondary (Ages 12-18) courses",
    "Professional development courses",
    "Business & SME training programs",
    "200+ exclusive Vault resources",
    "Video tutorials, worksheets & templates",
    "Priority event registration",
    "Free access to monthly seminars",
    "Discounted conference tickets",
    "Up to 6 family members",
    "Individual learning accounts",
    "Progress tracking per member",
    "Certificate programs",
    "Priority email support",
    "Community access (Discord & Skool)",
    "Cancel anytime, no commitment",
    "30-day money-back guarantee"
  ]'::JSONB,
  6,
  true,
  true,
  true,
  30,
  true,
  true,
  1
),
(
  'Individual Pass',
  'individual-pass',
  'Perfect for solo learners. Full access to all courses and content.',
  15.00,
  'GBP',
  'month',
  '[
    "Access to 50+ AI courses",
    "All age-appropriate content",
    "Exclusive Vault resources",
    "Event access (member pricing)",
    "Certificate programs",
    "Email support",
    "Community access"
  ]'::JSONB,
  1,
  true,
  true,
  true,
  14,
  false,
  false,
  2
);

-- Add comments
COMMENT ON TABLE public.membership_plans IS 'Defines available membership subscription plans';
COMMENT ON COLUMN public.membership_plans.features IS 'JSONB array of feature strings to display on pricing page';
COMMENT ON COLUMN public.membership_plans.max_family_members IS 'Maximum number of family members allowed on this plan';
COMMENT ON COLUMN public.membership_plans.trial_days IS 'Number of days for free trial period (0 = no trial)';
