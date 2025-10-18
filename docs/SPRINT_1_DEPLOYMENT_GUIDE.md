# Sprint 1 Deployment Guide
**Date:** October 16, 2025
**Estimated Time:** 30 minutes

---

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] Access to Supabase Dashboard
- [ ] Database connection credentials
- [ ] Admin access to your project
- [ ] Backup of current database (recommended)

**Supabase Dashboard URL:** https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]

---

## 🚀 Deployment Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Create a new query

---

### Step 2: Run Migration 1 - Team Invitations

**File:** `supabase/migrations/20251016120000_team_invitations.sql`

**What it creates:**
- Tables: `team_invitations`, `team_invitation_history`
- Functions: 3 (logging, expiration, acceptance)
- RLS policies: 8
- Indexes: 5

**Instructions:**

1. Copy the entire contents of `20251016120000_team_invitations.sql`
2. Paste into Supabase SQL Editor
3. Click **RUN** button
4. Wait for "Success. No rows returned" message

**Expected Result:**
```
Success. No rows returned
```

**Verification Query:**
```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('team_invitations', 'team_invitation_history');

-- Expected: 2 rows
```

**If you see errors:**
- Check if `organizations` table exists (from previous migrations)
- Ensure `auth.users` is accessible
- Verify you have sufficient permissions

---

### Step 3: Run Migration 2 - Course Assignments

**File:** `supabase/migrations/20251016120001_team_course_assignments.sql`

**What it creates:**
- Tables: `team_course_assignments`, `team_assignment_users`
- Functions: 5 (enrollment, syncing, statistics, overdue detection)
- RLS policies: 10
- Indexes: 8
- Triggers: 3

**Instructions:**

1. Copy the entire contents of `20251016120001_team_course_assignments.sql`
2. Paste into Supabase SQL Editor (new query)
3. Click **RUN**
4. Wait for success message

**Verification Query:**
```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('team_course_assignments', 'team_assignment_users');

-- Expected: 2 rows

-- Check if triggers were created
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%assignment%';

-- Expected: 3 triggers
```

---

### Step 4: Run Migration 3 - Analytics Views

**File:** `supabase/migrations/20251016120002_team_analytics_views.sql`

**What it creates:**
- Views: 4 (team_progress_summary, member_activity_summary, assignment_completion_summary, team_learning_trends)
- Materialized View: 1 (team_dashboard_cache)
- Functions: 5 (analytics queries)
- Indexes: 3
- Grants: Permissions for authenticated users

**Instructions:**

1. Copy the entire contents of `20251016120002_team_analytics_views.sql`
2. Paste into Supabase SQL Editor (new query)
3. Click **RUN**
4. Wait for success message

**Verification Query:**
```sql
-- Check if views were created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%team%' OR table_name LIKE '%member%' OR table_name LIKE '%assignment%';

-- Expected: 4+ views

-- Check if materialized view exists
SELECT matviewname
FROM pg_matviews
WHERE schemaname = 'public'
AND matviewname = 'team_dashboard_cache';

-- Expected: 1 row
```

---

## ✅ Post-Deployment Verification

### Verify All Tables Exist

Run this comprehensive check:

```sql
-- Check all new tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)
ORDER BY table_name;

-- Expected: 4 tables
```

**Expected Output:**
```
team_assignment_users       | 11
team_course_assignments     | 14
team_invitation_history     | 6
team_invitations            | 12
```

---

### Verify All Functions Exist

```sql
-- Check all new functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_invitation_action',
  'expire_old_invitations',
  'accept_team_invitation',
  'auto_enroll_assigned_users',
  'sync_assignment_progress',
  'update_assignment_statistics',
  'mark_overdue_assignments',
  'get_top_performers',
  'get_department_comparison',
  'get_popular_courses',
  'get_learning_velocity',
  'refresh_team_analytics_cache'
)
ORDER BY routine_name;

-- Expected: 12 functions
```

---

### Verify RLS is Enabled

```sql
-- Check RLS status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
);

-- Expected: All should have rowsecurity = true
```

---

### Verify RLS Policies

```sql
-- Check RLS policies count
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected counts:
-- team_assignment_users: 5 policies
-- team_course_assignments: 5 policies
-- team_invitation_history: 3 policies
-- team_invitations: 5 policies
```

---

## 🧪 Testing the Deployment

### Test 1: Create a Test Invitation

```sql
-- First, get your organization ID (or create one if needed)
SELECT id, name FROM organizations WHERE owner_id = auth.uid() LIMIT 1;

-- Create a test invitation
INSERT INTO team_invitations (
  organization_id,
  email,
  first_name,
  last_name,
  role,
  department,
  invited_by
) VALUES (
  '[YOUR_ORG_ID]', -- Replace with actual org ID
  'test@example.com',
  'Test',
  'User',
  'member',
  'Engineering',
  auth.uid()
) RETURNING *;

-- Expected: Should return the created invitation with a unique invite_token
```

---

### Test 2: Check Invitation History (Auto-logged)

```sql
-- Check if history was auto-logged
SELECT * FROM team_invitation_history
WHERE invitation_id IN (
  SELECT id FROM team_invitations WHERE email = 'test@example.com'
)
ORDER BY created_at DESC;

-- Expected: Should show 'sent' action
```

---

### Test 3: Create a Test Assignment

```sql
-- Get a course ID
SELECT id, title FROM courses LIMIT 1;

-- Create test assignment
INSERT INTO team_course_assignments (
  organization_id,
  course_id,
  title,
  description,
  assigned_by,
  is_mandatory,
  auto_enroll
) VALUES (
  '[YOUR_ORG_ID]', -- Replace with actual org ID
  '[COURSE_ID]',   -- Replace with actual course ID
  'Test Assignment',
  'Testing assignment creation',
  auth.uid(),
  true,
  true
) RETURNING *;

-- Expected: Should return the created assignment
```

