# 🔧 Admin Access Troubleshooting

## Problem: hirendra@gmail.com is admin in database, but /admin redirects to homepage

---

## ✅ Step-by-Step Fix

### **Step 1: Verify You're Signed In**

Open http://localhost:8080 and check:

- ✅ **Top-right navbar shows:** "hirendra@gmail.com" or your display name
- ❌ **Top-right navbar shows:** "Sign In" button

**If NOT signed in:**

1. Go to http://localhost:8080/auth
2. Sign in with hirendra@gmail.com
3. Continue to Step 2

---

### **Step 2: Sign Out and Sign In Again**

This refreshes your session with the updated admin role:

1. Click your **name/email** in top-right navbar
2. Click **"Sign Out"**
3. Go to http://localhost:8080/auth
4. Sign in with **hirendra@gmail.com**
5. Try http://localhost:8080/admin again

**Why this works:** When you signed in BEFORE updating the role, your session cached the old role.
Signing out and in again fetches the new role.

---

### **Step 3: Clear Browser Data (If Step 2 Fails)**

1. Open browser DevTools: Press **F12**
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage**
4. Click on `http://localhost:8080`
5. Find and delete keys containing:
   - `supabase.auth.token`
   - `sb-*` (any Supabase keys)
6. Close DevTools
7. **Hard refresh:** Ctrl+Shift+R
8. Sign in again

---

### **Step 4: Check Browser Console for Errors**

1. Open DevTools: **F12**
2. Go to **Console** tab
3. Try accessing http://localhost:8080/admin
4. Look for errors

**Common errors:**

| Error           | Meaning                       | Fix               |
| --------------- | ----------------------------- | ----------------- |
| "Unauthorized"  | Profile not fetched correctly | Sign out/in again |
| "Network error" | Can't reach Supabase          | Check internet    |
| "Invalid token" | Session expired               | Sign out/in again |
| No errors       | Silent redirect               | Check Step 5      |

---

### **Step 5: Verify Profile Fetch**

Open browser console and check what role is being fetched:

1. Sign in to http://localhost:8080
2. Open DevTools Console (F12)
3. Paste this code and press Enter:

```javascript
// Check current auth state
const {
  data: { user },
} = await window.supabase.auth.getUser();
const { data: profile } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('User:', user?.email);
console.log('Profile role:', profile?.role);
```

**Expected output:**

```
User: hirendra@gmail.com
Profile role: admin
```

**If you see:**

- `Profile role: user` → Database not updated, go back to Supabase
- `Profile role: null` → Profile not created properly
- `User: undefined` → Not signed in

---

### **Step 6: Force Profile Refresh**

If the profile exists but role is wrong, force a refresh:

```javascript
// Clear cached profile and refetch
await window.supabase.auth.refreshSession();
location.reload();
```

---

## 🐛 Advanced Troubleshooting

### **Check 1: Is Supabase Auth Working?**

Go to Supabase Dashboard: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/users

1. Find hirendra@gmail.com in users list
2. Check if user is confirmed/active
3. Check last sign-in time

### **Check 2: Database Row Correct?**

Run in Supabase SQL editor:

```sql
-- Check the exact data
SELECT
  id,
  email,
  display_name,
  role,
  created_at,
  updated_at
FROM profiles
WHERE email = 'hirendra@gmail.com';
```

**Verify:**

- ✅ `role` column = `'admin'` (with quotes, lowercase)
- ✅ Row exists
- ❌ If no row → Profile not created

### **Check 3: Auth User ID Matches Profile ID**

```sql
-- Check if auth user and profile are linked correctly
SELECT
  p.id as profile_id,
  p.email,
  p.role,
  u.id as auth_user_id,
  u.email as auth_email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'hirendra@gmail.com';
```

**Expected:**

- Both IDs should match
- Role should be 'admin'

---

## 🔍 Diagnostic Checklist

Run through this checklist:

- [ ] Database role = 'admin' (verified in Supabase)
- [ ] Signed out completely
- [ ] Signed in again with hirendra@gmail.com
- [ ] Can see email/name in top-right navbar
- [ ] Cleared browser cache/local storage
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Checked browser console for errors
- [ ] Tried in incognito/private window
- [ ] Profile ID matches auth user ID
- [ ] No network errors in DevTools Network tab

**If ALL checked and still not working:** Continue to Alternative Solutions

---

## 🚨 Alternative Solutions

### **Solution A: Create New Admin Account**

If hirendra@gmail.com is problematic, create a fresh admin account:

1. Sign up with a new email (e.g., admin@aiborg.ai)
2. Update that account to admin in database
3. Sign in with new account
4. Test /admin access

### **Solution B: Bypass Check (Development Only!)**

**⚠️ WARNING: Only for development/testing!**

Temporarily remove the admin check to verify the page works:

1. Open `src/pages/AdminRefactored.tsx`
2. Find lines 357-363
3. Comment out the redirect:

```typescript
useEffect(() => {
  // TEMPORARILY COMMENTED FOR TESTING
  // if (!user || profile?.role !== 'admin') {
  //   navigate('/');
  //   return;
  // }
  fetchData();
}, [user, profile, navigate]);
```

4. Save file
5. Try accessing /admin
6. **If it works:** Problem is with auth/profile fetch
7. **Revert this change** after testing!

### **Solution C: Check Environment Variables**

Verify your `.env.local` has correct Supabase credentials:

```bash
cat .env.local
```

Should show:

```
VITE_SUPABASE_URL=https://afrulkxxzcmngbrdfuzj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:8080
```

If wrong, fix and restart dev server.

---

## 📊 Test Matrix

| Test               | Expected     | Actual | Status |
| ------------------ | ------------ | ------ | ------ |
| Database role      | 'admin'      | ?      | ?      |
| Signed in          | Yes          | ?      | ?      |
| Navbar shows email | Yes          | ?      | ?      |
| Console errors     | None         | ?      | ?      |
| Profile fetched    | role='admin' | ?      | ?      |
| /admin redirects   | No           | ?      | ?      |

Fill this out to track your troubleshooting progress.

---

## 🎯 Most Common Fix

**90% of the time, this fixes it:**

```
1. Sign out completely
2. Close browser tab
3. Open new tab
4. Go to http://localhost:8080/auth
5. Sign in with hirendra@gmail.com
6. Go to http://localhost:8080/admin
```

**Why:** Refreshes the session and fetches updated profile data.

---

## 💡 Quick Debug Command

Paste this in browser console (F12) while signed in:

```javascript
(async () => {
  const {
    data: { user },
  } = await window.supabase.auth.getUser();
  const { data: profile } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  console.log('===== DEBUG INFO =====');
  console.log('Signed in:', !!user);
  console.log('User email:', user?.email);
  console.log('User ID:', user?.id);
  console.log('Profile exists:', !!profile);
  console.log('Profile role:', profile?.role);
  console.log('Is admin:', profile?.role === 'admin');
  console.log('====================');

  if (profile?.role !== 'admin') {
    console.error('❌ ISSUE: Role is not admin!');
    console.log('Current role:', profile?.role);
    console.log('Expected role: admin');
  } else {
    console.log('✅ Role is correct! Try navigating to /admin');
  }
})();
```

This tells you exactly what's wrong.

---

**Created:** October 8, 2025
