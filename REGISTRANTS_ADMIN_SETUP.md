# Registrants Management Admin Dashboard - Setup Guide

## 📋 Overview

A comprehensive admin dashboard feature for viewing and managing all registrants across
**Sessions**, **Events**, and **Courses**, with powerful batch messaging capabilities.

---

## ✅ What's Been Created

### **1. Components**

#### **RegistrantsManagement** (`src/components/admin/RegistrantsManagement.tsx`)

Main admin component with three tabs (Sessions, Events, Courses):

**Features:**

- ✅ View all registrants with detailed information
- ✅ Search by name, email, or entity name
- ✅ Filter by status (confirmed, pending, waitlisted, cancelled, etc.)
- ✅ Filter by specific session/event/course
- ✅ Multi-select registrants with checkboxes
- ✅ Export selected registrants to CSV
- ✅ Send batch messages to selected registrants
- ✅ Real-time data from Supabase
- ✅ Responsive table with sorting
- ✅ Status badges with color coding
- ✅ Age tracking for sessions (COPPA compliance indicator)

#### **BatchMessageDialog** (`src/components/admin/BatchMessageDialog.tsx`)

Dialog for composing and sending batch emails:

**Features:**

- ✅ Rich email composition form
- ✅ Custom subject and sender name
- ✅ Reply-to email configuration
- ✅ Live message preview
- ✅ Recipient count display
- ✅ Progress tracking during send
- ✅ Error handling and reporting
- ✅ Success confirmation
- ✅ Professional HTML email templates

### **2. Supabase Edge Function**

#### **send-batch-email** (`supabase/functions/send-batch-email/index.ts`)

Server-side function for sending batch emails:

**Features:**

- ✅ Admin authentication and authorization
- ✅ Rate limiting (max 100 recipients per batch)
- ✅ Integration with Resend email service
- ✅ Professional HTML email templates
- ✅ Error tracking per recipient
- ✅ Email delivery logging
- ✅ CORS support
- ✅ Development mode (logs without sending)

### **3. Admin Panel Integration**

- ✅ New "Registrants" tab in admin dashboard
- ✅ Icon: Mail envelope
- ✅ Accessible at `/admin` → "Registrants" tab

---

## 🚀 Setup Instructions

### **Step 1: Deploy the Components**

The components are already created and integrated. No action needed!

### **Step 2: Deploy the Supabase Edge Function**

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Deploy the send-batch-email function
supabase functions deploy send-batch-email
```

### **Step 3: Configure Email Service (Resend)**

1. **Sign up for Resend** (if you haven't):
   - Visit: https://resend.com
   - Create an account
   - Verify your sending domain

2. **Get API Key**:
   - Go to Settings → API Keys
   - Create new API key
   - Copy the key

3. **Set Supabase Secret**:

   ```bash
   # Using Supabase CLI
   supabase secrets set RESEND_API_KEY=your_api_key_here

   # Or via Supabase Dashboard:
   # Project Settings → Edge Functions → Secrets
   # Add: RESEND_API_KEY = your_api_key_here
   ```

4. **Configure Sending Domain**:
   - In Resend dashboard, add your domain (e.g., aiborg.ai)
   - Add DNS records as instructed
   - Verify domain
   - Update sender in Edge Function (line 138): `from: "${senderName} <noreply@aiborg.ai>"`

---

## 📊 Database Tables Used

### Sessions:

- `free_sessions` - Session details
- `session_registrations` - Registrant data

### Events:

- `events` - Event details
- `event_registrations` - Registrant data
- `profiles` - User names

### Courses:

- `courses` - Course details
- `enrollments` - Enrollment data
- `profiles` - User information

### Optional Logging:

```sql
-- Create email logs table (optional but recommended)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID REFERENCES auth.users(id),
  recipient_count INTEGER NOT NULL,
  subject TEXT NOT NULL,
  entity_type TEXT,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to insert and view
CREATE POLICY "Admins can manage email logs"
ON public.email_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## 🎯 How to Use

### **For Admins**

#### **1. Access the Dashboard**

1. Navigate to `/admin`
2. Click the **"Registrants"** tab (mail icon)

#### **2. View Registrants**

- **Switch tabs** to view Sessions, Events, or Courses
- **Search** by typing in the search box (name, email, entity)
- **Filter by status** using the status dropdown
- **Filter by entity** (specific session, event, or course)
- **Refresh** data with the filter button

#### **3. Select Registrants**

- Click checkboxes to select individual registrants
- Click header checkbox to select all filtered registrants
- Selected count appears in the action bar

#### **4. Send Batch Message**

1. Select registrants with checkboxes
2. Click **"Send Message"** button
3. Fill in the form:
   - **Sender Name:** Display name (e.g., "AIBorg Team")
   - **Reply-To:** Your support email
   - **Subject:** Email subject line
   - **Message:** Your message content
4. Preview your message
5. Click **"Send to [N]"** button
6. Wait for confirmation

#### **5. Export to CSV**

1. Select registrants
2. Click **"Export CSV"** button
3. File downloads automatically
4. Open in Excel, Google Sheets, etc.

---

## 📧 Email Template

Emails are sent with a professional HTML template:

```
┌─────────────────────────────────┐
│  AIBorg Learn Sphere (Header)   │
├─────────────────────────────────┤
│                                 │
│  [Your Message Here]            │
│                                 │
├─────────────────────────────────┤
│  Footer:                        │
│  - Sent by: Sender Name         │
│  - Reply-to: support email      │
│  - Copyright notice             │
└─────────────────────────────────┘
```

The template is automatically applied by the Edge Function.