---

### Test 4: Check Analytics Views

```sql
-- Test team progress summary view
SELECT * FROM team_progress_summary
WHERE organization_id = '[YOUR_ORG_ID]'
LIMIT 1;

-- Expected: Should return organization metrics (even if zeros)

-- Test member activity summary
SELECT * FROM member_activity_summary
WHERE organization_id = '[YOUR_ORG_ID]'
LIMIT 5;

-- Expected: Should return member activity data

-- Test learning trends
SELECT * FROM team_learning_trends
WHERE organization_id = '[YOUR_ORG_ID]'
AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
LIMIT 7;

-- Expected: Should return last 7 days of activity
```

---

### Test 5: Call Analytics Functions

```sql
-- Test top performers function
SELECT * FROM get_top_performers('[YOUR_ORG_ID]', 5);

-- Expected: Returns top 5 performers (or fewer if less members)

-- Test department comparison
SELECT * FROM get_department_comparison('[YOUR_ORG_ID]');

-- Expected: Returns department statistics

-- Test popular courses
SELECT * FROM get_popular_courses('[YOUR_ORG_ID]', 5);

-- Expected: Returns most popular courses
```

---

## 🔐 Security Testing

### Test RLS Policies

**Important:** RLS policies ensure data isolation between organizations.

```sql
-- Test 1: Try to view invitations from another organization (should fail)
-- First, create a second test organization (or use existing)
-- Then try to query invitations from org you don't belong to

SELECT * FROM team_invitations
WHERE organization_id = '[DIFFERENT_ORG_ID]';

-- Expected: Should return 0 rows (even if invitations exist)

-- Test 2: Try to view your own organization's invitations (should work)
SELECT * FROM team_invitations
WHERE organization_id = '[YOUR_ORG_ID]';

-- Expected: Should return your invitations
```

---

## 🐛 Troubleshooting

### Problem: "relation does not exist"

**Cause:** Table wasn't created (migration didn't run successfully)

**Solution:**
1. Check for error messages in SQL Editor
2. Verify the `organizations` table exists first
3. Run the migration again

---

### Problem: "permission denied"

**Cause:** RLS policies blocking access

**Solution:**
1. Ensure you're authenticated (auth.uid() returns a value)
2. Check if you're a member of the organization
3. Verify your role has the required permissions

---

### Problem: "function does not exist"

**Cause:** Function wasn't created

**Solution:**
1. Check if the function was created: `SELECT routine_name FROM information_schema.routines WHERE routine_name = '[FUNCTION_NAME]'`
2. Re-run the migration file
3. Check for syntax errors in the function definition

---

### Problem: Views return no data

**Cause:** No data in underlying tables yet

**Solution:**
1. This is normal for fresh deployments
2. Create test data (invitations, assignments)
3. Views will populate automatically

---

## 📊 Health Check Summary

Run this comprehensive health check:

```sql
-- Comprehensive deployment health check
SELECT
  'Tables' as category,
  COUNT(*) as count,
  4 as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
)

UNION ALL

SELECT
  'Views',
  COUNT(*),
  5
FROM information_schema.views
WHERE table_schema = 'public'
AND (
  table_name LIKE '%team%'
  OR table_name LIKE '%member%'
  OR table_name LIKE '%assignment%'
)

UNION ALL

SELECT
  'Functions',
  COUNT(*),
  12
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'log_invitation_action',
  'expire_old_invitations',
  'accept_team_invitation',
  'auto_enroll_assigned_users',
  'sync_assignment_progress',
  'update_assignment_statistics',
  'mark_overdue_assignments',
  'get_top_performers',
  'get_department_comparison',
  'get_popular_courses',
  'get_learning_velocity',
  'refresh_team_analytics_cache'
)

UNION ALL

SELECT
  'RLS Policies',
  COUNT(*),
  18
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'team_invitations',
  'team_invitation_history',
  'team_course_assignments',
  'team_assignment_users'
);
```

**Expected Output:**
```
Tables      | 4  | 4
Views       | 5  | 5
Functions   | 12 | 12
RLS Policies| 18 | 18
```

**If all counts match expected:** ✅ Deployment successful!

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All 4 tables created
- ✅ All 5 views created (including materialized view)
- ✅ All 12 functions created
- ✅ All 18 RLS policies active
- ✅ Test invitation creates successfully
- ✅ Test assignment creates successfully
- ✅ Analytics views return data
- ✅ RLS policies enforce data isolation

---

## 📝 Post-Deployment Tasks

### 1. Setup Cron Jobs (Optional - For Production)

These functions should run daily via Supabase Edge Functions or cron:

- `expire_old_invitations()` - Mark expired invitations (run daily)
- `mark_overdue_assignments()` - Mark overdue assignments (run daily)
- `refresh_team_analytics_cache()` - Refresh dashboard cache (run hourly)

**To set up:** Create Supabase Edge Functions that call these periodically.

---

### 2. Monitor Performance

Keep an eye on:
- Query performance on analytics views
- Materialized view refresh time
- RLS policy overhead
- Index usage

---

### 3. Backup Strategy

Ensure your backup includes:
- All new tables
- Functions and triggers
- RLS policies
- Views definitions

---

## ✅ Deployment Complete!

Once all tests pass, your Sprint 1 backend is fully deployed and ready for:

- Sprint 2: Building the UI components
- Integration with React hooks
- End-to-end testing

**Next Step:** Start Sprint 2 or test the services from your frontend! 🚀

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review the migration files for syntax errors
3. Verify Supabase project settings
4. Check Supabase logs for detailed error messages

**Supabase Logs:** Dashboard → Logs → Select log type (API, Database, etc.)
