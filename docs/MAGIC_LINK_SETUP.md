# Magic Link Authentication Setup Guide

This guide explains how to configure and use magic link (passwordless) authentication in the AIBORG
Learn Sphere platform.

## Overview

Magic link authentication provides a passwordless sign-in experience where users receive a secure,
one-time link via email to access their account. This improves security and user experience by
eliminating the need to remember passwords.

## Features

✅ **Passwordless Authentication** - No password required ✅ **One-Click Sign In** - Click link in
email to sign in ✅ **Auto Account Creation** - Creates account if user doesn't exist ✅
**Secure** - Links expire after 1 hour and can only be used once ✅ **Rate Limited** - Prevents
abuse with request throttling ✅ **Mobile Friendly** - Works seamlessly on all devices

## How It Works

1. **User enters email** - On the auth page, user provides their email address
2. **Magic link sent** - System sends secure link to user's email
3. **User clicks link** - Link opens in browser and authenticates user
4. **Automatic sign in** - User is signed in without entering a password

## Supabase Configuration

### Step 1: Enable Magic Link in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Providers**
3. Scroll to **Magic Link** section
4. Ensure **Enable Email Provider** is turned ON
5. Configure the following settings:

#### Email Settings

```
Enable Email Provider: ON
Enable Confirm Email: ON (recommended for security)
Secure Email Change: ON (recommended)
```

#### Magic Link Settings

```
Enable Magic Link: ON
Magic Link Expiry: 3600 seconds (1 hour - default)
```

### Step 2: Configure Email Templates

1. Navigate to **Authentication → Email Templates**
2. Select **Magic Link** template
3. Copy the contents from `supabase/templates/magic-link-email.html`
4. Paste into the template editor
5. Customize the template if needed
6. Click **Save**

#### Template Variables Available

The following variables are available in email templates:

- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - The magic link URL
- `{{ .SiteURL }}` - Your site URL (from Supabase config)
- `{{ .TokenHash }}` - Token hash (for advanced use)

### Step 3: Configure URL Settings

1. Navigate to **Authentication → URL Configuration**
2. Set the following URLs:

```
Site URL: https://your-production-domain.com
(or http://localhost:5173 for local development)

Redirect URLs (add all):
- https://your-production-domain.com/**
- http://localhost:5173/**
- http://localhost:3000/**
```

**Important:** The wildcard `**` allows redirects to any path on your domain.

### Step 4: Configure Email Provider (SMTP)

For production, configure a custom SMTP provider for reliable email delivery:

1. Navigate to **Project Settings → Auth → SMTP Settings**
2. Choose a provider:
   - **SendGrid** (recommended)
   - **Mailgun**
   - **AWS SES**
   - **Custom SMTP**

#### Example: SendGrid Configuration

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: <your-sendgrid-api-key>
Sender Email: noreply@yourdomain.com
Sender Name: AIBORG Learn Sphere
Enable TLS: ON
```

**Note:** For local development, Supabase provides a default SMTP service, but it has rate limits.
Use a custom SMTP provider for production.

## Frontend Integration

### Using the MagicLinkAuth Component

```typescript
import { MagicLinkAuth } from '@/components/auth/MagicLinkAuth';

function AuthPage() {
  return (
    <MagicLinkAuth
      onSuccess={() => console.log('Magic link sent!')}
      redirectTo="https://yourdomain.com/dashboard"
    />
  );
}
```

### Component Props

| Prop         | Type         | Description                      | Default                  |
| ------------ | ------------ | -------------------------------- | ------------------------ |
| `onSuccess`  | `() => void` | Callback when magic link is sent | -                        |
| `redirectTo` | `string`     | URL to redirect after sign in    | `window.location.origin` |

### Programmatic Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: 'https://yourdomain.com/dashboard',
      shouldCreateUser: true, // Auto-create account if doesn't exist
    },
  });

  if (error) {
    console.error('Magic link error:', error);
  } else {
    console.log('Magic link sent to:', email);
  }
}
```

