# Email Notification System

## Overview

A comprehensive email notification system for the AIborg Learn Sphere platform, providing timely
updates to students about their learning journey.

## Features

### 8 Notification Types

1. **🎓 Course Enrollment** - Welcome email when enrolling in a new course
2. **📝 Assignment Reminders** - Upcoming deadline notifications
3. **✅ Assignment Graded** - Grade and feedback notifications
4. **📢 Course Updates** - Important course changes
5. **📣 Announcements** - Instructor announcements
6. **⏰ Deadline Alerts** - Urgent deadline reminders
7. **🏆 Certificate Ready** - Course completion certificates
8. **💬 Discussion Replies** - Forum interaction notifications

### User Preferences

- **Master Toggle**: Enable/disable all email notifications
- **Granular Control**: Individual toggles for each notification type
- **Persistent Settings**: Preferences saved to user profile
- **Easy Access**: Available in Profile → Notifications tab

## Architecture

### Components

#### 1. Supabase Edge Function

**Location:** `supabase/functions/send-email-notification/index.ts`

- Handles all email sending logic
- Checks user preferences before sending
- Uses Resend API for email delivery
- Logs all sent notifications

#### 2. Database Migration

**Location:** `supabase/migrations/20251002000000_email_notifications.sql`

- Adds `email_notifications` boolean to profiles
- Adds `notification_preferences` JSONB column
- Creates `email_notifications_log` table
- Includes RLS policies for security

#### 3. UI Components

**Location:** `src/components/NotificationSettings.tsx`

- Beautiful, user-friendly settings interface
- Master toggle with individual controls
- Real-time save functionality
- Integrated into Profile page

#### 4. Helper Functions

**Location:** `src/utils/emailNotifications.ts`

- Type-safe helper functions for each notification type
- Easy-to-use API for triggering notifications
- Automatic URL generation

## Email Templates

All templates feature:

- **Responsive Design**: Works on all devices
- **Brand Consistency**: Aiborg™ colors and styling
- **Clear CTAs**: Prominent action buttons
- **Professional Layout**: Clean, modern HTML

### Template Examples

#### Course Enrollment

```html
Subject: Welcome to [Course Name]! 🎉 - Welcome message - Course details card - What's Next section
- CTA: Go to Course Dashboard
```

#### Assignment Graded

```html
Subject: Your assignment "[Name]" has been graded - Grade score display - Instructor feedback -
Submission details - CTA: View Full Results
```

#### Deadline Reminder

```html
Subject: 🚨 Deadline Alert: [Item] due in X hours - Urgent countdown display - Warning message -
CTA: Submit Now
```

## Usage

### Send Enrollment Email

```typescript
import { sendEnrollmentEmail } from '@/utils/emailNotifications';

await sendEnrollmentEmail({
  studentEmail: 'student@example.com',
  studentName: 'John Doe',
  courseName: 'Advanced AI Techniques',
  instructorName: 'Dr. Smith',
  duration: '8 weeks',
  startDate: '2025-01-15',
  courseUrl: 'https://app.aiborg.ai/course/123',
});
```

### Send Assignment Graded Email

```typescript
import { sendAssignmentGradedEmail } from '@/utils/emailNotifications';

await sendAssignmentGradedEmail({
  studentEmail: 'student@example.com',
  studentName: 'John Doe',
  assignmentName: 'Machine Learning Project',
  courseName: 'Advanced AI Techniques',
  score: 95,
  totalPoints: 100,
  grade: 'A',
  percentage: 95,
  feedback: 'Excellent work! Your implementation was creative and well-documented.',
  submittedDate: '2025-01-20',
  gradedDate: '2025-01-22',
  assignmentUrl: 'https://app.aiborg.ai/assignment/456',
});
```

### Send Deadline Reminder

```typescript
import { sendDeadlineReminderEmail } from '@/utils/emailNotifications';

await sendDeadlineReminderEmail({
  studentEmail: 'student@example.com',
  studentName: 'John Doe',
  itemName: 'Final Project',
  courseName: 'Advanced AI Techniques',
  hoursLeft: 12,
  dueDateTime: 'Jan 25, 2025 at 11:59 PM',
  submissionUrl: 'https://app.aiborg.ai/assignment/789/submit',
});
```

## Database Schema

### Profiles Table Updates

