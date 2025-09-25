# Google OAuth 2.0 Setup Guide for Supabase

## Step 1: Access Google Cloud Console

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Sign in with your Google account (use the account that will own the project)

2. **Create a New Project** (or select existing)
   - Click the project dropdown at the top
   - Click "New Project"
   - Enter project name: `aiborg-learn-sphere` (or your preferred name)
   - Click "Create"

## Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"

2. **Search and Enable Google+ API**
   - Search for "Google+ API"
   - Click on it and press "Enable"
   - This is required for OAuth to work

## Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" at the top
   - Select "OAuth client ID"

2. **Configure OAuth Consent Screen** (if not already done)
   - Click "CONFIGURE CONSENT SCREEN"
   - Choose "External" (for public access)
   - Click "Create"

3. **Fill in OAuth Consent Screen Details**
   ```
   App name: Aiborg Learn Sphere
   User support email: hirendra.vikram@aiborg.ai
   App logo: (optional - upload your logo)
   Application home page: https://aiborg-ai-web.vercel.app
   Application privacy policy: https://aiborg-ai-web.vercel.app/privacy
   Application terms of service: https://aiborg-ai-web.vercel.app/terms
   Authorized domains:
     - aiborg-ai-web.vercel.app
     - supabase.co
   Developer contact: hirendra.vikram@aiborg.ai
   ```
   - Click "Save and Continue"

4. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Select these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - Click "Update" → "Save and Continue"

5. **Add Test Users** (optional for testing)
   - Add email addresses of test users
   - Click "Save and Continue"

## Step 4: Create OAuth Client ID

1. **Back to Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS"
   - Select "OAuth client ID"

2. **Configure OAuth Client**
   ```
   Application type: Web application
   Name: Supabase Auth

   Authorized JavaScript origins:
   - https://afrulkxxzcmngbrdfuzj.supabase.co
   - https://aiborg-ai-web.vercel.app
   - http://localhost:3000 (for local development)

   Authorized redirect URIs:
   - https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback
   - https://aiborg-ai-web.vercel.app/auth/callback
   - http://localhost:3000/auth/callback (for local development)
   ```
   - Click "Create"

3. **Save Your Credentials**
   - You'll get a popup with:
     - **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxx`
   - **SAVE THESE SECURELY!**

## Step 5: Configure Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
   - Go to "Authentication" → "Providers"

2. **Enable Google Provider**
   - Find "Google" in the list
   - Toggle it ON
   - Enter your credentials:
     ```
     Client ID: [Your Google Client ID]
     Client Secret: [Your Google Client Secret]
     ```
   - Click "Save"

3. **Update Authorized Redirect URIs in Google**
   - Supabase will show you the callback URL
   - Copy it (usually: `https://[project-ref].supabase.co/auth/v1/callback`)
   - Go back to Google Cloud Console
   - Edit your OAuth 2.0 Client
   - Add this URL to "Authorized redirect URIs"
   - Save

## Step 6: Environment Variables

1. **For Local Development** (.env.local)
   ```env
   # These are public keys - safe to commit
   VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com

   # Supabase will handle the client secret internally
   ```

2. **For Vercel Production**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add:
     ```
     VITE_GOOGLE_CLIENT_ID = xxxxxxxxxxxx.apps.googleusercontent.com
     ```

## Step 7: Test the Integration

1. **Local Testing**
   ```bash
   npm run dev
   ```
   - Go to http://localhost:3000/auth
   - Click "Continue with Google"
   - Should redirect to Google sign-in

2. **Production Testing**
   - Deploy to Vercel
   - Go to https://aiborg-ai-web.vercel.app/auth
   - Test Google sign-in

## Common Issues & Solutions

### Issue 1: "Redirect URI mismatch"
**Solution**: Make sure the redirect URI in Google Console exactly matches Supabase's callback URL (including https://, no trailing slash)

### Issue 2: "This app is blocked"
**Solution**:
- During development, app is in "Testing" mode
- Add test users in OAuth consent screen
- Or publish the app for production use

### Issue 3: "Invalid client"
**Solution**:
- Double-check Client ID and Secret
- Ensure they're correctly entered in Supabase
- Wait a few minutes for changes to propagate

### Issue 4: "User info not being saved"
**Solution**:
- Check Supabase Auth settings
- Ensure "Email confirmations" is properly configured
- Check user metadata mappings

## Publishing for Production

When ready for production:

1. **Go to OAuth Consent Screen**
2. Click "Publish App"
3. Google may require verification if you request sensitive scopes
4. For basic auth (email, profile), usually instant approval

## Security Best Practices

1. **Never expose Client Secret**
   - Only store in Supabase Dashboard
   - Never commit to git
   - Never expose in frontend code

2. **Restrict Domains**
   - Only add your actual domains to authorized origins
   - Remove localhost URLs in production

3. **Use HTTPS**
   - Always use HTTPS URLs (except localhost for dev)
   - Google requires HTTPS for production

4. **Regular Audits**
   - Review authorized domains regularly
   - Remove unused redirect URIs
   - Rotate secrets if compromised

## Quick Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API
- [ ] Configured OAuth Consent Screen
- [ ] Created OAuth 2.0 Client ID
- [ ] Saved Client ID and Client Secret
- [ ] Configured Supabase Google Provider
- [ ] Added callback URL to Google Console
- [ ] Updated environment variables
- [ ] Tested locally
- [ ] Tested in production
- [ ] Published app (when ready)

## Need Help?

- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- Supabase Auth Docs: https://supabase.com/docs/guides/auth/social-login/auth-google
- Google Cloud Console: https://console.cloud.google.com/