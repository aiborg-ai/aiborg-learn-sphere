# 🚀 Go Live with Stripe - Production Setup Guide

This guide will help you switch from test mode to live mode to accept **real payments**.

---

## ⚠️ IMPORTANT - Read First!

**Going live means:**
- ✅ You'll accept real money from real customers
- ✅ Real charges to customer credit cards
- ✅ Real payouts to your bank account
- ⚠️ Real refunds if needed
- ⚠️ Stripe fees apply (2.9% + £0.30 per transaction in UK)

**Before going live:**
- ✅ Ensure you have proper terms & conditions
- ✅ Have a privacy policy
- ✅ Understand refund policy
- ✅ Know your customer support plan
- ✅ Test thoroughly in test mode first

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Stripe account created
- [ ] Business information completed in Stripe
- [ ] Bank account added for payouts
- [ ] Email verified
- [ ] Phone number verified
- [ ] Test mode working correctly
- [ ] Edge Functions deployed
- [ ] Database migrations complete

---

## STEP 1: Activate Your Stripe Account (15 minutes)

### 1.1 Go to Stripe Activation

Go to: https://dashboard.stripe.com/account/onboarding

### 1.2 Complete Business Information

You'll need to provide:

**Business Details:**
- [ ] Business type (Individual, Company, Non-profit)
- [ ] Legal business name
- [ ] Business address
- [ ] Business description
- [ ] Business website: `https://aiborg-ai-web.vercel.app`
- [ ] Customer support email
- [ ] Customer support phone

**Personal Information (for verification):**
- [ ] Legal name
- [ ] Date of birth
- [ ] Home address
- [ ] Phone number
- [ ] Last 4 of SSN/NIN (UK: National Insurance Number)

**Bank Account (for payouts):**
- [ ] Bank name
- [ ] Account holder name
- [ ] Account number
- [ ] Sort code (UK) or Routing number (US)
- [ ] Account type (Checking/Savings)

**Tax Information:**
- [ ] Tax ID (UK: VAT number if applicable)
- [ ] Tax classification

### 1.3 Submit for Review

1. Review all information
2. Click **"Submit"**
3. Wait for approval (usually instant, sometimes up to 24 hours)
4. ✅ Check email for confirmation

### 1.4 Verify Activation

