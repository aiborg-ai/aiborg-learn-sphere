# Research Findings: Free Introductory AI Session

**Feature**: 001-create-a-free **Date**: 2025-10-29 **Status**: Complete

---

## Research Summary

All technical unknowns have been researched and decisions finalized. This document captures the
rationale for technology choices, implementation approaches, and best practices to be followed
during implementation.

---

## 1. Video Conferencing Platform

### Decision: **Jitsi Meet** (https://meet.jit.si)

### Rationale:

- **Zero cost**: Free public servers with no authentication required
- **No vendor lock-in**: Can self-host if needed, or migrate to Google Meet later
- **Fast implementation**: 12-18 hours vs 15-21 hours for Google Meet integration
- **No prerequisites**: Works without Google Workspace subscription ($6-18/user/month)
- **Developer-friendly**: IFrame API for attendance tracking, React SDK available
- **Privacy**: European GDPR-compliant alternative

### Alternatives Considered:

1. **Google Meet via Google Calendar API**:
   - ❌ Requires Google Workspace (NOT free Gmail)
   - ❌ Service account setup with domain-wide delegation
   - ❌ $6-18/month per user minimum
   - ✅ More familiar brand to users
   - **Rejected because**: MVP must be zero-cost

2. **Zoom API**:
   - ❌ No free tier for API access
   - ❌ Requires paid Zoom account minimum $15/month
   - ✅ Well-known platform
   - **Rejected because**: Paid tier required

3. **Daily.co**:
   - ✅ Free tier: 1,000 minutes/month
   - ❌ Paid after free minutes ($0.015/min)
   - ✅ Good API
   - **Rejected because**: Free tier insufficient for growth

### Implementation Approach:

```typescript
// Generate unique room name
const roomName = `intro-session-${sessionId}-${crypto.randomUUID().slice(0, 8)}`;
const meetingUrl = `https://meet.jit.si/${roomName}`;

// Store in database
await supabase
  .from('free_sessions')
  .update({
    meeting_url: meetingUrl,
    meeting_room_name: roomName,
  })
  .eq('id', sessionId);
```

**Attendance Tracking**:

```typescript
// Jitsi IFrame API events
jitsiApi.on('participantJoined', participant => {
  supabase.from('session_attendance').insert({
    session_id: sessionId,
    user_id: participant.id,
    joined_at: new Date().toISOString(),
  });
});

jitsiApi.on('participantLeft', participant => {
  supabase
    .from('session_attendance')
    .update({
      left_at: new Date().toISOString(),
    })
    .eq('user_id', participant.id);
});
```

### Migration Path:

If Google Workspace is acquired later:

1. Implement Google Calendar API integration in parallel
2. Feature flag to toggle Jitsi/Meet per session
3. Migrate users gradually
4. Keep Jitsi as fallback for free sessions

---

## 2. Email Service

### Decision: **Resend.com** with React Email templates

### Rationale:

- **Official Supabase partnership**: Dedicated documentation and examples
- **Free tier**: 3,000 emails/month (covers 15 sessions × 200 emails/session)
- **Modern developer experience**: React Email templates with JSX/TypeScript
- **Best deliverability**: Above industry average inbox placement rates
- **Fast setup**: 1-2 hours vs 3-4 hours for SendGrid
- **Template power**: Build emails with React components, Tailwind CSS
- **Cost-effective**: FREE for MVP, $20/month for 50,000 emails when scaling

### Alternatives Considered:

1. **SendGrid**:
   - ✅ Proven reliability (Uber, Spotify use it)
   - ✅ Excellent deliverability (90%+)
   - ❌ Free tier only 60 days trial
   - ❌ Dated template system (Handlebars, no React)
   - ❌ More complex setup
   - **Rejected because**: Less developer-friendly, trial limitation

2. **AWS SES**:
   - ✅ Cheapest ($0.10/1000 emails)
   - ✅ Scales to billions
   - ❌ Complex AWS setup (IAM, SES sandbox approval, 4-6h setup)
   - ❌ Port restrictions with Deno Deploy (must use 2587)
   - ❌ Basic template system
   - **Rejected because**: Overkill for MVP, setup complexity

3. **Supabase Native Email**:
   - ✅ Built-in, zero setup
   - ❌ Severe rate limits (2 emails/hour default, 30/hour with custom SMTP)
   - ❌ Auth-only (cannot send custom transactional emails)
   - ❌ No SLA on delivery
   - **Rejected because**: Not suitable for transactional emails

### Implementation Approach:

```typescript
// Supabase Edge Function
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// React Email Template
const ConfirmationEmail = ({ studentName, meetLink, sessionDate }) => (
  <Html>
    <Body style={{ backgroundColor: '#f6f9fc' }}>
      <Container>
        <Heading>Welcome {studentName}!</Heading>
        <Text>Your session is confirmed for {sessionDate}</Text>
        <Button href={meetLink}>Join Google Meet</Button>
      </Container>
    </Body>
  </Html>
);