## Integration with Existing Auth Page

The magic link component has been integrated into the main Auth page as a tab option:

```typescript
// In src/pages/Auth.tsx
<Tabs defaultValue="signin">
  <TabsList>
    <TabsTrigger value="signin">Sign In</TabsTrigger>
    <TabsTrigger value="magiclink">Magic Link</TabsTrigger>
    <TabsTrigger value="signup">Sign Up</TabsTrigger>
  </TabsList>

  <TabsContent value="magiclink">
    <MagicLinkAuth redirectTo={window.location.origin} />
  </TabsContent>
</Tabs>
```

## Security Features

### Rate Limiting

Magic link requests are rate-limited to prevent abuse:

- **5 requests per 5 minutes** per email address
- Uses the same rate limiter as password sign-in
- Displays clear error messages when limit is reached

```typescript
import { checkSignInLimit, resetAuthLimit } from '@/utils/rateLimiter';

// Check rate limit before sending
const rateLimit = checkSignInLimit(email);
if (!rateLimit.allowed) {
  console.error(rateLimit.message);
  return;
}

// Reset on successful send
resetAuthLimit(email);
```

### Link Expiration

- Magic links expire after **1 hour** (configurable in Supabase)
- Links can only be used **once**
- Clicking an expired or used link shows an error

### Email Validation

- Email format is validated before sending
- Emails are normalized (trimmed, lowercased)
- Invalid emails are rejected immediately

```typescript
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

## User Experience

### Success Flow

1. User enters email
2. Sees confirmation: "Check Your Email"
3. Email arrives with magic link
4. User clicks link
5. Automatically signed in and redirected

### Email Sent Screen

```
✅ Check Your Email

We've sent a magic link to user@example.com

📧 Magic Link Sent
• Click the link in your email to sign in
• The link is valid for 1 hour
• You can close this window

[Resend Magic Link]
[Use a Different Email]
```

### Error Handling

Common errors and how they're handled:

| Error               | User Message                                         | Solution         |
| ------------------- | ---------------------------------------------------- | ---------------- |
| Invalid email       | "Please enter a valid email address"                 | Fix email format |
| Rate limit exceeded | "Too many sign-in attempts. Please try again later." | Wait 5 minutes   |
| Network error       | "Failed to send magic link. Please try again."       | Retry request    |
| Link expired        | "This link has expired"                              | Request new link |
| Link already used   | "This link has already been used"                    | Request new link |

## Testing

### Local Development Testing

1. Start local development server:

```bash
npm run dev
```

2. Navigate to: `http://localhost:5173/auth`

3. Click **Magic Link** tab

4. Enter your email address

5. Check your email inbox (or Supabase Auth logs)

6. Click the magic link

7. You should be redirected and signed in

### Testing with Supabase Local Email

Supabase provides a local email inbox for development:

1. Navigate to your Supabase dashboard
2. Go to **Authentication → Users**
3. Click **View Email** to see sent emails
4. Copy the magic link URL
5. Paste in browser to test

### Production Testing

Before launching:

1. ✅ Test with real email address
2. ✅ Verify email delivery time (< 30 seconds)
3. ✅ Test link expiration after 1 hour
4. ✅ Verify link can only be used once
5. ✅ Test rate limiting (send 6 requests quickly)
6. ✅ Test on mobile devices
7. ✅ Test with different email providers (Gmail, Outlook, etc.)

## Troubleshooting

### Magic link emails not arriving

**Possible causes:**

- SMTP not configured correctly
- Email in spam folder
- Rate limit reached
- Invalid email address

**Solutions:**

1. Check Supabase logs: **Authentication → Logs**
2. Verify SMTP settings: **Project Settings → Auth → SMTP**
3. Check spam/junk folder
4. Verify email is valid format
5. Wait 5 minutes if rate limited

