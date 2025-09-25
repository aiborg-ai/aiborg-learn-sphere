# Supabase OAuth Configuration Fix

## Important Configuration Steps

### 1. Supabase Dashboard Configuration

**CRITICAL**: You must update the following in your Supabase Dashboard:

1. **Go to**: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/url-configuration

2. **Update Redirect URLs to use wildcards**:
   - Remove: `https://aiborg-ai-web.vercel.app/auth/callback`
   - Add: `https://aiborg-ai-web.vercel.app/**`
   - Add: `http://localhost:3000/**` (for local testing)
   - Add: `http://localhost:5173/**` (for Vite dev server)

3. **Site URL**:
   - Set to: `https://aiborg-ai-web.vercel.app`

### 2. Google Cloud Console Configuration

Ensure these redirect URIs are in your Google OAuth client:
- `https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback`
- Keep this as is - Supabase handles the redirect back to your app

### 3. What Was Fixed in Code

#### AuthCallback.tsx
- ✅ Added support for OAuth code exchange (PKCE flow)
- ✅ Added error handling for OAuth errors
- ✅ Added logging for debugging
- ✅ Fallback support for implicit flow (legacy)

#### Supabase Client
- ✅ Added `detectSessionInUrl: true` to auto-detect auth callbacks
- ✅ Added `flowType: 'pkce'` to use secure PKCE flow

### 4. How the OAuth Flow Now Works

1. User clicks "Continue with Google"
2. Redirected to Google sign-in
3. Google redirects to: `https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback?code=XXX`
4. Supabase redirects to: `https://aiborg-ai-web.vercel.app/auth/callback?code=XXX`
5. AuthCallback component:
   - Extracts the `code` parameter
   - Calls `supabase.auth.exchangeCodeForSession(code)`
   - Establishes session
   - Redirects user to dashboard

### 5. Testing Checklist

- [ ] Update Supabase Dashboard redirect URLs to use wildcards
- [ ] Clear browser cookies/cache
- [ ] Test Google sign-in
- [ ] Check browser console for any errors
- [ ] Verify session persists after refresh

### 6. Common Issues

#### Issue: Redirects back to sign-in page
**Solution**: Ensure redirect URLs use `/**` wildcard pattern

#### Issue: "Invalid redirect URL" error
**Solution**: Check that your app URL is in Supabase's allowed redirects

#### Issue: WebSocket authentication errors
**Solution**: These are non-critical for OAuth - they relate to realtime features

### 7. Environment Variables

Ensure these are set in Vercel:
```
VITE_SUPABASE_URL=https://afrulkxxzcmngbrdfuzj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8
VITE_APP_URL=https://aiborg-ai-web.vercel.app
```