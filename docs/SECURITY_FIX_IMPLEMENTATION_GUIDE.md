# Security Fix Implementation Guide

This guide provides step-by-step instructions to implement the security fixes identified in the
[Security Audit Report](./SECURITY_AUDIT_REPORT.md).

## Table of Contents

1. [Critical Fixes (Immediate)](#critical-fixes-immediate)
2. [High Priority Fixes](#high-priority-fixes)
3. [Testing & Verification](#testing--verification)
4. [Post-Deployment Monitoring](#post-deployment-monitoring)

---

## Critical Fixes (Immediate)

### 1. Rotate Exposed Credentials

**CRITICAL:** All exposed credentials in `.env.local`, `.env.production`, and `.env.vercel` must be
rotated immediately.

#### Step 1.1: Rotate Supabase Credentials

1. **Generate New Anon Key:**

   ```bash
   # Log in to Supabase Dashboard
   # Navigate to: Settings → API → Project API keys
   # Click "Rotate anon key" button
   ```

2. **Update Vercel Environment Variables:**

   ```bash
   # Via Vercel Dashboard
   # Go to: Project Settings → Environment Variables
   # Update VITE_SUPABASE_ANON_KEY with new key
   ```

3. **Update Local Development:**
   ```bash
   # Update .env.local with new credentials
   # NEVER commit this file to git
   VITE_SUPABASE_ANON_KEY=<new-anon-key>
   ```

#### Step 1.2: Rotate OAuth Credentials

1. **Google OAuth:**

   ```bash
   # Go to: https://console.cloud.google.com/apis/credentials
   # Select your OAuth 2.0 Client ID
   # Click "Delete" then create new Client ID
   # Update authorized redirect URIs
   ```

2. **Update Environment Variables:**
   ```bash
   # In Vercel and locally
   VITE_GOOGLE_CLIENT_ID=<new-client-id>
   ```

#### Step 1.3: Remove Sensitive Files from Git History

**WARNING:** This will rewrite git history. Coordinate with team before proceeding.

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Install BFG Repo Cleaner (alternative to git-filter-branch)
# Or use git-filter-repo
pip install git-filter-repo

# Remove .env files from git history
git filter-repo --path .env.local --invert-paths
git filter-repo --path .env.production --invert-paths
git filter-repo --path .env.vercel --invert-paths

# Force push to remote (COORDINATE WITH TEAM FIRST)
git push origin --force --all
git push origin --force --tags
```

**Alternative (less destructive):**

```bash
# If you don't want to rewrite history, at least ensure files are untracked
git rm --cached .env.local .env.production .env.vercel
git commit -m "security: remove sensitive environment files from tracking"
git push
```

---

### 2. Implement Rate Limiting

**Status:** ✅ Already implemented in this security fix

**Files Modified:**

- `src/utils/rateLimiter.ts` (new)
- `src/pages/Auth.tsx` (updated)

**Verification:**

```bash
# Test rate limiting locally
npm run dev

# Try to sign in 6 times with wrong password
# Should be blocked after 5 attempts
```

**Configuration:** The rate limits are defined in `src/utils/rateLimiter.ts`:

- Sign in: 5 attempts per 15 minutes
- Sign up: 3 attempts per hour
- Password reset: 3 attempts per hour
- OAuth: 5 attempts per 5 minutes

**To adjust limits:**

```typescript
// Edit src/utils/rateLimiter.ts
export const RATE_LIMITS = {
  SIGN_IN: {
    maxAttempts: 10, // Increase if too restrictive
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  },
  // ...
};
```

---

## High Priority Fixes

### 3. Strengthen Password Policy

**Status:** ✅ Already implemented in this security fix

**Files Modified:**

- `src/utils/passwordValidation.ts` (new)
- `src/pages/Auth.tsx` (updated)

**New Requirements:**

- Minimum 12 characters (was 6)
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character
- Cannot be common password
- Cannot contain sequential characters
- Cannot contain repeated characters

**User Communication:** Update password requirements on all user-facing pages:

```tsx
<p className="text-xs text-white/60">
  Must be 12+ characters with uppercase, lowercase, numbers, and special characters
</p>
```

**Migration Plan for Existing Users:**

**Option A - Gradual Migration (Recommended):** Users with weak passwords can still log in but will
be prompted to update on next login:

```typescript
// Add to useAuth.ts after successful sign in
if (user) {
  // Check password strength (would need backend support)
  const needsUpdate = await checkPasswordStrength(user.id);
  if (needsUpdate) {
    // Redirect to password update page
    navigate('/update-password');
  }
}
```

**Option B - Force Reset:** Send password reset emails to all users with weak passwords (requires
Supabase function).

---

### 4. Fix Stripe Webhook Verification

**Status:** ⚠️ Needs manual update in Supabase Edge Function

**File to Update:** `supabase/functions/stripe-webhook/index.ts`

**Current Code (Lines 5-30):**

```typescript
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// Verify webhook signature
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

**Updated Code:**

```typescript
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!webhookSecret) {
  console.error('CRITICAL: STRIPE_WEBHOOK_SECRET not configured');
  return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (err) {
  console.error('Webhook signature verification failed', {
    error: err instanceof Error ? err.message : 'Unknown error',
    signaturePresent: !!signature,
  });
  return new Response(JSON.stringify({ error: 'Invalid signature' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Continue processing verified event
console.log('Webhook verified successfully:', event.type);
```

**Deployment:**

```bash
# Deploy updated function to Supabase
npx supabase functions deploy stripe-webhook

# Verify webhook secret is set in Supabase dashboard
# Settings → Edge Functions → stripe-webhook → Secrets
# Add: STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

---

### 5. Add Input Validation

**Status:** ✅ Display name validation implemented **Status:** ⚠️ Blog content sanitization needs
review

**Files Modified:**

- `src/pages/Auth.tsx` (display name validation added)

**Display Name Validation (Already Added):**

```typescript
// Validate display name
if (!displayName || displayName.trim().length < 2) {
  setError('Display name must be at least 2 characters long');
  return;
}

if (displayName.length > 50) {
  setError('Display name must be less than 50 characters');
  return;
}

// Check for invalid characters in display name
if (!/^[a-zA-Z0-9\s\-\_]+$/.test(displayName)) {
  setError('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
  return;
}
```

**Additional Validation Needed:**

For blog content and rich text inputs:

```bash
# Install DOMPurify (already in dependencies as isomorphic-dompurify)
npm install isomorphic-dompurify
```

Create sanitization utility:

```typescript
// src/utils/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

export const sanitizeText = (text: string): string => {
  // Remove HTML tags and entities
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};
```

Use in blog manager:

```typescript
// src/pages/Admin/BlogManager.tsx
import { sanitizeHtml, sanitizeText } from '@/utils/sanitization';

// Before saving
const sanitizedPost = {
  ...postData,
  title: sanitizeText(postData.title),
  content: sanitizeHtml(postData.content),
  excerpt: sanitizeText(postData.excerpt),
};
```

---

### 6. Enhanced Authorization Checks

**Status:** ⚠️ Needs implementation

**Current Issue:** Admin checks only happen client-side. Malicious users could manipulate state.

**Solution - Add Server-Side Admin Verification:**

Create a Supabase Edge Function for admin operations:

```typescript
// supabase/functions/admin-verify/index.ts
import { createClient } from '@supabase/supabase-js';

serve(async req => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Check admin role in database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
      status: 403,
    });
  }

  return new Response(JSON.stringify({ isAdmin: true, userId: user.id }), { status: 200 });
});
```

Update client-side admin operations:

```typescript
// src/utils/adminAuth.ts
export const verifyAdminAccess = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-verify');
    if (error) throw error;
    return data?.isAdmin === true;
  } catch (error) {
    console.error('Admin verification failed:', error);
    return false;
  }
};

