# 🧪 Admin Course Management Testing Guide

**Date:** October 8, 2025 **Feature:** Enhanced Course Management with Full Database Schema Support
**Location:** `/admin` → Courses Tab

---

## 📋 Test Prerequisites

### Required Access

- **Admin account** with `role = 'admin'` in the `profiles` table
- Navigate to: `http://localhost:8080/admin`
- Click on the **"Courses"** tab

---

## ✅ Test Cases

### **TEST 1: View Course Management Interface**

**Objective:** Verify the enhanced course table displays all new fields

**Steps:**

1. Navigate to Admin → Courses tab
2. Observe the table header columns

**Expected Results:**

- ✅ Table shows these columns:
  - Title
  - Audiences (with badges)
  - Mode (Online/Offline/Hybrid)
  - Duration
  - Price
  - Level
  - Order (sort_order)
  - Enrolling (Yes/No badge)
  - Active (toggle switch)
  - Visible (toggle switch)
  - Actions (Edit/Delete buttons)

**Screenshot Location:** `admin_courses_table.png`

---

### **TEST 2: Create New Course - Basic Information**

**Objective:** Test basic course information fields

**Steps:**

1. Click **"Add New Course"** button
2. Verify the form opens with sectioned layout
3. Fill in Basic Information section:
   - **Course Title:** "Test AI Course"
   - **Category:** Select "AI"
   - **Description:** "This is a test course for AI learning"

**Expected Results:**

- ✅ Dialog opens with title "Create New Course"
- ✅ Form is organized into clear sections with headers
- ✅ Title field is required (shows \* indicator)
- ✅ Category dropdown has options: AI, Machine Learning, Data Science, Young Learners, Corporate
  Training
- ✅ Description textarea allows multi-line input

---

### **TEST 3: Course Details Section**

**Objective:** Test all course detail fields

**Steps:**

1. In the Course Details section, fill:
   - **Mode:** Select "Online"
   - **Level:** Select "Beginner"
   - **Duration:** "8 weeks"
   - **Price:** "£5,100"
   - **Start Date:** Select today's date + 7 days
   - **Display Order:** "10"

**Expected Results:**

- ✅ Mode dropdown shows: Online, Offline, Hybrid
- ✅ Level dropdown shows: Beginner, Intermediate, Advanced, All Levels
- ✅ Duration accepts free-text (e.g., "8 weeks", "40 hours")
- ✅ Price accepts any format (£, $, "Free")
- ✅ Start date shows date picker
- ✅ Display Order accepts numbers

---

### **TEST 4: Prerequisites Field**

**Objective:** Test prerequisites textarea

**Steps:**

1. In Course Details section, fill Prerequisites:
   - **Prerequisites:** "No prior experience required. Basic understanding of programming is helpful
     but not mandatory."

**Expected Results:**

- ✅ Prerequisites textarea accepts multi-line text
- ✅ Placeholder shows helpful example text
- ✅ Field is optional (no \* indicator)

---

### **TEST 5: Dynamic Audiences (Array Input)**

**Objective:** Test adding/removing multiple target audiences

**Steps:**

1. In Target Audiences section:
   - Type "SMEs & Corporate" in the input field
   - Click the **+** button (or press Enter)
   - Type "Young Learners"
   - Press **Enter**
   - Type "Educational Institutions"
   - Click **+** button
   - Click the **X** on "Young Learners" badge to remove it

**Expected Results:**

- ✅ Input field accepts text
- ✅ Pressing Enter adds the audience as a badge
- ✅ Clicking + button adds the audience as a badge
- ✅ Input field clears after adding
- ✅ Badges appear with secondary styling
- ✅ Each badge has an X button
- ✅ Clicking X removes the audience from the list
- ✅ Final audiences: "SMEs & Corporate", "Educational Institutions"

---

### **TEST 6: Dynamic Features (Array Input)**

**Objective:** Test adding/removing course features

**Steps:**

1. In Course Features section:
   - Add "Live Q&A sessions"
   - Add "Hands-on projects"
   - Add "Certificate upon completion"
   - Add "Lifetime access"
   - Remove "Hands-on projects"

**Expected Results:**

