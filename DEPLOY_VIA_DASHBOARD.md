# 🚀 Deploy Edge Functions via Supabase Dashboard

Since CLI deployment requires authentication, let's deploy directly through the Supabase Dashboard.

---

## 📋 What You Need to Deploy

3 Edge Functions:
1. `create-subscription` - Creates Stripe checkout sessions
2. `manage-subscription` - Handles pause/cancel/resume
3. `stripe-webhook-subscription` - Processes Stripe webhooks

---

## 🎯 Quick Deploy (10 minutes)

### Step 1: Open Supabase Edge Functions

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/functions

### Step 2: Deploy create-subscription

1. Click **"Deploy a new function"** or **"Create function"**
2. Function name: `create-subscription`
3. Click **"Create function"**
4. In the editor, **delete all existing code**
5. Copy ALL contents from:
   ```
   /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/create-subscription/index.ts
   ```
6. Paste into the editor
7. Click **"Deploy"** or **"Save"**
8. ✅ Wait for deployment to complete

### Step 3: Deploy manage-subscription

1. Click **"Deploy a new function"**
2. Function name: `manage-subscription`
3. Copy ALL contents from:
   ```
   /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/manage-subscription/index.ts
   ```
4. Paste into the editor
5. Click **"Deploy"**
6. ✅ Wait for deployment to complete

### Step 4: Deploy stripe-webhook-subscription

1. Click **"Deploy a new function"**
2. Function name: `stripe-webhook-subscription`
3. Copy ALL contents from:
   ```
   /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/stripe-webhook-subscription/index.ts
   ```
4. Paste into the editor
5. Click **"Deploy"**
6. ✅ Wait for deployment to complete

---

## ⚙️ Set Environment Variables (Secrets)

### Step 1: Go to Secrets

Still in the Edge Functions page, look for **"Manage secrets"** or go to:
https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/functions

### Step 2: Add Required Secrets

Click **"Add new secret"** for each:

| Name | Value | Where to Get It |
|------|-------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | https://dashboard.stripe.com/test/apikeys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Configure webhook first (see below) |
| `FRONTEND_URL` | `https://aiborg-ai-web.vercel.app` | Your Vercel URL |
| `SUPABASE_URL` | `https://afrulkxxzcmngbrdfuzj.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJ...` | https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/api |

### Step 3: Save Secrets

Click **"Save"** after adding each secret.

---

## 💳 Configure Stripe (15 minutes)

### Step 1: Create Stripe Product

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in:
   - Name: `All Access - Family Membership Pass`
   - Price: `20.00 GBP`
   - Billing: `Monthly`
   - Free trial: `30 days`
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_`)

### Step 2: Update Database

Run in Supabase SQL Editor:

```sql
UPDATE membership_plans
SET stripe_price_id = 'price_YOUR_PRICE_ID_HERE'
WHERE slug = 'family-pass';

-- Verify
SELECT name, stripe_price_id FROM membership_plans WHERE slug = 'family-pass';
```

### Step 3: Configure Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Endpoint URL:
   ```
   https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/stripe-webhook-subscription
   ```
4. Click **"Select events"**
5. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Click **"Add events"**
7. Click **"Add endpoint"**
8. Click on the webhook you just created
9. Click **"Reveal"** under "Signing secret"
10. Copy the secret (starts with `whsec_`)
11. Add it to Supabase secrets (see Step 2 above)

---

## ✅ Verify Deployment

### Check Functions Are Deployed

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/functions

You should see:
- ✅ create-subscription (deployed)
- ✅ manage-subscription (deployed)
- ✅ stripe-webhook-subscription (deployed)

### Test the Endpoint

Open in browser (should return error about missing parameters - that's OK):
```
https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/create-subscription
```

Expected: Should NOT show 404, should show error about authorization or missing parameters.

---

## 🧪 Test Enrollment Flow

1. Go to: https://aiborg-ai-web.vercel.app/family-membership/enroll
2. Fill in the form
3. Click "Start Free Trial"
4. Use test card: `4242 4242 4242 4242`
5. ✅ Should redirect to Stripe Checkout

---

## 🔧 Troubleshooting

### CORS Error

If you still see CORS errors, check that the Edge Function includes:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### 404 Error on Function

- Check function is deployed
- Check function name matches exactly: `create-subscription`
- Check URL is correct

### "Unauthorized" Error

- Check `STRIPE_SECRET_KEY` is set in secrets
- Check you're using the correct Stripe key (test vs live)

### Webhook Not Working

- Check webhook URL matches your Supabase project
- Check webhook secret is set in Supabase secrets
- Check selected events include subscription events
- Check webhook logs in Stripe Dashboard

---

## 📝 Alternative: Use Supabase CLI with Access Token

If you prefer CLI deployment:

### Step 1: Get Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Name it: `cli-deployment`
4. Click **"Generate token"**
5. Copy the token

### Step 2: Deploy with Token

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

export SUPABASE_ACCESS_TOKEN=sbp_your_token_here

npx supabase functions deploy create-subscription --project-ref afrulkxxzcmngbrdfuzj
npx supabase functions deploy manage-subscription --project-ref afrulkxxzcmngbrdfuzj
npx supabase functions deploy stripe-webhook-subscription --project-ref afrulkxxzcmngbrdfuzj
```

---

## 🎉 Done!

Once all functions are deployed and Stripe is configured, your enrollment system should work!

Test it by visiting:
```
https://aiborg-ai-web.vercel.app/family-membership/enroll
```

---

**Need help? Check the function logs:**
https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/logs/edge-functions
