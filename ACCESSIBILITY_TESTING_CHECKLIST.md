# Accessibility Testing Checklist

**Quick reference guide for testing ARIA label implementations**

---

## ⚡ Quick Test Commands

### Automated Testing
```bash
# Install testing tools
npm install -g pa11y axe-cli lighthouse

# Run local dev server
npm run dev

# Test specific pages
pa11y http://localhost:8080
pa11y http://localhost:8080/ai-assessment
pa11y http://localhost:8080/course/1

# Generate Lighthouse report
lighthouse http://localhost:8080 --view --only-categories=accessibility
```

---

## 🧪 Manual Testing Checklist

### 1. Navigation (Navbar)

#### Desktop Navigation
- [ ] Tab through all menu items
- [ ] Verify each link announces its purpose
- [ ] Test user dropdown menu
- [ ] Verify admin link (if admin user)
- [ ] Test theme toggle
- [ ] Test keyboard shortcuts button
- [ ] Verify all icons are hidden from screen reader (`aria-hidden="true"`)

#### Mobile Navigation
- [ ] Open mobile menu
- [ ] Verify menu button announces state (open/closed)
- [ ] Tab through mobile menu items
- [ ] Test user section in mobile menu
- [ ] Close menu with Escape key

**Expected Screen Reader Announcements:**
```
"Main navigation, navigation landmark"
"Aiborg home, link"
"AI Assessment - New feature, link"
"Navigate to training programs section, button"
"User account menu, button"
```

---

### 2. AI Assessment Page

#### Hero Section
- [ ] Navigate to assessment start button
- [ ] Verify button announces "Start free AI assessment"
- [ ] Test "Learn More" button
- [ ] Verify statistics are announced correctly
- [ ] Check "New" badge is announced

**Expected Announcements:**
```
"AI Assessment hero section"
"Start free AI assessment, button"
"Over 5,000 assessments taken"
"92 percent user satisfaction"
```

#### Features Section
- [ ] Navigate through feature cards
- [ ] Verify each feature is announced as a list item
- [ ] Check feature titles and descriptions

**Expected Announcements:**
```
"Assessment features, list"
"10-15 Minutes, heading"
"Quick, comprehensive assessment..."
```

---

### 3. Course Page

#### Loading States
- [ ] Verify loading spinner announces "Loading course content"
- [ ] Test error state announcement
- [ ] Test enrollment required message

**Expected Announcements:**
```
"status, Loading course content"
"alert, Course Not Found"
"alert, Enrollment Required"
```

#### Course Content
- [ ] Navigate to course tabs
- [ ] Verify each tab announces with count
- [ ] Switch between tabs with arrow keys
- [ ] Verify tab panels are associated correctly

**Expected Announcements:**
```
"Course navigation tabs, tab list"
"Overview tab, tab"
"Quizzes tab, 5 quizzes available, tab"
"Materials tab, tab"
```

---

## 🎹 Keyboard Navigation Tests

### Essential Keyboard Shortcuts
```
Tab           - Next interactive element
Shift + Tab   - Previous interactive element
Enter/Space   - Activate button/link
Arrow Keys    - Navigate within tabs/menus
Escape        - Close modal/menu
Home          - First item in list
End           - Last item in list
```

### Test Scenarios

#### 1. Full Keyboard Navigation Test
```
✓ Start from page load
✓ Tab through entire page
✓ Verify logical tab order
✓ Activate each interactive element
✓ Complete a full user journey without mouse
```

#### 2. Focus Management
```
✓ Verify visible focus indicator on all elements
✓ Check focus doesn't get trapped
✓ Test focus moves to opened modal
✓ Verify focus returns after modal close
```

---

## 🔊 Screen Reader Testing

### VoiceOver (Mac)
```bash
# Enable VoiceOver
Cmd + F5

# Navigation commands
VO + A           - Start reading
VO + Right/Left  - Navigate elements
VO + Space       - Activate element
VO + U           - Open rotor (lists, links, headings)
```

