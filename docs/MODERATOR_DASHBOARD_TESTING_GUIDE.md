# Moderator Dashboard Testing Guide

## Overview

The Moderator Dashboard is a comprehensive interface for managing forum moderation activities. This
guide will help you test all features effectively.

## Accessing the Dashboard

### Prerequisites

1. User must be an **admin** (in profiles table: `role = 'admin'`)
2. User must be assigned as a **moderator** (in `forum_moderators` table)

### Navigation

1. Log in as an admin user
2. Navigate to `/admin`
3. Click on the **"Moderation"** tab (Shield icon)

---

## Dashboard Components

The dashboard has **5 main tabs**:

### 1. **Reports Queue** (Default Tab)

Displays all pending user-submitted reports

### 2. **Actions Log**

Shows recent moderation actions taken by all moderators

### 3. **Active Bans**

Lists all currently active user bans

### 4. **Warnings**

Displays warnings issued to users

### 5. **Moderators**

Shows all assigned moderators and their permissions

---

## Feature Testing Checklist

### ✅ Statistics Cards (Top of Dashboard)

Test that the 4 statistics cards display:

- **Pending Reports**: Count of unreviewed reports
- **Active Bans**: Count of currently banned users
- **Warnings (7d)**: Warnings issued in last 7 days
- **Actions Today**: Moderation actions taken today

**Expected Behavior:**

- Numbers should update in real-time when actions are taken
- Cards should be color-coded and visually distinct

---

### ✅ Reports Queue Tab

#### Test Cases:

1. **View Pending Reports**
   - Navigate to Reports Queue tab
   - Verify table shows all pending reports
   - Check columns: Type, Content, Reason, Reporter, Reported User, Date, Actions

2. **Review a Report**
   - Click **"Review"** button on any report
   - Dialog should open showing:
     - Report type and reason
     - Content preview
     - Reporter notes
   - Verify all report details are accurate

3. **Dismiss a Report**
   - Click "Review" on a report
   - Click **"Dismiss"** button
   - Verify:
     - Report status changes to 'dismissed'
     - Report disappears from pending queue
     - Toast notification appears

4. **Delete Reported Content**
   - Click "Review" on a thread/post report
   - Click **"Delete Content"** button
   - Verify:
     - Content is soft-deleted
     - Report status changes to 'actioned'
     - Toast notification appears

5. **Warn User from Report**
   - Click "Review" on a report
   - Click **"Warn User"** button
   - Warning dialog should open
   - Fill in:
     - Severity (Low/Medium/High/Critical)
     - Reason (required)
     - Description (optional)
   - Click "Issue Warning"
   - Verify warning is created

6. **Ban User from Report**
   - Click "Review" on a report
   - Click **"Ban User"** button
   - Ban dialog should open
   - Test each ban type:
     - **Temporary**: Requires end date
     - **Permanent**: No end date
     - **Shadow**: User can read but not post
   - Verify ban is created

7. **Empty State**
   - Clear all pending reports
   - Verify "No pending reports" message displays
   - Check for green checkmark icon

---

### ✅ Actions Log Tab

#### Test Cases:

1. **View Recent Actions**
   - Navigate to Actions Log tab
   - Verify table shows up to 50 recent actions
   - Check columns: Action, Target, Moderator, Reason, Date

2. **Action Types**
   - Verify different action types display correctly:
     - `ban_user`
     - `unban_user`
     - `warn_user`
     - `delete_thread`
     - `delete_post`
     - `purge_user`
   - Action types should be badge-formatted

3. **Moderator Attribution**
   - Verify moderator name/email shows correctly
   - Check that "Unknown" appears for deleted moderators

4. **Audit Trail**
   - Perform a moderation action (ban/warn/delete)
   - Check Actions Log immediately
   - Verify new action appears at top
   - Check timestamp is accurate

5. **Empty State**
   - With no actions in database
   - Verify "No moderation actions yet" message
   - Check for History icon

---

### ✅ Active Bans Tab

#### Test Cases:

1. **View Active Bans**
   - Navigate to Active Bans tab
   - Verify table shows all active bans
   - Check columns: User, Ban Type, Reason, Banned By, Expires, Date

2. **Ban Types**
   - Verify badge colors:
     - **Permanent**: Red (destructive)
     - **Temporary**: Gray (secondary)
     - **Shadow**: Gray (secondary)

3. **Expiration Display**
   - **Permanent bans**: Should show "Never"
   - **Temporary bans**: Should show "in X days/hours"
   - Verify relative time formatting

4. **User Information**
   - Verify user full name or email displays
   - Check "Unknown" for deleted users

5. **Empty State**
   - With no active bans
   - Verify "No active bans" message
   - Check for green checkmark icon

---

### ✅ Warnings Tab

#### Test Cases:

1. **View Recent Warnings**
   - Navigate to Warnings tab
   - Verify table shows all warnings
   - Check columns: User, Severity, Reason, Issued By, Acknowledged, Date