- ✅ All features added successfully with Enter or + button
- ✅ Features appear as secondary badges
- ✅ Removed feature disappears from list
- ✅ Final features: "Live Q&A sessions", "Certificate upon completion", "Lifetime access"

---

### **TEST 7: Dynamic Keywords (Array Input)**

**Objective:** Test adding/removing SEO keywords

**Steps:**

1. In SEO & Search section:
   - Add "AI"
   - Add "Machine Learning"
   - Add "Artificial Intelligence"
   - Add "Neural Networks"
   - Remove "Artificial Intelligence"

**Expected Results:**

- ✅ Keywords added successfully
- ✅ Keywords appear as outline badges (different from audiences/features)
- ✅ Removed keyword disappears
- ✅ Final keywords: "AI", "Machine Learning", "Neural Networks"

---

### **TEST 8: Status & Visibility Toggles**

**Objective:** Test all status switches

**Steps:**

1. In Status & Visibility section:
   - Toggle **Course Active** ON
   - Toggle **Currently Enrolling** ON
   - Toggle **Visible on Website** ON
   - Toggle **Currently Enrolling** OFF
   - Toggle back ON

**Expected Results:**

- ✅ All three switches are present:
  - Course Active
  - Currently Enrolling
  - Visible on Website
- ✅ Switches respond to clicks
- ✅ Visual state changes when toggled
- ✅ Switches work independently

---

### **TEST 9: Form Validation - Required Fields**

**Objective:** Test that required fields are validated

**Steps:**

1. Leave Title field empty
2. Click **"Create Course"** button
3. Observe error messages

**Expected Results:**

- ✅ Form does not submit
- ✅ Error message appears under Title field: "Title is required"
- ✅ Error text is in red color

---

### **TEST 10: Create Course - Full Submission**

**Objective:** Test complete course creation with all fields

**Steps:**

1. Fill all fields from previous tests
2. Ensure:
   - Title: "Test AI Course"
   - Category: "AI"
   - Description: Filled
   - Mode: "Online"
   - Level: "Beginner"
   - Duration: "8 weeks"
   - Price: "£5,100"
   - Prerequisites: Filled
   - Audiences: 2 items
   - Features: 3 items
   - Keywords: 3 items
   - All toggles: ON
3. Click **"Create Course"** button

**Expected Results:**

- ✅ Button shows "Saving..." with spinning icon
- ✅ Success toast notification appears
- ✅ Dialog closes
- ✅ Course table refreshes
- ✅ New course appears in the table with all data

---

### **TEST 11: View Course in Table**

**Objective:** Verify new course displays correctly in table

**Steps:**

1. Locate the newly created "Test AI Course" in the table
2. Examine all columns

**Expected Results:**

- ✅ Title shows "Test AI Course"
- ✅ Audiences column shows 2 badges: "SMEs & Corporate", "Educational Institutions"
- ✅ Mode shows "Online" badge with default (blue) variant
- ✅ Duration shows "8 weeks"
- ✅ Price shows "£5,100"
- ✅ Level shows "Beginner" badge
- ✅ Order shows "10"
- ✅ Enrolling shows "Yes" badge (blue/default variant)
- ✅ Active toggle is ON
- ✅ Visible toggle is ON
- ✅ Edit button is present
- ✅ Delete button is present (red/destructive)

---

### **TEST 12: Edit Existing Course**

**Objective:** Test editing an existing course

**Steps:**

1. Click **Edit** button (pencil icon) on "Test AI Course"
2. Verify form pre-populates with existing data
3. Modify fields:
   - Change Duration to "10 weeks"
   - Change Price to "£6,500"
   - Add one more audience: "Researchers"
   - Remove one feature
   - Add keyword: "Deep Learning"
4. Click **"Update Course"**

**Expected Results:**

- ✅ Dialog opens with title "Edit Course"
- ✅ All fields pre-populated with existing values
- ✅ Audiences array shows existing items as badges
- ✅ Features array shows existing items
- ✅ Keywords array shows existing items
- ✅ Can add/remove items from arrays
- ✅ Button shows "Update Course" (not "Create Course")
- ✅ On save, shows "Saving..."
- ✅ Success toast: "Course updated successfully"
- ✅ Table updates with new values
- ✅ Duration now shows "10 weeks"
- ✅ Price now shows "£6,500"
- ✅ Audiences shows 3 badges (with +1 indicator if showing only 2)

