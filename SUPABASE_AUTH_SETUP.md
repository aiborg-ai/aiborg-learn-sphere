# Supabase Authentication Setup Guide

## Configure Redirect URLs in Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `afrulkxxzcmngbrdfuzj`

### Step 2: Configure Authentication URLs
1. Navigate to **Authentication** → **URL Configuration**
2. Add the following URLs to **Redirect URLs** (allowed list):
   - `http://localhost:8080/*` (for local development)
   - `https://your-app-name.vercel.app/*` (replace with your actual Vercel URL)
   - `https://aiborg-ai-web.vercel.app/*` (if this is your domain)

### Step 3: Update Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Check that the confirmation email template uses the `{{ .RedirectTo }}` variable
3. Default template should work, but you can customize if needed

## Environment Variables Setup

### For Local Development
Create a `.env` file in your project root:
```env
VITE_APP_URL=http://localhost:8080
VITE_SUPABASE_URL=https://afrulkxxzcmngbrdfuzj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8
```

### For Production (Vercel)
Add these environment variables in Vercel Dashboard:
- `VITE_APP_URL` = `https://your-app-name.vercel.app` (your actual Vercel URL)
- `VITE_SUPABASE_URL` = `https://afrulkxxzcmngbrdfuzj.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

## Testing the Fix

1. **Local Testing:**
   - Run `npm run dev`
   - Sign up with a new email
   - Check that the confirmation email redirects to `http://localhost:8080`

2. **Production Testing:**
   - Deploy to Vercel
   - Sign up with a new email
   - Check that the confirmation email redirects to your Vercel URL

## Troubleshooting

### Email still redirects to wrong URL?
1. Clear your browser cache
2. Check that environment variables are loaded correctly
3. Verify Supabase dashboard settings saved properly
4. Make sure you've redeployed after adding environment variables

### Getting CORS errors?
Ensure your domain is added to Supabase's allowed redirect URLs list

### Environment variables not working?
- Restart your dev server after adding `.env` file
- In Vercel, redeploy after adding environment variables
- Check variable names start with `VITE_` for Vite to expose them