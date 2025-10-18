# 💳 Stripe Setup Guide - Family Membership System

This guide will help you set up Stripe for your Family Membership system.

---

## 📋 What You'll Need

- Stripe account (free to create)
- 15 minutes of time
- Access to Supabase dashboard

---

## PART 1: Create Stripe Account (if you don't have one)

### Step 1: Sign Up

1. Go to: https://stripe.com
2. Click **"Start now"** or **"Sign in"**
3. Create account with email
4. Verify email
5. Complete business details

---

## PART 2: Create Products in Stripe

### Product 1: Family Membership Pass (Required)

#### Step 1: Navigate to Products

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**

#### Step 2: Configure Product

Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `All Access - Family Membership Pass` |
| **Description** | `Unlimited learning for your entire family. Access all courses, exclusive vault content, and priority event invitations.` |
| **Image** | (Optional) Upload your logo or product image |
| **Statement descriptor** | `AIBORG FAMILY` |

#### Step 3: Configure Pricing

| Field | Value |
|-------|-------|
| **Pricing model** | Standard pricing |
| **Price** | `20.00` |
| **Currency** | `GBP` (British Pound) |
| **Billing period** | `Monthly` ✅ |
| **Charge customers** | `Automatically` |
| **Payment behavior** | `Error if payment fails` |

#### Step 4: Add Free Trial

| Field | Value |
|-------|-------|
| **Free trial** | ✅ Enabled |
| **Trial period** | `30 days` |
| **Require payment method** | ✅ Yes (checked) |

#### Step 5: Save Product

1. Click **"Save product"**
2. ✅ Product created!

#### Step 6: Copy IDs

After saving, you'll see:

```
Product ID: prod_xxxxxxxxxxxxx
Price ID: price_xxxxxxxxxxxxx
```

**📝 COPY THESE IDs - You'll need them later!**

---

### Product 2: Individual Pass (Optional)

If you want to offer an individual plan:

| Field | Value |
|-------|-------|
| **Name** | `Individual Learning Pass` |
| **Description** | `Perfect for solo learners` |
| **Price** | `15.00 GBP` |
| **Billing period** | `Monthly` |
| **Free trial** | `14 days` |

---

## PART 3: Get API Keys

### Step 1: Navigate to API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. You'll see two types of keys:
   - **Publishable key** - Safe to use in frontend
   - **Secret key** - Must be kept secure!

### Step 2: Copy Test Keys

For testing:

```
Publishable key: pk_test_51xxxxxxxxxxxxx
Secret key: sk_test_51xxxxxxxxxxxxx
```

**⚠️ IMPORTANT:** Never share your secret key or commit it to git!

### Step 3: Save Keys Securely

