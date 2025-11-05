# How to Apply Review Request System Migrations

## Overview

The review request system has been split into two migrations that can be safely applied to any
database, regardless of which tables exist.

## Migration Files

1. **`20251104075236_add_review_request_system_standalone.sql`** - Core system (11 KB)
2. **`20251104075237_add_review_request_session_integration.sql`** - Session integration (7.3 KB)

## Option 1: Apply via Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (ID: `afrulkxxzcmngbrdfuzj`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Apply First Migration

1. Copy the entire contents of:

   ```
   supabase/migrations/20251104075236_add_review_request_system_standalone.sql
   ```

2. Paste into the SQL Editor

3. Click **Run** (or press Cmd/Ctrl + Enter)

4. You should see success messages like:
   ```
   NOTICE: Added review request columns to free_sessions
   Success: No rows returned
   ```

### Step 3: Apply Second Migration

1. Click **New Query** again

2. Copy the entire contents of:

   ```
   supabase/migrations/20251104075237_add_review_request_session_integration.sql
   ```

3. Paste into the SQL Editor

4. Click **Run**

5. You should see notices about which tables were updated

### Step 4: Verify Installation

Run this query to verify the migrations worked:

```sql
-- Check review_requests table exists
SELECT COUNT(*) FROM public.review_requests;

-- Check review_request_stats view exists
SELECT * FROM public.review_request_stats LIMIT 1;

-- Check helper function exists
SELECT get_user_pending_review_requests('00000000-0000-0000-0000-000000000000');

-- Check which session tables have review request columns
SELECT
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('review_requests_sent_at', 'review_requests_count')
ORDER BY table_name, column_name;
```

Expected results:

- `review_requests` table should exist (even if empty)
- `review_request_stats` view should exist
- Helper function should return empty result (or results if you have a valid user_id)
- Query should show which tables have the review request tracking columns

## Option 2: Apply via CLI (If You Have Access)

If you have Supabase CLI access with the right credentials:

```bash
# Link to project
npx supabase link --project-ref afrulkxxzcmngbrdfuzj

# Push migrations
npx supabase db push
```

## Option 3: Apply to Local Development

If you want to test locally first:

```bash
# Start local Supabase
npx supabase start

# Migrations will be applied automatically
# Or manually apply:
npx supabase db reset
```

## What These Migrations Do

### Migration 1: Core System

✅ Creates `review_requests` table with NO dependencies ✅ Adds RLS policies for security ✅ Creates
analytics view (`review_request_stats`) ✅ Adds helper function (`get_user_pending_review_requests`)
✅ Extends notification types (if notifications table exists) ✅ Enables real-time replication

### Migration 2: Session Integration

✅ Adds tracking columns to session tables (if they exist) ✅ Creates triggers to auto-update counts
✅ Supports: workshop_sessions, free_sessions, classroom_sessions, courses, events

## Safety Features

Both migrations are designed to:

- ✅ Never fail due to missing tables
- ✅ Skip features gracefully if dependencies don't exist
- ✅ Be safe to run multiple times
- ✅ Log helpful notices about what was applied/skipped
- ✅ Automatically enable features when tables are created later

## What If Some Tables Don't Exist?

| Scenario               | Behavior                                             |
| ---------------------- | ---------------------------------------------------- |
| No session tables      | Core system works, session integration skipped       |
| No notifications table | Works without notification constraint                |
| No reviews table       | Works without foreign key constraint                 |
| No profiles table      | Works with basic RLS (users only, no admin policies) |

The system will gracefully enable features as tables become available!

## Troubleshooting

### Error: "relation public.reviews does not exist"

This is fine! The migration skips the foreign key constraint and continues.

### Error: "permission denied"

You need to be logged in as a Supabase admin. Use the Dashboard method instead.

### No errors but table not created

Check the notices/warnings in the SQL Editor output. The migration may have skipped due to missing
dependencies.

### Want to verify what was created

Run the verification queries in Step 4 above.

## Next Steps After Migration

Once migrations are applied:

1. ✅ Backend is ready - ReviewRequestService will work
2. ✅ Edge function (`send-review-request`) can be deployed
3. ⏳ Frontend components need to be built (see REVIEW_REQUEST_SYSTEM_IMPLEMENTATION.md)

## Support

If you encounter issues:

1. Check the SQL Editor output for specific error messages
2. Run the verification queries to see what exists
3. The migrations are designed to be safe - they won't break your database
