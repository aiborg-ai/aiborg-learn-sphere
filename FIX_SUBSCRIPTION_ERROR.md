# 🔧 Fix "Failed to send request to edge function" Error

## 📋 Quick Diagnosis

Your error message: **"Failed to send a request to the edge function"**

**Root cause:** Missing Stripe configuration (Product IDs, API keys, environment variables)

---

## ✅ STEP-BY-STEP FIX GUIDE

Follow these steps in order. **Total time:** ~30-45 minutes

---

### STEP 1: Create Stripe Product (15 minutes)

#### 1.1 Login to Stripe Dashboard

Go to: https://dashboard.stripe.com/test/products

> ⚠️ Make sure you're in **TEST MODE** (toggle in top-right corner)

#### 1.2 Create New Product

Click **"+ Add product"** button

Fill in:

| Field                | Value                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Name                 | `All Access - Family Membership Pass`                                                                                     |
| Description          | `Unlimited learning for your entire family. Access all courses, exclusive vault content, and priority event invitations.` |
| Statement descriptor | `AIBORG FAMILY`                                                                                                           |

#### 1.3 Configure Pricing

Click **"Add pricing"** or **"Pricing"** section:

| Field            | Value                          |
| ---------------- | ------------------------------ |
| Pricing model    | ☑️ Standard pricing            |
| Price            | `20.00`                        |
| Currency         | `GBP` (British Pound Sterling) |
| Billing period   | ☑️ **Monthly**                 |
| Usage type       | ☑️ **Licensed**                |
| Charge customers | ☑️ **Automatically**           |

#### 1.4 Add Free Trial

Still in pricing section:

| Field        | Value          |
| ------------ | -------------- |
| Free trial   | ☑️ **Enabled** |
| Trial period | `30` days      |

#### 1.5 Save and Copy IDs

1. Click **"Add product"** or **"Save"**
2. After saving, you'll see:

```
Product: prod_xxxxxxxxxxxx
Default price: price_xxxxxxxxxxxx
```

**📝 COPY BOTH IDs TO NOTEPAD - YOU'LL NEED THEM!**

Example:

```
Product ID: prod_R1zN8xKp5QrXxK
Price ID: price_1QRsG9L5t6KHfRzNabcdef123
```

---

### STEP 2: Get Stripe API Keys (2 minutes)

#### 2.1 Navigate to API Keys

Go to: https://dashboard.stripe.com/test/apikeys

#### 2.2 Copy Keys

You'll see:

| Key Type            | Format          | Purpose           |
| ------------------- | --------------- | ----------------- |
| **Publishable key** | `pk_test_51...` | Frontend (safe)   |
| **Secret key**      | `sk_test_51...` | Backend (SECRET!) |

Click **"Reveal test key"** and copy the **Secret key**

**📝 COPY SECRET KEY TO NOTEPAD**

Example:

```
Secret Key: sk_test_51QRsG9L5t6KHfRzN...
```

> ⚠️ **NEVER** share secret key or commit to git!

---

### STEP 3: Update Database with Stripe IDs (2 minutes)

#### 3.1 Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

#### 3.2 Run This SQL

**IMPORTANT:** Replace `YOUR_PRODUCT_ID` and `YOUR_PRICE_ID` with the actual IDs from Step 1!

```sql
-- Update Family Pass with your Stripe IDs
UPDATE membership_plans
SET
  stripe_product_id = 'prod_YOUR_PRODUCT_ID_HERE',   -- ← PASTE YOUR PRODUCT ID
  stripe_price_id = 'price_YOUR_PRICE_ID_HERE',      -- ← PASTE YOUR PRICE ID
  updated_at = NOW()
WHERE slug = 'family-pass';

-- Verify the update worked
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
```

#### 3.3 Expected Result

You should see output like:

| name                                | slug        | price | currency | billing_interval | stripe_product_id   | stripe_price_id           | is_active | trial_days |
| ----------------------------------- | ----------- | ----- | -------- | ---------------- | ------------------- | ------------------------- | --------- | ---------- |
| All Access - Family Membership Pass | family-pass | 20.00 | GBP      | month            | prod_R1zN8xKp5QrXxK | price_1QRsG9L5t6KHfRzN... | true      | 30         |