Create a file (don't commit to git!):

```bash
# .env.stripe-keys (add to .gitignore!)
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51xxxxxxxxxxxxx
STRIPE_SECRET_KEY_TEST=sk_test_51xxxxxxxxxxxxx
```

---

## PART 4: Update Database with Stripe IDs

### Option A: Use SQL Helper Script

1. Open: `setup-stripe.sql`
2. Replace `YOUR_PRODUCT_ID_HERE` with your actual Product ID
3. Replace `YOUR_PRICE_ID_HERE` with your actual Price ID
4. Run in Supabase SQL Editor

### Option B: Manual SQL Query

Run this in Supabase SQL Editor:

```sql
-- Update Family Pass with your Stripe IDs
UPDATE membership_plans
SET
  stripe_product_id = 'prod_R1xxxxxxxxxxx',  -- ← Your Product ID
  stripe_price_id = 'price_1xxxxxxxxxxx',    -- ← Your Price ID
  updated_at = NOW()
WHERE slug = 'family-pass';

-- Verify update
SELECT
  name,
  stripe_product_id,
  stripe_price_id,
  price,
  trial_days
FROM membership_plans
WHERE slug = 'family-pass';
```

✅ Should see your Stripe IDs populated

---

## PART 5: Configure Webhook

### What is a Webhook?

A webhook lets Stripe notify your backend when events happen (like payment success).

### Step 1: Get Your Webhook URL

Your webhook URL is:

```
https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/stripe-webhook-subscription
```

### Step 2: Create Webhook in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Enter your webhook URL
4. Click **"Select events"**

### Step 3: Select Events

Check these events:

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

### Step 4: Save Webhook

1. Click **"Add events"**
2. Click **"Add endpoint"**
3. ✅ Webhook created!

### Step 5: Get Webhook Secret

1. Click on the webhook you just created
2. Find **"Signing secret"**
3. Click **"Reveal"**
4. Copy the secret (starts with `whsec_`)

Example:
```
whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

---

## PART 6: Set Secrets in Supabase

### Method 1: Using Supabase CLI

```bash
# Navigate to project
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY="sk_test_YOUR_KEY" \
  --project-ref afrulkxxzcmngbrdfuzj

# Set webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET" \
  --project-ref afrulkxxzcmngbrdfuzj

# Set frontend URL
supabase secrets set FRONTEND_URL="https://aiborg-ai-web.vercel.app" \
  --project-ref afrulkxxzcmngbrdfuzj
```

### Method 2: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/functions
2. Click **"Edge Functions"**
3. Click **"Manage secrets"**
4. Add each secret:
   - Key: `STRIPE_SECRET_KEY`, Value: `sk_test_...`
   - Key: `STRIPE_WEBHOOK_SECRET`, Value: `whsec_...`
   - Key: `FRONTEND_URL`, Value: `https://aiborg-ai-web.vercel.app`
5. Click **"Save"**

### Verify Secrets

```bash
supabase secrets list --project-ref afrulkxxzcmngbrdfuzj
```

✅ Should see 3 secrets (values are hidden for security)

---

## PART 7: Test Cards

### Successful Payment

```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/26)
CVC: Any 3 digits (e.g., 123)
ZIP: Any valid ZIP (e.g., SW1A 1AA)
```

### Failed Payment

```
Card number: 4000 0000 0000 0002
```

### Requires Authentication (3D Secure)

```
Card number: 4000 0025 0000 3155
```

### More Test Cards

Full list: https://stripe.com/docs/testing#cards

---

## PART 8: Test the Integration

### Test 1: Create Subscription

1. Visit: https://aiborg-ai-web.vercel.app/family-membership/enroll
2. Complete the 4-step form
3. Click "Start Free Trial"
4. Use test card: `4242 4242 4242 4242`
5. ✅ Should redirect to success page

### Test 2: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. ✅ Should see your test subscription
3. Status should be `trialing`

### Test 3: Check Database

Run in Supabase SQL Editor:

```sql
SELECT
  s.id,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  p.name as plan_name,
  s.trial_end,
  s.created_at
FROM membership_subscriptions s
JOIN membership_plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC
LIMIT 1;
```

✅ Should see your subscription record

### Test 4: Check Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook
3. Click **"Testing"** tab
4. Send test event: `checkout.session.completed`
5. ✅ Should see 200 response

---

## PART 9: Go Live (Production)

When you're ready to accept real payments:

### Step 1: Activate Stripe Account

1. Go to: https://dashboard.stripe.com/account/onboarding
2. Complete all required information
3. Submit for activation
4. Wait for approval (usually instant)

### Step 2: Create Live Products

1. Switch to Live mode (toggle in top-right)
2. Recreate products with same details
3. Copy new Live IDs

### Step 3: Get Live API Keys

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy Live keys (start with `pk_live_` and `sk_live_`)

### Step 4: Create Live Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Create webhook with same events
3. Copy new webhook secret

### Step 5: Update Secrets

```bash
# Update with LIVE keys
supabase secrets set STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY" \
  --project-ref afrulkxxzcmngbrdfuzj

supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_LIVE_SECRET" \
  --project-ref afrulkxxzcmngbrdfuzj
```

### Step 6: Update Database

```sql
UPDATE membership_plans
SET
  stripe_product_id = 'prod_YOUR_LIVE_PRODUCT_ID',
  stripe_price_id = 'price_YOUR_LIVE_PRICE_ID'
WHERE slug = 'family-pass';
```

### Step 7: Test with Real Card

Test with a small amount first!

---

## 🎉 Setup Complete!

Your Stripe integration is ready!

### Quick Reference

| Resource | URL |
|----------|-----|
| **Stripe Dashboard** | https://dashboard.stripe.com |
| **Test Cards** | https://stripe.com/docs/testing |
| **Webhook Testing** | https://dashboard.stripe.com/test/webhooks |
| **API Logs** | https://dashboard.stripe.com/test/logs |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj |

### Need Help?

- **Stripe Docs:** https://stripe.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Support:** Check logs in both dashboards

---

## Troubleshooting

### "Stripe price ID not found"

**Solution:** Ensure you copied the Price ID (not Product ID) and updated the database.

### Webhook not receiving events

**Solution:**
1. Check webhook URL is correct
2. Verify webhook secret is set
3. Check Supabase function logs
4. Check Stripe webhook logs

### Payment fails immediately

**Solution:**
1. Check you're using correct test card
2. Verify Stripe keys are test mode keys
3. Check error in Stripe logs

### Subscription created but not showing in database

**Solution:**
1. Check webhook is configured
2. Check webhook logs for errors
3. Verify Edge Function is deployed
4. Check database RLS policies

---

**Happy selling! 💰**
