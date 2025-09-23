# Supabase URL Configuration Fix

## Required URL Settings in Supabase Dashboard

Go to **Authentication → URL Configuration** and set:

### 1. Site URL
```
https://aiborg-ai-web.vercel.app
```

### 2. Redirect URLs (Add ALL of these)
```
https://aiborg-ai-web.vercel.app/*
https://aiborg-ai-web.vercel.app/auth/callback
https://aiborg-ai-web.vercel.app/auth/reset-password
https://aiborg-ai-lt5ncnonq-hirendra-vikrams-projects.vercel.app/*
http://localhost:8080/*
http://localhost:5173/*
http://localhost:3000/*
```

### 3. Email Templates (Authentication → Email Templates)

Go to **Email Templates** and check the **Reset Password** template.

The default template should have:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

Make sure the **Confirmation URL** in the template uses:
```
{{ .SiteURL }}/auth/reset-password?token={{ .Token }}&type=recovery
```

## Quick Fix via SQL

If you just want to reset your password without the email flow, run this in Supabase SQL Editor:

```sql
-- Update user password directly (replace with your email and new password hash)
-- First, get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@gmail.com';

-- Option 1: Delete user and recreate (easiest)
DELETE FROM auth.users WHERE email = 'your-email@gmail.com';
-- Then sign up again with new password

-- Option 2: Use Supabase Dashboard
-- Go to Authentication → Users → Click on user → Reset Password
```

## Alternative: Skip Password Reset

1. **Create a new account** with a different email
2. Grant it admin access
3. Use that account instead

```sql
-- Grant admin to your new account
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'your-new-email@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;
```