// Send email
const html = await renderAsync(<ConfirmationEmail {...props} />);
await resend.emails.send({
  from: 'AIborg Learn Sphere <sessions@aiborg.dev>',
  to: studentEmail,
  subject: 'Session Confirmed',
  html
});
```

### Email Types to Implement:

1. **Confirmation Email** (FR-013, FR-014):
   - Sent immediately after registration
   - Includes: Google Meet link, date/time (GMT + local), support WhatsApp, calendar link
   - React template with branding

2. **Waitlist Notification** (FR-021):
   - Triggered when confirmed user cancels
   - Includes: Registration link (24h expiry), session details
   - Urgent/priority styling

3. **Pre-Session Reminders** (FR-014):
   - 24 hours before: Preparation tips, agenda, Meet link
   - 1 hour before: Quick reminder, Meet link, support contact
   - Scheduled via pg_cron

4. **Post-Session Follow-up** (FR-019):
   - Recording link (if available)
   - Feedback survey
   - Recommended paid courses
   - Opt-in for future free sessions

---

## 3. Waitlist Management

### Decision: **FIFO (First-In, First-Out)** with database-driven promotion

### Rationale:

- **Fairness**: First registered users get priority
- **Simple**: Easy to understand and implement
- **Transparent**: Users see their position
- **Atomic**: Database transaction ensures no race conditions

### Implementation Pattern:

```sql
-- Promote next waitlisted user
WITH next_in_line AS (
  SELECT id, registration_id
  FROM session_waitlist
  WHERE session_id = $1
    AND status = 'waiting'
    AND promoted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED  -- Prevent race conditions
)
UPDATE session_waitlist
SET
  status = 'promoted',
  promoted_at = NOW(),
  notified = true
WHERE id = (SELECT id FROM next_in_line)
RETURNING registration_id;

-- Update registration status
UPDATE session_registrations
SET status = 'confirmed'
WHERE id = (SELECT registration_id FROM next_in_line);
```

### Edge Cases Handled:

- Multiple simultaneous cancellations: `FOR UPDATE SKIP LOCKED` ensures atomicity
- User doesn't claim spot: 24-hour expiry, next user promoted automatically
- Session fills before waitlist user confirms: Status updated to 'full', email sent

### Alternative Considered:

- **Priority-based**: Give priority to returning users, referrals, etc.
  - **Rejected because**: Adds complexity, less fair for new users
  - **Future enhancement**: Can add priority column later if needed

---

## 4. COPPA Compliance

### Decision: **Parent email required for under-13** with honor-system age verification

### Legal Requirements (FTC COPPA Rule):

- **Age Gate**: Collect birthdate to determine age
- **Parental Consent**: Required for under-13 users
- **Verifiable Consent**: Email to parent with confirmation link (acceptable method per FTC)
- **Data Minimization**: Only collect necessary data (name, email, birthdate)
- **Privacy Policy**: Must be accessible and clear

### Implementation Approach:

```typescript
// Zod validation schema
const registrationSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    birthdate: z.date(),
    parentEmail: z.string().email().optional(),
  })
  .refine(data => {
    const age = calculateAge(data.birthdate);
    // Require parent email if under 13
    if (age < 13 && !data.parentEmail) {
      throw new Error('Parent/guardian email required for users under 13');
    }
    return true;
  });

