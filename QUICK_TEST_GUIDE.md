# ⚡ Quick Test Guide - Admin Course Management

**5-Minute Essential Tests**

## 🚀 Quick Start

1. **Login:** Sign in with admin credentials at `/auth`
2. **Navigate:** Go to `/admin` → Click "Courses" tab
3. **Test:** Follow these essential tests

---

## ✅ Essential Tests (5 minutes)

### 1️⃣ Create Course with All Fields (2 min)

```
Click "Add New Course"

✏️ Basic Info:
  Title: "Test AI Course" ✓
  Category: "AI" ✓
  Description: "Test description" ✓

⚙️ Course Details:
  Mode: "Online" ✓
  Level: "Beginner" ✓
  Duration: "8 weeks" ✓
  Price: "£5,100" ✓
  Start Date: [Pick any date] ✓
  Order: "10" ✓
  Prerequisites: "None" ✓

👥 Audiences (Type + Press Enter):
  "SMEs & Corporate" ✓
  "Young Learners" ✓

⭐ Features (Type + Press Enter):
  "Live Q&A sessions" ✓
  "Certificate" ✓

🔍 Keywords (Type + Press Enter):
  "AI" ✓
  "Machine Learning" ✓

🎛️ Status:
  Course Active: ON ✓
  Currently Enrolling: ON ✓
  Visible on Website: ON ✓

Click "Create Course" ✓
```

**✅ Pass if:** Toast shows success, course appears in table

---

### 2️⃣ Verify Table Display (1 min)

Check your new course row shows:

- ✅ Title: "Test AI Course"
- ✅ Audiences: 2 badges visible
- ✅ Mode: Blue "Online" badge
- ✅ Duration: "8 weeks"
- ✅ Price: "£5,100"
- ✅ Level: "Beginner"
- ✅ Order: "10"
- ✅ Enrolling: Blue "Yes" badge
- ✅ Active toggle: ON
- ✅ Visible toggle: ON
- ✅ Edit & Delete buttons present

---

### 3️⃣ Edit Course (1 min)

```
Click Edit button on your test course

Modify:
  Duration: Change to "10 weeks" ✓
  Price: Change to "Free" ✓
  Add Audience: "Researchers" ✓ (Now 3 audiences)

Click "Update Course" ✓
```

**✅ Pass if:**

- Toast shows "Course updated successfully"
- Table shows new duration "10 weeks" and price "Free"
- Audiences shows 2 badges + "+1" badge

---

### 4️⃣ Quick Toggles (30 sec)

```
Without opening edit dialog:

  Click "Active" toggle OFF ✓
  → Toast appears, toggle updates

  Click "Active" toggle ON ✓
  → Toast appears, toggle updates

  Click "Visible" toggle OFF then ON ✓
```

**✅ Pass if:** All toggles work without opening dialog

---

### 5️⃣ Delete Course (30 sec)

```
Click Delete button (trash icon) ✓
→ Confirmation dialog appears

Click "Delete" ✓
→ Shows "Deleting..."
→ Success toast
→ Course removed from table
```

**✅ Pass if:** Course deleted, table refreshes

---

## 🎯 You're Done!

**If all 5 tests passed:** ✅ Feature is working correctly!

**If any failed:** See `ADMIN_COURSE_TESTING_GUIDE.md` for detailed debugging

---

## 🐛 Common Issues

**Issue:** Can't access /admin **Fix:** Check your user role is "admin" in profiles table

**Issue:** Audiences don't save **Fix:** Check course_audiences table exists

**Issue:** Toast doesn't appear **Fix:** Check browser console for errors

---

## 📸 Screenshot Checklist

Take these screenshots for documentation:

1. ✅ Course table with multiple courses
2. ✅ Create course dialog (full form)
3. ✅ Audiences section with badges
4. ✅ Features section with badges
5. ✅ Success toast notification
6. ✅ Edit dialog with pre-filled data
7. ✅ Delete confirmation dialog

---

**Time Required:** 5 minutes **Critical Tests:** 5 **Optional Tests:** See full guide (30 more
tests)
