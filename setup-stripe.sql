-- ============================================================================
-- STRIPE INTEGRATION SETUP HELPER SCRIPT
-- ============================================================================
-- Use this script to configure Stripe IDs in your membership plans
-- Run this in Supabase SQL Editor after creating your Stripe products
-- ============================================================================

-- STEP 1: Update Stripe IDs for Family Pass
-- Replace YOUR_PRODUCT_ID and YOUR_PRICE_ID with actual values from Stripe

UPDATE membership_plans
SET
  stripe_product_id = 'prod_YOUR_PRODUCT_ID_HERE',  -- Example: prod_R12345abcdef
  stripe_price_id = 'price_YOUR_PRICE_ID_HERE',     -- Example: price_1QR12345wxyz
  updated_at = NOW()
WHERE slug = 'family-pass';

-- ============================================================================
-- STEP 2: Verify the update
-- ============================================================================

SELECT
  name,
  slug,
  price,
  currency,
  billing_interval,
  stripe_product_id,
  stripe_price_id,
  is_active,
  trial_days
FROM membership_plans
WHERE slug = 'family-pass';

-- Expected result:
-- Should show your Stripe IDs populated

-- ============================================================================
-- STEP 3: Test Stripe integration
-- ============================================================================

-- Check if plan is ready for checkout
SELECT
  CASE
    WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL
    THEN '✓ Plan is ready for Stripe checkout!'
    ELSE '✗ Missing Stripe IDs. Please update above.'
  END as status,
  name,
  stripe_product_id IS NOT NULL as has_product_id,
  stripe_price_id IS NOT NULL as has_price_id
FROM membership_plans
WHERE slug = 'family-pass';

-- ============================================================================
-- OPTIONAL: Create additional plans (Individual, Enterprise, etc.)
-- ============================================================================

-- Uncomment and customize to add more plans:

/*
INSERT INTO membership_plans (
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
  stripe_product_id,  -- Add your Stripe IDs
  stripe_price_id,    -- Add your Stripe IDs
  is_active,
  is_featured,
  display_order
) VALUES (
  'Individual Learning Pass',
  'individual-pass',
  'Perfect for solo learners. Access all courses and vault content.',
  15.00,
  'GBP',
  'month',
  '[
    "Access to 50+ AI courses",
    "200+ Vault resources",
    "Priority event registration",
    "Certificate programs",
    "Email support",
    "Cancel anytime"
  ]'::JSONB,
  1,  -- Only 1 person
  true,
  true,
  true,
  14,  -- 14-day trial
  'prod_YOUR_INDIVIDUAL_PRODUCT_ID',
  'price_YOUR_INDIVIDUAL_PRICE_ID',
  true,
  false,
  2
);
*/

-- ============================================================================
-- UTILITY QUERIES
-- ============================================================================

-- View all plans with their Stripe status
SELECT
  name,
  slug,
  price || ' ' || currency || '/' || billing_interval as pricing,
  CASE
    WHEN stripe_price_id IS NOT NULL THEN '✓ Configured'
    ELSE '✗ Missing Stripe ID'
  END as stripe_status,
  is_active,
  is_featured,
  trial_days || ' days' as trial
FROM membership_plans
ORDER BY display_order;

-- Check for any subscriptions
SELECT
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trialing,
  COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled
FROM membership_subscriptions;

-- View recent subscriptions with plan details
SELECT
  s.id,
  s.status,
  s.stripe_customer_id,
  p.name as plan_name,
  p.price,
  s.current_period_start,
  s.current_period_end,
  s.trial_end,
  s.created_at
FROM membership_subscriptions s
JOIN membership_plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC
LIMIT 10;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if RLS policies are enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE '%membership%' OR tablename LIKE '%family%');

-- View all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename IN ('membership_plans', 'membership_subscriptions', 'family_members')
ORDER BY tablename, policyname;

-- Check if helper functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%membership%'
ORDER BY routine_name;

-- ============================================================================
-- CLEANUP (USE WITH CAUTION!)
-- ============================================================================

-- DANGER: This will delete ALL subscriptions and family members
-- Only use in development/testing

/*
-- Uncomment to delete all test data:

DELETE FROM family_members;
DELETE FROM membership_subscriptions;

-- Reset the plans to remove Stripe IDs (keeps the plans):
UPDATE membership_plans
SET
  stripe_product_id = NULL,
  stripe_price_id = NULL
WHERE slug = 'family-pass';
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

-- Next Steps:
-- 1. Copy your Stripe Product ID and Price ID from Stripe Dashboard
-- 2. Update the UPDATE statement at the top of this file
-- 3. Run this script in Supabase SQL Editor
-- 4. Verify the results with the SELECT queries
-- 5. Deploy Edge Functions (see DEPLOY_STEP_BY_STEP.md)
-- 6. Configure Stripe webhook
-- 7. Test the enrollment flow!