// Age calculation
function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

// Warning for out-of-range age (9-18 target)
if (age < 9 || age > 18) {
  showWarning('This session is designed for ages 9-18, but you may proceed with registration.');
}
```

### Parent Email Workflow:

1. User under 13 registers → parent email required
2. System sends email to parent: "Your child [name] has registered for..."
3. Parent must click "Approve Registration" link
4. Only then is registration confirmed and child gets Google Meet link
5. Parent email also receives all session communications (copy)

### Data Storage:

```sql
CREATE TABLE session_registrations (
  ...
  birthdate DATE NOT NULL,
  parent_email TEXT,  -- Required if age < 13
  parent_consent_given BOOLEAN DEFAULT FALSE,
  parent_consent_at TIMESTAMPTZ,
  ...
  CONSTRAINT valid_parent_email CHECK (
    (EXTRACT(YEAR FROM AGE(birthdate)) >= 13) OR
    (parent_email IS NOT NULL AND parent_consent_given = TRUE)
  )
);
```

---

## 5. Calendar Integration (iCal/Google Calendar)

### Decision: **iCal .ics file generation** with Google Calendar add link

### Rationale:

- **Universal**: Works with Google Calendar, Outlook, Apple Calendar, any calendar app
- **No API needed**: Just generate .ics file format
- **Simple**: One format supports all platforms
- **Fast**: No external API calls

### Implementation Approach:

```typescript
import { format } from 'npm:date-fns@3.6.0';

function generateICalLink(session: FreeSession): string {
  const startTime = new Date(session.session_date);
  const endTime = new Date(startTime.getTime() + 90 * 60000); // 90 minutes

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AIborg Learn Sphere//Free Session//EN',
    'BEGIN:VEVENT',
    `DTSTART:${format(startTime, "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTEND:${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}`,
    `SUMMARY:${session.title}`,
    `DESCRIPTION:${session.description}\\n\\nJoin: ${session.meeting_url}`,
    `LOCATION:${session.meeting_url}`,
    `UID:${session.id}@aiborg.dev`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H', // Reminder 24 hours before
    'DESCRIPTION:Session tomorrow',
    'ACTION:DISPLAY',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H', // Reminder 1 hour before
    'DESCRIPTION:Session starting soon',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Return as data URI for download
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ical)}`;
}

// Google Calendar specific link (alternative)
function googleCalendarLink(session: FreeSession): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${formatGoogleDate(session.session_date)}/${formatGoogleDate(session.session_end)}`,
    details: `${session.description}\n\nJoin: ${session.meeting_url}`,
    location: session.meeting_url,
    trp: 'false',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
```

### Email Template Integration:

```tsx
<Button href={icalLink} download="ai-session.ics">
  Add to Calendar
</Button>
<Text>
  Or: <a href={googleCalendarLink}>Add to Google Calendar</a>
</Text>
```

---

## 6. Attendance Tracking via Jitsi IFrame API

### Decision: **Client-side tracking** with Edge Function persistence

### Implementation Pattern:

```typescript
// Frontend: JitsiMeetingComponent.tsx
import { JitsiMeeting } from '@jitsi/react-sdk';

