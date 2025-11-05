# Test Plan: Course Update Fix Verification

## ✅ Migration Applied Successfully

Great! The migration has been run. Now let's verify everything is working.

---

## Quick Verification (2 minutes)

### Step 1: Verify Database Policy

Run this in **Supabase SQL Editor**:

```sql
SELECT
  policyname,
  cmd,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'courses'
  AND policyname = 'Admins can update courses';
```

**Expected Result:**

- `policyname`: "Admins can update courses"
- `cmd`: "UPDATE"
- `has_with_check`: **true** ✅

If you see `has_with_check: false`, the migration didn't apply correctly.

---

### Step 2: Test Course Update in UI

1. **Open the application** in your browser
2. **Log in as admin** (your admin user)
3. **Navigate to**: Admin Panel → Course Management
4. **Click Edit** on any course (e.g., "Kickstarter AI Adventures")
5. **Make a simple change**:
   - Update the title (e.g., add " - Updated" to the end)
   - Or change the duration
   - Or modify the description
6. **Click "Update Course"** button
7. **Watch for**:
   - ✅ Green toast notification: "Course updated successfully"
   - ✅ Dialog closes
   - ✅ Course list refreshes with updated data
   - ✅ **No red error toast**

---

## Detailed Testing (5 minutes)

### Test Case 1: Update Basic Fields

- [x] Update course **title**
- [x] Update course **description**
- [x] Update **price**
- [x] Update **duration**
- [x] Click "Update Course"
- **Expected**: Success toast + changes visible in list

### Test Case 2: Update Status Toggles

- [x] Toggle "Course Active" switch
- [x] Toggle "Currently Enrolling" switch
- [x] Toggle "Visible on Website" switch
- [x] Click "Update Course"
- **Expected**: Success toast + toggle states saved

### Test Case 3: Update Arrays

- [x] Add/remove **audiences** (e.g., add "Professional")
- [x] Add/remove **features** (e.g., add "Live Q&A")
- [x] Add/remove **keywords** (e.g., add "AI, Machine Learning")
- [x] Click "Update Course"
- **Expected**: Success toast + array items saved

### Test Case 4: Update Dates

- [x] Change **start_date** to a different date
- [x] Click "Update Course"
- **Expected**: Success toast + new date saved

### Test Case 5: Rapid Updates

- [x] Edit a course
- [x] Update title → Save → Success
- [x] Edit same course again
- [x] Update duration → Save → Success
- **Expected**: Both updates work independently

---

## Browser Console Check

**Before testing**, open browser console (F12 → Console):

### What You Should NOT See:

- ❌ Any errors mentioning "RLS" or "policy"
- ❌ Any errors mentioning "permission denied"
- ❌ Any 403 errors from Supabase
- ❌ Failed network requests to `/rest/v1/courses`

### What You SHOULD See:

- ✅ Successful PATCH request to `/rest/v1/courses?id=eq.{id}`
- ✅ Status code: 200 OK
- ✅ Response body: empty or course data

---

## Troubleshooting

### If Update Still Fails:

#### 1. Check Admin Role

Run in Supabase SQL Editor:

```sql
SELECT user_id, role, email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.id = auth.uid();
```

**Expected**: `role` should be `'admin'`

#### 2. Check Browser Console

Look for exact error message. Common issues:

- **"new row violates row-level security policy"** → Policy still not correct
- **"permission denied"** → User is not admin
- **"column does not exist"** → Form sending wrong field names

#### 3. Verify Migration Applied

```sql
SELECT * FROM pg_policies
WHERE tablename = 'courses'
  AND policyname = 'Admins can update courses';
```

Check that `with_check` column is NOT NULL.

#### 4. Check Other RLS Policies

```sql
-- This should return 0 (no conflicting policies)
SELECT COUNT(*) - 1 as extra_update_policies
FROM pg_policies
WHERE tablename = 'courses'
  AND cmd = 'UPDATE';
```

---

## Success Criteria ✅

All these should work without errors:

- [x] **Create** new course → Success
- [x] **Read/View** courses in list → Visible
- [x] **Update** course fields → Success (THIS WAS BROKEN, NOW FIXED)
- [x] **Delete** course → Success
- [x] **Toggle** course status (Active/Display) → Success
- [x] **Duplicate** course → Success

---

## Next Steps After Verification

Once you've confirmed updates are working:

1. **Test other admin operations** to ensure nothing else broke
2. **Deploy to production** if this is currently on staging
3. **Monitor** for any issues in the next 24 hours
4. **Document** this fix in your internal docs

---

## Verification Script

I created `VERIFY_COURSE_UPDATE_FIX.sql` which contains comprehensive checks.

Run it in Supabase SQL Editor to get a full report of:

- Policy configuration
- Admin users
- Potential conflicts

---

## Status Report Template

After testing, reply with:

```
✅ Migration verified: [YES/NO]
✅ UI update working: [YES/NO]
✅ Browser console clean: [YES/NO]
✅ All test cases passed: [YES/NO]

Issues found (if any):
- [describe any issues]
```

---

**Need help?** Let me know the results and I'll help troubleshoot!