2. **Severity Levels**
   - Verify badge colors:
     - **Critical**: Red
     - **High**: Red
     - **Medium**: Gray
     - **Low**: Outline

3. **Acknowledgment Status**
   - **Acknowledged**: Green badge with checkmark
   - **Pending**: Yellow badge with clock icon
   - Verify icons display correctly

4. **Auto-Ban Threshold**
   - Issue 3 warnings to same user
   - Verify user is auto-banned after 3rd warning
   - Check ban is 7 days temporary
   - Reason should be "Automatic ban after 3 warnings"

5. **Empty State**
   - With no warnings
   - Verify "No warnings issued" message
   - Check for green checkmark icon

---

### ✅ Moderators Tab

#### Test Cases:

1. **View Moderators**
   - Navigate to Moderators tab
   - Verify table shows all active moderators
   - Check columns: Moderator, Category, Permissions, Assigned By, Date

2. **Category Assignment**
   - **Global moderators**: Badge shows "Global" (outline)
   - **Category moderators**: Badge shows category name (secondary)
   - Verify badge colors

3. **Permissions Display**
   - Verify permissions list shows enabled permissions:
     - delete, edit, pin, lock, ban, warn
   - Format: "delete, edit, pin, lock"
   - "None" if no permissions enabled

4. **Empty State**
   - With no moderators
   - Verify "No moderators assigned" message
   - Check for Users icon

---

### ✅ Ban User Dialog

#### Test Cases:

1. **Open Ban Dialog**
   - Click "Ban User" from any report review
   - Verify dialog opens
   - Title: "Ban User"

2. **Ban Type Selection**
   - **Temporary**:
     - End date field should appear
     - Test datetime-local input
     - Verify future dates only
   - **Permanent**:
     - End date field should hide
   - **Shadow**:
     - End date field should hide

3. **Form Validation**
   - Try submitting without reason
   - Verify "Ban User" button is disabled
   - Reason is required field

4. **Submit Ban**
   - Fill all fields correctly
   - Click "Ban User"
   - Verify:
     - Loading state shows (spinner)
     - Ban is created in database
     - Toast notification appears
     - Dialog closes
     - Form resets

5. **Cancel**
   - Click "Cancel" button
   - Verify dialog closes without action

---

### ✅ Warn User Dialog

#### Test Cases:

1. **Open Warn Dialog**
   - Click "Warn User" from any report review
   - Verify dialog opens
   - Title: "Warn User"

2. **Severity Selection**
   - Test all 4 options:
     - Low
     - Medium (default)
     - High
     - Critical

3. **Form Validation**
   - Try submitting without reason
   - Verify "Issue Warning" button is disabled
   - Reason is required field
   - Description is optional

4. **Submit Warning**
   - Fill all fields correctly
   - Click "Issue Warning"
   - Verify:
     - Loading state shows (spinner)
     - Warning is created in database
     - Toast notification appears
     - Dialog closes
     - Form resets

5. **Auto-Ban Notice**
   - Dialog description mentions: "auto-ban after 3 warnings"
   - Verify text is visible

---

### ✅ Access Control

#### Test Cases:

1. **Non-Moderator Access**
   - Log in as a non-moderator user
   - Navigate to /admin (if admin) or create non-admin user
   - Go to Moderation tab
   - Verify:
     - "Access Denied" message shows
     - Red alert icon displays
     - Message: "You do not have moderator permissions"

2. **Moderator Access**
   - Assign user as moderator in `forum_moderators` table
   - Navigate to Moderation tab
   - Verify full dashboard access

3. **Loading States**
   - On initial load
   - Verify spinner shows while checking moderator status
   - Dashboard renders after check completes

---

### ✅ Real-Time Updates

#### Test Cases:

1. **TanStack Query Invalidation**
   - Perform any moderation action
   - Verify related queries refresh:
     - Ban user → Invalidates actions log
     - Warn user → Invalidates actions log
     - Review report → Invalidates reports queue

2. **Optimistic Updates**
   - Fast network
   - Verify UI updates immediately
   - No flicker or delay

---

### ✅ Error Handling

#### Test Cases:

1. **Network Errors**
   - Disconnect internet
   - Try to ban/warn user
   - Verify:
     - Error toast appears
     - Error message is user-friendly
     - No crash

2. **Unauthorized Actions**
   - Remove moderator permissions mid-session
   - Try to perform action
   - Verify error handling

3. **Invalid Data**
   - Submit ban with past end_date
   - Verify validation or error

---

## Database Setup for Testing

### Create Test Data

#### 1. Make Yourself a Moderator

```sql
-- Insert into forum_moderators table
INSERT INTO forum_moderators (user_id, category_id, assigned_by, permissions, is_active)
VALUES (
  'YOUR_USER_ID',           -- Your auth user ID
  NULL,                      -- NULL = global moderator
  'YOUR_USER_ID',           -- Assigned by yourself
  '{"delete": true, "edit": true, "pin": true, "lock": true, "ban": true, "warn": true}'::jsonb,
  true
);
```

#### 2. Create Test Reports

