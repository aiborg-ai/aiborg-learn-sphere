# 🔐 Setup Admin Access - Quick Guide

## Problem: Getting Redirected from /admin to Homepage

**Reason:** Your account doesn't have admin role in the database.

---

## ✅ Solution: Update Your Role to Admin

### **Method 1: Using Supabase Dashboard (Easiest)**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj

2. **Navigate to Table Editor:**
   - Click **"Table Editor"** in left sidebar
   - Select **"profiles"** table

3. **Find Your Account:**
   - Look for your email address in the list
   - Or use the search filter

4. **Edit Your Role:**
   - Click on your row
   - Find the **"role"** column
   - Change it from `user` to `admin`
   - Click **Save**

5. **Sign Out and Sign In Again:**
   - Go to http://localhost:8080
   - Sign out (if signed in)
   - Sign in again
   - Try http://localhost:8080/admin

---

### **Method 2: Using SQL Query (Advanced)**

1. **Go to Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

2. **Run this SQL query** (replace with YOUR email):

```sql
-- Update your account to admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, display_name, role
FROM profiles
WHERE email = 'your-email@example.com';
```

3. **Click "Run"**

4. **Verify the result shows:**
   - Your email
   - role = 'admin'

5. **Sign out and sign in again**

---

### **Method 3: Using psql Command Line**

```bash
PGPASSWORD='hirendra$1234ABCD' psql \
  -h aws-0-ap-south-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.afrulkxxzcmngbrdfuzj \
  -d postgres \
  -c "UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';"
```

Replace `your-email@example.com` with your actual email.

---

## 🔍 Check Your Current Status

### **Before making changes, check:**

**SQL Query:**

```sql
SELECT id, email, display_name, role, created_at
FROM profiles
WHERE email = 'your-email@example.com';
```

**What to look for:**

- `role` column should be `'admin'` (not `'user'`)

---

## 📝 Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: ARE YOU SIGNED IN?                                 │
│                                                              │
│  Check: Do you see your name in top-right navbar?           │
│                                                              │
│  ❌ NO  → Sign in at /auth first                            │
│  ✅ YES → Continue to Step 2                                │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: CHECK YOUR ROLE IN DATABASE                        │
│                                                              │
│  Go to Supabase → Table Editor → profiles table             │
│  Find your email → Check "role" column                      │
│                                                              │
│  Current role = "user"   → Continue to Step 3               │
│  Current role = "admin"  → See troubleshooting below        │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: UPDATE ROLE TO ADMIN                               │
│                                                              │
│  In Supabase profiles table:                                │
│  1. Click on your row                                       │
│  2. Change role column: "user" → "admin"                    │
│  3. Save                                                     │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: SIGN OUT AND SIGN IN AGAIN                         │
│                                                              │
│  1. Click your name in navbar                               │
│  2. Click "Sign Out"                                        │
│  3. Sign in again at /auth                                  │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: TRY ACCESSING ADMIN                                │
│                                                              │
│  Go to: http://localhost:8080/admin                         │
│                                                              │
│  ✅ SUCCESS! You should see the admin dashboard             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### **Issue 1: Still Redirected After Setting role = 'admin'**

**Cause:** Your browser has cached the old profile data

**Fix:**

1. Sign out completely
2. Close browser tab
3. Open new tab
4. Sign in again
5. Try /admin again

OR

1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Sign in again

---

### **Issue 2: "Admin Dashboard" Not Showing in Dropdown**

**Cause:** Profile not updated in current session

**Fix:**

1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or sign out and sign in again

---

### **Issue 3: Can't Find Your Email in profiles Table**

**Cause:** You haven't created a profile yet

**Fix:**

1. Sign in to the app at http://localhost:8080/auth
2. Go to http://localhost:8080/profile
3. Fill in your profile (display name, etc.)
4. This creates your profile record
5. Then update the role in database

---

### **Issue 4: Multiple Accounts with Same Email**

**Cause:** Duplicate profiles in database

**Fix:**

```sql
-- Find duplicates
SELECT id, email, role, created_at
FROM profiles
WHERE email = 'your-email@example.com'
ORDER BY created_at DESC;

-- Update the most recent one
UPDATE profiles
SET role = 'admin'
WHERE id = 'the-most-recent-id-from-above';
```

---

## ✅ Verification Checklist

After making changes, verify:

- [ ] Signed in successfully
- [ ] Can see username in top-right navbar
- [ ] Click username → Dropdown menu appears
- [ ] Dropdown shows "Admin Dashboard" option
- [ ] Clicking "Admin Dashboard" goes to /admin
- [ ] See admin interface (tabs: Analytics, Users, Courses, etc.)
- [ ] NOT redirected to homepage

---

## 🎯 Quick Test

**After setting up admin access:**

1. Navigate to: http://localhost:8080/admin
2. **Expected:** See admin dashboard with tabs
3. **If redirected:** Follow troubleshooting steps above

**Check navbar dropdown:**

1. Click your name in navbar
2. **Expected:** See "Admin Dashboard" option
3. **If not there:** Your role is not admin yet

---

## 📊 Database Role Values

| Role Value     | Access Level                           |
| -------------- | -------------------------------------- |
| `'user'`       | Normal user - No admin access          |
| `'admin'`      | Administrator - Full access to /admin  |
| `'instructor'` | Instructor - Access to /instructor     |
| `null`         | No specific role - Default user access |

**You need:** `role = 'admin'`

---

## 🔐 Security Note

**Important:** Only give admin role to trusted accounts!

Admin users can:

- ✅ Create/edit/delete courses
- ✅ Manage all users
- ✅ View all enrollments
- ✅ Manage content (blog, events, reviews)
- ✅ Access analytics
- ✅ Full system access

**Best practice:**

- Create a separate admin account
- Don't use your personal account as admin
- Limit number of admin accounts

---

## 📞 Still Need Help?

If you're still having issues:

1. **Check browser console** (F12) for errors
2. **Check Supabase logs** for auth issues
3. **Verify environment variables** are correct
4. **Try incognito/private browsing** to rule out cache issues

**Common errors in console:**

- "Unauthorized" → Role not set correctly
- "Network error" → Check internet connection
- "Invalid token" → Sign out and sign in again

---

**Created:** October 8, 2025 **Last Updated:** October 8, 2025
