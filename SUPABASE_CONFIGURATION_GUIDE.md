# Supabase Configuration Guide

Complete step-by-step guide to configure Supabase for the aiborg-learn-sphere security hardening
implementation.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Migrations](#database-migrations)
3. [Encryption Key Setup](#encryption-key-setup)
4. [Magic Link Configuration](#magic-link-configuration)
5. [SMTP Configuration](#smtp-configuration)
6. [URL Configuration](#url-configuration)
7. [Verification Steps](#verification-steps)

---

## Prerequisites

- Access to Supabase Dashboard: https://supabase.com/dashboard
- Project: `afrulkxxzcmngbrdfuzj` (https://afrulkxxzcmngbrdfuzj.supabase.co)
- Admin access to the project

---

## 1. Database Migrations

You need to apply 7 database migrations to enable all security features.

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Get your Supabase access token from: https://supabase.com/dashboard/account/tokens
# Set it as environment variable
export SUPABASE_ACCESS_TOKEN=<your-access-token>

# Link to your project
npx supabase link --project-ref afrulkxxzcmngbrdfuzj

# Apply all migrations
npx supabase db push
```

### Option B: Manual SQL Execution (Via Dashboard)

If CLI doesn't work, apply each migration manually:

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql
2. Click "New query"
3. Copy-paste each migration file content in order:

**Apply in this exact order:**

1. `supabase/migrations/20251109000000_account_lockout_system.sql`
   - Creates failed_login_attempts table
   - Creates account_lockout_status table
   - Implements brute force protection functions

2. `supabase/migrations/20251109000001_rls_security_audit.sql`
   - Enables Row-Level Security on all tables
   - Creates 30+ RLS policies
   - Creates security_audit_log table

3. `supabase/migrations/20251109000002_rate_limiting_system.sql`
   - Creates rate_limit_config table
   - Creates rate_limit_tracking table
   - Implements API rate limiting functions

4. `supabase/migrations/20251109000003_pii_encryption_system.sql`
   - Creates encrypted_pii table
   - Creates encryption_keys table
   - Implements AES-256-GCM encryption functions
   - Creates PII access audit log

5. `supabase/migrations/20251109000004_gdpr_compliance_system.sql`
   - Creates user_consents table
   - Creates data_export_requests table
   - Creates data_deletion_requests table
   - Implements GDPR compliance functions

6. `supabase/migrations/20251109000005_api_key_rotation_system.sql`
   - Creates api_keys table
   - Creates api_key_usage_log table
   - Implements API key rotation functions
   - Implements SHA-256 key hashing

7. `supabase/migrations/20251109000006_data_retention_automation.sql`
   - Creates data_retention_policies table
   - Implements automated data cleanup
   - Creates cron jobs for retention policies

8. Click "Run" for each query
9. Verify no errors appear

---

## 2. Encryption Key Setup

The PII encryption system requires a master encryption key to be stored as a Supabase secret.

### Generated Encryption Key

```
9XUmz3q2icM5Yd9OX4z9l96Ls9pUo4jnhRaAq5Gg8fQ=
```

**IMPORTANT**: This key was randomly generated. Store it securely and NEVER commit it to version
control.

### Set the Secret in Supabase

#### Option A: Using Supabase CLI

```bash
export SUPABASE_ACCESS_TOKEN=<your-access-token>
npx supabase secrets set ENCRYPTION_KEY="9XUmz3q2icM5Yd9OX4z9l96Ls9pUo4jnhRaAq5Gg8fQ="
```

#### Option B: Via Dashboard

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault
2. Click "New secret"
3. Enter:
   - **Name**: `ENCRYPTION_KEY`
   - **Secret**: `9XUmz3q2icM5Yd9OX4z9l96Ls9pUo4jnhRaAq5Gg8fQ=`
4. Click "Create secret"

### Verify Encryption Key

Test the encryption by running this SQL query in the SQL Editor:

```sql
SELECT public.get_encryption_key() IS NOT NULL AS key_exists;
```

Should return `true`.

---

## 3. Magic Link Configuration

Enable passwordless email authentication via magic links.

### Step 3.1: Enable Email Provider

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/providers
2. Find "Email" provider
3. Toggle "Enable Email Provider" to **ON**
4. Configure settings:
   - **Enable Email Confirmations**: ON (recommended)
   - **Secure Email Change**: ON (recommended)
   - **Enable Magic Link**: **ON** ✓
5. Click "Save"

### Step 3.2: Configure Magic Link Settings

1. In the same Email Provider settings:
   - **Magic Link Token Expiry**: `3600` (1 hour)
   - **Enable Signups**: ON (allow new user registration via magic link)
2. Click "Save"

### Step 3.3: Upload Email Template

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/templates
2. Click on "Magic Link" template
3. Replace the entire content with the template from `supabase/templates/magic-link-email.html`
4. The template includes:
   - AIBORG branding with gold gradient
   - Professional email layout
   - Security information (link expiry, no password sharing)
   - Support contact information
5. Click "Save"

### Email Template Variables

The template uses these Supabase variables:

- `{{ .ConfirmationURL }}` - Magic link URL (auto-populated by Supabase)
- `{{ .SiteURL }}` - Your site URL (configured in next section)

---

## 4. SMTP Configuration

Configure email delivery for production. By default, Supabase provides limited email sending for
development. For production, use a dedicated SMTP provider.

### Recommended SMTP Providers

- **SendGrid** (https://sendgrid.com) - 100 emails/day free
- **Mailgun** (https://www.mailgun.com) - 5,000 emails/month free
- **Amazon SES** (https://aws.amazon.com/ses) - Pay-as-you-go
- **Resend** (https://resend.com) - 3,000 emails/month free

### Configure SMTP in Supabase

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/auth
2. Scroll to "SMTP Settings"
3. Toggle "Enable Custom SMTP" to **ON**
4. Enter your SMTP credentials:
   - **Host**: e.g., `smtp.sendgrid.net`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender Email**: e.g., `noreply@aiborg.ai`
   - **Sender Name**: `AIBORG Learn Sphere`
5. Click "Save"

### Test Email Delivery

After configuration, test by triggering a magic link sign-in from your app.

---

## 5. URL Configuration

Configure allowed redirect URLs for authentication flows.

### Step 5.1: Set Site URL

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/auth
2. Find "Site URL"
3. Set to your production URL:
   ```
   https://aiborg-ai-k4scvtwlr-hirendra-vikrams-projects.vercel.app
   ```
4. Click "Save"

### Step 5.2: Add Redirect URLs

1. In the same Auth settings page
2. Find "Redirect URLs" section
3. Add these URLs (one per line):

   ```
   https://aiborg-ai-k4scvtwlr-hirendra-vikrams-projects.vercel.app/**
   http://localhost:5173/**
   http://127.0.0.1:5173/**
   ```

4. Click "Save"

### Why These URLs?

- Production URL: For deployed app authentication
- Localhost URLs: For local development
- `/**` wildcard: Allows all paths under the domain

---

## 6. Verification Steps

After completing all configuration steps, verify everything works:

### 6.1 Verify Migrations Applied

Run this query in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'failed_login_attempts',
    'account_lockout_status',
    'security_audit_log',
    'rate_limit_config',
    'rate_limit_tracking',
    'encrypted_pii',
    'encryption_keys',
    'user_consents',
    'data_export_requests',
    'data_deletion_requests',
    'api_keys',
    'api_key_usage_log',
    'data_retention_policies'
  )
ORDER BY table_name;
```

Should return 13 tables.

### 6.2 Verify RLS Policies

```sql
-- Check RLS is enabled on critical tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'courses', 'enrollments', 'payments')
ORDER BY tablename;
```

All should have `rowsecurity = true`.

### 6.3 Verify Rate Limiting Config

```sql
SELECT endpoint, max_requests, window_seconds
FROM public.rate_limit_config
ORDER BY endpoint;
```

Should return default rate limits for `/auth/login`, `/auth/signup`, `/api/chat`, etc.

### 6.4 Test Magic Link

1. Open your deployed app: https://aiborg-ai-k4scvtwlr-hirendra-vikrams-projects.vercel.app
2. Go to Sign In page
3. Click "Magic Link" tab
4. Enter your email
5. Click "Send Magic Link"
6. Check your email inbox
7. Click the magic link
8. Should redirect back to app and be signed in

### 6.5 Test MFA Enrollment (After Migration)

1. Sign in to your app
2. Go to Profile → Security Settings
3. Click "Enable Two-Factor Authentication"
4. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
5. Enter 6-digit code
6. Should see "MFA enabled successfully"

### 6.6 Test Account Lockout

1. Try to sign in with wrong password 5 times
2. On 6th attempt, should see "Account locked" error
3. Check database:
   ```sql
   SELECT email, locked_until, attempt_count
   FROM public.account_lockout_status
   WHERE email = 'your-test-email@example.com';
   ```

### 6.7 Test PII Encryption

1. Go to Profile → Privacy Settings
2. Enter sensitive data (phone, address, etc.)
3. Click "Save"
4. Check database (should see encrypted data):
   ```sql
   SELECT user_id,
          phone_encrypted IS NOT NULL as has_phone,
          address_encrypted IS NOT NULL as has_address
   FROM public.encrypted_pii
   WHERE user_id = auth.uid();
   ```

### 6.8 Test Data Export (GDPR)

1. Go to Profile → Privacy Settings
2. Click "Request Data Export"
3. Check database:
   ```sql
   SELECT status, requested_at
   FROM public.data_export_requests
   WHERE user_id = auth.uid();
   ```
4. Status should be "pending"
5. Admin can approve via SQL:
   ```sql
   SELECT public.generate_data_export(
     (SELECT id FROM public.data_export_requests WHERE user_id = auth.uid() LIMIT 1)
   );
   ```

---

## 7. Troubleshooting

### Issue: Migrations fail with "permission denied"

**Solution**: Ensure you're using a Supabase admin account with full database access.

### Issue: Magic link emails not sending

**Solution**:

1. Check SMTP configuration is correct
2. Verify sender email is verified with your SMTP provider
3. Check Supabase logs: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/logs/edge-logs

### Issue: "Encryption key not found" error

**Solution**:

1. Verify secret is set: `SELECT public.get_encryption_key() IS NOT NULL;`
2. Check vault: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault
3. Recreate secret if needed

### Issue: Rate limiting not working

**Solution**:

1. Verify rate_limit_config table has entries
2. Check if functions exist:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name LIKE '%rate_limit%';
   ```

### Issue: RLS blocking legitimate requests

**Solution**:

1. Check user is authenticated: `SELECT auth.uid();`
2. Verify policies exist for the table
3. Temporarily disable RLS for debugging (re-enable after!):
   ```sql
   ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
   ```

---

## 8. Security Checklist

Before going to production, verify:

- [ ] All 7 migrations applied successfully
- [ ] Encryption key set in Vault
- [ ] RLS enabled on all tables
- [ ] SMTP configured and tested
- [ ] Magic link emails sending
- [ ] Redirect URLs configured
- [ ] Rate limiting active
- [ ] Account lockout working (test with wrong password)
- [ ] MFA enrollment tested
- [ ] PII encryption tested
- [ ] Data export tested
- [ ] All API keys rotated (if any)
- [ ] Security audit log capturing events
- [ ] Data retention policies configured

---

## 9. Next Steps After Configuration

Once all configuration is complete:

1. **Test all features end-to-end**
2. **Monitor security audit logs** for suspicious activity
3. **Set up alerting** for critical security events
4. **Document any custom configurations** made
5. **Train team** on new security features
6. **Review GDPR compliance** with legal team
7. **Schedule regular security audits**

---

## 10. Useful SQL Queries

### Check Failed Login Attempts

```sql
SELECT email, COUNT(*) as attempts, MAX(attempted_at) as last_attempt
FROM public.failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY attempts DESC;
```

### Check Rate Limit Usage

```sql
SELECT identifier, endpoint, request_count, window_start
FROM public.rate_limit_tracking
WHERE window_end > NOW()
ORDER BY request_count DESC
LIMIT 20;
```

### Check Active API Keys

```sql
SELECT key_prefix, scopes, created_at, expires_at, last_used_at
FROM public.api_keys
WHERE is_active = TRUE AND user_id = auth.uid();
```

### Check User Consents

```sql
SELECT consent_type, granted, consent_version, granted_at
FROM public.user_consents
WHERE user_id = auth.uid()
ORDER BY granted_at DESC;
```

### Check Security Audit Log

```sql
SELECT event_type, email, ip_address, created_at
FROM public.security_audit_log
ORDER BY created_at DESC
LIMIT 50;
```

---

## Support

If you encounter issues during configuration:

1. Check Supabase documentation: https://supabase.com/docs
2. Review migration files for detailed comments
3. Check implementation documentation in `PHASE4_IMPLEMENTATION_COMPLETE.md`
4. Consult the security hardening plan in `CODE_HARDENING_PLAN.md`

---

**Configuration Generated**: 2024-11-09 **Encryption Key Generated**: 2024-11-09 **Project**:
aiborg-learn-sphere **Supabase Project ID**: afrulkxxzcmngbrdfuzj