```sql
-- Create a test thread first
INSERT INTO forum_threads (category_id, user_id, title, content)
VALUES (
  'SOME_CATEGORY_ID',
  'SOME_USER_ID',
  'Test Thread for Moderation',
  'This is test content that violates community guidelines'
)
RETURNING id;

-- Create report for the thread
INSERT INTO forum_reports (
  reporter_id,
  reported_user_id,
  reportable_type,
  reportable_id,
  reason,
  description,
  status
)
VALUES (
  'REPORTER_USER_ID',
  'REPORTED_USER_ID',
  'thread',
  'THREAD_ID_FROM_ABOVE',
  'spam',
  'This content is spam and should be removed',
  'pending'
);
```

#### 3. Create Test Ban

```sql
INSERT INTO forum_bans (
  user_id,
  banned_by,
  ban_type,
  reason,
  end_date,
  is_active
)
VALUES (
  'SOME_USER_ID',
  'YOUR_USER_ID',
  'temporary',
  'Repeated spamming',
  NOW() + INTERVAL '7 days',
  true
);
```

#### 4. Create Test Warning

```sql
INSERT INTO forum_warnings (
  user_id,
  issued_by,
  severity,
  reason,
  description,
  is_acknowledged
)
VALUES (
  'SOME_USER_ID',
  'YOUR_USER_ID',
  'medium',
  'Inappropriate language',
  'User posted offensive content',
  false
);
```

---

## Performance Testing

### Load Testing

1. **100 Pending Reports**
   - Create 100 test reports
   - Navigate to Reports Queue
   - Verify table renders smoothly
   - Check pagination (if implemented)

2. **500 Moderator Actions**
   - Create 500 test actions
   - Navigate to Actions Log
   - Verify only 50 show (limit)
   - Check sorting (newest first)

3. **Query Performance**
   - Monitor network tab
   - Verify queries complete <500ms
   - Check for unnecessary re-fetches

---

## UI/UX Testing

### Responsiveness

1. **Desktop (1920x1080)**
   - All tables readable
   - Dialogs centered
   - Cards in grid layout

2. **Tablet (768x1024)**
   - Statistics cards stack 2x2
   - Tables scroll horizontally
   - Dialogs responsive

3. **Mobile (375x667)**
   - Statistics cards stack vertically
   - Tables scroll
   - Dialogs full-width

### Accessibility

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Enter/Space to activate buttons
   - Escape to close dialogs

2. **Screen Reader**
   - Test with screen reader
   - Verify labels are descriptive
   - Dialog titles announced

3. **Color Contrast**
   - Check badge colors meet WCAG AA
   - Verify text on dark background readable

---

## Common Issues & Troubleshooting

### Issue: "Access Denied" even though I'm admin

**Solution:**

- Admin role ≠ Moderator role
- Check `forum_moderators` table
- Must have active moderator record

### Issue: Reports not showing

**Solution:**

- Check `status = 'pending'` filter
- Verify reports exist in database
- Check RLS policies

### Issue: Actions not logging

**Solution:**

- Check `logModeratorAction` private method
- Verify `forum_moderator_actions` table exists
- Check insert permissions

### Issue: Ban dialog end date required for permanent

**Solution:**

- Conditional rendering based on `ban_type`
- Only show for `ban_type === 'temporary'`

---

## Success Criteria

The Moderator Dashboard passes testing if:

✅ All 5 tabs render correctly ✅ Statistics cards show accurate counts ✅ Reports can be reviewed
and actioned ✅ Bans can be issued with all 3 types ✅ Warnings can be issued with all 4 severities
✅ Actions log shows recent history ✅ Access control works (moderators only) ✅ Real-time updates
work (TanStack Query) ✅ Error handling is graceful ✅ Loading states display correctly ✅ Empty
states show helpful messages ✅ Forms validate correctly ✅ Dialogs open/close properly ✅ Toast
notifications appear ✅ No TypeScript errors ✅ No console errors

---

## Next Steps

After testing the dashboard, consider adding:

1. **Search & Filters**
   - Search reports by content
   - Filter by report reason
   - Filter by date range

2. **Bulk Actions**
   - Select multiple reports
   - Bulk dismiss/action

3. **Moderator Analytics**
   - Actions per moderator
   - Average response time
   - Most common violation types

4. **Notifications**
   - Email moderators on new reports
   - Push notifications for urgent reports
   - Slack/Discord webhooks

5. **Advanced Features**
   - User reputation scores
   - Automated spam detection
   - Appeal system for bans

---

## Resources

- **Database Schema**: `supabase/migrations/20251026000000_forum_system.sql`
- **Service Layer**: `src/services/forum/ForumModerationService.ts`
- **Hooks**: `src/hooks/forum/useForumModeration.ts`
- **Component**: `src/components/admin/ModeratorDashboard.tsx`
- **Types**: `src/types/forum.ts`

---

## Feedback

If you encounter any issues or have suggestions for improvements, please:

1. Check the Issues section in the repository
2. Create a detailed bug report with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser/device information

---

**Happy Testing! 🛡️**
