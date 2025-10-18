# ⚡ Quick Start - Deploy Family Membership in 5 Minutes

This is the fastest way to deploy the Family Membership system.

---

## ✅ Prerequisites (2 minutes)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Navigate to project
cd /home/vik/aiborg_CC/aiborg-learn-sphere
```

---

## 🚀 Option 1: Automated Deployment (Recommended)

Run the automated deployment script:

```bash
# Make script executable (if not already)
chmod +x deploy-family-membership.sh

# Run deployment script
./deploy-family-membership.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Link to Supabase project
- ✅ Run database migrations
- ✅ Deploy all Edge Functions
- ✅ Set required secrets
- ✅ Provide next steps

**That's it!** Follow the on-screen instructions for Stripe setup.

---

## 🔧 Option 2: Manual Deployment (Step-by-Step)

### Step 1: Database Setup (1 minute)

Go to Supabase SQL Editor: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

Copy and run these files one by one:

1. `supabase/migrations/20251017120000_membership_plans.sql`
2. `supabase/migrations/20251017120001_membership_subscriptions.sql`

### Step 2: Deploy Edge Functions (2 minutes)

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Link project
supabase link --project-ref afrulkxxzcmngbrdfuzj

# Deploy functions
supabase functions deploy create-subscription --project-ref afrulkxxzcmngbrdfuzj
supabase functions deploy manage-subscription --project-ref afrulkxxzcmngbrdfuzj
supabase functions deploy stripe-webhook-subscription --project-ref afrulkxxzcmngbrdfuzj
```

### Step 3: Set Secrets (1 minute)

```bash
# Get your Stripe secret key from: https://dashboard.stripe.com/test/apikeys

supabase secrets set STRIPE_SECRET_KEY="sk_test_YOUR_KEY" --project-ref afrulkxxzcmngbrdfuzj
supabase secrets set FRONTEND_URL="https://aiborg-ai-web.vercel.app" --project-ref afrulkxxzcmngbrdfuzj
```

### Step 4: Configure Stripe (2 minutes)

See: `STRIPE_SETUP_GUIDE.md` for detailed Stripe configuration.

Quick version:
1. Create product in Stripe Dashboard
2. Copy Price ID
3. Update database:

```sql
UPDATE membership_plans
SET stripe_price_id = 'price_YOUR_PRICE_ID'
WHERE slug = 'family-pass';
```

### Step 5: Set Up Webhook (1 minute)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/stripe-webhook-subscription`
3. Select all subscription and checkout events
4. Copy webhook secret
5. Run:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET" --project-ref afrulkxxzcmngbrdfuzj
```

---

## 🧪 Quick Test

```bash
# 1. Visit enrollment page
open https://aiborg-ai-web.vercel.app/family-membership/enroll

# 2. Use test card
Card: 4242 4242 4242 4242
Expiry: 12/26
CVC: 123

# 3. Check database
# Run in Supabase SQL Editor:
SELECT * FROM membership_subscriptions ORDER BY created_at DESC LIMIT 1;
```

---

## 📚 Full Documentation

If you need more details:

| Guide | What's Inside |
|-------|--------------|
| `DEPLOY_STEP_BY_STEP.md` | Detailed walkthrough with screenshots |
| `STRIPE_SETUP_GUIDE.md` | Complete Stripe configuration guide |
| `setup-stripe.sql` | SQL helper queries for Stripe setup |
| `FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md` | System architecture and features |

---

## ⚠️ Troubleshooting

### "Command not found: supabase"

```bash
npm install -g supabase
```

### "Not logged in"

```bash
supabase login
```

### "Project not linked"

```bash
supabase link --project-ref afrulkxxzcmngbrdfuzj
```

### "Edge function deployment failed"

```bash
# Check if you're in the right directory
pwd  # Should be: /home/vik/aiborg_CC/aiborg-learn-sphere

# Try re-linking
supabase link --project-ref afrulkxxzcmngbrdfuzj

# Try deploying again
supabase functions deploy create-subscription --project-ref afrulkxxzcmngbrdfuzj
```

### "Webhook not working"

1. Check secrets are set: `supabase secrets list --project-ref afrulkxxzcmngbrdfuzj`
2. Check webhook URL is correct
3. Check Stripe webhook logs: https://dashboard.stripe.com/test/webhooks
4. Check Supabase function logs

---

## 🎯 Next Steps After Deployment

1. ✅ Test enrollment flow
2. ✅ Add family members
3. ✅ Test subscription management
4. ✅ Configure email notifications (see `DEPLOY_FAMILY_MEMBERSHIP_EMAILS.md`)
5. ✅ Go live with production keys

---

## 🆘 Need Help?

Run these diagnostic commands:

```bash
# Check Supabase connection
supabase projects list

# Check secrets
supabase secrets list --project-ref afrulkxxzcmngbrdfuzj

# Check functions
supabase functions list --project-ref afrulkxxzcmngbrdfuzj

# View function logs
supabase functions logs create-subscription --project-ref afrulkxxzcmngbrdfuzj
```

---

**You're all set! Happy deploying! 🚀**
