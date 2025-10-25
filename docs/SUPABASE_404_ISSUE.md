# Supabase 404 Error - Root Cause Analysis

## Issue Found ✅

The loading issue is **NOT** a code problem. The Supabase database is returning **404 errors** for
all API requests.

## Failed API Calls

All of these Supabase REST API endpoints are returning 404:

1. ❌ `GET /rest/v1/courses_with_audiences` - 404
2. ❌ `GET /rest/v1/events` - 404
3. ❌ `GET /rest/v1/reviews` - 404
4. ❌ `POST /rest/v1/rpc/get_assessment_tools_for_audience` - 404
5. ❌ WebSocket `wss://...supabase.co/realtime/v1/websocket` - 502 Error

## Root Causes (Most Likely)

### 1. Supabase Project Paused ⏸️

**Most Common Issue:** Free tier Supabase projects automatically pause after 7 days of inactivity.

**Check:**

1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
2. Look for a "Paused" banner at the top
3. Click "Resume Project" if paused

**Resolution Time:** 1-2 minutes for project to resume

---

### 2. Missing Database Tables/Views 🗄️

The view `courses_with_audiences` and tables might not exist in the database.

**Check:**

1. Go to Supabase Dashboard → Table Editor
2. Verify these tables/views exist:
   - `courses_with_audiences` (VIEW)
   - `events` (TABLE)
   - `reviews` (TABLE)
   - `assessment_tools` (TABLE)

**Fix:** Run migrations if tables are missing

---

### 3. RLS Policies Blocking Access 🔒

Row Level Security policies might be blocking anonymous access.

**Check:**

1. Supabase Dashboard → Authentication → Policies
2. Look for policies on `courses`, `events`, `reviews`, `assessment_tools`
3. Ensure there are policies allowing SELECT for anonymous users

**Example Policy:**

```sql
-- Public read access for active courses
CREATE POLICY "Public can view active courses"
  ON courses FOR SELECT
  USING (is_active = true AND display = true);
```

---

### 4. Database Connection Issue 🌐

Network or authentication problem with Supabase.

**Check:**

1. Verify `VITE_SUPABASE_URL` in `.env.local`
2. Verify `VITE_SUPABASE_ANON_KEY` in `.env.local`
3. Check if Supabase is experiencing outages: https://status.supabase.com/

---

## Quick Fix Steps

### Step 1: Resume Supabase Project

1. Visit: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
2. If you see "Project Paused", click **Resume Project**
3. Wait 1-2 minutes for it to become active
4. Refresh your app

### Step 2: Verify Tables Exist

Run this query in Supabase SQL Editor:

```sql
-- Check if tables/views exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'courses_with_audiences', 'events', 'reviews', 'assessment_tools')
ORDER BY table_name;
```

Expected output: 5 rows showing tables/views

### Step 3: Check RLS Policies

Run this query:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('courses', 'events', 'reviews', 'assessment_tools')
ORDER BY tablename, policyname;
```

Should show policies allowing public SELECT access.

---

## What's Working

✅ Frontend code is correct ✅ React components render properly ✅ Routing works ✅ UI components
load ✅ API calls are being made correctly

## What's NOT Working

❌ Supabase database API returning 404 ❌ No data being returned from backend ❌ WebSocket
connection failing (realtime subscriptions)

---

## Next Actions

1. **Check Supabase Dashboard** for "Paused" status
2. **Resume project** if paused
3. **Verify tables exist** in Table Editor
4. **Check RLS policies** allow anonymous SELECT
5. **Refresh browser** after fixing

---

## Contact Supabase Support

If none of the above works, contact Supabase:

- Dashboard: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/settings/general
- Support: https://supabase.com/support
- Status: https://status.supabase.com/

Project Ref: `afrulkxxzcmngbrdfuzj`
