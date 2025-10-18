# 🚀 Family Membership Deployment - Step-by-Step Guide

This guide walks you through deploying the Family Membership system manually.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Supabase account and project access
- [ ] Stripe account (test mode is fine)
- [ ] Terminal/command line access
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Project files downloaded locally

---

## STEP 1: Database Setup (15 minutes)

### 1.1 Login to Supabase Dashboard

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj

### 1.2 Open SQL Editor

Click on **SQL Editor** in the left sidebar

### 1.3 Run Migration 1: Membership Plans

1. Click **"New Query"**
2. Copy contents from: `supabase/migrations/20251017120000_membership_plans.sql`
3. Paste into editor
4. Click **"Run"**
5. ✓ Should see: "Success. No rows returned"

**What this creates:**
- `membership_plans` table
- Default Family Pass plan (£20/month)
- RLS policies for secure access

### 1.4 Run Migration 2: Membership Subscriptions

1. Click **"New Query"**
2. Copy contents from: `supabase/migrations/20251017120001_membership_subscriptions.sql`
3. Paste into editor
4. Click **"Run"**
5. ✓ Should see: "Success. No rows returned"

**What this creates:**
- `membership_subscriptions` table
- Stripe integration fields
- RLS policies
- Helper functions for access checks

### 1.5 Run Migration 3: Family Members (if exists)

1. Check if file exists: `supabase/migrations/20251017120003_family_members.sql`
2. If yes:
   - Click **"New Query"**
   - Copy contents
   - Paste and **Run**

**What this creates:**
- `family_members` table
- Invitation system
- RLS policies for family data

### 1.6 Verify Tables Created

Run this query in SQL Editor:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%membership%' OR tablename LIKE '%family%';
```

✓ Should see:
- `membership_plans`
- `membership_subscriptions`
- `family_members` (if migration 3 exists)

---

## STEP 2: Stripe Setup (20 minutes)

### 2.1 Create Stripe Product

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"Add product"**
3. Fill in:
   - **Name:** `All Access - Family Membership Pass`
   - **Description:** `Unlimited learning for your entire family`
   - **Pricing model:** Standard pricing
   - **Price:** `20.00`
   - **Currency:** `GBP`
   - **Billing period:** `Monthly`
   - **Free trial:** `30 days`
4. Click **"Save product"**

### 2.2 Copy Stripe IDs

After saving, you'll see two IDs:

1. **Product ID** (starts with `prod_`): Copy this
2. **Price ID** (starts with `price_`): Copy this

Example:
```
Product ID: prod_R12345abcdef
Price ID: price_1QR12345wxyz
```

### 2.3 Update Database with Stripe IDs

Go back to **Supabase SQL Editor** and run:

```sql
UPDATE membership_plans
SET
  stripe_product_id = 'prod_YOUR_PRODUCT_ID_HERE',
  stripe_price_id = 'price_YOUR_PRICE_ID_HERE'
WHERE slug = 'family-pass';

-- Verify update
SELECT name, stripe_product_id, stripe_price_id
FROM membership_plans
WHERE slug = 'family-pass';
```

✓ Should see your Stripe IDs in the result

### 2.4 Get Stripe API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Secret key** (starts with `sk_test_`)
3. Copy **Publishable key** (starts with `pk_test_`)

**IMPORTANT:** Keep these keys secure! Never commit them to git.

---

## STEP 3: Deploy Edge Functions (10 minutes)

### 3.1 Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### 3.2 Login to Supabase

```bash
supabase login
```

This will open your browser for authentication.

### 3.3 Link to Your Project

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere
supabase link --project-ref afrulkxxzcmngbrdfuzj
```

### 3.4 Deploy Edge Functions

Run these commands one by one:

```bash
# Deploy subscription creation function
supabase functions deploy create-subscription --project-ref afrulkxxzcmngbrdfuzj

# Deploy subscription management function
supabase functions deploy manage-subscription --project-ref afrulkxxzcmngbrdfuzj

# Deploy Stripe webhook handler
supabase functions deploy stripe-webhook-subscription --project-ref afrulkxxzcmngbrdfuzj

# Deploy email notification function (optional)
supabase functions deploy send-email-notification --project-ref afrulkxxzcmngbrdfuzj
```

✓ Each should show: "Deployed function successfully!"

### 3.5 Set Supabase Secrets

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE" --project-ref afrulkxxzcmngbrdfuzj

