# Fixing Google OAuth "Continue to xxx.supabase.co" Issue

## Problem
When users sign in with Google, they see:
- "You're signing back in to afrulkxxzcmngbrdfuzj.supabase.co"
- Browser warning: "Did you mean aiborg.ai?"
- This looks unprofessional and creates distrust

## Root Cause
Google OAuth displays the redirect domain, which is your Supabase project URL, not your application domain.

## Solutions

### Solution 1: Custom Domain (Recommended - Requires Supabase Pro)

#### Steps:
1. **Upgrade to Supabase Pro**
   - Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/billing
   - Upgrade to Pro plan ($25/month)

2. **Set up Custom Domain**
   - Navigate to: Settings → General → Custom Domains
   - Add domain: `auth.aiborg.ai` or `api.aiborg.ai`
   - Follow DNS configuration instructions

3. **Configure DNS (at your domain provider)**
   ```
   Type: CNAME
   Name: auth (or api)
   Value: [provided by Supabase]
   ```

4. **Update Google OAuth**
   - Go to: https://console.cloud.google.com/
   - APIs & Services → Credentials → Your OAuth 2.0 Client
   - Add to Authorized redirect URIs:
     - `https://auth.aiborg.ai/auth/v1/callback`

5. **Update Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://auth.aiborg.ai
   ```

6. **Result**: Users will see "Continue to auth.aiborg.ai" ✅

### Solution 2: Google App Verification (Free)

#### Steps:
1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/
   - APIs & Services → OAuth consent screen

2. **Update App Information**
   ```
   App name: AIBORG
   User support email: hirendra.vikram@aiborg.ai
   App logo: Upload AIBORG logo
   Application home page: https://aiborg.ai
   ```

3. **Clean Authorized Domains**
   - Remove: `supabase.co`
   - Keep only: `aiborg.ai`, `aiborg-ai-web.vercel.app`

4. **Submit for Verification**
   - Click "Submit for Verification"
   - Fill out verification form
   - Explain app purpose: "AI Learning Platform"
   - Wait 3-5 business days

5. **Result**: Users will see "Continue to AIBORG" instead of domain

### Solution 3: Alternative Auth Flow (Immediate)

#### Option A: Email Magic Links
```typescript
// Use email magic links instead of OAuth
const { error } = await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    emailRedirectTo: 'https://aiborg.ai/auth/callback',
  }
})
```

#### Option B: Implement Auth Proxy
Create an auth proxy on your domain that handles OAuth:
1. Set up API endpoint at aiborg.ai/api/auth/google
2. Proxy OAuth requests through your domain
3. Handle callback on your domain

### Solution 4: User Communication (Temporary)

Add a notice on the sign-in page:
```tsx
<Alert className="mb-4 bg-blue-500/20 border-blue-500/50">
  <Info className="h-4 w-4" />
  <AlertDescription className="text-white/90">
    When signing in with Google, you'll be redirected to our secure
    authentication provider (Supabase). This is normal and your data is safe.
  </AlertDescription>
</Alert>
```

## Immediate Actions Taken

1. **Improved AuthCallback page** with AIBORG branding
2. **Created branded loading screens** for better UX
3. **Added auth redirect handling** to return users to their original page

## Recommended Next Steps

### Priority 1: Google App Verification
- Free solution
- Takes 3-5 days
- Shows "AIBORG" instead of Supabase URL

### Priority 2: Consider Supabase Pro
- Custom domain completely solves the issue
- Professional appearance
- Better for long-term growth

### Priority 3: Update Google OAuth Console
Ensure these settings are correct:
```
Application name: AIBORG
Application type: Production
Authorized domains:
  - aiborg.ai
  - aiborg-ai-web.vercel.app
```

## Testing Checklist

- [ ] Test Google sign-in flow
- [ ] Verify redirect URLs work
- [ ] Check mobile browser experience
- [ ] Test in incognito mode
- [ ] Verify auth persistence

## Support Links

- [Supabase Custom Domains](https://supabase.com/docs/guides/platform/custom-domains)
- [Google OAuth Verification](https://support.google.com/cloud/answer/9110914)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)