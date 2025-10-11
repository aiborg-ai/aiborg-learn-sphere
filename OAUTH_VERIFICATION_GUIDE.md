# 🔐 Google OAuth Verification Guide

**Date:** 2025-10-11
**Status:** Ready for Verification
**Production URL:** https://aiborg-ai-web.vercel.app

---

## ✅ Code Configuration Status

### **VERIFIED - Code is correctly configured:**

1. ✅ **OAuth Implementation** (`src/hooks/useAuth.ts:180-199`)
   - Modern PKCE flow enabled
   - Proper redirect URL handling
   - Session storage for auth state

2. ✅ **Auth Callback Handler** (`src/pages/AuthCallback.tsx`)
   - Code exchange for PKCE flow
   - Error handling for failed auth
   - Fallback for legacy implicit flow

3. ✅ **Supabase Client** (`src/integrations/supabase/client.ts`)
   - `flowType: 'pkce'` configured
   - `detectSessionInUrl: true`
   - `persistSession: true`

4. ✅ **Environment Variables** (`.env.local`)
   - `VITE_GOOGLE_CLIENT_ID` set
   - `VITE_SUPABASE_URL` set
   - `VITE_APP_URL` set for local dev

---

## ⚠️ MANUAL VERIFICATION REQUIRED

### **Step 1: Supabase Dashboard Configuration**

#### 1.1 URL Configuration
🔗 **Go to:** https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/url-configuration

**Verify these exact settings:**

```
Site URL:
https://aiborg-ai-web.vercel.app
```

```
Redirect URLs (add all of these):
https://aiborg-ai-web.vercel.app/**
https://aiborg-ai-bj8zk4wqp-hirendra-vikrams-projects.vercel.app/**
http://localhost:8080/**
http://localhost:5173/**
http://localhost:3000/**
```

☝️ **CRITICAL:** The `/**` wildcard at the end is required!

#### 1.2 Google Provider Configuration
🔗 **Go to:** https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/providers

**Configure:**

1. Find "Google" in the list
2. Toggle the switch to **ON** (enabled)
3. Enter **Client ID:**
   ```
   124256030012-qvrptdi2qv0hkao0nccuuf7508dlji93.apps.googleusercontent.com
   ```
4. Enter **Client Secret:** (you should have this from Google Cloud Console)
5. Click **"Save"** button

---

### **Step 2: Google Cloud Console Configuration**

#### 2.1 OAuth 2.0 Client Settings
🔗 **Go to:** https://console.cloud.google.com/apis/credentials

**Find your OAuth 2.0 Client and verify:**

**Authorized JavaScript origins:**
```
https://afrulkxxzcmngbrdfuzj.supabase.co
https://aiborg-ai-web.vercel.app
http://localhost:8080
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback
```

☝️ **IMPORTANT:** Only the Supabase callback URL is needed. Supabase handles redirecting back to your app.

#### 2.2 OAuth Consent Screen
🔗 **Go to:** https://console.cloud.google.com/apis/credentials/consent

**Verify:**
- App name: "Aiborg Learn Sphere" (or similar)
- User support email: Valid email address
- Authorized domains:
  - `aiborg-ai-web.vercel.app`
  - `supabase.co`
- Scopes:
  - `../auth/userinfo.email`
  - `../auth/userinfo.profile`
  - `openid`

**Publishing Status:**
- **Testing Mode:** Only users you add to test users can sign in
- **Production Mode:** Anyone with a Google account can sign in

**⚠️ DECISION NEEDED:** Will you publish to production or keep in testing mode?

---

### **Step 3: Vercel Environment Variables**

🔗 **Go to:** https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/settings/environment-variables

**Verify these are set for Production:**

