# Fix Browser Security Warning for aiborg-ai-web.vercel.app

## Problem
Browser shows security warning: "Did you mean aiborg.ai?" when visiting `aiborg-ai-web.vercel.app`

## Solutions

### Solution 1: Use Custom Domain (Best)

Since you own `aiborg.ai`, connect it to this Vercel project:

1. **Check Current Domain Owner**
   - The domain `aiborg.ai` is already assigned to another Vercel project/team
   - You need to access the correct Vercel account that owns this domain

2. **Steps to Connect Domain**:
   ```bash
   # From the correct Vercel account/team:
   vercel domains add aiborg.ai

   # Or use the Vercel Dashboard:
   # Go to: Settings → Domains → Add Domain
   ```

3. **Update DNS Records** (at your domain registrar):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Solution 2: Use a Subdomain

Create a subdomain that doesn't trigger the warning:

1. **Add Subdomain in Vercel**:
   ```bash
   vercel domains add app.aiborg.ai
   ```

2. **Configure DNS**:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

3. **Result**: Access via `https://app.aiborg.ai` (no warning)

### Solution 3: Change Project Name (Temporary)

Rename the Vercel project to avoid similarity:

1. **In Vercel Dashboard**:
   - Go to: Settings → General → Project Name
   - Change from: `aiborg-ai-web`
   - To something like: `learn-platform-2025`

2. **New URL**: `https://learn-platform-2025.vercel.app`

### Solution 4: Add Browser Exception (Users)

Tell users to:
1. Click "Ignore" or "Continue anyway" on the warning
2. Add the site to their trusted sites
3. Bookmark the correct URL

## Immediate Actions

### For You (Developer):

1. **Access the correct Vercel account** that owns `aiborg.ai`
2. **Connect the domain** to your project
3. **Or create a subdomain** like `app.aiborg.ai` or `platform.aiborg.ai`

### Update All References:

Once you have the custom domain:
1. Update `VITE_APP_URL` in environment variables
2. Update OAuth redirect URLs in Google Console
3. Update Supabase redirect URLs
4. Update any hardcoded URLs in the code

## Why This Happens

- Chrome's Safe Browsing detects similarity between:
  - Your URL: `aiborg-ai-web.vercel.app`
  - Known domain: `aiborg.ai`
- It assumes potential typosquatting/phishing
- This is a false positive but affects user trust

## Recommended Solution

**Use your actual domain `aiborg.ai` or a subdomain like `app.aiborg.ai`**

This will:
- ✅ Remove the security warning
- ✅ Look more professional
- ✅ Build user trust
- ✅ Improve SEO

## Need Help?

1. **Check which Vercel account owns aiborg.ai**:
   - Try logging into different Vercel accounts
   - Check email for Vercel domain emails
   - Contact Vercel support if needed

2. **Alternative domains**:
   - `learn.aiborg.ai`
   - `platform.aiborg.ai`
   - `app.aiborg.ai`
   - `portal.aiborg.ai`