1. Go to: https://dashboard.stripe.com
2. Toggle from **"Test mode"** to **"Live mode"** (top right)
3. You should see "No live data yet" (that's OK!)

---

## STEP 2: Create Live Products (10 minutes)

### 2.1 Switch to Live Mode

In Stripe Dashboard:
1. Look at top right corner
2. Toggle switch to **"Live mode"** (NOT "Test mode")
3. ⚠️ Make sure it says "LIVE" - this is critical!

### 2.2 Create Family Pass Product (Live)

1. Go to: https://dashboard.stripe.com/products
2. **Ensure you're in LIVE mode** (check top right!)
3. Click **"+ Add product"**

**Product Details:**
```
Name: All Access - Family Membership Pass
Description: Unlimited learning for your entire family. Access all courses, exclusive vault content, and priority event invitations.
```

**Pricing:**
```
Pricing model: Standard pricing
Price: 20.00
Currency: GBP (British Pound)
Billing period: Monthly
```

**Recurring Settings:**
```
Charge customers: Automatically
Payment behavior: Error if payment fails
```

**Free Trial:**
```
☑ Free trial enabled
Trial period: 30 days
☑ Require payment method during trial
```

**Advanced Settings (optional):**
```
Statement descriptor: AIBORG FAMILY
Metadata: You can add custom key-value pairs
```

4. Click **"Save product"**

### 2.3 Copy Live Product & Price IDs

After saving, you'll see:

```
Product ID: prod_xxxxxxxxxxxxx     ← Copy this
Default Price ID: price_xxxxxxxxxxxxx     ← Copy this (MOST IMPORTANT!)
```

**📝 SAVE THESE IDs - You'll need them!**

Example:
```
Live Product ID: prod_R1M2abcdefXYZ123
Live Price ID: price_1QR2abcdefXYZ456789
```

### 2.4 Create Individual Pass (Optional)

If you want an individual plan:

```
Name: Individual Learning Pass
Price: 15.00 GBP
Billing: Monthly
Trial: 14 days
```

---

## STEP 3: Update Database with Live Stripe IDs (2 minutes)

### 3.1 Go to Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

### 3.2 Run This Query

```sql
-- Update Family Pass with LIVE Stripe IDs
UPDATE membership_plans
SET
  stripe_product_id = 'prod_YOUR_LIVE_PRODUCT_ID_HERE',
  stripe_price_id = 'price_YOUR_LIVE_PRICE_ID_HERE',
  updated_at = NOW()
WHERE slug = 'family-pass';

-- Verify the update
SELECT
  name,
  slug,
  price,
  currency,
  stripe_product_id,
  stripe_price_id,
  is_active
FROM membership_plans
WHERE slug = 'family-pass';
```

Replace `prod_YOUR_LIVE_PRODUCT_ID_HERE` and `price_YOUR_LIVE_PRICE_ID_HERE` with your actual LIVE IDs from Step 2.3.

### 3.3 Verify

The query should return:
```json
{
  "name": "All Access - Family Membership Pass",
  "slug": "family-pass",
  "price": 20.00,
  "currency": "GBP",
  "stripe_product_id": "prod_R1M2abc...",
  "stripe_price_id": "price_1QR2abc...",
  "is_active": true
}
```

✅ Both Stripe IDs should be populated with **LIVE** IDs (not test IDs!)

---

## STEP 4: Update Supabase Secrets with Live Keys (5 minutes)

### 4.1 Get Live API Keys from Stripe

1. Go to: https://dashboard.stripe.com/apikeys
2. **Make sure you're in LIVE mode** (toggle at top right)
3. You'll see:
   - **Publishable key**: `pk_live_...` (for frontend)
   - **Secret key**: `sk_live_...` (for backend)

**⚠️ CRITICAL: These are LIVE keys - keep them secure!**

### 4.2 Update Supabase Edge Function Secrets

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/functions

Find the secret `STRIPE_SECRET_KEY` and update it:

**OLD VALUE (test):**
```
sk_test_51xxxxxxxxxxxxx
```

**NEW VALUE (live):**
```
sk_live_51xxxxxxxxxxxxx
```

Click **"Save"** or **"Update"**

### 4.3 Update Frontend Environment Variables (Vercel)

Go to: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/settings/environment-variables

Find or add `VITE_STRIPE_PUBLISHABLE_KEY`:

**OLD VALUE (test):**
```
pk_test_51xxxxxxxxxxxxx
```

**NEW VALUE (live):**
```
pk_live_51xxxxxxxxxxxxx
```

**IMPORTANT:** After updating, you MUST redeploy:
1. Click **"Save"**
2. Go to: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web
3. Click **"Redeploy"** on the latest deployment
4. Wait for deployment to complete (~2 minutes)

---

## STEP 5: Configure Live Webhook (10 minutes)

### 5.1 Go to Stripe Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. **Ensure you're in LIVE mode** (check top right!)
3. Click **"+ Add endpoint"**

### 5.2 Configure Endpoint

**Endpoint URL:**
```
https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/stripe-webhook-subscription
```

**Description (optional):**
```
Production webhook for AIBORG membership subscriptions
```

### 5.3 Select Events to Listen To

Click **"Select events"** and choose:

**Checkout Events:**
- [x] `checkout.session.completed`
- [x] `checkout.session.expired`

**Subscription Events:**
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `customer.subscription.paused`
- [x] `customer.subscription.resumed`
- [x] `customer.subscription.trial_will_end`

**Invoice Events:**
- [x] `invoice.payment_succeeded`
- [x] `invoice.payment_failed`
- [x] `invoice.upcoming`
- [x] `invoice.finalized`

**Customer Events:**
- [x] `customer.created`
- [x] `customer.updated`
- [x] `customer.deleted`

Click **"Add events"**

### 5.4 Save Endpoint

Click **"Add endpoint"**

### 5.5 Get Webhook Signing Secret

1. Click on the webhook you just created
2. Find **"Signing secret"**
3. Click **"Reveal"**
4. Copy the secret (starts with `whsec_`)

Example:
```
whsec_abc123def456ghi789jkl...
```

### 5.6 Add Webhook Secret to Supabase

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/functions

Find or add secret `STRIPE_WEBHOOK_SECRET`:

**OLD VALUE (test):**
```
whsec_test123...
```

**NEW VALUE (live):**
```
whsec_abc123def456...
```

Click **"Save"**

---

## STEP 6: Test with Real Payment (CAREFULLY!)

### 6.1 Use a Small Test First

**Recommendation:** Test with your own card first for £0.01 or use the trial.

### 6.2 Test Enrollment Flow

1. Go to: https://aiborg-ai-web.vercel.app/family-membership/enroll
2. Fill in your real information
3. Choose **"Start Free Trial"** (safer for first test)
4. Use your real credit card
5. ✅ Complete checkout

### 6.3 Verify in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/subscriptions
2. **Make sure you're in LIVE mode**
3. You should see your new subscription
4. Status should be `trialing`

### 6.4 Verify in Database

Run in Supabase SQL Editor:

```sql
SELECT
  s.id,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  p.name as plan_name,
  s.trial_end,
  s.current_period_end,
  s.created_at
FROM membership_subscriptions s
JOIN membership_plans p ON s.plan_id = p.id
WHERE s.stripe_subscription_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 1;
```

Should show:
- `status`: "trialing" or "active"
- `stripe_subscription_id`: starts with `sub_`
- `trial_end`: 30 days from now

### 6.5 Test Webhook

Check webhook is working:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook
3. Click **"Events"** or **"Logs"**
4. Should see `checkout.session.completed` event
5. Status should be ✅ Success (200 OK)

### 6.6 Cancel Test Subscription (if desired)

If you want to cancel your test subscription:

1. Go to: https://dashboard.stripe.com/subscriptions
2. Click on your subscription
3. Click **"Actions"** → **"Cancel subscription"**
4. Choose "Cancel immediately" or "Cancel at period end"

---

## STEP 7: Monitor & Maintain

### 7.1 Enable Radar (Fraud Prevention)

1. Go to: https://dashboard.stripe.com/radar
2. Review default rules
3. Enable/customize as needed
4. Stripe Radar helps prevent fraudulent transactions

### 7.2 Set Up Email Notifications

1. Go to: https://dashboard.stripe.com/settings/notifications
2. Enable notifications for:
   - Failed payments
   - Successful payments
   - Disputes/chargebacks
   - Subscription cancellations

### 7.3 Monitor Dashboard

Regularly check:
- https://dashboard.stripe.com/dashboard
- Revenue metrics
- Failed payments
- Customer subscriptions
- Webhook logs

---

## ✅ Verification Checklist

Before going fully live, verify:

- [ ] Stripe account fully activated
- [ ] Live product created in Stripe
- [ ] Live Price ID copied
- [ ] Database updated with live Stripe IDs
- [ ] Live Stripe secret key set in Supabase
- [ ] Live publishable key set in Vercel
- [ ] Vercel redeployed after env var change
- [ ] Live webhook created and configured
- [ ] Webhook secret set in Supabase
- [ ] Test enrollment completed successfully
- [ ] Subscription shows in Stripe dashboard (LIVE mode)
- [ ] Subscription shows in database
- [ ] Webhook logs show success
- [ ] Terms & conditions on website
- [ ] Privacy policy on website
- [ ] Refund policy documented
- [ ] Customer support email working

---

## 🔒 Security Best Practices

### Keep Keys Secure

**NEVER:**
- ❌ Commit API keys to git
- ❌ Share keys in Slack/email
- ❌ Use live keys in test mode
- ❌ Hardcode keys in frontend code

**ALWAYS:**
- ✅ Use environment variables
- ✅ Keep secret keys in Supabase secrets
- ✅ Use publishable keys in frontend
- ✅ Rotate keys if compromised
- ✅ Use different keys for test/live

### Monitor for Issues

Set up alerts for:
- Failed payments (could indicate issues)
- Unusual subscription patterns
- Webhook failures
- High refund rates

---

## 🆘 Rollback to Test Mode

If something goes wrong, you can quickly revert:

### Quick Rollback

1. Update Supabase secret back to test key:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. Update Vercel env var back to test key:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Redeploy Vercel

4. Update database back to test Price ID:
   ```sql
   UPDATE membership_plans
   SET stripe_price_id = 'price_YOUR_TEST_ID'
   WHERE slug = 'family-pass';
   ```

---

## 📊 Understanding Stripe Fees

**UK Pricing:**
- 2.9% + £0.30 per successful card charge
- No setup fees
- No monthly fees
- No hidden charges

**Example:**
- £20 subscription = £20.00 - (£20 × 2.9%) - £0.30
- You receive: £20.00 - £0.58 - £0.30 = £19.12
- Stripe keeps: £0.88

**Payouts:**
- Automatic daily payouts to your bank account
- 2-day rolling basis (today's earnings paid in 2 days)
- Can change to weekly/monthly in settings

---

## 🎯 Next Steps After Going Live

1. **Monitor first week closely**
   - Check subscriptions daily
   - Watch for failed payments
   - Review webhook logs

2. **Set up customer support**
   - Monitor support email
   - Have cancellation process ready
   - Prepare for refund requests

3. **Marketing**
   - Announce you're live!
   - Share enrollment link
   - Consider launch promotion

4. **Scale**
   - Monitor performance
   - Optimize based on data
   - Add features based on feedback

---

## 🚨 Common Issues & Solutions

### "Payment failed" errors

**Check:**
- Customer has sufficient funds
- Card not expired
- Card not blocked by bank
- Radar not blocking transaction

### Webhook not firing

**Check:**
- Webhook URL is correct
- Webhook secret matches
- Events are selected
- Check webhook logs in Stripe

### Subscription not showing in database

**Check:**
- Webhook is working
- Edge function deployed
- Secrets are set correctly
- Check Edge Function logs

---

## 📞 Support Resources

**Stripe Support:**
- Dashboard: https://dashboard.stripe.com/support
- Docs: https://stripe.com/docs
- Email: support@stripe.com

**Supabase Support:**
- Docs: https://supabase.com/docs
- Dashboard: https://supabase.com/dashboard/support

---

## ✨ Congratulations!

You're now accepting real payments! 🎉

**Quick Links:**
- Live Dashboard: https://dashboard.stripe.com/dashboard
- Subscriptions: https://dashboard.stripe.com/subscriptions
- Customers: https://dashboard.stripe.com/customers
- Webhooks: https://dashboard.stripe.com/webhooks
- Enrollment Page: https://aiborg-ai-web.vercel.app/family-membership/enroll

**Remember:**
- Test thoroughly before promoting
- Monitor closely in first week
- Have customer support ready
- Keep backups of important data

---

**Good luck with your launch! 🚀**