// Use in admin components
useEffect(() => {
  const checkAccess = async () => {
    const isAdmin = await verifyAdminAccess();
    if (!isAdmin) {
      navigate('/');
      toast({ title: 'Access Denied', variant: 'destructive' });
    }
  };
  checkAccess();
}, []);
```

---

## Medium Priority Fixes

### 7. Security Headers

**Status:** ✅ Already implemented in this security fix

**File Modified:** `vercel.json`

**Headers Added:**

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control
- `Permissions-Policy` - Disable unused features
- `Strict-Transport-Security` - Force HTTPS
- `Content-Security-Policy` - Restrict resource loading

**Verification After Deployment:**

```bash
# Test security headers
curl -I https://aiborg-ai-web.vercel.app | grep -E "X-Frame|X-Content|X-XSS|Content-Security"

# Or use online tools
# https://securityheaders.com/?q=https://aiborg-ai-web.vercel.app
```

**Adjusting CSP (if needed):** If you encounter CSP violations after deployment, check browser
console and adjust the CSP in `vercel.json`:

```javascript
// To allow additional domains
"connect-src 'self' https://afrulkxxzcmngbrdfuzj.supabase.co https://new-api.com";
```

---

### 8. Environment Variable Security

**Status:** ✅ Already implemented in this security fix

**Files Modified:**

- `.gitignore` (updated)
- `.env.example` (security notes added)

**Best Practices:**

1. **Use Vercel Environment Variables:**

   ```bash
   # Set in Vercel Dashboard, NOT in .env files committed to git
   # Settings → Environment Variables
   VITE_SUPABASE_URL=<value>
   VITE_SUPABASE_ANON_KEY=<value>
   ```

2. **Local Development:**

   ```bash
   # Copy example file
   cp .env.example .env.local

   # Add your local credentials
   # NEVER commit .env.local to git
   ```

3. **Verify No Secrets in Git:**

   ```bash
   # Check git history for secrets
   git log --all --full-history --source -- .env.*

   # Use git-secrets to prevent future commits
   npm install -D git-secrets
   git secrets --scan
   ```

---

## Testing & Verification

### Local Testing

```bash
# 1. Install dependencies
npm install

