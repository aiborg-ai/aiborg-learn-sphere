# Deploy Review Request Edge Functions

## Overview

The review request system requires two edge functions:

1. **`send-review-request`** (NEW) - Main function for sending review requests
2. **`send-email-notification`** (EXISTING) - Email service used by send-review-request

## Prerequisites

✅ Migrations applied successfully (you've done this!) ✅ Supabase project access ✅ Environment
variables configured in Supabase Dashboard

## Method 1: Deploy via Supabase CLI (Recommended if you have access)

### Step 1: Authenticate with Supabase

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref afrulkxxzcmngbrdfuzj
```

### Step 2: Deploy the Function

```bash
# Deploy send-review-request function
npx supabase functions deploy send-review-request

# Verify deployment
npx supabase functions list
```

### Step 3: Set Environment Variables (if needed)

The function needs these environment variables (should already be set):

```bash
# Set SITE_URL if not already set
npx supabase secrets set SITE_URL=https://your-production-url.vercel.app
```

## Method 2: Deploy via Supabase Dashboard

### Step 1: Open Edge Functions

1. Go to https://app.supabase.com
2. Select your project (ID: `afrulkxxzcmngbrdfuzj`)
3. Click **Edge Functions** in the left sidebar
4. Click **Create a new function**

### Step 2: Create the Function

1. **Function Name**: `send-review-request`
2. **Function Code**: Copy the entire contents of:
   ```
   supabase/functions/send-review-request/index.ts
   ```
3. Click **Deploy function**

### Step 3: Configure Function Settings

After deploying, configure the function:

1. Click on the `send-review-request` function
2. Go to **Settings** tab
3. **Verify JWT**: Should be **OFF** (disabled)
   - This is already configured in `supabase/config.toml`
4. Click **Save**

### Step 4: Set Environment Variables

The function requires these environment variables to be set in your Supabase project:

1. Go to **Project Settings** → **Edge Functions** → **Environment variables**
2. Ensure these are set (they should already exist):
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key
   - `SITE_URL` - Your production app URL (e.g., https://aiborg-ai-web.vercel.app)

### Step 5: Verify Deployment

Test the function with a simple request:

1. Go to the function page
2. Click **Invoke function**
3. Test payload:

```json
{
  "sessionId": "00000000-0000-0000-0000-000000000000",
  "sessionType": "free_session",
  "userIds": [],
  "sessionTitle": "Test Session",
  "sessionDate": "2025-11-04T10:00:00Z"
}
```

4. Should return success (even with empty userIds)

## Method 3: Use Supabase Dashboard - Copy/Paste Method

If you can't upload files directly:

### Step 1: Get the Function Code

The complete function code is in:

```
supabase/functions/send-review-request/index.ts
```

### Step 2: Create Function in Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click **Create a new function**
3. Name: `send-review-request`
4. Paste the entire code from `index.ts`
5. Click **Deploy**

## Function Configuration

The function is already configured in `supabase/config.toml`:

```toml
[functions.send-review-request]
verify_jwt = false
```

This means the function doesn't require JWT verification and can be called with the service role
key.

## Testing the Function

### Test 1: Health Check (Empty Request)

```bash
curl -L -X POST \
  'https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/send-review-request' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{
    "sessionId": "test-id",
    "sessionType": "free_session",
    "userIds": [],
    "sessionTitle": "Test Session",
    "sessionDate": "2025-11-04T10:00:00Z"
  }'
```

Expected response:

```json
{
  "success": true,
  "requestsCreated": 0,
  "notificationsCreated": 0,
  "emailsSent": 0,
  "errors": []
}
```

### Test 2: Real Request (with actual user)

```javascript
// From your frontend
const { data, error } = await supabase.functions.invoke('send-review-request', {
  body: {
    sessionId: 'actual-session-id',
    sessionType: 'free_session',
    userIds: ['actual-user-id'],
    sessionTitle: 'Introduction to AI Session',
    sessionDate: '2025-11-04T15:00:00Z',
    customMessage: 'We would love to hear your feedback!',
  },
});

console.log('Result:', data);
```

Expected response (for valid user):

```json
{
  "success": true,
  "requestsCreated": 1,
  "notificationsCreated": 1,
  "emailsSent": 1,
  "errors": [],
  "details": {
    "successfulUserIds": ["user-id"],
    "failedUserIds": []
  }
}
```

## Troubleshooting

### Error: "Function not found"

- Make sure you deployed the function
- Check the function name is exactly `send-review-request`
- Verify in Dashboard → Edge Functions

### Error: "SITE_URL not set"

- Set the environment variable in Project Settings
- Redeploy the function after setting

### Error: "send-email-notification function not found"

- Deploy the `send-email-notification` function first
- Or comment out the email sending section temporarily

### Error: "Cannot invoke function"

- Check CORS settings
- Verify JWT verification is disabled
- Check authorization header

### Error: "No email found for user"

- This is expected if the user doesn't have an email in profiles
- The function will skip that user and continue

## Dependencies

The function depends on:

- ✅ `review_requests` table (created by migration)
- ✅ `notifications` table (should already exist)
- ✅ `profiles` table (should already exist)
- ✅ `send-email-notification` function (should already exist)

## Security

- Function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Only admins can call this function (enforced in frontend)
- Email sending respects user notification preferences
- All database operations are logged

## Next Steps After Deployment

1. ✅ Migrations applied
2. ✅ Edge function deployed
3. ⏳ Build frontend components (see REVIEW_REQUEST_SYSTEM_IMPLEMENTATION.md)
4. ⏳ Test end-to-end flow

## Monitoring

Monitor function execution:

1. Go to Edge Functions → `send-review-request`
2. Click **Logs** tab
3. See real-time execution logs and errors

## Function URL

Your function will be available at:

```
https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/send-review-request
```

## Quick Command Reference

```bash
# Deploy
npx supabase functions deploy send-review-request

# View logs
npx supabase functions logs send-review-request

# List all functions
npx supabase functions list

# Delete function (if needed)
npx supabase functions delete send-review-request
```
