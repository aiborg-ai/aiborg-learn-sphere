# Offline Content System - Production Deployment Guide

**Date**: 2025-11-16 **Feature**: Offline Content Download System **Priority**: Q1 2025 Roadmap

## Overview

This guide provides step-by-step instructions to deploy the Offline Content Download system to
production.

## Components to Deploy

### 1. Database Schema (Migration)

- **File**: `supabase/migrations/20251116000001_offline_content_system.sql`
- **Tables Created**:
  - `offline_downloads` - Tracks downloaded content
  - `offline_progress` - Tracks offline progress for sync
  - `offline_storage_quota` - Manages user storage limits
- **Features**:
  - Row Level Security (RLS) policies
  - Automated triggers for quota management
  - Utility functions for storage checks

### 2. Service Worker

- **File**: `public/sw-offline.js`
- **Features**:
  - Enhanced caching strategies
  - Background sync for progress
  - Offline content management

### 3. Frontend Application

- **Components**:
  - `src/components/offline/DownloadButton.tsx`
  - `src/components/offline/OfflineBadge.tsx`
  - `src/components/offline/DownloadManagerUI.tsx`
- **Services**:
  - `src/services/offline/DownloadManager.ts`
  - `src/services/offline/OfflineContentService.ts`
  - `src/services/offline/ProgressSyncService.ts`
- **Hooks**:
  - `src/hooks/useOfflineContent.ts`
- **Utilities**:
  - `src/utils/offlineStorage.ts`

### 4. UI Integration

- **Modified Files**:
  - `src/components/course-page/CourseHeader.tsx`
  - `src/components/optimized/MemoizedCourseCard.tsx`
  - `src/components/course-page/CourseMaterialsTab.tsx`

## Deployment Steps

### Step 1: Database Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/20251116000001_offline_content_system.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success message appears
8. Check that the following tables now exist:
   - Go to **Table Editor** → Should see `offline_downloads`, `offline_progress`,
     `offline_storage_quota`

**Option B: Via Supabase CLI (Requires Database Password)**

```bash
# If you have the database password:
npx supabase db push --db-url "postgresql://postgres.afrulkxxzcmngbrdfuzj:<PASSWORD>@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

**Verification:**

After running the migration, verify with this SQL query in the SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('offline_downloads', 'offline_progress', 'offline_storage_quota');

-- Should return 3 rows
```

### Step 2: Deploy Application to Vercel

1. **Build the application locally** (optional verification):

   ```bash
   npm run build
   ```

2. **Commit all changes to Git**:

   ```bash
   git add .
   git commit -m "feat: Deploy offline content download system to production

   - Database migration for offline content tables
   - Service worker enhancements
   - Download manager and UI components
   - Course page integration with download buttons
   - Storage quota management
   - Background sync for offline progress"
   ```

3. **Push to GitHub**:

   ```bash
   git push origin main
   ```

4. **Deploy to Vercel**:

   ```bash
   npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
   ```

5. **Monitor deployment**:
   - Vercel Dashboard: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments
   - Or use: `npx vercel inspect <deployment-url> --logs --token ogferIl3xcqkP9yIUXzMezgH`

### Step 3: Verify Production Deployment

**Test Checklist:**

1. **Visit Production Site**:
   - URL: https://aiborg-ai-o8c8qv43w-hirendra-vikrams-projects.vercel.app
   - Or: https://aiborg-ai-web.vercel.app

2. **Test Offline Download Feature**:
   - [ ] Log in to the application
   - [ ] Navigate to a course page (`/course/:courseId`)
   - [ ] Verify **Download** button appears in course header
   - [ ] Click download button
   - [ ] Check download progress indicator appears
   - [ ] Wait for download to complete
   - [ ] Verify **Offline** badge appears next to course title
   - [ ] Check course card in dashboard shows offline badge
   - [ ] Test going offline (DevTools → Network → Offline)
   - [ ] Verify course materials accessible offline
   - [ ] Go back online
   - [ ] Verify progress syncs automatically

