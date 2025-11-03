# ✅ SOLUTION: Events and Courses Not Showing

## Problem Found! 🎯

Your diagnostic results revealed the issue:

```json
{
  "id": 27,
  "title": "AI Leadership Summit 2024",
  "is_active": true,
  "is_visible": false,  ← THIS IS THE PROBLEM!
  "event_date": "2024-02-15"
}
```

**All events have `is_visible = false`** - they're hidden from the website!

## Why This Happens

The RLS (Row Level Security) policy requires **BOTH** conditions:
```sql
WHERE is_active = true AND is_visible = true
```

Your events have:
- ✅ `is_active = true` (events are active)
- ❌ `is_visible = false` (events are HIDDEN)

Result: **0 events shown on website** even though 19 exist in database!

## The Fix (2 minutes)

### Step 1: Make Events Visible

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy contents of: **`MAKE_EVENTS_VISIBLE.sql`**
3. Paste and click **Run**
4. You should see:
   - BEFORE: `active_and_visible = 0`
   - AFTER: `active_and_visible = 19`

### Step 2: Make Courses Visible (if needed)

1. In **SQL Editor** → **New Query**
2. Copy contents of: **`MAKE_COURSES_VISIBLE.sql`**
3. Paste and click **Run**
4. Check results

### Step 3: Test

1. Go to **www.aiborg.ai**
2. Refresh the page (Ctrl+R or Cmd+R)
3. Events and courses should now load! ✅

## What the Fix Does

**Before:**
```sql
UPDATE events SET is_visible = false;  -- Hidden
```

**After:**
```sql
UPDATE events SET is_visible = true;   -- Visible! ✅
```

All active events are now set to `is_visible = true`, so they pass the RLS policy check.

## Files to Run (in order)

1. ✅ **`MAKE_EVENTS_VISIBLE.sql`** - Makes all events visible
2. ✅ **`MAKE_COURSES_VISIBLE.sql`** - Makes all courses visible

## Why Were They Hidden?

Events and courses were likely:
1. Created with `is_visible = false` by default
2. Or manually hidden by an admin
3. Or a migration set them to false

The `is_visible` column is designed to let admins hide events without deleting them, but it looks like all events were accidentally hidden.

## Verification

After running the scripts, verify with this SQL:

```sql
-- Should return 19 events
SELECT COUNT(*)
FROM events
WHERE is_active = true AND is_visible = true;

-- Should return your courses
SELECT COUNT(*)
FROM courses
WHERE is_active = true AND display = true;
```

Both should show counts > 0.

## Expected Website Behavior After Fix

✅ **Events Page**: Shows all 19 active events
✅ **Courses Page**: Shows all active courses
✅ **Homepage**: Shows featured events/courses
✅ **Both logged in and logged out**: Data visible

## Don't Run These Files

These are documentation, not SQL to run:
- ❌ `SOLUTION_EVENTS_NOT_SHOWING.md` (this file - just instructions)
- ❌ `COURSES_EVENTS_NOT_LOADING_FIX.md` (documentation)
- ❌ `RUN_THIS_SQL_FIRST.txt` (instructions)

## If Still Not Working

1. **Check browser console** (F12 → Console)
   - Look for errors
   - Share any red error messages

2. **Verify the update worked**
   ```sql
   SELECT is_visible, COUNT(*)
   FROM events
   GROUP BY is_visible;
   ```
   Should show: `true: 19`

3. **Clear browser cache**
   - Ctrl+Shift+Delete (or Cmd+Shift+Delete)
   - Select "Cached images and files"
   - Click "Clear data"
   - Reload page

## Summary

**Root Cause**: `is_visible = false` on all events (and possibly `display = false` on courses)

**Solution**: Run `MAKE_EVENTS_VISIBLE.sql` and `MAKE_COURSES_VISIBLE.sql`

**Time to Fix**: 2 minutes

**Result**: Events and courses appear on website ✅

---

**Quick Start:**
1. Run `MAKE_EVENTS_VISIBLE.sql` in Supabase SQL Editor
2. Run `MAKE_COURSES_VISIBLE.sql` in Supabase SQL Editor
3. Refresh website
4. Done! 🎉