# Set frontend URL
supabase secrets set FRONTEND_URL="https://aiborg-ai-web.vercel.app" --project-ref afrulkxxzcmngbrdfuzj
```

### 3.6 Verify Secrets

```bash
supabase secrets list --project-ref afrulkxxzcmngbrdfuzj
```

✓ Should see:
- `STRIPE_SECRET_KEY` (hidden)
- `FRONTEND_URL` (hidden)

---

## STEP 4: Configure Stripe Webhook (10 minutes)

### 4.1 Get Webhook URL

Your webhook URL is:
```
https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/stripe-webhook-subscription
```

### 4.2 Create Webhook in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Paste the webhook URL
4. Click **"Select events"**
5. Select these events:
   - [x] `checkout.session.completed`
   - [x] `customer.subscription.created`
   - [x] `customer.subscription.updated`
   - [x] `customer.subscription.deleted`
   - [x] `customer.subscription.paused`
   - [x] `customer.subscription.resumed`
   - [x] `invoice.payment_succeeded`
   - [x] `invoice.payment_failed`
6. Click **"Add events"**
7. Click **"Add endpoint"**

### 4.3 Copy Webhook Secret

After creating the webhook:
1. Click on the webhook you just created
2. Click **"Reveal"** under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### 4.4 Set Webhook Secret in Supabase

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE" --project-ref afrulkxxzcmngbrdfuzj
```

---

## STEP 5: Frontend Configuration (5 minutes)

### 5.1 Update Environment Variables in Vercel

1. Go to: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/settings/environment-variables
2. Add/Update these variables:

```
VITE_SUPABASE_URL=https://afrulkxxzcmngbrdfuzj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_APP_URL=https://aiborg-ai-web.vercel.app
```

3. Click **"Save"**
4. **Redeploy** the application

### 5.2 Verify Deployment

Visit: https://aiborg-ai-web.vercel.app/family-membership

✓ Page should load without errors

---

## STEP 6: Test the System (10 minutes)

### 6.1 Test Free Trial Enrollment

1. Visit: https://aiborg-ai-web.vercel.app/family-membership
2. Click **"Start Free Trial"** or **"Enroll Now"**
3. Complete the 4-step form:
   - Step 1: Review plan
   - Step 2: Enter your details
   - Step 3: Add family members (optional)
   - Step 4: Choose "Start Free Trial"
4. ✓ Should redirect to Stripe Checkout

### 6.2 Complete Test Payment

Use Stripe test card:
```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### 6.3 Verify Subscription Created

1. Go to Supabase SQL Editor
2. Run:

```sql
SELECT
  s.id,
  s.status,
  s.stripe_customer_id,
  p.name as plan_name,
  s.created_at
FROM membership_subscriptions s
JOIN membership_plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC
LIMIT 5;
```

✓ Should see your test subscription with status `trialing` or `active`

### 6.4 Check Stripe Dashboard

Go to: https://dashboard.stripe.com/test/subscriptions

✓ Should see your test subscription listed

---

## STEP 7: Go Live! (Production Setup)

### 7.1 Switch Stripe to Live Mode

1. Get live API keys from: https://dashboard.stripe.com/apikeys
2. Create live product (same as test)
3. Update database with live Stripe IDs
4. Create live webhook
5. Update secrets with live keys

### 7.2 Update Environment Variables

Change from test keys to live keys in:
- Supabase secrets
- Vercel environment variables

### 7.3 Test in Production

1. Complete a real enrollment with a real card
2. Verify subscription shows in Stripe live mode
3. Test cancellation flow
4. Test family member invitation

---

## 🎉 Deployment Complete!

Your Family Membership system is now live!

### Quick Links

- **Frontend:** https://aiborg-ai-web.vercel.app/family-membership
- **Supabase Dashboard:** https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
- **Stripe Dashboard:** https://dashboard.stripe.com

### Documentation

- 📘 System Overview: `FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md`
- 🚀 Quick Start: `MEMBERSHIP_QUICK_START.md`
- 📧 Email Setup: `DEPLOY_FAMILY_MEMBERSHIP_EMAILS.md`
- 📚 Full Docs: `MEMBERSHIP_DOCUMENTATION_INDEX.md`

---

## ⚠️ Troubleshooting

### Subscription not created after payment

**Check:**
1. Webhook is configured correctly
2. Webhook secret is set
3. Check Stripe webhook logs for errors

### Can't access enrollment page

**Check:**
1. Database migrations ran successfully
2. RLS policies are enabled
3. User is authenticated

### Edge function errors

**Check:**
1. All secrets are set correctly
2. Functions are deployed
3. Check Supabase function logs

### Need Help?

Check the logs:
```bash
# Supabase function logs
supabase functions logs stripe-webhook-subscription --project-ref afrulkxxzcmngbrdfuzj

# Stripe webhook logs
# Go to: https://dashboard.stripe.com/test/webhooks → Click your webhook → View logs
```

---

**Need assistance? Contact support or check the documentation.**
