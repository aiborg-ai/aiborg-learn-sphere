# Configuration Next Steps - Quick Reference

This is a quick-start guide for completing the Supabase configuration. For detailed instructions,
see `SUPABASE_CONFIGURATION_GUIDE.md`.

## Prerequisites

You need:

1. Supabase Dashboard access: https://supabase.com/dashboard
2. Project ID: `afrulkxxzcmngbrdfuzj`
3. Supabase access token from: https://supabase.com/dashboard/account/tokens

## Quick Start (5 Steps)

### Step 1: Apply Migrations (Choose One Method)

**Method A: Automated Script (Recommended)**

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your_token_here

# Run the automated script
./apply-migrations.sh
```

**Method B: Manual via Dashboard**

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql
2. Apply each migration file in order (see list below)

### Step 2: Set Encryption Key

**Generated Key (SAVE THIS SECURELY):**

```
9XUmz3q2icM5Yd9OX4z9l96Ls9pUo4jnhRaAq5Gg8fQ=
```

**Set in Supabase:**

```bash
# Via CLI
export SUPABASE_ACCESS_TOKEN=your_token_here
npx supabase secrets set ENCRYPTION_KEY="9XUmz3q2icM5Yd9OX4z9l96Ls9pUo4jnhRaAq5Gg8fQ="
```

**Or via Dashboard:**

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/vault
2. Click "New secret"
3. Name: `ENCRYPTION_KEY`
4. Value: `9XUmz3q2icM5Yd9OX4z9l96Ls9pUo4jnhRaAq5Gg8fQ=`

### Step 3: Enable Magic Link

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/providers
2. Find "Email" provider → Toggle to **ON**
3. Enable "Magic Link" → Toggle to **ON**
4. Set "Magic Link Token Expiry" to `3600` seconds
5. Click "Save"

### Step 4: Upload Email Template

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/templates
2. Click "Magic Link" template
3. Copy content from `supabase/templates/magic-link-email.html`
4. Paste into the template editor
5. Click "Save"

### Step 5: Configure URLs

**Set Site URL:**

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/auth
2. Find "Site URL"
3. Set to: `https://aiborg-ai-k4scvtwlr-hirendra-vikrams-projects.vercel.app`
4. Click "Save"

**Add Redirect URLs:**

1. In same page, find "Redirect URLs"
2. Add these (one per line):
   ```
   https://aiborg-ai-k4scvtwlr-hirendra-vikrams-projects.vercel.app/**
   http://localhost:5173/**
   http://127.0.0.1:5173/**
   ```
3. Click "Save"

## Migration Files (Apply in Order)

1. `20251109000000_account_lockout_system.sql` - Brute force protection
2. `20251109000001_rls_security_audit.sql` - Row-Level Security
3. `20251109000002_rate_limiting_system.sql` - API rate limiting
4. `20251109000003_pii_encryption_system.sql` - PII encryption
5. `20251109000004_gdpr_compliance_system.sql` - GDPR compliance
6. `20251109000005_api_key_rotation_system.sql` - API key management
7. `20251109000006_data_retention_automation.sql` - Data retention

## Verification

After completing all steps, verify by running these SQL queries:

**Check migrations applied:**

```sql
SELECT COUNT(*) as migration_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'failed_login_attempts', 'account_lockout_status',
    'security_audit_log', 'rate_limit_config',
    'encrypted_pii', 'user_consents',
    'api_keys', 'data_retention_policies'
  );
```

Expected: 8 or more

**Check encryption key:**

```sql
SELECT public.get_encryption_key() IS NOT NULL AS key_exists;
```

Expected: `true`

**Test magic link:**

1. Go to: https://aiborg-ai-k4scvtwlr-hirendra-vikrams-projects.vercel.app
2. Click "Magic Link" tab
3. Enter your email
4. Click "Send Magic Link"
5. Check your email
6. Click the link in email
7. Should be signed in

## Optional: SMTP Configuration

For production email delivery, configure SMTP:

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/auth
2. Scroll to "SMTP Settings"
3. Toggle "Enable Custom SMTP" to **ON**
4. Enter your SMTP provider details (SendGrid, Mailgun, etc.)
5. Click "Save"

**Recommended Providers:**

- SendGrid (100 emails/day free)
- Mailgun (5,000 emails/month free)
- Resend (3,000 emails/month free)

## Feature Test Checklist

After configuration, test these features:

- [ ] Magic link sign-in works
- [ ] MFA enrollment works (scan QR code)
- [ ] Account lockout triggers after 5 failed login attempts
- [ ] Privacy settings allow PII storage
- [ ] Data export request creates pending request
- [ ] Rate limiting blocks excessive requests

## Troubleshooting

**Issue: Migrations fail**

- Ensure you have admin access to the project
- Check for syntax errors in migration files
- Apply migrations one at a time to identify issues

**Issue: Magic link emails not sending**

- Check SMTP configuration
- Verify email template is saved
- Check Supabase logs for errors

**Issue: "Encryption key not found"**

- Verify secret is set in Vault
- Check secret name is exactly `ENCRYPTION_KEY`
- Try re-creating the secret

## Support Resources

- Detailed guide: `SUPABASE_CONFIGURATION_GUIDE.md`
- Implementation docs: `PHASE4_IMPLEMENTATION_COMPLETE.md`
- Security plan: `CODE_HARDENING_PLAN.md`
- Supabase docs: https://supabase.com/docs

## Important Security Notes

1. **Never commit** the encryption key to version control
2. **Store securely** - back up the encryption key in a secure location
3. **Rotate regularly** - plan to rotate encryption keys periodically
4. **Monitor logs** - check security_audit_log table regularly
5. **Review access** - audit who has access to Supabase project

---

**Generated**: 2024-11-09 **Encryption Key Generated**: 2024-11-09 **Project**: aiborg-learn-sphere
(afrulkxxzcmngbrdfuzj)