### Link says "expired" immediately

**Possible causes:**

- System clock mismatch
- Link already used
- Copied link incorrectly (truncated)

**Solutions:**

1. Request new magic link
2. Ensure full URL is copied
3. Check system time is correct
4. Don't click link multiple times

### Redirect not working after sign in

**Possible causes:**

- Redirect URL not whitelisted in Supabase
- Wrong `redirectTo` parameter

**Solutions:**

1. Add redirect URL to **Authentication → URL Configuration**
2. Use full URL with protocol: `https://domain.com/path`
3. Check browser console for errors

### Rate limiting too strict

**Solutions:**

1. Increase rate limit in `src/utils/rateLimiter.ts`:

```typescript
// Change from 5 attempts to 10 attempts
const MAX_ATTEMPTS = 10;
```

2. Or disable rate limiting for testing (not recommended for production):

```typescript
// In MagicLinkAuth.tsx, comment out rate limit check
// const rateLimit = checkSignInLimit(email);
```

## Best Practices

### For Users

1. ✅ Check spam folder if email doesn't arrive
2. ✅ Click link within 1 hour
3. ✅ Don't share magic links with anyone
4. ✅ Use the same browser/device where you requested the link

### For Developers

1. ✅ Always use HTTPS in production
2. ✅ Configure custom SMTP provider (SendGrid, Mailgun, etc.)
3. ✅ Customize email template with your branding
4. ✅ Set appropriate rate limits
5. ✅ Monitor authentication logs
6. ✅ Test email deliverability regularly
7. ✅ Provide clear error messages
8. ✅ Add fallback to password auth

## Monitoring

### Track Magic Link Usage

Query Supabase to track magic link usage:

```sql
-- Count magic link sign-ins
SELECT COUNT(*)
FROM auth.audit_log_entries
WHERE action = 'user_signedup'
  AND method = 'otp'
  AND created_at > NOW() - INTERVAL '7 days';

-- Magic link success rate
SELECT
  COUNT(CASE WHEN success = true THEN 1 END) as successful,
  COUNT(CASE WHEN success = false THEN 1 END) as failed,
  ROUND(100.0 * COUNT(CASE WHEN success = true THEN 1 END) / COUNT(*), 2) as success_rate
FROM auth.audit_log_entries
WHERE action = 'user_signedin'
  AND method = 'otp'
  AND created_at > NOW() - INTERVAL '7 days';
```

### Email Delivery Monitoring

Track email delivery with your SMTP provider:

- **SendGrid:** Dashboard → Email Activity
- **Mailgun:** Logs → Email Logs
- **AWS SES:** CloudWatch Metrics

## FAQ

**Q: Can users sign up with magic link?** A: Yes! Set `shouldCreateUser: true` in the OTP options.
If the email doesn't exist, an account is automatically created.

**Q: How long are magic links valid?** A: Default is 1 hour (3600 seconds). Configurable in Supabase
dashboard under Authentication settings.

**Q: Can I customize the email template?** A: Yes! Edit the template in **Authentication → Email
Templates → Magic Link**.

**Q: Is magic link secure?** A: Yes! Links are:

- Cryptographically secure random tokens
- Single-use only
- Time-limited (1 hour)
- Sent over HTTPS
- Protected by rate limiting

**Q: What happens if user changes email client?** A: The magic link works across devices and
browsers. User just needs to click the link in the email.

**Q: Can I use magic link alongside password auth?** A: Yes! Users can choose either method. Both
are supported simultaneously.

## Additional Resources

- [Supabase Magic Link Docs](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Email Provider Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [Authentication Best Practices](https://supabase.com/docs/guides/auth/auth-helpers)

## Support

For issues or questions:

1. Check Supabase logs: **Authentication → Logs**
2. Review email provider dashboard
3. Test with different email addresses
4. Contact support with error details

---

**Last Updated:** 2025-11-09 **Version:** 1.0
