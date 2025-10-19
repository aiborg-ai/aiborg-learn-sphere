-- ============================================================================
-- STRIPE SETUP VALIDATION SCRIPT
-- ============================================================================
-- Run this script to verify your Stripe integration is properly configured
-- Use this after following the steps in FIX_SUBSCRIPTION_ERROR.md
-- ============================================================================

-- ============================================================================
-- CHECK 1: Verify Stripe IDs are set in membership plans
-- ============================================================================

SELECT
  '1. Stripe Configuration' as check_name,
  CASE
    WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL
    THEN '✅ PASS: Stripe IDs are configured'
    WHEN stripe_product_id IS NULL AND stripe_price_id IS NULL
    THEN '❌ FAIL: Both Stripe IDs are missing - Run Step 3 in fix guide'
    WHEN stripe_product_id IS NULL
    THEN '❌ FAIL: Product ID is missing'
    ELSE '❌ FAIL: Price ID is missing'
  END as status,
  name,
  slug,
  stripe_product_id,
  stripe_price_id
FROM membership_plans
WHERE slug = 'family-pass';

-- ============================================================================
-- CHECK 2: Verify plan pricing and trial configuration
-- ============================================================================

SELECT
  '2. Plan Configuration' as check_name,
  CASE
    WHEN price = 20.00 AND currency = 'GBP' AND billing_interval = 'month' AND trial_days = 30
    THEN '✅ PASS: Plan pricing is correct (£20/month with 30-day trial)'
    ELSE '⚠️  WARNING: Plan pricing may not match Stripe product'
  END as status,
  price || ' ' || currency || '/' || billing_interval as pricing,
  trial_days || ' days trial' as trial,
  is_active
FROM membership_plans
WHERE slug = 'family-pass';

-- ============================================================================
-- CHECK 3: Verify plan is active and ready
-- ============================================================================

SELECT
  '3. Plan Active Status' as check_name,
  CASE
    WHEN is_active = true
    THEN '✅ PASS: Plan is active and available for enrollment'
    ELSE '❌ FAIL: Plan is inactive - Users cannot subscribe'
  END as status,
  name,
  is_active,
  is_featured
FROM membership_plans
WHERE slug = 'family-pass';

-- ============================================================================
-- CHECK 4: Test if subscriptions can be created
-- ============================================================================

SELECT
  '4. Ready for Subscriptions' as check_name,
  CASE
    WHEN stripe_product_id IS NOT NULL
    AND stripe_price_id IS NOT NULL
    AND is_active = true
    THEN '✅ PASS: Everything configured - Ready to test enrollment!'
    ELSE '❌ FAIL: Configuration incomplete - Review checks above'
  END as status,
  'Run: SELECT * FROM membership_plans WHERE slug = ''family-pass'';' as next_step
FROM membership_plans
WHERE slug = 'family-pass';

-- ============================================================================
-- CHECK 5: View complete plan details
-- ============================================================================

SELECT
  '5. Complete Plan Details' as section,
  '' as separator
UNION ALL
SELECT
  'ID: ' || id::text,
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Name: ' || name,
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Price: ' || price::text || ' ' || currency,
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Billing: ' || billing_interval,
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Trial: ' || trial_days::text || ' days',
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Max Family: ' || max_family_members::text || ' members',
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Stripe Product: ' || COALESCE(stripe_product_id, 'NOT SET ❌'),
  ''
FROM membership_plans WHERE slug = 'family-pass'
UNION ALL
SELECT
  'Stripe Price: ' || COALESCE(stripe_price_id, 'NOT SET ❌'),
  ''
FROM membership_plans WHERE slug = 'family-pass';

-- ============================================================================
-- CHECK 6: Verify database functions exist
-- ============================================================================

SELECT
  '6. Database Functions' as check_name,
  routine_name as function_name,
  '✅ Exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'check_membership_access',
  'calculate_family_savings',
  'get_active_subscription'
)
ORDER BY routine_name;

-- ============================================================================
-- CHECK 7: Verify RLS policies are enabled
-- ============================================================================

