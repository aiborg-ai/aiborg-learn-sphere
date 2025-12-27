# Fix Database Errors - Migration Instructions

## Quick Summary

This migration fixes all the database errors found in production:

- ✅ Creates missing tables: `engagement_metrics`, `page_views`
- ✅ Fixes RLS policies for `reviews` and `events` tables
- ✅ Fixes `get_tenant_by_domain` RPC function
- ✅ Adds analytics views

## Apply Migration via Supabase Dashboard

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run the Migration

1. Open the migration file: `supabase/migrations/20251227_fix_database_errors.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **Run** button (or press Cmd/Ctrl + Enter)

### Step 3: Verify Migration Success

You should see a success message. Verify by checking:

1. Go to **Table Editor** → Check if `engagement_metrics` and `page_views` tables exist
2. Go to **Database** → **Functions** → Check if `get_tenant_by_domain` exists

### Step 4: Test the Site

Visit https://www.aiborg.ai and open browser console (F12)

- You should see **NO** 404 or 500 errors
- All features should load correctly

## What This Migration Does

### 1. Creates Missing Tables

**engagement_metrics** - Tracks user interactions:

- Page views, clicks, scrolls, time spent
- User ID, session ID, page path, action type
- Automatically indexed for performance

**page_views** - Analytics data:

- Page visits with referrer, user agent, IP
- Device type, browser, OS detection
- Country and city tracking
- Session duration

### 2. Fixes RLS Policies

**Reviews Table**:

- Allows anyone to view approved reviews (was blocked)

**Events Table**:

- Allows anyone to view visible events (was blocked)

**New Tables**:

- Anyone can insert analytics data (for tracking)
- Users can view their own data

### 3. Fixes RPC Function

**get_tenant_by_domain**:

- Now handles missing table gracefully
- Returns empty result instead of 406 error
- Proper error handling

### 4. Adds Analytics Views

**page_view_analytics**:

- Total views, unique users, unique sessions
- Average duration, device type breakdown
- Grouped by page and date

**engagement_analytics**:

- Action counts by type (view, click, scroll)
- Unique users and sessions
- Grouped by page, action, and hour

## Troubleshooting

### If migration fails:

1. Check error message in SQL Editor
2. The migration uses `IF NOT EXISTS` and `IF EXISTS` so it's safe to run multiple times
3. Each section is independent - partial success is OK

### If you still see errors:

1. Check browser console for specific error URLs
2. Verify RLS policies: Database → Authentication → Policies
3. Check table existence: Table Editor

## After Migration

All database errors should be resolved:

- ✅ No more 404 errors for missing tables
- ✅ No more 500 errors from reviews/events queries
- ✅ No more 406 errors from RPC function
- ✅ Analytics tracking will work
- ✅ Page views will be recorded
- ✅ Reviews and events will display
