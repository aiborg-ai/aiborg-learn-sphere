# Security Hardening Database Migration - Deployment Guide

## Migration File
`supabase/migrations/20251116000000_security_hardening.sql`

## Deployment Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Navigate to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `afrulkxxzcmngbrdfuzj`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy Migration Content**
   - Open `supabase/migrations/20251116000000_security_hardening.sql`
   - Copy the entire contents (260 lines)

4. **Run Migration**
   - Paste the SQL into the SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for completion (should take 5-10 seconds)

5. **Verify Success**
   - Check for success message in the output panel
   - Verify tables created: `audit_logs`
   - Verify policies added to existing tables

### Option 2: Supabase CLI (If Authenticated)

```bash
# Login to Supabase CLI
npx supabase login

# Link to project
npx supabase link --project-ref afrulkxxzcmngbrdfuzj

# Push migrations
npx supabase db push
```

## What This Migration Does

### 1. Creates `audit_logs` Table
- Tracks all sensitive operations
- Required for audit trail compliance
- Enables the audit logging we implemented in services

### 2. Adds RLS Policies
- **custom_dashboard_views**: Users can only update own dashboards
- **custom_dashboard_views**: Cannot delete published templates
- **dashboard_share_links**: Rate limit share link creation (10/hour)
- **dashboard_template_ratings**: Users can only modify own ratings

### 3. Enforces Data Integrity
- Rating must be between 1 and 5
- Dashboard view limit (50 per user)
- Template publish limit (20 per user)
- Share link validation functions

### 4. Adds Performance Indexes
- `idx_audit_logs_user_id`
- `idx_audit_logs_action`
- `idx_audit_logs_resource`
- `idx_audit_logs_timestamp`
- `idx_share_links_token`
- `idx_share_links_expires_at`
- `idx_templates_category`
- `idx_templates_created_at`
- `idx_templates_view_count`

## Post-Deployment Verification

### 1. Check Tables
```sql
-- Verify audit_logs table exists
SELECT * FROM pg_tables WHERE tablename = 'audit_logs';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('audit_logs', 'custom_dashboard_views', 'dashboard_share_links');
```

### 2. Test Audit Logging
```sql
-- Should be empty initially
SELECT COUNT(*) FROM audit_logs;
```

### 3. Verify Triggers
```sql
-- List all triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('custom_dashboard_views', 'shared_dashboard_templates');
```

### 4. Check Functions
```sql
-- Verify helper functions exist
SELECT proname FROM pg_proc
WHERE proname IN (
  'check_dashboard_view_limit',
  'check_template_publish_limit',
  'validate_share_link_usage',
  'cleanup_expired_share_links'
);
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Remove policies (they won't break existing functionality)
DROP POLICY IF EXISTS "Users can only update own dashboards" ON custom_dashboard_views;
DROP POLICY IF EXISTS "Cannot delete published templates" ON custom_dashboard_views;
DROP POLICY IF EXISTS "Rate limit share link creation" ON dashboard_share_links;
DROP POLICY IF EXISTS "Users can only modify own ratings" ON dashboard_template_ratings;

-- Remove triggers
DROP TRIGGER IF EXISTS dashboard_view_limit_trigger ON custom_dashboard_views;
DROP TRIGGER IF EXISTS template_publish_limit_trigger ON shared_dashboard_templates;

-- Remove functions
DROP FUNCTION IF EXISTS check_dashboard_view_limit();
DROP FUNCTION IF EXISTS check_template_publish_limit();
DROP FUNCTION IF EXISTS validate_share_link_usage(TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_share_links();
```

## Expected Impact

### ✅ Positive
- **Security**: XSS, SQL injection, and unauthorized access prevented
- **Compliance**: Audit trail for all sensitive operations
- **Limits**: Prevents abuse with rate limiting and resource caps
- **Performance**: Indexes improve query speed

### ⚠️ Important Notes
- **Breaking Change**: Share link creation now limited to 10 per hour
- **User Impact**: Users can't create more than 50 dashboard views
- **Template Limits**: Users can't publish more than 20 templates
- **RLS Required**: All operations now enforce ownership verification

## Monitoring Post-Deployment

After deployment, monitor for:

1. **Audit Log Growth**
   ```sql
   SELECT COUNT(*), action FROM audit_logs
   GROUP BY action
   ORDER BY COUNT(*) DESC;
   ```

2. **Rate Limit Hits**
   - Watch for user complaints about "Rate limit exceeded"
   - Check application logs for ERROR_CODES.RATE_LIMIT_EXCEEDED

3. **Policy Violations**
   - Watch for unauthorized access attempts in logs
   - Check Supabase logs for policy violations

## Questions?

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify RLS is enabled on all tables
3. Test operations in SQL Editor before app deployment
4. Review audit_logs table for any logged errors

---

**Status**: ⏳ Awaiting manual deployment
**Priority**: High - Required for audit logging to function
**Estimated Time**: 5-10 minutes