const handleApiReady = (api: any) => {
  // Track join event
  api.on('participantJoined', async (participant: any) => {
    await supabase.functions.invoke('track-attendance', {
      body: {
        sessionId,
        userId: user?.id || participant.id,
        event: 'join',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Track leave event
  api.on('participantLeft', async (participant: any) => {
    await supabase.functions.invoke('track-attendance', {
      body: {
        sessionId,
        userId: user?.id || participant.id,
        event: 'leave',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Track when user (not others) joins
  api.on('videoConferenceJoined', () => {
    console.log('You joined the conference');
  });

  // Track when user leaves
  api.on('videoConferenceLeft', () => {
    console.log('You left the conference');
  });
};

<JitsiMeeting
  domain="meet.jit.si"
  roomName={roomName}
  userInfo={{ displayName: studentName }}
  onApiReady={handleApiReady}
/>
```

### Backend: Edge Function

```typescript
// supabase/functions/track-attendance/index.ts
Deno.serve(async req => {
  const { sessionId, userId, event, timestamp } = await req.json();

  if (event === 'join') {
    // Create attendance record
    const { data, error } = await supabase
      .from('session_attendance')
      .insert({
        session_id: sessionId,
        user_id: userId,
        joined_at: timestamp,
      })
      .select()
      .single();
  } else if (event === 'leave') {
    // Update with leave time and calculate duration
    const { error } = await supabase
      .from('session_attendance')
      .update({
        left_at: timestamp,
        duration_seconds: supabase.rpc('calculate_duration', { joined_at, left_at: timestamp }),
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .is('left_at', null); // Update only if not already set
  }

  return new Response(JSON.stringify({ success: true }));
});
```

### Analytics Queries:

```sql
-- Attendance rate
SELECT
  COUNT(DISTINCT sa.user_id) AS attended,
  COUNT(DISTINCT sr.id) AS registered,
  ROUND(100.0 * COUNT(DISTINCT sa.user_id) / COUNT(DISTINCT sr.id), 2) AS attendance_rate
FROM session_registrations sr
LEFT JOIN session_attendance sa ON sa.session_id = sr.session_id
WHERE sr.session_id = $1 AND sr.status = 'confirmed';

-- Average session duration
SELECT AVG(duration_seconds) / 60 AS avg_minutes
FROM session_attendance
WHERE session_id = $1 AND duration_seconds IS NOT NULL;
```

---

## 7. Email Scheduling for Reminders

### Decision: **pg_cron** extension with Edge Function invocation

### Rationale:

- **Native PostgreSQL**: pg_cron already available in Supabase
- **Reliable**: Runs on database server, not dependent on external scheduler
- **Simple**: SQL-based scheduling
- **Cost-effective**: No additional service needed

### Implementation:

```sql
-- Enable pg_cron extension (one-time setup)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to send reminders
CREATE OR REPLACE FUNCTION send_session_reminders()
RETURNS void AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Find sessions starting in 24 hours (not yet reminded)
  FOR session_record IN
    SELECT id, title, session_date
    FROM free_sessions
    WHERE session_date BETWEEN NOW() + INTERVAL '23 hours 50 minutes'
      AND NOW() + INTERVAL '24 hours 10 minutes'
    AND reminder_24h_sent = FALSE
  LOOP
    -- Call Edge Function via HTTP
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-session-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'sessionId', session_record.id,
        'timeUntil', '24h'
      )
    );

    UPDATE free_sessions SET reminder_24h_sent = TRUE WHERE id = session_record.id;
  END LOOP;

  -- Find sessions starting in 1 hour (not yet reminded)
  FOR session_record IN
    SELECT id, title, session_date
    FROM free_sessions
    WHERE session_date BETWEEN NOW() + INTERVAL '50 minutes'
      AND NOW() + INTERVAL '1 hour 10 minutes'
    AND reminder_1h_sent = FALSE
  LOOP
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-session-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'sessionId', session_record.id,
        'timeUntil', '1h'
      )
    );

    UPDATE free_sessions SET reminder_1h_sent = TRUE WHERE id = session_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule to run every 10 minutes
SELECT cron.schedule(
  'send-session-reminders',
  '*/10 * * * *',  -- Every 10 minutes
  'SELECT send_session_reminders()'
);
```

### Alternative Considered:

- **Supabase Database Webhooks**: Trigger on table changes
  - **Rejected because**: Cannot schedule based on time, only on data changes
  - **Use case**: Good for real-time reactions, not scheduled tasks

---

## 8. Time Zone Conversion

### Decision: **date-fns-tz** for time zone handling

### Rationale:

- **Lightweight**: Smaller bundle size than Luxon or Moment
- **Tree-shakeable**: Only import what you need
- **Already in use**: date-fns already a project dependency
- **Simple API**: Easy to use with UTC and local conversions

### Implementation:

```typescript
import { format, formatInTimeZone } from 'npm:date-fns-tz@3.2.0';
import { parseISO } from 'npm:date-fns@3.6.0';

// Store all dates in UTC in database
const sessionDateUTC = '2025-11-08T17:00:00Z';  // 5 PM GMT

// Display in user's local timezone
function formatLocalTime(utcDateString: string, userTimezone: string): string {
  return formatInTimeZone(
    parseISO(utcDateString),
    userTimezone,
    'EEEE, MMMM do, yyyy \'at\' h:mm a zzz'
  );
  // Output: "Saturday, November 8th, 2025 at 12:00 PM EST"
}

// Detect user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Email template with dual display
<Text>
  <strong>Date:</strong> November 8th, 2025<br/>
  <strong>Time:</strong> 5:00 PM GMT ({formatLocalTime(sessionDate, userTimezone)})
</Text>
```

### Database Schema:

```sql
CREATE TABLE free_sessions (
  ...
  session_date TIMESTAMPTZ NOT NULL,  -- Always store in UTC
  timezone TEXT DEFAULT 'UTC',         -- Original timezone (informational)
  ...
);
```

---

## Technology Stack Summary

| Technology          | Purpose              | Cost         | Why Chosen                                 |
| ------------------- | -------------------- | ------------ | ------------------------------------------ |
| **Jitsi Meet**      | Video conferencing   | FREE         | Zero cost, no auth, fast setup             |
| **Resend.com**      | Email delivery       | FREE (3k/mo) | Best Supabase integration, React templates |
| **React Email**     | Email templates      | FREE         | Modern DX, JSX templates                   |
| **date-fns-tz**     | Time zone conversion | FREE         | Lightweight, tree-shakeable                |
| **pg_cron**         | Email scheduling     | FREE         | Native PostgreSQL, reliable                |
| **Zod**             | Form validation      | FREE         | Type-safe, already in use                  |
| **React Hook Form** | Form management      | FREE         | Already in use, good DX                    |

**Total MVP Cost**: **$0/month** (all free tiers)

---

## Implementation Timeline Estimate

| Phase                   | Tasks                           | Estimated Time  |
| ----------------------- | ------------------------------- | --------------- |
| **Database Setup**      | 5 migrations + RLS              | 3-4 hours       |
| **Edge Functions**      | 6 functions                     | 6-8 hours       |
| **Frontend Components** | 3 components + 3 hooks          | 5-6 hours       |
| **Email Templates**     | 4 React Email templates         | 3-4 hours       |
| **Integration**         | Jitsi, Resend, calendar         | 4-5 hours       |
| **Testing**             | Manual E2E testing              | 2-3 hours       |
| **Deployment**          | Migrations, functions, frontend | 1-2 hours       |
| **Total**               |                                 | **24-32 hours** |

**Developer effort**: 3-4 working days for single developer

---

## Risk Mitigation

| Risk                             | Mitigation Strategy                                                              |
| -------------------------------- | -------------------------------------------------------------------------------- |
| **Jitsi public server downtime** | Monitor uptime, have backup meet.jit.si instances, migration plan to self-hosted |
| **Email deliverability issues**  | Use Resend's reputation, verify SPF/DKIM, monitor bounce rates                   |
| **Waitlist race conditions**     | Use `FOR UPDATE SKIP LOCKED`, implement idempotent endpoints                     |
| **COPPA non-compliance**         | Implement parent consent workflow, audit data collection, privacy policy review  |
| **Time zone confusion**          | Always show both GMT and local time, prominent timezone display                  |
| **pg_cron missing executions**   | Implement idempotent reminder logic (won't re-send), log all executions          |

---

**Research Status**: ✅ Complete **Ready for Phase 1 (Design & Contracts)**: ✅ Yes **All unknowns
resolved**: ✅ Yes