---

### **TEST 13: Audiences Display - More than 2**

**Objective:** Test audience badge overflow display

**Steps:**

1. View a course with 3+ audiences in the table
2. Observe the Audiences column

**Expected Results:**

- ✅ Shows first 2 audiences as badges
- ✅ Shows "+N" badge where N = remaining count
- ✅ Example: If 3 audiences, shows 2 badges + "+1" badge

---

### **TEST 14: Mode Badge Colors**

**Objective:** Verify mode badges have correct color coding

**Steps:**

1. Create/edit courses with different modes
2. View in table

**Expected Results:**

- ✅ "Online" → Default/blue badge
- ✅ "Hybrid" → Secondary/gray badge
- ✅ "Offline" → Outline badge

---

### **TEST 15: Currently Enrolling Badge**

**Objective:** Test enrolling status badge

**Steps:**

1. Toggle "Currently Enrolling" OFF on a course
2. Save and view in table
3. Toggle back ON

**Expected Results:**

- ✅ When ON: "Yes" badge with blue/default variant
- ✅ When OFF: "No" badge with gray/secondary variant
- ✅ Changes reflect immediately after save

---

### **TEST 16: Quick Toggle - Active Status**

**Objective:** Test inline toggle without opening edit dialog

**Steps:**

1. Find the Active toggle switch in the table row
2. Click to toggle OFF
3. Observe changes
4. Toggle back ON

**Expected Results:**

- ✅ Toggle responds immediately
- ✅ Success toast appears
- ✅ No dialog opens
- ✅ Change saves to database
- ✅ Table reflects new state

---

### **TEST 17: Quick Toggle - Visible Status**

**Objective:** Test visibility toggle

**Steps:**

1. Toggle Visible switch OFF
2. Toggle back ON

**Expected Results:**

- ✅ Same behavior as Active toggle
- ✅ Success toast notification
- ✅ Immediate response

---

### **TEST 18: Delete Course - Confirmation**

**Objective:** Test delete functionality with confirmation

**Steps:**

1. Click **Delete** button (trash icon) on "Test AI Course"
2. Observe confirmation dialog
3. Click **Cancel**
4. Verify course still exists
5. Click Delete again
6. Click **Delete** in confirmation

**Expected Results:**

- ✅ Confirmation dialog appears
- ✅ Title: "Are you sure?"
- ✅ Description mentions course title
- ✅ Warning about permanent deletion
- ✅ Cancel button works (closes dialog, keeps course)
- ✅ Delete button is red/destructive
- ✅ Shows "Deleting..." when clicked
- ✅ Success toast appears
- ✅ Course removed from table
- ✅ Table refreshes

---

### **TEST 19: Database Verification - Courses Table**

**Objective:** Verify data saved correctly to courses table

**Steps:**

1. After creating a course, check the database
2. Run SQL query:

```sql
SELECT
  id, title, mode, duration, price, level, category,
  features, keywords, prerequisites,
  is_active, currently_enrolling, sort_order, display
FROM courses
WHERE title = 'Test AI Course';
```

**Expected Results:**

- ✅ Record exists
- ✅ All fields match form inputs
- ✅ `features` is JSON array
- ✅ `keywords` is JSON array
- ✅ `prerequisites` is text
- ✅ `is_active` = true
- ✅ `currently_enrolling` = true
- ✅ `display` = true
- ✅ `sort_order` = 10

---

### **TEST 20: Database Verification - Course Audiences Table**

**Objective:** Verify audiences saved to junction table

**Steps:**

1. Check course_audiences table:

```sql
SELECT ca.course_id, ca.audience, c.title
FROM course_audiences ca
JOIN courses c ON ca.course_id = c.id
WHERE c.title = 'Test AI Course';
```

**Expected Results:**

- ✅ Multiple rows for same course_id
- ✅ One row per audience
- ✅ Audiences: "SMEs & Corporate", "Educational Institutions", "Researchers"
- ✅ Correct course_id association

---

### **TEST 21: Backward Compatibility - Audience Field**

**Objective:** Verify single audience field is still populated

**Steps:**

1. Check courses table:

```sql
SELECT audience FROM courses WHERE title = 'Test AI Course';
```

**Expected Results:**

- ✅ `audience` field contains first audience from array
- ✅ Value: "SMEs & Corporate"

---

### **TEST 22: Empty Arrays Handling**

**Objective:** Test course creation without optional arrays

**Steps:**

1. Create a course without adding:
   - Audiences
   - Features
   - Keywords
2. Save course

**Expected Results:**

- ✅ Course saves successfully
- ✅ No errors
- ✅ Empty arrays stored as `[]` in database
- ✅ Table displays empty cells gracefully

---

### **TEST 23: Form Reset After Cancel**

**Objective:** Test form cleanup on cancel

**Steps:**

1. Open "Create New Course" dialog
2. Fill some fields
3. Add audiences, features
4. Click **Cancel**
5. Open dialog again

**Expected Results:**

- ✅ Dialog closes on cancel
- ✅ No data saved
- ✅ Reopening shows fresh form
- ✅ All fields reset to defaults
- ✅ Array inputs empty

---

### **TEST 24: Long Title Truncation**

**Objective:** Test UI handles long course titles

**Steps:**

1. Create course with very long title (100+ characters)
2. View in table

**Expected Results:**

- ✅ Title truncates with ellipsis (...)
- ✅ Max width applied (200px)
- ✅ Hovering shows full title in tooltip
- ✅ No layout breaking

---

### **TEST 25: Multiple Courses - Sorting**

**Objective:** Verify courses display in sort_order

**Steps:**

1. Create 3 courses with different sort_order values:
   - Course A: sort_order = 1
   - Course B: sort_order = 3
   - Course C: sort_order = 2
2. View table

**Expected Results:**

- ✅ Courses display in order: A, C, B
- ✅ Order column shows: 1, 2, 3

---

## 🎯 Edge Cases & Error Handling

### **TEST 26: Form Validation Edge Cases**

**Test Cases:**

- ✅ Title with special characters: `"AI & ML: Advanced Course"`
- ✅ Price with symbols: `"$5,100.00"`, `"£5,100"`, `"Free"`
- ✅ Duration variations: `"8 weeks"`, `"40 hours"`, `"2 months"`, `"Self-paced"`
- ✅ Very long description (1000+ characters)
- ✅ Prerequisites with line breaks
- ✅ Duplicate keywords (should allow)
- ✅ Duplicate audiences (should allow or prevent?)

---

### **TEST 27: Array Input Edge Cases**

**Test Cases:**

- ✅ Empty string in audience input (should not add)
- ✅ Whitespace-only input (should not add)
- ✅ Very long audience name (50+ characters)
- ✅ Special characters in keywords: `"AI/ML"`, `"C++"`, `"Node.js"`
- ✅ Adding 10+ items to each array

---

### **TEST 28: Network Error Handling**

**Simulation Steps:**

1. Open browser DevTools
2. Set Network throttling to "Offline"
3. Try to save a course

**Expected Results:**

- ✅ Error toast appears
- ✅ Message: "Failed to create course" or similar
- ✅ Form stays open with data preserved
- ✅ User can retry

---

### **TEST 29: Database Constraint Violations**

**Test Cases:**

- ✅ Missing required fields (handled by form validation)
- ✅ Invalid date format (handled by date picker)
- ✅ Non-numeric sort_order (type="number" prevents)

---

## 📊 Performance Tests

### **TEST 30: Large Dataset Performance**

**Steps:**

1. Load admin page with 50+ courses
2. Measure page load time
3. Test table scrolling
4. Test search/filter (if implemented)

**Expected Results:**

- ✅ Page loads in < 3 seconds
- ✅ Table scrolls smoothly
- ✅ No UI lag

---

### **TEST 31: Form Responsiveness**

**Steps:**

1. Add 20 audiences
2. Add 20 features
3. Add 20 keywords
4. Scroll through form

**Expected Results:**

- ✅ Badges render without layout issues
- ✅ Scrolling is smooth
- ✅ No performance degradation

---

## 🔒 Security Tests

### **TEST 32: SQL Injection Prevention**

**Steps:**

1. Try malicious input in title:
   - `"'; DROP TABLE courses; --"`
   - `"<script>alert('xss')</script>"`

