# Password Reset Fix Guide

## Issue Summary
The password reset flow requires proper configuration in Supabase Dashboard for emails to work correctly.

## Step-by-Step Fix

### 1. Update Supabase URL Configuration

Go to your Supabase Dashboard:
1. Navigate to **Authentication → URL Configuration**
2. Update the following settings:

#### Site URL
Set this to your production URL:
```
https://aiborg-ai-web.vercel.app
```

#### Redirect URLs
Add ALL of these URLs (remove any old ones first):
```
https://aiborg-ai-web.vercel.app/*
https://aiborg-ai-web.vercel.app/auth/callback
https://aiborg-ai-web.vercel.app/auth/reset-password
http://localhost:8080/*
http://localhost:5173/*
http://localhost:3000/*
```

### 2. Update Email Templates

Go to **Authentication → Email Templates**:
1. Select **Reset Password** template
2. Make sure it contains:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### 3. Check Email Settings

Go to **Authentication → Providers → Email**:
1. Ensure "Enable Email Provider" is ON
2. Check "Confirm email" setting (can be OFF for testing)
3. Make sure "Enable email link sign in" is OFF (unless you want magic links)

### 4. SMTP Configuration (Optional but Recommended)

If emails aren't sending reliably:
1. Go to **Project Settings → Auth**
2. Configure custom SMTP settings:
   - Use services like SendGrid, Mailgun, or Resend
   - This ensures reliable email delivery

### 5. Test the Flow

1. Go to https://aiborg-ai-web.vercel.app/auth
2. Click "Forgot password?"
3. Enter your email
4. Check your email (including spam folder)
5. Click the reset link
6. Enter your new password

## Alternative Solutions

### Option A: Manual Password Reset via Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Click the three dots → Reset Password
4. You'll receive an email immediately

### Option B: Create New Admin Account
```sql
-- Run in Supabase SQL Editor
-- 1. First sign up with a new email at https://aiborg-ai-web.vercel.app/auth
-- 2. Then run this to make it admin:

INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'your-new-email@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;
```

### Option C: Direct Password Update (Advanced)
If you have access to Supabase service role key:
```bash
curl -X PUT "https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/admin/users/{user-id}" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "your-new-password"}'
```

## Common Issues and Fixes

### Email Not Received
- Check spam/junk folder
- Verify email address exists in Supabase Users
- Check Supabase email logs: Authentication → Logs

### 404 Error on Reset Link
- The /auth/reset-password route is now implemented
- Make sure you're using the latest deployment

### "Invalid token" Error
- Token might be expired (default 1 hour)
- Request a new reset email
- Check that the URL hasn't been modified

### Email Shows as Invalid
- Some domains (like @aiborg.ai) might not work without proper DNS setup
- Use a standard email provider (Gmail, Outlook, etc.)

## Testing Checklist
- [ ] Site URL is set to https://aiborg-ai-web.vercel.app
- [ ] Redirect URLs include production and localhost URLs
- [ ] Email template is configured correctly
- [ ] Password reset page exists at /auth/reset-password
- [ ] Emails are being sent (check logs if not)
- [ ] Reset link redirects to correct URL
- [ ] New password can be set successfully

## Need Help?
If issues persist after following this guide:
1. Check Supabase Logs: Authentication → Logs
2. Verify environment variables are set in Vercel
3. Try using a different email address
4. Consider setting up custom SMTP for reliable delivery