SELECT
  '7. Row Level Security' as check_name,
  tablename,
  CASE
    WHEN rowsecurity = true
    THEN '✅ RLS Enabled'
    ELSE '❌ RLS Not Enabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('membership_plans', 'membership_subscriptions', 'family_members')
ORDER BY tablename;

-- ============================================================================
-- CHECK 8: Check if any subscriptions exist (optional)
-- ============================================================================

SELECT
  '8. Existing Subscriptions' as check_name,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status IN ('active', 'trialing') THEN 1 END) as active_count,
  COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_count,
  CASE
    WHEN COUNT(*) = 0
    THEN 'No subscriptions yet - Ready for first enrollment'
    ELSE COUNT(*)::text || ' subscription(s) found'
  END as message
FROM membership_subscriptions;

-- ============================================================================
-- CHECK 9: View recent subscriptions (if any)
-- ============================================================================

SELECT
  '9. Recent Subscriptions' as section,
  '' as note
WHERE EXISTS (SELECT 1 FROM membership_subscriptions)

UNION ALL

SELECT
  s.stripe_subscription_id as subscription_id,
  s.status || ' since ' || s.created_at::date::text as status_info
FROM membership_subscriptions s
JOIN membership_plans p ON s.plan_id = p.id
WHERE p.slug = 'family-pass'
ORDER BY s.created_at DESC
LIMIT 5;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
  '══════════════════════════════════════════════' as summary_line
UNION ALL
SELECT 'VALIDATION SUMMARY'
UNION ALL
SELECT '══════════════════════════════════════════════'
UNION ALL
SELECT
  CASE
    WHEN (
      SELECT COUNT(*) FROM membership_plans
      WHERE slug = 'family-pass'
      AND stripe_product_id IS NOT NULL
      AND stripe_price_id IS NOT NULL
      AND is_active = true
    ) = 1
    THEN '✅ ALL CHECKS PASSED - Ready to test enrollment!'
    ELSE '❌ CONFIGURATION INCOMPLETE - Review checks above'
  END;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

SELECT
  '══════════════════════════════════════════════' as next_steps_header
UNION ALL
SELECT 'NEXT STEPS'
UNION ALL
SELECT '══════════════════════════════════════════════'
UNION ALL
SELECT
  CASE
    WHEN (
      SELECT COUNT(*) FROM membership_plans
      WHERE slug = 'family-pass'
      AND stripe_product_id IS NOT NULL
      AND stripe_price_id IS NOT NULL
    ) = 1
    THEN '1. ✅ Database is configured'
    ELSE '1. ❌ Run Step 3 in FIX_SUBSCRIPTION_ERROR.md to set Stripe IDs'
  END
UNION ALL
SELECT '2. Verify Supabase secrets are set (STRIPE_SECRET_KEY, FRONTEND_URL)'
UNION ALL
SELECT '3. Test enrollment: https://aiborg-ai-web.vercel.app/family-membership/enroll'
UNION ALL
SELECT '4. Click "Start 30-Day Free Trial" and check for redirect to Stripe'
UNION ALL
SELECT '5. Use test card: 4242 4242 4242 4242';

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- If you need to troubleshoot, uncomment and run these queries:

/*
-- View all membership plans
SELECT * FROM membership_plans ORDER BY display_order;

-- View all subscriptions
SELECT * FROM membership_subscriptions ORDER BY created_at DESC;

-- View all family members
SELECT * FROM family_members ORDER BY created_at DESC;

-- Check if user has active membership (replace USER_ID)
SELECT * FROM check_membership_access('YOUR-USER-ID-HERE');

-- Calculate savings example
SELECT * FROM calculate_family_savings(
  p_num_members := 4,
  p_courses_per_member := 2,
  p_months := 12
);
*/

-- ============================================================================
-- END OF VALIDATION SCRIPT
-- ============================================================================

SELECT
  '══════════════════════════════════════════════' as script_end
UNION ALL
SELECT 'Validation complete!'
UNION ALL
SELECT '══════════════════════════════════════════════'
UNION ALL
SELECT 'Need help? Check FIX_SUBSCRIPTION_ERROR.md';