**Expected Results:**

- ✅ Input saved as literal text
- ✅ No SQL execution
- ✅ No script execution
- ✅ Supabase client sanitizes automatically

---

### **TEST 33: Authorization Check**

**Steps:**

1. Log in as non-admin user
2. Try to navigate to `/admin`

**Expected Results:**

- ✅ Redirected to homepage
- ✅ No access to admin features

---

## 📱 Responsive Design Tests

### **TEST 34: Mobile View (375px)**

**Steps:**

1. Resize browser to 375px width
2. Navigate to Admin → Courses
3. Try to create/edit course

**Expected Results:**

- ✅ Table horizontally scrollable
- ✅ Dialog adapts to screen width
- ✅ Form fields stack vertically
- ✅ Buttons remain accessible

---

### **TEST 35: Tablet View (768px)**

**Expected Results:**

- ✅ Hybrid layout (some columns visible)
- ✅ Form uses 2-column grid where appropriate
- ✅ Dialog max-width respected

---

## ✅ Checklist Summary

Use this checklist to track your testing progress:

- [ ] TEST 1: View Course Management Interface
- [ ] TEST 2: Create New Course - Basic Information
- [ ] TEST 3: Course Details Section
- [ ] TEST 4: Prerequisites Field
- [ ] TEST 5: Dynamic Audiences (Array Input)
- [ ] TEST 6: Dynamic Features (Array Input)
- [ ] TEST 7: Dynamic Keywords (Array Input)
- [ ] TEST 8: Status & Visibility Toggles
- [ ] TEST 9: Form Validation - Required Fields
- [ ] TEST 10: Create Course - Full Submission
- [ ] TEST 11: View Course in Table
- [ ] TEST 12: Edit Existing Course
- [ ] TEST 13: Audiences Display - More than 2
- [ ] TEST 14: Mode Badge Colors
- [ ] TEST 15: Currently Enrolling Badge
- [ ] TEST 16: Quick Toggle - Active Status
- [ ] TEST 17: Quick Toggle - Visible Status
- [ ] TEST 18: Delete Course - Confirmation
- [ ] TEST 19: Database Verification - Courses Table
- [ ] TEST 20: Database Verification - Course Audiences Table
- [ ] TEST 21: Backward Compatibility - Audience Field
- [ ] TEST 22: Empty Arrays Handling
- [ ] TEST 23: Form Reset After Cancel
- [ ] TEST 24: Long Title Truncation
- [ ] TEST 25: Multiple Courses - Sorting
- [ ] TEST 26: Form Validation Edge Cases
- [ ] TEST 27: Array Input Edge Cases
- [ ] TEST 28: Network Error Handling
- [ ] TEST 29: Database Constraint Violations
- [ ] TEST 30: Large Dataset Performance
- [ ] TEST 31: Form Responsiveness
- [ ] TEST 32: SQL Injection Prevention
- [ ] TEST 33: Authorization Check
- [ ] TEST 34: Mobile View (375px)
- [ ] TEST 35: Tablet View (768px)

---

## 🐛 Bug Report Template

If you encounter issues, use this template:

```
**Test Case:** TEST ##: [Test Name]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Steps to Reproduce:**
1.
2.
3.

**Screenshots:** [Attach if applicable]
**Browser:** [Chrome/Firefox/Safari]
**Console Errors:** [Any errors in browser console]
```

---

## 📈 Test Results Summary

After completing all tests, fill in:

- **Total Tests:** 35
- **Passed:** \_\_\_
- **Failed:** \_\_\_
- **Blocked:** \_\_\_
- **Success Rate:** \_\_\_%

**Date Tested:** ******\_\_\_****** **Tested By:** ******\_\_\_****** **Environment:** Local
Development / Staging / Production

---

## 🎉 Acceptance Criteria

Feature is considered **READY FOR PRODUCTION** when:

✅ All core functionality tests (1-18) pass ✅ Database verification tests (19-21) pass ✅ No
critical bugs in edge case tests ✅ Authorization check (TEST 33) passes ✅ Success rate ≥ 95%

---

**Generated:** October 8, 2025 **Version:** 1.0 **Feature:** Enhanced Admin Course Management
