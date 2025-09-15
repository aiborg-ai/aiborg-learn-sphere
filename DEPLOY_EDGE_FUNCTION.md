# Deploy Edge Function for Email Notifications

## Option 1: Deploy via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Functions** section
3. Click **Create a new function**
4. Name: `send-contact-notification`
5. Copy the entire contents of `/supabase/functions/send-contact-notification/index.ts`
6. Click **Advanced Settings** and add environment variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_FAxvwTTu_9FxfkEWrsj15LCenPauT8aBj`
7. Deploy the function

## Option 2: Alternative Email Solutions

### A. Use Supabase Database Webhook
1. Go to Database → Webhooks
2. Create webhook that triggers on `contact_messages` INSERT
3. Point to your email service endpoint

### B. Use Supabase Realtime + External Service
1. Set up a listener on your server
2. When new message inserted, send email via your backend

### C. Direct Email Link (Simplest)
Instead of automated emails, add a mailto link that opens the user's email client:

```javascript
// Add this to ContactSection after successful submission
window.location.href = `mailto:hirendra.vikram@aiborg.ai?subject=New Contact: ${formData.subject}&body=From: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0AAudience: ${formData.audience}%0D%0A%0D%0AMessage:%0D%0A${formData.message}`;
```

## Testing the Edge Function

Once deployed, you can test it directly:

```bash
curl -X POST https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/send-contact-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "audience": "general",
    "message": "Test message"
  }'
```

## Why Email Isn't Working

The email notification isn't working because:
1. **Edge function not deployed** - It needs to be manually deployed to Supabase
2. **Resend API key not configured** - Environment variable needs to be set
3. **401 Unauthorized** - The function might need proper CORS/auth setup

## Quick Fix Without Edge Functions

If you want email notifications without deploying edge functions, I can:
1. Remove the edge function call
2. Add a database trigger that logs messages for manual review
3. Show the admin email in the success message so users know where their message went

The contact form IS working - messages are being saved to the database. The only missing piece is the automated email notification.