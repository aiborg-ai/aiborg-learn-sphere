# 🚀 Family Membership Email System - Deployment Guide

## ✅ What's Been Built

All code is complete and ready for deployment! Here's what was created:

### **📧 6 New Email Templates**
- 🎉 Family Membership Welcome
- 🎁 Family Invitation
- ✅ Payment Success
- ⚠️ Payment Failed
- 📋 Subscription Lifecycle (Pause/Resume/Cancel)
- ⏰ Expiration Warning

### **📁 Files Updated**
- ✅ `/supabase/functions/send-email-notification/index.ts` - 6 new templates added
- ✅ `/supabase/functions/stripe-webhook-subscription/index.ts` - All email triggers implemented
- ✅ `/src/services/membership/FamilyMembersService.ts` - Invitation emails integrated
- ✅ `/src/utils/familyMembershipEmails.ts` - Helper functions created
- ✅ `/docs/FAMILY_MEMBERSHIP_EMAILS.md` - Complete documentation

---

## 🔐 Step 1: Get Supabase Access Token

You need a Supabase access token to deploy edge functions.

### **Option A: Get from Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Give it a name: `cli-deployment`
4. Click **"Generate Token"**
5. **Copy the token** (you won't see it again!)

### **Option B: Use Existing Token** (if you have one)

Check if you have an existing token in your Supabase dashboard.

---

## 🚀 Step 2: Deploy Edge Functions

### **Option A: Deploy with Token (Recommended)**

Run these commands in your terminal:

```bash
# Navigate to project directory
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Deploy send-email-notification function
npx supabase functions deploy send-email-notification \
  --project-ref afrulkxxzcmngbrdfuzj \
  --token YOUR_SUPABASE_ACCESS_TOKEN

# Deploy stripe-webhook-subscription function
npx supabase functions deploy stripe-webhook-subscription \
  --project-ref afrulkxxzcmngbrdfuzj \
  --token YOUR_SUPABASE_ACCESS_TOKEN
```

Replace `YOUR_SUPABASE_ACCESS_TOKEN` with your actual token.

### **Option B: Set Environment Variable**

```bash
# Set the token as an environment variable
export SUPABASE_ACCESS_TOKEN=YOUR_SUPABASE_ACCESS_TOKEN

# Deploy both functions
npx supabase functions deploy send-email-notification --project-ref afrulkxxzcmngbrdfuzj
npx supabase functions deploy stripe-webhook-subscription --project-ref afrulkxxzcmngbrdfuzj
```

### **Option C: Login Interactively** (if you have a browser)

```bash
# Login (opens browser)
npx supabase login

# Then deploy
npx supabase functions deploy send-email-notification
npx supabase functions deploy stripe-webhook-subscription
```

---

## ⚙️ Step 3: Verify Environment Variables

Ensure these secrets are set in your Supabase project:

### **Check Existing Secrets**

```bash
npx supabase secrets list --project-ref afrulkxxzcmngbrdfuzj
```

### **Required Secrets**

You should see:
- ✅ `RESEND_API_KEY` - For sending emails
- ✅ `STRIPE_SECRET_KEY` - For Stripe integration
- ✅ `STRIPE_WEBHOOK_SECRET` - For webhook verification
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- ✅ `APP_URL` - Your app URL (e.g., https://aiborg-ai-web.vercel.app)

### **Set Missing Secrets** (if needed)

```bash
# Set APP_URL (if not already set)
npx supabase secrets set APP_URL=https://aiborg-ai-web.vercel.app \
  --project-ref afrulkxxzcmngbrdfuzj

# Set other secrets as needed
npx supabase secrets set RESEND_API_KEY=your_key_here \
  --project-ref afrulkxxzcmngbrdfuzj
```

---

## ✅ Step 4: Verify Deployment

### **List Deployed Functions**

```bash
npx supabase functions list --project-ref afrulkxxzcmngbrdfuzj
```

You should see:
- ✅ `send-email-notification` (UPDATED with 6 new templates)
- ✅ `stripe-webhook-subscription` (UPDATED with email triggers)

### **Check Function Logs**

```bash
# View send-email-notification logs
npx supabase functions logs send-email-notification --project-ref afrulkxxzcmngbrdfuzj

# View stripe-webhook-subscription logs
npx supabase functions logs stripe-webhook-subscription --project-ref afrulkxxzcmngbrdfuzj
```

---

## 🧪 Step 5: Test Email System

### **Test 1: Welcome Email**

Create a test family membership subscription and verify the welcome email is sent.

```bash
# Monitor logs in real-time
npx supabase functions logs send-email-notification --tail --project-ref afrulkxxzcmngbrdfuzj
```

Then create a subscription in your app. You should see:
```
✅ Welcome email sent to user {userId}
```

### **Test 2: Invitation Email**

Add a family member in your app:

1. Go to `/family-membership`
2. Click **"Invite Family Member"**
3. Enter details and submit
4. Check recipient's email for invitation

### **Test 3: Payment Emails**

Use Stripe test mode to trigger payment events:

```bash
# Install Stripe CLI (if needed)
stripe listen --forward-to your-webhook-url

# Trigger test payment success
stripe trigger payment_intent.succeeded

# Trigger test payment failure
stripe trigger payment_intent.payment_failed
```

---

## 🔍 Troubleshooting

### **Issue: "Cannot find project ref"**

**Solution:** Ensure you're using `--project-ref afrulkxxzcmngbrdfuzj` or the project is linked:

```bash
npx supabase link --project-ref afrulkxxzcmngbrdfuzj
```

### **Issue: "Your account does not have the necessary privileges"**

**Solution:** You need a Supabase access token. Follow Step 1 above.

### **Issue: Emails Not Sending**

**Check these:**

1. **Resend API Key is set:**
   ```bash
   npx supabase secrets list --project-ref afrulkxxzcmngbrdfuzj | grep RESEND
   ```

2. **Function deployed successfully:**
   ```bash
   npx supabase functions list --project-ref afrulkxxzcmngbrdfuzj
   ```

3. **Check function logs for errors:**
   ```bash
   npx supabase functions logs send-email-notification --tail
   ```

4. **Verify email in Resend dashboard:**
   https://resend.com/emails

### **Issue: Webhook Not Triggering Emails**

**Check these:**

1. **Stripe webhook configured:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Verify endpoint URL is correct
   - Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET`

2. **Metadata is passed:**
   Ensure checkout session includes:
   ```javascript
   {
     metadata: {
       user_id: 'user-uuid',
       plan_id: 'plan-uuid'
     }
   }
   ```

3. **Check webhook logs:**
   ```bash
   npx supabase functions logs stripe-webhook-subscription --tail
   ```

---

## 📊 Monitor Email Delivery

### **View Sent Emails in Database**

```sql
-- Check recent emails sent
SELECT
  user_email,
  notification_type,
  sent_at,
  email_id
FROM email_notifications_log
WHERE notification_type IN (
  'family_membership_welcome',
  'family_invitation',
  'membership_payment_success',
  'membership_payment_failed',
  'membership_lifecycle',
  'membership_expiration_warning'
)
ORDER BY sent_at DESC
LIMIT 10;
```

### **Check Delivery Status in Resend**

1. Go to: https://resend.com/emails
2. Search by `email_id` from database
3. View delivery status, opens, clicks

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] Both edge functions deployed successfully
- [ ] Environment variables are set (especially `APP_URL`)
- [ ] Welcome email sent on new subscription
- [ ] Invitation email sent when adding family member
- [ ] Payment success email sent on successful payment
- [ ] Payment failed email sent on failed payment
- [ ] Cancellation email sent when subscription cancelled
- [ ] All emails appear in Resend dashboard
- [ ] All emails appear in `email_notifications_log` table
- [ ] Email links work correctly (dashboard, accept invitation, etc.)

---

## 📚 Additional Resources

### **Documentation**
- Email System Docs: `/docs/FAMILY_MEMBERSHIP_EMAILS.md`
- General Email Docs: `/docs/EMAIL_NOTIFICATIONS.md`
- Deployment Guide: This file

### **Code Files**
- Email Templates: `/supabase/functions/send-email-notification/index.ts`
- Webhook Handler: `/supabase/functions/stripe-webhook-subscription/index.ts`
- Helper Functions: `/src/utils/familyMembershipEmails.ts`
- Service Integration: `/src/services/membership/FamilyMembersService.ts`

### **External Links**
- Supabase Functions: https://supabase.com/docs/guides/functions
- Resend API: https://resend.com/docs
- Stripe Webhooks: https://stripe.com/docs/webhooks

---

## 🆘 Need Help?

If you encounter issues:

1. **Check function logs:**
   ```bash
   npx supabase functions logs <function-name> --tail
   ```

2. **Check Supabase dashboard:**
   - https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj

3. **Check Resend dashboard:**
   - https://resend.com/emails

4. **Review documentation:**
   - `/docs/FAMILY_MEMBERSHIP_EMAILS.md`

---

## 🎉 What's Next?

After successful deployment:

1. ✅ Test all email flows end-to-end
2. ✅ Monitor delivery rates in Resend
3. ✅ Check open rates and engagement
4. ✅ Adjust email content based on metrics
5. ✅ Consider adding more email types (digest, reminders, etc.)

---

**🚀 All code is complete and ready to deploy! Follow the steps above to go live.**

**Last Updated:** 2025-01-17
**Project:** Aiborg Family Membership Pass
**Status:** ✅ Complete - Ready for Deployment
