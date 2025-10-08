# 📚 How to Add New Courses - Simple Guide

**Super simple 5-step process to add courses to your website**

---

## Step 1: Sign In as Admin

1. Go to: `http://localhost:8080/auth`
2. Sign in with your **admin account**
3. Make sure your account has `role = 'admin'` in the database

---

## Step 2: Open Admin Panel

1. Click on your **username** in the top right navbar
2. Select **"Admin Dashboard"** from the dropdown menu
3. Or directly visit: `http://localhost:8080/admin`

---

## Step 3: Go to Courses Tab

1. You'll see multiple tabs: Analytics, Users, Courses, etc.
2. Click on the **"Courses"** tab (has a book icon 📖)
3. You'll see a table with all existing courses

---

## Step 4: Click "Add New Course" Button

1. Click the blue **"Add New Course"** button in the top-right of the Courses section
2. A dialog/form will open

---

## Step 5: Fill in the Course Form

The form is divided into sections. Fill each section:

### 📝 **Section 1: Basic Information**

```
Course Title *
└─ Example: "AI for Business Leaders"
   (This is what students will see)

Category *
└─ Choose from dropdown:
   • AI
   • Machine Learning
   • Data Science
   • Young Learners
   • Corporate Training

Description *
└─ Example: "Learn how AI can transform your business.
   This course covers practical applications, use cases,
   and implementation strategies."
   (Use multiple lines if needed)
```

### ⚙️ **Section 2: Course Details**

```
Mode *
└─ Choose:
   • Online (most common)
   • Offline
   • Hybrid

Level *
└─ Choose:
   • Beginner
   • Intermediate
   • Advanced
   • All Levels

Duration *
└─ Example: "8 weeks" or "40 hours" or "Self-paced"
   (Type whatever format you want)

Price *
└─ Example: "£5,100" or "$299" or "Free"
   (Type exactly how you want it displayed)

Start Date *
└─ Click to select date from calendar

Display Order
└─ Example: 0, 10, 20
   (Lower numbers appear first on website)
   (0 = first, 10 = second, 20 = third, etc.)

Prerequisites
└─ Example: "No prior experience required"
   or "Basic understanding of Python"
```

### 👥 **Section 3: Target Audiences**

This section lets you add **multiple audiences** for one course:

```
1. Type audience name: "SMEs & Corporate"
2. Press ENTER or click the + button
3. Audience appears as a badge
4. Repeat for more audiences:
   - "Young Learners"
   - "Educational Institutions"
   - "Researchers"

To remove: Click the X on any badge
```

**Common Audiences:**

- SMEs & Corporate
- Young Learners (Ages 7-11)
- Teenagers (Ages 12-17)
- Educational Institutions
- Researchers
- Career Changers
- Professionals

### ⭐ **Section 4: Course Features**

Add highlights/selling points of your course:

```
1. Type feature: "Live Q&A sessions"
2. Press ENTER or click +
3. Add more:
   - "Hands-on projects"
   - "Certificate upon completion"
   - "Lifetime access"
   - "Expert instructors"
   - "Real-world case studies"

These appear on the course card!
```

### 🔍 **Section 5: SEO & Search (Keywords)**

Add keywords to help students find your course:

```
1. Type keyword: "AI"
2. Press ENTER or click +
3. Add more:
   - "Machine Learning"
   - "Artificial Intelligence"
   - "Business Intelligence"
   - "Automation"

These help with search/filtering
```

### 🎛️ **Section 6: Status & Visibility**

Three toggle switches:

```
✅ Course Active
   └─ Turn ON if course is ready to run
   └─ Turn OFF to pause the course

✅ Currently Enrolling
   └─ Turn ON if accepting new students
   └─ Turn OFF when enrollment is closed

✅ Visible on Website
   └─ Turn ON to show on homepage
   └─ Turn OFF to hide (draft mode)
```

---

## Step 6: Save the Course

1. Review all your entries
2. Click the blue **"Create Course"** button at the bottom
3. You'll see "Saving..." with a spinner
4. Success! A green notification appears: ✅ "Course created successfully"
5. The dialog closes
6. Your new course appears in the table!

---

## 📊 What You'll See in the Table

After creating, your course shows in the table with these columns:

| Column        | Example                 | What It Means                |
| ------------- | ----------------------- | ---------------------------- |
| **Title**     | AI for Business Leaders | Course name                  |
| **Audiences** | `SMEs` `+2`             | Shows first 2, +N if more    |
| **Mode**      | 🔵 Online               | Blue badge for online        |
| **Duration**  | 8 weeks                 | What you typed               |
| **Price**     | £5,100                  | What you typed               |
| **Level**     | Beginner                | Difficulty level             |
| **Order**     | 10                      | Display position             |
| **Enrolling** | 🔵 Yes                  | Currently accepting students |
| **Active**    | ✅ Toggle               | Turn on/off quickly          |
| **Visible**   | ✅ Toggle               | Show/hide quickly            |
| **Actions**   | ✏️ 🗑️                   | Edit / Delete buttons        |

---

## ✏️ How to Edit a Course