---

## 🔒 Security & Permissions

### **Admin Access Required**

- Only users with `role = 'admin'` or `role = 'super_admin'` can:
  - Access the Registrants tab
  - View registrant data
  - Send batch messages

### **Rate Limiting**

- Maximum 100 recipients per batch
- 100ms delay between emails to avoid spam
- Resend API has daily limits (check your plan)

### **Data Privacy**

- Parent emails visible for minors (under 13)
- All registrant data protected by RLS
- Email logs track who sent what

---

## 🎨 UI Features

### **Status Badges**

| Status     | Color  | Description            |
| ---------- | ------ | ---------------------- |
| Confirmed  | Green  | Registration confirmed |
| Pending    | Gray   | Awaiting confirmation  |
| Waitlisted | Orange | On waitlist            |
| Cancelled  | Red    | Registration cancelled |
| Completed  | Blue   | Course/event completed |

### **Special Indicators**

- **Minor Badge**: Shows for registrants under 13 (sessions only)
- **Parent Email**: Displayed for minors (COPPA compliance)
- **Age Column**: Shows age for session registrants

### **Responsive Design**

- Mobile-friendly table
- Collapsible filters
- Touch-friendly checkboxes
- Adaptive layout

---

## 🧪 Testing

### **Test in Development Mode**

If `RESEND_API_KEY` is not set, the function runs in DEV MODE:

- Emails are logged to console
- No actual emails sent
- Returns success response
- Useful for testing UI

### **Test with Real Emails**

1. Configure Resend API key
2. Select a few test registrants
3. Send a test message
4. Check your inbox
5. Verify:
   - Email received
   - Formatting correct
   - Links work
   - Reply-to works

---

## 📈 Analytics & Monitoring

### **Check Email Logs**

```sql
-- View recent batch emails
SELECT
  el.*,
  p.display_name as sent_by_name,
  p.email as sent_by_email
FROM public.email_logs el
JOIN public.profiles p ON p.user_id = el.sent_by
ORDER BY sent_at DESC
LIMIT 20;

-- Email stats
SELECT
  entity_type,
  COUNT(*) as batch_count,
  SUM(recipient_count) as total_sent,
  SUM(success_count) as successful,
  SUM(error_count) as failed,
  ROUND(100.0 * SUM(success_count) / NULLIF(SUM(recipient_count), 0), 2) as success_rate
FROM public.email_logs
GROUP BY entity_type;
```

### **Monitor Resend Dashboard**

- Login to https://resend.com
- View Emails → Logs
- Check delivery rates
- Monitor bounces and complaints

---

## 🛠️ Customization

### **Change Email Template**

Edit `supabase/functions/send-batch-email/index.ts`:

```typescript
// Line 138: Change sender domain
from: `${senderName} <noreply@YOUR-DOMAIN.com>`,

// Line 148-180: Customize HTML template
html: `
  <!DOCTYPE html>
  <html>
    <!-- Your custom HTML here -->
  </html>
`
```

### **Add Personalization**

Support mail merge fields like `{name}`, `{entity}`, etc.:

1. Update BatchMessageDialog to show available placeholders
2. Update Edge Function to replace placeholders:

```typescript
const personalizedMessage = message
  .replace(/{name}/g, recipientName)
  .replace(/{entity}/g, entityName);
```

### **Change Rate Limit**

Edit line 135 in Edge Function:

```typescript
// From:
if (recipients.length > 100) {

// To:
if (recipients.length > 500) {
```

---

## 🐛 Troubleshooting

### **Error: "Missing authorization header"**

- User is not logged in
- Session expired
- Solution: Log out and log back in

### **Error: "Forbidden: Admin access required"**

- User is not an admin
- Solution: Update user role in `profiles` table

### **Error: "RESEND_API_KEY not configured"**

- API key not set in Supabase
- Function runs in DEV MODE
- Solution: Set the secret as described in Step 3

### **Emails not sending**

- Check Resend dashboard for errors
- Verify domain is verified
- Check API key is valid
- Review daily sending limits

### **Slow batch sending**

- Expected: 100ms delay per email
- 100 emails = ~10 seconds
- This prevents spam classification

---

## 🎯 Best Practices

### **Email Content**

- Keep subject lines under 60 characters
- Write clear, concise messages
- Include call-to-action if needed
- Always provide contact information
- Test with yourself first

### **Recipient Selection**

- Use filters to target specific groups
- Don't send unnecessary emails
- Respect user preferences
- Send at appropriate times

### **Data Management**

- Export before major operations
- Keep email logs for records
- Monitor bounce rates
- Clean up cancelled registrations

---

## 📞 Support

**For Issues:**

- Email: hirendra.vikram@aiborg.ai
- WhatsApp: +44 7404568207

**Resources:**

- Resend Docs: https://resend.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

## ✅ Checklist

Setup:

- [ ] Components deployed (automatic)
- [ ] Edge function deployed
- [ ] Resend account created
- [ ] API key configured
- [ ] Domain verified
- [ ] Email logs table created (optional)

Testing:

- [ ] Admin access works
- [ ] Can view registrants
- [ ] Search works
- [ ] Filters work
- [ ] Selection works
- [ ] CSV export works
- [ ] Test email sent
- [ ] Email received

Production:

- [ ] Monitor first batch
- [ ] Check delivery rates
- [ ] User feedback collected
- [ ] Email logs reviewed

---

**🎉 Your Registrants Management Dashboard is Ready!**

Navigate to `/admin` → "Registrants" tab to start managing your registrants!

---

_Generated by Claude Code - October 29, 2024_