3. **Test Database**:

   ```sql
   -- Check downloads are being tracked
   SELECT * FROM public.offline_downloads LIMIT 5;

   -- Check storage quota is working
   SELECT * FROM public.offline_storage_quota LIMIT 5;

   -- Check RLS policies
   SELECT tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE tablename IN ('offline_downloads', 'offline_progress', 'offline_storage_quota');
   ```

4. **Browser Console Checks**:
   - Open DevTools → Console
   - Look for any errors related to offline content
   - Check Service Worker registered: `navigator.serviceWorker.controller`
   - Check IndexedDB has `offlineContent` database

### Step 4: Monitor and Troubleshoot

**Common Issues:**

1. **Service Worker not updating**:
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Clear cache: DevTools → Application → Clear storage
   - Check: DevTools → Application → Service Workers → Update on reload

2. **Download failing**:
   - Check network tab for failed requests
   - Verify CORS headers on Supabase Storage
   - Check browser console for errors
   - Verify user has sufficient storage quota

3. **Offline badge not showing**:
   - Check IndexedDB for download record
   - Verify `useOfflineContent` hook is called
   - Check React DevTools for component state

4. **Progress not syncing**:
   - Check `offline_progress` table for pending records
   - Verify network connectivity
   - Check service worker background sync registration

**Monitoring Queries:**

```sql
-- Active downloads by status
SELECT download_status, COUNT(*)
FROM public.offline_downloads
GROUP BY download_status;

-- Storage usage summary
SELECT
  COUNT(DISTINCT user_id) as total_users,
  SUM(used_bytes) / 1024.0 / 1024.0 / 1024.0 as total_gb_used,
  AVG(used_bytes) / 1024.0 / 1024.0 as avg_mb_per_user
FROM public.offline_storage_quota;

-- Recent downloads
SELECT
  u.email,
  od.content_type,
  od.download_status,
  od.created_at,
  od.file_size_bytes / 1024.0 / 1024.0 as size_mb
FROM public.offline_downloads od
JOIN auth.users u ON u.id = od.user_id
ORDER BY od.created_at DESC
LIMIT 10;
```

## Rollback Plan

If issues occur, you can rollback the database changes:

```sql
-- Drop tables (in order, respecting dependencies)
DROP TABLE IF EXISTS public.offline_progress CASCADE;
DROP TABLE IF EXISTS public.offline_downloads CASCADE;
DROP TABLE IF EXISTS public.offline_storage_quota CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_offline_downloads_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_offline_progress_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_storage_quota() CASCADE;
DROP FUNCTION IF EXISTS check_storage_quota(UUID, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS get_storage_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_failed_downloads(INTEGER) CASCADE;
```

Then redeploy the previous version from Git:

```bash
git revert HEAD
git push origin main
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
```

## Environment Variables

No new environment variables are required. The feature uses existing configuration:

- `VITE_SUPABASE_URL` - Already configured
- `VITE_SUPABASE_ANON_KEY` - Already configured

## Post-Deployment Tasks

1. **Update Documentation**:
   - User guide for offline content feature
   - Admin guide for monitoring storage usage

2. **Monitor Performance**:
   - Track download success rates
   - Monitor storage usage trends
   - Check background sync performance

3. **User Communication**:
   - Announce new offline feature
   - Create tutorial video/guide
   - Add feature to changelog

## Support

For issues or questions:

- Development: Check `OFFLINE_CONTENT_GUIDE.md`
- Database: Check Supabase Dashboard logs
- Frontend: Check Vercel deployment logs
- Git: https://github.com/aiborg-ai/aiborg-learn-sphere

## Success Criteria

✅ Migration runs successfully without errors ✅ All 3 tables created with proper indexes and RLS ✅
Application builds and deploys to Vercel ✅ Download button appears on course pages ✅ Downloads
complete successfully ✅ Offline badge shows for downloaded content ✅ Content accessible when
offline ✅ Progress syncs when back online ✅ Storage quota enforced correctly

---

**Deployment Date**: _To be filled after deployment_ **Deployed By**: _To be filled after
deployment_ **Migration Status**: _To be filled after deployment_ **Production URL**:
https://aiborg-ai-web.vercel.app **Supabase Project**:
https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