### NVDA (Windows)
```bash
# Start NVDA
Ctrl + Alt + N

# Navigation commands
Insert + Down    - Start reading
Up/Down Arrow    - Navigate elements
Enter            - Activate element
Insert + F7      - Elements list
```

### Testing Script

For each enhanced page:

1. **Load the page**
   - Listen to page title announcement
   - Verify main landmark is announced

2. **Navigate landmarks**
   - Use landmark navigation (VO+U → Landmarks)
   - Verify all major sections are announced

3. **Navigate headings**
   - Use heading navigation
   - Verify logical heading structure

4. **Test interactive elements**
   - Navigate to each button
   - Verify clear purpose announcement
   - Activate button and verify result

5. **Test forms (if present)**
   - Navigate to each form field
   - Verify label association
   - Test error announcements

---

## 📊 Test Results Template

### Page: _______________
**Date**: _______________
**Tester**: _______________
**Screen Reader**: _______________

#### Results

| Component | Pass | Fail | Notes |
|-----------|------|------|-------|
| Navigation | [ ] | [ ] | |
| Main content | [ ] | [ ] | |
| Buttons | [ ] | [ ] | |
| Links | [ ] | [ ] | |
| Forms | [ ] | [ ] | |
| Images/Icons | [ ] | [ ] | |
| Dynamic content | [ ] | [ ] | |

#### Issues Found
```
1.
2.
3.
```

#### Recommendations
```
1.
2.
3.
```

---

## 🚨 Common Issues to Check

### 1. Missing or Incorrect Labels
```tsx
// ❌ Bad
<Button>Submit</Button>

// ✅ Good
<Button aria-label="Submit assessment answers">Submit</Button>
```

### 2. Decorative Elements Not Hidden
```tsx
// ❌ Bad
<Sparkles className="h-4 w-4" />

// ✅ Good
<Sparkles className="h-4 w-4" aria-hidden="true" />
```

### 3. Dynamic Content Not Announced
```tsx
// ❌ Bad
<div>{message}</div>

// ✅ Good
<div role="status" aria-live="polite">{message}</div>
```

### 4. Missing Tab Panel Association
```tsx
// ❌ Bad
<TabsTrigger value="overview">Overview</TabsTrigger>

// ✅ Good
<TabsTrigger
  value="overview"
  aria-controls="overview-panel"
  aria-label="Overview tab"
>
  Overview
</TabsTrigger>
```

---

## 📱 Mobile Testing

### iOS VoiceOver
```
Triple-click Home/Side button to enable

Swipe Right/Left - Navigate elements
Double Tap       - Activate element
Two-finger swipe - Scroll
```

### Android TalkBack
```
Volume Up + Down - Enable TalkBack

Swipe Right/Left - Navigate
Double Tap       - Activate
```

### Test Checklist
- [ ] Mobile menu opens and closes
- [ ] All buttons are accessible
- [ ] Touch targets are large enough (44x44px minimum)
- [ ] Swipe gestures work with screen reader
- [ ] Form inputs are accessible

---

## ✅ Success Criteria

Page passes accessibility test if:

- ✅ All interactive elements have clear labels
- ✅ Decorative elements are hidden from screen readers
- ✅ Keyboard navigation works completely
- ✅ Focus order is logical
- ✅ Dynamic content updates are announced
- ✅ Error messages are immediately announced
- ✅ Loading states are communicated
- ✅ Tab navigation includes proper controls
- ✅ No automated tool errors (Lighthouse, axe)
- ✅ Manual screen reader testing passes

---

## 📞 Need Help?

### Resources
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM Screen Reader Survey: https://webaim.org/projects/screenreadersurvey9/
- Accessibility Developer Guide: https://www.accessibility-developer-guide.com/

### Tools
- axe DevTools: https://www.deque.com/axe/devtools/
- Lighthouse: Built into Chrome DevTools
- WAVE: https://wave.webaim.org/extension/

---

**Last Updated**: October 10, 2025
**Version**: 1.0.0