| Variable | Expected Value |
|----------|----------------|
| `VITE_APP_URL` | `https://aiborg-ai-web.vercel.app` |
| `VITE_GOOGLE_CLIENT_ID` | `124256030012-qvrptdi2qv0hkao0nccuuf7508dlji93...` |
| `VITE_SUPABASE_URL` | `https://afrulkxxzcmngbrdfuzj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 🧪 Testing Procedures

### **Local Testing (Step 1)**

1. **Start dev server:**
   ```bash
   cd /home/vik/aiborg_CC/aiborg-learn-sphere
   npm run dev
   ```

2. **Open test page:**
   ```
   http://localhost:8080/test-oauth-config.html
   ```
   This will verify your environment variables.

3. **Test OAuth flow:**
   - Navigate to: http://localhost:8080/auth
   - Click "Continue with Google"
   - Complete Google sign-in
   - Should redirect to `/auth/callback` with loading screen
   - Should then redirect to homepage `/`
   - Verify you're logged in (check navbar)

4. **Check browser console:**
   - Look for any errors
   - Verify auth state changes are logged

### **Production Testing (Step 2)**

1. **Navigate to production:**
   ```
   https://aiborg-ai-web.vercel.app/auth
   ```

2. **Test OAuth flow:**
   - Click "Continue with Google"
   - Complete Google sign-in
   - Should redirect back to your app
   - Verify successful login

3. **Test with multiple accounts:**
   - Sign out
   - Sign in with different Google account
   - Verify each account works

4. **Test session persistence:**
   - After signing in, refresh the page
   - You should remain logged in
   - Check navbar shows your profile

### **Error Scenario Testing (Step 3)**

Test these scenarios to ensure error handling works:

1. **Cancel OAuth flow:**
   - Click "Continue with Google"
   - Click "Cancel" on Google consent screen
   - Should redirect back to `/auth` with error message

2. **Invalid credentials:**
   - If testing mode, try with non-test user
   - Should see appropriate error

3. **Network errors:**
   - Disconnect internet briefly during OAuth
   - Should show error message

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Redirect URI Mismatch"**

**Symptoms:**
- Error message: `redirect_uri_mismatch`
- OAuth fails immediately

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client
3. Ensure `https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback` is in Authorized Redirect URIs
4. Save and **wait 5 minutes** for propagation

---

### **Issue 2: "This app is blocked"**

**Symptoms:**
- Google shows "This app isn't verified"
- Can't proceed with sign-in

**Solution:**
- **For Testing:** Add your email to test users in OAuth consent screen
- **For Production:** Publish the app in Google Cloud Console

---

### **Issue 3: Redirects to /auth after Google sign-in**

**Symptoms:**
- Google sign-in completes
- Redirects back to app
- Immediately redirects to `/auth` (not logged in)

**Possible Causes:**
1. Supabase redirect URLs don't use wildcard `/**`
2. Site URL in Supabase is incorrect
3. Google Client Secret not set in Supabase

**Solution:**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Ensure redirect URLs have `/**` wildcard
3. Verify Google provider is enabled with correct credentials
4. Re-enter Client Secret in Supabase if needed

---

### **Issue 4: "Invalid client" or "Unauthorized"**

**Symptoms:**
- Error message: `invalid_client` or `unauthorized`
- OAuth fails at Google step

**Possible Causes:**
1. Google Client ID mismatch
2. Client Secret incorrect in Supabase
3. Domain not authorized in Google Console

**Solution:**
1. Double-check Client ID in Vercel env vars matches Google Console
2. Re-enter Client Secret in Supabase
3. Verify authorized domains in Google Console
4. **Wait 5-10 minutes** for changes to propagate

---

## 📋 Verification Checklist

Print this and check off each item:

### **Supabase Dashboard** ✏️
- [ ] Logged into Supabase dashboard
- [ ] Navigated to Auth → URL Configuration
- [ ] Site URL = `https://aiborg-ai-web.vercel.app`
- [ ] Redirect URLs include `https://aiborg-ai-web.vercel.app/**`
- [ ] Redirect URLs include `http://localhost:8080/**`
- [ ] All redirect URLs have `/**` wildcard
- [ ] Navigated to Auth → Providers
- [ ] Google provider toggle is **ON**
- [ ] Client ID matches: `124256030012-qvrptdi2qv0hkao0nccuuf7508dlji93...`
- [ ] Client Secret is entered (shows as *****)
- [ ] Clicked **Save** button

### **Google Cloud Console** ✏️
- [ ] Logged into Google Cloud Console
- [ ] Navigated to APIs & Services → Credentials
- [ ] Found OAuth 2.0 Client
- [ ] JavaScript origins include `https://afrulkxxzcmngbrdfuzj.supabase.co`
- [ ] JavaScript origins include `https://aiborg-ai-web.vercel.app`
- [ ] Redirect URI = `https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback`
- [ ] Navigated to OAuth Consent Screen
- [ ] App name is set
- [ ] User support email is configured
- [ ] Authorized domains include `aiborg-ai-web.vercel.app`
- [ ] Scopes include email, profile, openid
- [ ] **Decision made:** Keep in Testing or Publish to Production

### **Vercel Dashboard** ✏️
- [ ] Logged into Vercel
- [ ] Navigated to Project Settings → Environment Variables
- [ ] `VITE_APP_URL` = `https://aiborg-ai-web.vercel.app`
- [ ] `VITE_GOOGLE_CLIENT_ID` is set
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set

### **Local Testing** ✏️
- [ ] Started dev server (`npm run dev`)
- [ ] Opened http://localhost:8080/test-oauth-config.html
- [ ] All environment variables show as "✓ Set"
- [ ] Navigated to http://localhost:8080/auth
- [ ] Clicked "Continue with Google"
- [ ] Completed Google sign-in
- [ ] Redirected to homepage
- [ ] Logged in successfully
- [ ] Refreshed page, still logged in
- [ ] Checked browser console, no errors

### **Production Testing** ✏️
- [ ] Navigated to https://aiborg-ai-web.vercel.app/auth
- [ ] Clicked "Continue with Google"
- [ ] Completed Google sign-in
- [ ] Redirected to homepage
- [ ] Logged in successfully
- [ ] Tested with 2nd Google account
- [ ] Tested with 3rd Google account
- [ ] Session persists after page refresh
- [ ] No errors in browser console

### **Error Testing** ✏️
- [ ] Tested canceling OAuth flow
- [ ] Error message displayed correctly
- [ ] Redirected back to /auth
- [ ] No console errors

---

## ✅ Success Criteria

Your OAuth is ready for launch when:

- ✅ All Supabase settings verified and saved
- ✅ All Google Cloud Console settings verified
- ✅ All Vercel environment variables set
- ✅ Local testing passes (can sign in successfully)
- ✅ Production testing passes (can sign in successfully)
- ✅ Tested with multiple Google accounts
- ✅ Session persists after page refresh
- ✅ Error scenarios handled gracefully
- ✅ No console errors during sign-in flow
- ✅ Decision made on publishing status (Test vs Production)

---

## 🚀 Ready to Test?

**Quick Start Commands:**

```bash
# Start local dev server
cd /home/vik/aiborg_CC/aiborg-learn-sphere
npm run dev

# Open in browser:
# - Test page: http://localhost:8080/test-oauth-config.html
# - Auth page: http://localhost:8080/auth

# Production URLs:
# - Auth: https://aiborg-ai-web.vercel.app/auth
# - Homepage: https://aiborg-ai-web.vercel.app
```

---

## 📞 Important Links

| Resource | URL |
|----------|-----|
| **Production App** | https://aiborg-ai-web.vercel.app |
| **Vercel Dashboard** | https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web |
| **Vercel Env Vars** | https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/settings/environment-variables |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj |
| **Supabase Auth URLs** | https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/url-configuration |
| **Supabase Providers** | https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/providers |
| **Google Credentials** | https://console.cloud.google.com/apis/credentials |
| **OAuth Consent** | https://console.cloud.google.com/apis/credentials/consent |

---

**Generated:** 2025-10-11
**Last Updated:** 2025-10-11
**Status:** Ready for manual verification and testing