✅ If you see your Stripe IDs populated, **SUCCESS!** Proceed to Step 4.

❌ If NULL or no results, re-run the UPDATE query.

---

### STEP 4: Set Supabase Environment Variables (5 minutes)

#### 4.1 Navigate to Supabase Settings

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault

#### 4.2 Add Stripe Secret Key

Click **"Add new secret"**

| Field | Value                                         |
| ----- | --------------------------------------------- |
| Name  | `STRIPE_SECRET_KEY`                           |
| Value | `sk_test_51...` (your secret key from Step 2) |

Click **"Add secret"**

#### 4.3 Add Frontend URL

Click **"Add new secret"** again

| Field | Value                              |
| ----- | ---------------------------------- |
| Name  | `FRONTEND_URL`                     |
| Value | `https://aiborg-ai-web.vercel.app` |

Click **"Add secret"**

#### 4.4 Verify Secrets

You should now see:

- ✅ `STRIPE_SECRET_KEY` = `sk_test_51...` (masked)
- ✅ `FRONTEND_URL` = `https://aiborg-ai-web.vercel.app`

> 📝 Note: You'll add `STRIPE_WEBHOOK_SECRET` in Step 5 after creating the webhook

---

### STEP 5: Setup Stripe Webhook (10 minutes)

#### 5.1 Navigate to Webhooks

Go to: https://dashboard.stripe.com/test/webhooks

#### 5.2 Add Endpoint

Click **"Add endpoint"** button

#### 5.3 Configure Endpoint

| Field            | Value                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Endpoint URL** | `https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/stripe-webhook-subscription` |
| **Description**  | `Family Membership Subscription Webhook`                                            |

#### 5.4 Select Events

Click **"Select events"** and choose:

**Checkout:**

- ✅ `checkout.session.completed`

**Customer:**

- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

**Invoice:**

- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

#### 5.5 Save Endpoint

Click **"Add endpoint"**

#### 5.6 Copy Signing Secret

After creating, you'll see:

```
Signing secret: whsec_xxxxxxxxxxxxxx
```

Click **"Reveal"** and copy the signing secret

#### 5.7 Add Webhook Secret to Supabase

1. Go back to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault
2. Click **"Add new secret"**
3. Name: `STRIPE_WEBHOOK_SECRET`
4. Value: `whsec_...` (paste your signing secret)
5. Click **"Add secret"**

---

### STEP 6: Verify Edge Functions Are Deployed (2 minutes)

#### 6.1 Check Functions

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/functions

#### 6.2 Verify These Functions Exist

You should see:

- ✅ `create-subscription` (deployed "a day ago" per your screenshot)
- ✅ `manage-subscription`
- ✅ `stripe-webhook-subscription`

If they exist, **you're good!** ✅

If missing, you'll need to deploy them (let me know).

---

### STEP 7: Test the Fix (5 minutes)

#### 7.1 Visit Enrollment Page

Go to: https://aiborg-ai-web.vercel.app/family-membership/enroll

#### 7.2 Complete Enrollment

1. **Step 1:** View plan → Click "Continue"
2. **Step 2:** Enter your info → Click "Continue"
3. **Step 3:** Skip or add family → Click "Continue"
4. **Step 4:** Create account (or sign in if you have one)
5. **Step 5:** Click **"Start 30-Day Free Trial"**

#### 7.3 Expected Result

✅ **SUCCESS:** You should be redirected to Stripe checkout page

❌ **FAILURE:** Still see error → Go to Step 8 (Troubleshooting)

#### 7.4 Test Stripe Checkout

On Stripe checkout page, use test card:

| Field       | Value                           |
| ----------- | ------------------------------- |
| Card number | `4242 4242 4242 4242`           |
| Expiry      | Any future date (e.g., `12/26`) |
| CVC         | Any 3 digits (e.g., `123`)      |
| ZIP         | Any 5 digits (e.g., `12345`)    |

Click **"Subscribe"**

✅ **SUCCESS:** Redirected back to your app

#### 7.5 Verify in Database

Run this SQL in Supabase:

```sql
SELECT
  s.id,
  s.status,
  s.stripe_subscription_id,
  s.trial_end,
  p.name as plan_name,
  s.created_at
FROM membership_subscriptions s
JOIN membership_plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC
LIMIT 1;
```

✅ **SUCCESS:** You should see a subscription with:

- `status` = 'trialing' or 'active'
- `stripe_subscription_id` = 'sub\_...'
- `trial_end` = 30 days from now

---

## STEP 8: Troubleshooting (If Still Not Working)

### Issue: Still getting "failed to send request" error

**Check 1: Browser Console**

1. Press F12 to open DevTools
2. Go to Console tab
3. Try clicking "Start Free Trial" again
4. Look for red error messages

**Common errors:**

| Error Message               | Solution                                        |
| --------------------------- | ----------------------------------------------- |
| `401 Unauthorized`          | User not logged in properly - check Step 4 auth |
| `400 Bad Request`           | Check database Stripe IDs (Step 3)              |
| `500 Internal Server Error` | Check Supabase secrets (Step 4)                 |
| `CORS error`                | Edge function not deployed or CORS issue        |

**Check 2: Network Tab**

1. In DevTools, go to Network tab
2. Try clicking "Start Free Trial" again
3. Look for request to `create-subscription`
4. Click on it and check:
   - **Status:** Should be 200
   - **Response:** Should have `url` and `sessionId`

**Check 3: Verify Stripe IDs in Database**

Run this SQL:

```sql
SELECT
  slug,
  stripe_product_id,
  stripe_price_id,
  CASE
    WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL
    THEN '✅ Ready'
    ELSE '❌ Missing Stripe IDs'
  END as status
FROM membership_plans
WHERE slug = 'family-pass';
```

**Check 4: Verify Supabase Secrets**

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault
2. Verify these secrets exist:
   - ✅ `STRIPE_SECRET_KEY`
   - ✅ `STRIPE_WEBHOOK_SECRET`
   - ✅ `FRONTEND_URL`

**Check 5: Test Edge Function Directly**

Run this in browser console on your site:

```javascript
// This tests if edge function is accessible
const { data, error } = await supabase.functions.invoke('create-subscription', {
  body: {
    planSlug: 'family-pass',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    startTrial: true,
  },
});

console.log('Success:', data);
console.log('Error:', error);
```

---

## 📞 Need More Help?

If you're still stuck after following all steps, please share:

1. **Screenshot of browser console errors** (F12 → Console tab)
2. **Screenshot of Network tab** showing the failed request
3. **Result of this SQL query:**

```sql
SELECT
  slug,
  stripe_product_id IS NOT NULL as has_product_id,
  stripe_price_id IS NOT NULL as has_price_id
FROM membership_plans
WHERE slug = 'family-pass';
```

4. **Supabase secrets status:** Are all 3 secrets set?

---

## ✅ Success Checklist

Mark these off as you complete each step:

- [ ] Created Stripe product
- [ ] Copied Product ID and Price ID
- [ ] Copied Stripe Secret Key
- [ ] Updated database with Stripe IDs (ran SQL)
- [ ] Verified Stripe IDs in database
- [ ] Added `STRIPE_SECRET_KEY` to Supabase
- [ ] Added `FRONTEND_URL` to Supabase
- [ ] Created Stripe webhook endpoint
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Supabase
- [ ] Verified edge functions are deployed
- [ ] Tested enrollment flow end-to-end
- [ ] Successfully redirected to Stripe checkout
- [ ] Completed test payment with test card
- [ ] Verified subscription in database

---

## 🎯 Quick Reference

**Stripe Dashboard URLs:**

- Products: https://dashboard.stripe.com/test/products
- API Keys: https://dashboard.stripe.com/test/apikeys
- Webhooks: https://dashboard.stripe.com/test/webhooks

**Supabase Dashboard URLs:**

- SQL Editor: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql
- Secrets: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault
- Functions: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/functions

**Test Enrollment:**

- URL: https://aiborg-ai-web.vercel.app/family-membership/enroll
- Test Card: `4242 4242 4242 4242`

---

**Last Updated:** 2025-01-19 **Status:** Ready for setup