# 2. Run linting
npm run lint

# 3. Run type checking
npm run typecheck

# 4. Start development server
npm run dev

# 5. Test authentication flows
# - Sign up with weak password (should fail)
# - Sign up with strong password (should succeed)
# - Try 6 failed sign-ins (should be rate limited)
# - Reset password multiple times (should be rate limited)
```

### Security Testing

```bash
# 1. Run npm audit
npm audit

# 2. Check for vulnerabilities
npm audit fix

# 3. Test with OWASP ZAP or similar tools
# https://www.zaproxy.org/
```

### Manual Testing Checklist

- [ ] Password validation rejects weak passwords
- [ ] Password validation accepts strong passwords
- [ ] Rate limiting blocks after max attempts
- [ ] Rate limiting allows attempts after time window
- [ ] Display name validation rejects invalid characters
- [ ] OAuth sign-in still works (Google, GitHub)
- [ ] Password reset email is sent
- [ ] Security headers are present in production
- [ ] No console errors related to security features
- [ ] Admin pages require proper authorization

---

## Deployment

### Pre-Deployment Checklist

- [ ] All sensitive credentials rotated
- [ ] Environment variables updated in Vercel
- [ ] Code reviewed and tested locally
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Password validation tested
- [ ] No `.env.*` files committed to git
- [ ] Team notified of security changes

### Deployment Steps

```bash
# 1. Commit changes
git add .
git commit -m "security: implement critical security fixes

- Add password validation with 12+ char requirement
- Implement rate limiting on auth endpoints
- Add security headers (CSP, HSTS, etc.)
- Fix Stripe webhook verification
- Update .gitignore for environment files
- Add input validation for user fields"

# 2. Push to GitHub (triggers Vercel deployment)
git push origin main

# 3. Monitor deployment in Vercel dashboard
# https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments
```

### Post-Deployment Verification

```bash
# 1. Check security headers
curl -I https://aiborg-ai-web.vercel.app

# 2. Test authentication
# - Sign up with new account
# - Sign in with existing account
# - Test password reset

# 3. Monitor logs
# Check Vercel logs for any errors
# Check Supabase logs for auth issues

# 4. Test rate limiting
# Try multiple failed sign-in attempts
# Verify blocking occurs
```

---

## Post-Deployment Monitoring

### Set Up Alerts

1. **Supabase Alerts:**

   ```
   - Navigate to Supabase Dashboard → Logs → Alerts
   - Create alert for failed authentication attempts
   - Create alert for rate limit violations
   ```

2. **Vercel Alerts:**
   ```
   - Settings → Alerts
   - Enable error rate alerts
   - Enable performance alerts
   ```

### Monitor Metrics

**Weekly:**

- Review failed authentication attempts
- Check rate limit trigger frequency
- Monitor password reset requests

**Monthly:**

- Review user password strength (if metrics available)
- Check for suspicious activity patterns
- Review and update security policies

### Security Scanning

**Continuous:**

```bash
# Set up GitHub Dependabot
# .github/dependabot.yml already exists

# Set up Snyk scanning
npm install -g snyk
snyk auth
snyk monitor
```

**Quarterly:**

- Full penetration testing
- Security audit
- Update dependencies

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Vercel)

```bash
# Via Vercel Dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
```

### Code Rollback (Git)

```bash
# 1. Revert last commit
git revert HEAD

# 2. Push to trigger redeployment
git push origin main
```

### Emergency Contact

If critical security issue discovered:

1. **Immediate:** Take down production (Vercel → Project → Settings → Disable)
2. **Rotate credentials:** Supabase, Stripe, OAuth
3. **Notify users:** If data breach suspected
4. **Fix issue:** Apply emergency patch
5. **Redeploy:** After thorough testing

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security-best-practices)
- [Vercel Security](https://vercel.com/docs/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## Questions & Support

For implementation questions:

1. Review [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)
2. Check Supabase documentation
3. Consult with security team

**Document Version:** 1.0.0 **Last Updated:** 2025-10-12 **Next Review:** 2025-11-12