```sql
-- Email notification settings
email_notifications: BOOLEAN DEFAULT true

-- Individual notification preferences
notification_preferences: JSONB DEFAULT {
  "course_enrollment": true,
  "assignment_due": true,
  "assignment_graded": true,
  "course_update": true,
  "new_announcement": true,
  "deadline_reminder": true,
  "certificate_ready": true,
  "discussion_reply": true
}
```

### Email Notifications Log

```sql
CREATE TABLE email_notifications_log (
  id UUID PRIMARY KEY,
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  email_id TEXT NOT NULL,  -- Resend email ID
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Setup Instructions

### 1. Configure Environment Variables

Add to Supabase Edge Function secrets:

```bash
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy Edge Function

```bash
npx supabase functions deploy send-email-notification
```

### 3. Run Database Migration

```bash
npx supabase db push
```

### 4. Verify Setup

1. Go to Profile → Notifications tab
2. Ensure all toggles are working
3. Test with a sample notification

## Testing

### Manual Testing

```typescript
// In browser console or test file
import { sendEnrollmentEmail } from '@/utils/emailNotifications';

// Send test email
await sendEnrollmentEmail({
  studentEmail: 'your-email@example.com',
  studentName: 'Test User',
  courseName: 'Test Course',
  instructorName: 'Test Instructor',
  duration: '4 weeks',
  startDate: new Date().toISOString().split('T')[0],
  courseUrl: window.location.origin + '/course/1',
});
```

### Edge Function Testing

```bash
# Local testing
npx supabase functions serve send-email-notification

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-email-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "type": "course_enrollment",
    "data": {
      "studentName": "Test User",
      "courseName": "Test Course"
    }
  }'
```

## Monitoring

### View Sent Notifications

```sql
-- Check all notifications for a user
SELECT * FROM email_notifications_log
WHERE user_email = 'student@example.com'
ORDER BY sent_at DESC;

-- Count by type
SELECT notification_type, COUNT(*) as count
FROM email_notifications_log
GROUP BY notification_type;
```

### Check Delivery Status

Use Resend Dashboard:

1. Go to https://resend.com/emails
2. Search by email_id from logs
3. View delivery status and bounces

## Best Practices

### 1. Respect User Preferences

```typescript
// Always check preferences before sending
const { data: profile } = await supabase
  .from('profiles')
  .select('email_notifications, notification_preferences')
  .eq('email', userEmail)
  .single();

if (!profile?.email_notifications) return;
if (!profile.notification_preferences?.assignment_due) return;
```

### 2. Batch Notifications

For bulk operations, use rate limiting:

```typescript
// Send to multiple users with delay
for (const user of users) {
  await sendNotification(user);
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
}
```

### 3. Handle Errors Gracefully

```typescript
const result = await sendEnrollmentEmail(params);
if (!result.success) {
  console.error('Failed to send email:', result.error);
  // Log to monitoring service
  // Don't block user flow
}
```

## Roadmap

### Phase 2 Features

- [ ] Digest emails (daily/weekly summaries)
- [ ] SMS notifications (Twilio integration)
- [ ] Push notifications (browser/mobile)
- [ ] Email templates editor (for admins)
- [ ] A/B testing for subject lines
- [ ] Unsubscribe links
- [ ] Email analytics dashboard

### Phase 3 Features

- [ ] Multi-language support
- [ ] Custom notification schedules
- [ ] Smart notification batching
- [ ] AI-powered content personalization
- [ ] Integration with calendar apps

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**

   ```bash
   npx supabase secrets list
   ```

2. **Verify Edge Function Logs**

   ```bash
   npx supabase functions logs send-email-notification
   ```

3. **Check User Preferences**
   ```sql
   SELECT email_notifications, notification_preferences
   FROM profiles
   WHERE email = 'user@example.com';
   ```

### Email Delivery Issues

1. **Check Spam Folder**: Resend emails may be flagged initially
2. **Verify Domain**: Ensure sending domain is verified in Resend
3. **Check Bounces**: Review Resend dashboard for bounce reports

### Template Rendering Issues

1. **Test HTML**: Use an email testing tool like Litmus or Email on Acid
2. **Check Variables**: Ensure all template variables are provided
3. **Validate JSON**: Check notification_preferences structure

## Support

- **Documentation**: This file
- **Edge Function Code**: `supabase/functions/send-email-notification/`
- **UI Component**: `src/components/NotificationSettings.tsx`
- **Helper Functions**: `src/utils/emailNotifications.ts`

For issues or questions, contact the development team or create a GitHub issue.
