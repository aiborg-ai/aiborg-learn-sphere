# Manual Password Reset Guide

Based on your Supabase Users dashboard, here are the ways to reset passwords:

## Method 1: Direct Dashboard Reset (Easiest)

1. Go to your Supabase Dashboard → Authentication → Users
2. Find your user (e.g., `hirendra.vikram@gmail.com`)
3. Click the three dots (⋮) on the right
4. Select **"Send Password Recovery"**
5. Check your email for the reset link

## Method 2: Use a Working Account

Since you have multiple test accounts created, you can:
1. Use one of these existing accounts:
   - `hellomail@gmail.com`
   - `testmail555@gmail.com`
   - `testuser555@gmail.com`

2. Grant it admin access using this SQL:
```sql
-- Run in Supabase SQL Editor
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'testmail555@gmail.com'  -- Use any of your test emails
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;
```

## Method 3: Create Fresh Account

1. Go to https://aiborg-ai-web.vercel.app/auth
2. Sign up with a new email (use a Gmail/Outlook address for reliability)
3. Once created, run the SQL script to grant admin:
```sql
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'your-new-email@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;
```

## Method 4: Update Password via SQL (Advanced)

If you want to set a specific password directly:

1. First, delete the old user:
```sql
DELETE FROM auth.users WHERE email = 'hirendra.vikram@gmail.com';
```

2. Then sign up again with the same email and your new password at:
   https://aiborg-ai-web.vercel.app/auth

3. Grant admin access:
```sql
INSERT INTO user_roles (user_id, role, is_active)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'hirendra.vikram@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', is_active = true;
```

## Troubleshooting Email Issues

### If emails aren't arriving:
1. **Check Spam/Junk folder**
2. **Verify Supabase Email Settings:**
   - Go to Authentication → Providers → Email
   - Make sure "Enable Email Provider" is ON
   - Consider disabling "Confirm email" for testing

3. **Check Email Logs:**
   - Go to Authentication → Logs
   - Look for email send events
   - Check for any error messages

### For @aiborg.ai domain issues:
The @aiborg.ai domain might not receive emails properly without:
- Proper MX records configured
- SPF/DKIM settings
- Domain verification in Supabase

**Recommendation:** Use a standard email provider (Gmail, Outlook) for admin accounts.

## Quick Access Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
- **Users Management:** https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/users
- **SQL Editor:** https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql
- **Live App:** https://aiborg-ai-web.vercel.app

## Currently Active Users (from your screenshot)

| Email | Created | Last Sign In |
|-------|---------|--------------|
| hirendra.vikram@gmail.com | Sep 15, 2024 | Sep 15, 2024 |
| hellomail@gmail.com | Sep 18, 2024 | Sep 18, 2024 |
| testmail555@gmail.com | Sep 18, 2024 | Sep 18, 2024 |
| testuser555@gmail.com | Sep 18, 2024 | - |
| And others... | | |

Choose any of these accounts and reset their password using Method 1 above.