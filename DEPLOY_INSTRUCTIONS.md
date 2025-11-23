# Deployment Instructions for Vault Claim Feature

## ✅ Completed Steps

1. ✅ Fixed SQL migration syntax error
2. ✅ Applied database migration to production

## 📋 Remaining Steps (Manual Authentication Required)

### Step 1: Authenticate Supabase CLI

```bash
# Login to Supabase CLI
npx supabase login

# Link the project
npx supabase link --project-ref afrulkxxzcmngbrdfuzj
```

### Step 2: Regenerate TypeScript Types (Optional but Recommended)

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Step 3: Deploy Edge Functions

```bash
# Deploy submit-vault-claim function
npx supabase functions deploy submit-vault-claim

# Deploy process-vault-claim function
npx supabase functions deploy process-vault-claim

# Verify deployment
npx supabase functions list
```

### Step 4: Deploy Frontend to Vercel

```bash
# Build the project
npm run build

# Deploy to Vercel production
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
```

## 🔍 Verification Steps

After completing all deployments:

1. **Test the Free Claim Flow:**
   - Navigate to: https://aiborg-ai-o8c8qv43w-hirendra-vikrams-projects.vercel.app/claim-free-pass
   - Complete Steps 1-3 (should work as before)
   - Submit the claim at Step 4 (should now work!)
   - Check for success message and email notification

2. **Check Admin Dashboard:**
   - Login as admin
   - Navigate to Vault Claims section
   - Verify you can see the submitted claim
   - Test approval/rejection workflow

3. **Verify Database:**
   - Check Supabase Dashboard → Table Editor
   - Confirm `vault_subscription_claims` table exists
   - Verify claim records are being created

## 📝 Files Modified

- ✅ `/supabase/migrations/20251105000000_vault_subscription_claims.sql` - Fixed SQL syntax
- 📄 `/apply_vault_migration.sql` - Applied to production database
- ⏳ `/src/integrations/supabase/types.ts` - Needs regeneration after auth

## 🎯 Expected Outcome

Users should now be able to:

- ✅ Navigate through Steps 1-3 of free claim flow
- ✅ Successfully submit claims at Step 4
- ✅ Receive email notifications
- ✅ Admins can review and approve/reject claims

## ❓ Troubleshooting

If claim submission still fails:

1. **Check Edge Function Logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Look for errors in `submit-vault-claim` function

2. **Verify Database Tables:**
   - Supabase Dashboard → Table Editor
   - Confirm `vault_subscription_claims` and `vault_subscribers` tables exist

3. **Check Browser Console:**
   - Open Developer Tools → Console
   - Look for API errors or network failures

4. **Test Database Function:**
   - Supabase Dashboard → SQL Editor
   - Run:
     `SELECT public.submit_vault_claim(NULL, 'test@example.com', 'Test User', 'vault@example.com', NOW(), '[]'::jsonb, '{}'::jsonb);`
   - Should return a UUID without errors