1. Find your course in the table
2. Click the **pencil icon** (✏️ Edit button)
3. The form opens with all data pre-filled
4. Make your changes
5. Click **"Update Course"**
6. Success! ✅ "Course updated successfully"

### Quick Edits (Without Opening Form):

- **Toggle Active:** Just click the Active switch in the table
- **Toggle Visible:** Just click the Visible switch in the table
- Changes save instantly!

---

## 🗑️ How to Delete a Course

1. Find your course in the table
2. Click the **trash icon** (🗑️ Delete button)
3. Confirmation dialog appears: "Are you sure?"
4. Click **"Delete"** to confirm (red button)
5. Course is permanently removed

⚠️ **Warning:** Deletion is permanent and cannot be undone!

---

## 💡 Tips & Best Practices

### 1. **Display Order**

- Use gaps: 0, 10, 20, 30
- Makes it easy to insert courses later
- Example: Insert between 10 and 20? Use 15!

### 2. **Audiences**

- Add multiple! One course can target many audiences
- Shows course versatility
- Better search/filtering

### 3. **Features**

- Add 3-5 compelling features
- Focus on benefits, not just facts
- Use action words

### 4. **Keywords**

- Think like a student searching
- Include synonyms
- Add technology names (Python, TensorFlow, etc.)

### 5. **Draft Mode**

- Create course with Visible = OFF
- Perfect it before going live
- Toggle ON when ready

### 6. **Price Display**

- Be consistent: all £ or all $
- "Free" attracts attention
- "Contact for pricing" for custom courses

---

## 🎯 Common Scenarios

### **Scenario 1: Create a Free Course**

```
Title: "Introduction to AI"
Price: "Free"
Currently Enrolling: ON
Visible: ON
```

### **Scenario 2: Create a Premium Corporate Course**

```
Title: "AI Team Training Program"
Category: "Corporate Training"
Price: "£5,100"
Audiences:
  - "SMEs & Corporate"
  - "Educational Institutions"
Features:
  - "8-week structured program"
  - "Expert instructors"
  - "Certificate upon completion"
Currently Enrolling: ON
```

### **Scenario 3: Create a Kids Course**

```
Title: "AI Explorers for Kids"
Category: "Young Learners"
Level: "Beginner"
Price: "£299"
Audiences:
  - "Young Learners (Ages 7-11)"
Features:
  - "Fun, interactive lessons"
  - "No coding required"
  - "Parent dashboard access"
```

### **Scenario 4: Create a Draft Course (Not Yet Live)**

```
Title: "Advanced Machine Learning"
... (fill all fields)
Visible on Website: OFF
```

Students won't see it. You can perfect it, then toggle Visible = ON when ready.

---

## 🐛 Troubleshooting

### **Problem: Can't find "Add New Course" button**

**Solution:** Make sure you're in the **Courses tab**, not another tab

### **Problem: Can't access /admin**

**Solution:**

1. Check you're signed in
2. Check your account has `role = 'admin'` in database
3. Ask database admin to update your role

### **Problem: "Title is required" error**

**Solution:** You left the title field empty. Fill it in!

### **Problem: Can't add audiences**

**Solution:**

1. Type the audience name
2. Press ENTER (don't just type and click Create)
3. Or click the + button

### **Problem: Course not showing on website**

**Solution:** Check these toggles are ON:

- ✅ Course Active
- ✅ Visible on Website

### **Problem: Changes not saving**

**Solution:**

1. Check your internet connection
2. Check browser console for errors (F12)
3. Try refreshing the page

---

## 📸 Screenshot Guide

### Where is "Add New Course"?

```
Admin Dashboard
└─ Courses Tab (📖 icon)
   └─ Top-right corner
      └─ Blue button: "Add New Course"
```

### What does the form look like?

```
Dialog Title: "Create New Course"

Sections (scroll down to see all):
1. Basic Information
2. Course Details
3. Target Audiences
4. Course Features
5. SEO & Search
6. Status & Visibility

Bottom:
[Cancel]  [Create Course]
```

---

## ✅ Success Checklist

Before clicking "Create Course", verify:

- [ ] Title is descriptive and clear
- [ ] Category selected
- [ ] Description explains what students learn
- [ ] Mode selected (Online/Offline/Hybrid)
- [ ] Level selected
- [ ] Duration filled (e.g., "8 weeks")
- [ ] Price filled (e.g., "£5,100" or "Free")
- [ ] Start date selected
- [ ] At least 1 audience added
- [ ] At least 3 features added
- [ ] At least 3 keywords added
- [ ] Toggles set correctly:
  - [ ] Course Active = ON
  - [ ] Currently Enrolling = ON or OFF
  - [ ] Visible on Website = ON

Click "Create Course" ✅

---

## 🎉 You're Done!

Your course is now:

- ✅ In the database
- ✅ Visible in admin table
- ✅ Live on the website (if Visible = ON)
- ✅ Ready for students to enroll!

---

**Need help?**

- See full testing guide: `ADMIN_COURSE_TESTING_GUIDE.md`
- Quick test guide: `QUICK_TEST_GUIDE.md`

**Still stuck?** Open browser console (F12) and check for errors.

---

**Created:** October 8, 2025 **Last Updated:** October 8, 2025 **Version:** 1.0
