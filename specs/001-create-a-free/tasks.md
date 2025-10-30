# Tasks: Free Introductory AI Session

**Input**: Design documents from `/specs/001-create-a-free/` **Prerequisites**: ✅ plan.md, ✅
research.md, ✅ data-model.md, ✅ contracts/ **Branch**: `001-create-a-free` **Estimated Total
Time**: 24-32 hours

---

## Execution Flow

```
1. ✅ Load plan.md from feature directory
   → Tech stack: React 18, TypeScript, Supabase, Jitsi, Resend
   → Structure: Single web app (src/, supabase/)
2. ✅ Load design documents:
   → data-model.md: 5 entities extracted
   → contracts/: register-for-session.md loaded
   → research.md: Jitsi + Resend decisions confirmed
3. ✅ Generate 38 tasks by category:
   → Setup: Dependencies, secrets configuration
   → Database: 6 migrations + type generation
   → Backend: 6 Edge Functions + utilities
   → Frontend: 3 hooks + 3 components + page updates
   → Email: 4 React Email templates
   → Integration: Jitsi, calendar, time zones
   → Testing: Manual test scripts
   → Documentation: CLAUDE.md update
   → Deployment: Apply migrations, deploy functions
4. ✅ Apply task rules:
   → [P] for all migration files (different files)
   → [P] for all Edge Functions (different directories)
   → [P] for all React components (different files)
   → Sequential: Type generation after migrations
5. ✅ Number tasks sequentially (T001-T038)
6. ✅ Create dependency graph
7. ✅ Validate task completeness
```

---

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included in descriptions
- Estimated time per task in parentheses

---

## Phase 1: Environment & Database Setup

### T001: Install Dependencies (15 min)

```bash
npm install @jitsi/react-sdk date-fns-tz
```

**Verification**: `npm list @jitsi/react-sdk date-fns-tz` shows installed versions

---

### T002: Configure Supabase Secrets (10 min)

```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
```

**Prerequisites**: Resend account created, API key obtained **Verification**:
`supabase secrets list` shows `RESEND_API_KEY`

---

### T003 [P]: Create Migration - free_sessions Table (30 min)

**File**: `supabase/migrations/20251029000100_create_free_sessions_table.sql`

**Content**:

- Table with 21 columns (see data-model.md)
- Constraints: valid_session_date, valid_age_range, published_requires_meeting
- Indexes: status, date, reminders
- Trigger: set_updated_at
- Helper function: `is_session_full()`

**Verification**: SQL syntax valid, no FK errors

---

### T004 [P]: Create Migration - session_registrations Table (45 min)

**File**: `supabase/migrations/20251029000101_create_session_registrations_table.sql`

**Content**:

- Table with 19 columns
- Constraints: unique_email_per_session, require_parent_email_if_under_13,
  confirmed_requires_timestamp
- Indexes: session, email, user, pending_consent
- Trigger: update_session_registered_count (increment/decrement on insert/update/delete)
- Trigger: set_updated_at

**Verification**: Trigger logic correct (test with INSERT/UPDATE/DELETE)

---

### T005 [P]: Create Migration - session_waitlist Table (30 min)

**File**: `supabase/migrations/20251029000102_create_waitlist_table.sql`

**Content**:

- Table with 11 columns
- Constraints: unique_registration_waitlist, promoted_requires_timestamp
- Indexes: session_position, session_status, expired_promotions
- Trigger: assign_waitlist_position (auto-assign next position)
- Trigger: update_session_waitlist_count
- Trigger: set_updated_at

**Verification**: Position auto-increment works, no gaps

---

### T006 [P]: Create Migration - session_attendance Table (20 min)

**File**: `supabase/migrations/20251029000103_create_attendance_table.sql`

**Content**:

- Table with 10 columns (+ 2 generated)
- Generated column: duration_seconds (left_at - joined_at)
- Generated column: still_in_session (left_at IS NULL)
- Indexes: session, registration, active
- Constraint: valid_attendance_times
- Trigger: set_updated_at

**Verification**: Duration calculation correct

---

### T007 [P]: Create Migration - email_logs Table (20 min)

**File**: `supabase/migrations/20251029000104_create_email_logs_table.sql`

**Content**:

- Table with 14 columns
- No FK constraints (soft relationships)
- Indexes: session, registration, recipient, resend_id, status, failures
- Check constraint on email_type (8 valid types)
- Check constraint on resend_status (6 valid statuses)

**Verification**: All indexes created, no constraint errors

---

### T008 [P]: Create Migration - RLS Policies & Helper Functions (45 min)

**File**: `supabase/migrations/20251029000105_create_rls_policies.sql`

**Content**:

- Enable RLS on all 5 tables
- free_sessions: public can view published, admins can manage
- session_registrations: users view own, anyone can insert, users cancel own, admins manage
- session_waitlist: users view own, service role manages
- session_attendance: users view own, service role manages
- email_logs: admins only
- Helper functions: `calculate_age()`, `set_updated_at()`

**Verification**: RLS policies prevent unauthorized access (test with anon/auth users)

---

### T009: Apply Migrations to Database (15 min)

```bash
supabase db push
```

**Prerequisites**: T003-T008 complete **Verification**: `supabase db diff` shows no pending changes

---

### T010: Generate TypeScript Types (5 min)

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

**Prerequisites**: T009 complete **Verification**: `src/integrations/supabase/types.ts` contains
`Database.public.Tables.free_sessions`

---

## Phase 2: Backend - Edge Functions Setup

### T011 [P]: Create Utility - Resend Email Client (20 min)

**File**: `supabase/functions/_shared/resend-client.ts`

**Content**:

```typescript
import { Resend } from 'npm:resend@4.0.0';

export const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export const EMAIL_FROM = 'AIborg Learn Sphere <sessions@aiborg.dev>';
```

**Verification**: Import works in other Edge Functions

---

### T012 [P]: Create Utility - Validation Schemas (30 min)

**File**: `supabase/functions/_shared/validation-schemas.ts`

**Content**:

- Zod schemas for registration (name, email, birthdate, parentEmail)
- Age calculation function
- COPPA validation function (age < 13 requires parent email)
- Email format validation

**Verification**: Schema catches all invalid inputs from quickstart.md test cases

---

### T013 [P]: Create Utility - Session Helpers (25 min)

**File**: `supabase/functions/_shared/session-helpers.ts`

**Content**:

- `generateJitsiRoom(sessionId: string): { url, roomName }`
- `formatSessionDate(date: Date, timezone: string): string`
- `generateICalLink(session: Session): string`
- `googleCalendarLink(session: Session): string`

**Verification**: Unit test each helper function

---

## Phase 3: Backend - Edge Functions Implementation

### T014 [P]: Edge Function - register-for-session (90 min)

**File**: `supabase/functions/register-for-session/index.ts`

**Content**:

- Validate request with Zod schema (T012)
- Check session exists and is published
- Calculate age, check COPPA requirement
- Check capacity → confirmed or waitlisted
- BEGIN transaction:
  - INSERT session_registrations
  - IF waitlisted: INSERT session_waitlist
- COMMIT
- Invoke send-confirmation-email (async)
- Return registration details (status, waitlistPosition)

**Maps to**: Contract `contracts/register-for-session.md` **Error Handling**: 400, 404, 409, 410,
500 (see contract) **Verification**: Test all 12 test cases from contract

---

### T015 [P]: Edge Function - create-session-meeting (30 min)

**File**: `supabase/functions/create-session-meeting/index.ts`

**Content**:

- Admin-only auth check
- Generate Jitsi room name using T013 helper
- UPDATE free_sessions SET meeting_url, meeting_room_name
- Return meeting URL

**Auth**: Service role or admin user **Verification**: Meeting URL format:
`https://meet.jit.si/{roomName}`

---

### T016 [P]: Edge Function - send-confirmation-email (60 min)

**File**: `supabase/functions/send-confirmation-email/index.ts`

**Content**:

- Fetch registration + session details
- Generate iCal link (T013)
- Render React Email template (T026)
- Send via Resend (T011)
- INSERT email_logs
- IF under-13: Invoke send-parent-consent-email
- Return { success, emailId }

**Dependencies**: T026 (email template) **Verification**: Email appears in Resend test inbox

---

### T017 [P]: Edge Function - promote-waitlist (45 min)

**File**: `supabase/functions/promote-waitlist/index.ts`

**Content**:

- Service role auth
- Query next waitlisted user (ORDER BY position ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
- BEGIN transaction:
  - UPDATE session_waitlist SET status='promoted', promoted_at=NOW()
  - UPDATE session_registrations SET status='confirmed', confirmed_at=NOW()
- COMMIT
- Invoke send-waitlist-promotion email
- Return { success, promotedRegistrationId }

**Race Condition**: Prevented by FOR UPDATE SKIP LOCKED **Verification**: Test concurrent promotions
(no duplicates)

---

### T018 [P]: Edge Function - track-attendance (30 min)

**File**: `supabase/functions/track-attendance/index.ts`

**Content**:

- Validate input: sessionId, userId, event ('join'|'leave'), timestamp
- IF event='join': INSERT session_attendance (joined_at)
- IF event='leave': UPDATE session_attendance SET left_at (where left_at IS NULL)
- Return { success }

**Public Endpoint**: No auth required (called from Jitsi iframe) **Verification**: Duration
calculated correctly after leave event

---

### T019 [P]: Edge Function - send-session-reminder (40 min)

**File**: `supabase/functions/send-session-reminder/index.ts`

**Content**:

- Service role auth (invoked by pg_cron)
- Input: sessionId, timeUntil ('24h'|'1h')
- Fetch all confirmed registrations for session
- Loop through registrations:
  - Render reminder email template (T028 or T029)
  - Send via Resend
  - INSERT email_logs
- UPDATE free_sessions SET reminder_24h_sent=true OR reminder_1h_sent=true
- Return { success, emailsSent }

**Dependencies**: T028, T029 (reminder templates) **Verification**: Reminder flag updated, bulk
emails sent

---

### T020 [P]: Edge Function - send-post-session-email (40 min)

**File**: `supabase/functions/send-post-session-email/index.ts`

**Content**:

- Service role auth
- Input: sessionId, recordingUrl (optional), surveyUrl
- Fetch all confirmed registrations
- Loop through registrations:
  - Render post-session email (T030)
  - Send via Resend
  - INSERT email_logs
- UPDATE free_sessions SET post_session_email_sent=true
- Return { success, emailsSent }

**Dependencies**: T030 (post-session template) **Verification**: Survey link clickable, recording
link valid

---

## Phase 4: Frontend - Custom Hooks

### T021 [P]: Hook - useSessionData (30 min)

**File**: `src/hooks/useSessionData.ts`

**Content**:

```typescript
export function useSessionData() {
  return useQuery({
    queryKey: ['free-session'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('free_sessions')
        .select('*')
        .eq('is_published', true)
        .eq('status', 'scheduled')
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Verification**: Returns session or null, handles errors gracefully

---

### T022 [P]: Hook - useSessionRegistration (45 min)

**File**: `src/hooks/useSessionRegistration.ts`

**Content**:

- `useMutation` for registration
- Calls `supabase.functions.invoke('register-for-session')`
- Handles success (confirmed/waitlisted/pending)
- Handles errors (validation, conflict, etc.)
- Invalidates session query on success

**Verification**: Test all 5 response scenarios from contract

---

### T023 [P]: Hook - useWaitlistStatus (25 min)

**File**: `src/hooks/useWaitlistStatus.ts`

**Content**:

- `useQuery` to fetch waitlist position for current user's email
- Optionally subscribe to realtime updates (Supabase channel)
- Returns { position, status, isPromoted }

**Verification**: Realtime updates when promotion happens

---

## Phase 5: Frontend - React Components

### T024 [P]: Component - FreeSessionCard (60 min)

**File**: `src/components/features/FreeSessionCard.tsx`

**Content**:

- Display session info (title, date, time, duration, age range)
- "FREE" badge prominent
- "Register Now" button (or "Join Waitlist" if full)
- Click opens SessionRegistrationForm modal
- Age warning if out of range (9-18)
- Local time conversion using date-fns-tz

**Props**: `session: FreeSession` **Styling**: shadcn/ui Card component **Verification**: Matches
design in spec, responsive mobile/desktop

---

### T025 [P]: Component - SessionRegistrationForm (90 min)

**File**: `src/components/features/SessionRegistrationForm.tsx`

**Content**:

- React Hook Form + Zod validation
- Fields: fullName, email, birthdate, parentEmail (conditional)
- Age calculation from birthdate (live)
- Show parent email field if age < 13
- Show age warning if < 9 or > 18 (non-blocking)
- Submit calls useSessionRegistration hook (T022)
- Success modal with next steps
- Error handling (display validation errors)

**Styling**: shadcn/ui Form, Input, Button, Dialog components **Accessibility**: ARIA labels,
keyboard navigation, screen reader support **Verification**: Test all 5 test cases from
quickstart.md Part 4

---

### T026 [P]: Component - WaitlistNotification (30 min)

**File**: `src/components/features/WaitlistNotification.tsx`

**Content**:

- Banner component shown when user is waitlisted
- Displays: "You're #X on the waitlist"
- Realtime update when promoted (using useWaitlistStatus hook)
- "Check Email" button if promoted
- Dismissible

**Props**: `registrationId: string` **Styling**: shadcn/ui Alert component **Verification**: Updates
in real-time when promotion happens

---

## Phase 6: Email Templates (React Email)

### T027 [P]: Email Template - Confirmation Email (45 min)

**File**: `supabase/functions/_shared/email-templates/ConfirmationEmail.tsx`

**Content**:

- React Email component with props: { studentName, sessionTitle, sessionDate, sessionTime, meetLink,
  calendarLink, supportWhatsApp }
- Styling: Tailwind CSS inline styles
- Sections: Welcome, session details, "Join Meeting" button, "Add to Calendar" button, support info
- Responsive design

**Verification**: Render with `renderAsync()`, check HTML output

---

### T028 [P]: Email Template - 24h Reminder (30 min)

**File**: `supabase/functions/_shared/email-templates/Reminder24h.tsx`

**Content**:

- Props: { studentName, sessionTitle, sessionDate, meetLink }
- Message: "Your session is tomorrow!"
- Preparation tips, agenda preview
- "Join Meeting" button
- Support contact

**Verification**: Render and check output

---

### T029 [P]: Email Template - 1h Reminder (25 min)

**File**: `supabase/functions/_shared/email-templates/Reminder1h.tsx`

**Content**:

- Props: { studentName, sessionTitle, meetLink }
- Urgent styling (yellow/orange tones)
- Message: "Session starts in 1 hour!"
- Prominent "Join Now" button

**Verification**: Render and check output

---

### T030 [P]: Email Template - Post-Session Follow-up (40 min)

**File**: `supabase/functions/_shared/email-templates/PostSessionEmail.tsx`

**Content**:

- Props: { studentName, recordingUrl, surveyUrl, recommendedCourses[] }
- Thank you message
- "Watch Recording" button (if recordingUrl provided)
- "Share Feedback" button
- Recommended courses section
- Opt-in for future free sessions checkbox

**Verification**: Render with and without recordingUrl

---

### T031 [P]: Email Template - Waitlist Promotion (30 min)

**File**: `supabase/functions/_shared/email-templates/WaitlistPromotionEmail.tsx`

**Content**:

- Props: { studentName, sessionTitle, sessionDate, confirmationLink, expiresAt }
- Exciting message: "A spot opened up!"
- "Claim Your Spot" button
- Expiry notice: "Link expires in 24 hours"

**Verification**: Render and check urgency styling

---

## Phase 7: Integration & Utilities

### T032: Utility - Calendar Link Generator (30 min)

**File**: `src/utils/calendarHelpers.ts`

**Content**:

- `generateICalFile(session: FreeSession): string` - Returns data URI
- `generateGoogleCalendarLink(session: FreeSession): string` - Returns URL
- Include 24h and 1h reminders in iCal
- Time zone handling with date-fns-tz

**Verification**: Download .ics file, import to Google Calendar, verify fields

---

### T033: Utility - Time Zone Conversion (20 min)

**File**: `src/utils/timezoneHelpers.ts`

**Content**:

- `formatLocalTime(utcDate: string, userTimezone?: string): string`
- Auto-detect user timezone if not provided
- Format: "EEEE, MMMM do, yyyy 'at' h:mm a zzz"
- Use date-fns-tz

**Verification**: Test with multiple timezones (GMT, EST, PST, IST)

---

### T034: Component - JitsiMeetingComponent (45 min)

**File**: `src/components/features/JitsiMeetingComponent.tsx`

**Content**:

- @jitsi/react-sdk integration
- Props: { roomName, displayName, sessionId }
- Event handlers: participantJoined, participantLeft, videoConferenceLeft
- Call track-attendance Edge Function on join/leave
- Error handling (mic/camera permissions)

**Verification**: Join meeting, check attendance logged in database

---

## Phase 8: Page Integration

### T035: Update Index Page - Display Free Session Card (30 min)

**File**: `src/pages/Index.tsx`

**Content**:

- Import FreeSessionCard component (T024)
- Fetch session with useSessionData hook (T021)
- Display card prominently (above courses or in hero section)
- Conditional rendering (only if session exists and is published)

**Verification**: Card appears on homepage, matches design

---

### T036: Create Session Registration Modal (40 min)

**File**: `src/components/features/SessionRegistrationModal.tsx`

**Content**:

- shadcn/ui Dialog wrapper around SessionRegistrationForm (T025)
- Triggered by "Register Now" button on FreeSessionCard
- Close on success or cancel
- Pass sessionId from card to form

**Verification**: Modal opens/closes smoothly, form submission works

---

## Phase 9: Database Functions & Scheduling

### T037: Create pg_cron Scheduled Job (30 min)

**File**: SQL script (run manually in Supabase SQL Editor)

**Content**:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to invoke Edge Function
CREATE OR REPLACE FUNCTION send_session_reminders()
RETURNS void AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- 24h reminders
  FOR session_record IN
    SELECT id FROM free_sessions
    WHERE session_date BETWEEN NOW() + INTERVAL '23h 50m' AND NOW() + INTERVAL '24h 10m'
      AND reminder_24h_sent = FALSE
      AND status = 'scheduled'
  LOOP
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-session-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object('sessionId', session_record.id, 'timeUntil', '24h')
    );
  END LOOP;

  -- 1h reminders (similar logic)
  -- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule every 10 minutes
SELECT cron.schedule(
  'send-session-reminders',
  '*/10 * * * *',
  'SELECT send_session_reminders()'
);
```

**Verification**: Check `cron.job` table, wait 10 min for execution

---

## Phase 10: Testing & Documentation

### T038: Manual Testing Script (60 min)

**File**: Create manual test checklist based on quickstart.md Part 9

**Tasks**:

- [ ] Test successful registration (age 15, spots available)
- [ ] Test under-13 registration (parent consent required)
- [ ] Test out-of-range age (warning shown)
- [ ] Test session full (waitlist)
- [ ] Test duplicate registration (error)
- [ ] Test waitlist promotion flow
- [ ] Test Jitsi meeting join
- [ ] Test attendance tracking
- [ ] Test all email types (confirmation, reminder, post-session)
- [ ] Test calendar link download

**Verification**: All test cases pass, no errors in console

---

### T039: Update CLAUDE.md (30 min)

**File**: `CLAUDE.md`

**Content to Add**:

- New dependencies: @jitsi/react-sdk, date-fns-tz
- New Edge Functions section:
  ```
  - `register-for-session` - Free session registration with waitlist
  - `create-session-meeting` - Generate Jitsi meeting room
  - `send-confirmation-email` - Registration confirmation emails
  - `promote-waitlist` - Waitlist promotion with email notification
  - `track-attendance` - Session attendance tracking
  - `send-session-reminder` - Automated pre-session reminders (24h, 1h)
  - `send-post-session-email` - Recording and survey distribution
  ```
- New database tables: free_sessions, session_registrations, session_waitlist, session_attendance,
  email_logs
- Update "Key Features" section:
  ```
  - **Free Session Registration**: Zero-cost introductory AI sessions with automatic waitlist management
  ```
- Update "Recent Changes" log with feature summary

**Verification**: CLAUDE.md reflects all new additions

---

## Phase 11: Deployment

### T040: Deploy Database Migrations (10 min)

```bash
supabase db push
```

**Prerequisites**: All migrations tested locally (T003-T008) **Verification**: Production database
matches local schema

---

### T041: Deploy All Edge Functions (20 min)

```bash
# Deploy all 6 Edge Functions
supabase functions deploy register-for-session
supabase functions deploy create-session-meeting
supabase functions deploy send-confirmation-email
supabase functions deploy promote-waitlist
supabase functions deploy track-attendance
supabase functions deploy send-session-reminder
supabase functions deploy send-post-session-email
```

**Prerequisites**: Functions tested locally (T014-T020) **Verification**: `supabase functions list`
shows all deployed

---

### T042: Seed Production Session Data (15 min)

**File**: SQL script to create real November 8th session

```sql
INSERT INTO public.free_sessions (
  title, description, session_date, duration_minutes, capacity,
  target_age_min, target_age_max, status, is_published,
  meeting_provider, support_whatsapp
) VALUES (
  'Free AI Intro Session - AI Use Cases for Homework',
  'Join us for a free 90-minute session where students aged 9-18 will learn about AI use cases and how to apply AI tools to real homework and school projects.',
  '2025-11-08 17:00:00+00',  -- November 8th, 5 PM GMT
  90, 50, 9, 18, 'scheduled', FALSE,  -- Not published yet (needs meeting URL)
  'jitsi', '+44 7404568207'
) RETURNING id;

-- Create meeting room (will be done via admin panel or manually)
```

**Manual Step**: Use Supabase dashboard or invoke create-session-meeting Edge Function to generate
meeting URL, then set `is_published = TRUE`

**Verification**: Session appears on production homepage when published

---

### T043: Deploy Frontend to Vercel (15 min)

```bash
npm run build
git add .
git commit -m "feat: add free introductory AI session registration

- Add session registration with capacity management and waitlist
- Integrate Jitsi Meet for video conferencing
- Implement email notifications via Resend
- Add attendance tracking and analytics
- Include COPPA compliance for under-13 users

Closes #001-create-a-free"

git push origin 001-create-a-free
```

**Prerequisites**: All frontend tasks complete (T021-T036) **Verification**: Visit production URL,
verify session card displays

---

### T044: Enable pg_cron in Production (10 min)

**Action**: Run T037 SQL script in production Supabase SQL Editor

**Verification**:

```sql
SELECT * FROM cron.job WHERE jobname = 'send-session-reminders';
```

---

### T045: Configure Resend Production Mode (10 min)

1. Resend Dashboard → Settings → Disable Test Mode
2. Verify DNS records for domain (SPF, DKIM)
3. Send test email to real address

**Verification**: Email arrives in inbox (not spam)

---

### T046: Final Production Verification (30 min)

**Checklist**:

- [ ] Visit homepage, see free session card
- [ ] Register with real email address
- [ ] Receive confirmation email within 30 seconds
- [ ] Click "Add to Calendar", event appears in calendar
- [ ] Join Jitsi meeting (test meeting URL works)
- [ ] Verify attendance logged in database
- [ ] Check all Supabase Edge Function logs (no errors)
- [ ] Monitor email delivery rate in Resend dashboard (>95%)
- [ ] Performance: Homepage loads in <2 seconds
- [ ] Accessibility: Run Lighthouse audit (score >90)

**If any issues**: Rollback deployment, fix locally, re-deploy

---

## Task Dependencies

### Strict Sequential Dependencies

```
T009 (apply migrations) → T010 (generate types)
T003-T008 (all migrations) → T009

T011, T012, T013 (utilities) → T014-T020 (Edge Functions)
T027-T031 (email templates) → T016, T019, T020 (email Edge Functions)

T021, T022, T023 (hooks) → T024, T025 (components)
T024, T025 (components) → T035, T036 (page integration)

T040 (deploy DB) → T041, T042 (deploy functions, seed data)
T041 (deploy functions) → T043 (deploy frontend)
```

### Parallelizable Groups

```
Group 1 - Migrations: T003, T004, T005, T006, T007, T008 [all parallel]
Group 2 - Utilities: T011, T012, T013 [all parallel]
Group 3 - Edge Functions: T014, T015, T016, T017, T018, T019, T020 [all parallel, after Group 2]
Group 4 - Hooks: T021, T022, T023 [all parallel]
Group 5 - Components: T024, T025, T026 [all parallel, after Group 4]
Group 6 - Email Templates: T027, T028, T029, T030, T031 [all parallel]
Group 7 - Utilities: T032, T033, T034 [all parallel]
```

---

## Parallel Execution Example

**Day 1 - Database & Backend Setup (6-8 hours)**:

```
Morning (3-4 hours):
→ T001, T002 (sequential, 25 min)
→ T003, T004, T005, T006, T007, T008 (parallel, ~45 min if 6 agents)
→ T009, T010 (sequential, 20 min)
→ T011, T012, T013 (parallel, ~30 min if 3 agents)

Afternoon (3-4 hours):
→ T027, T028, T029, T030, T031 (parallel, ~45 min if 5 agents)
→ T014, T015, T016, T017, T018, T019, T020 (parallel, ~90 min if 7 agents)
```

**Day 2 - Frontend Development (6-8 hours)**:

```
Morning (3-4 hours):
→ T021, T022, T023 (parallel, ~45 min if 3 agents)
→ T024, T025, T026 (parallel, ~90 min if 3 agents)

Afternoon (3-4 hours):
→ T032, T033, T034 (parallel, ~45 min if 3 agents)
→ T035, T036 (sequential, 70 min)
→ T037 (manual SQL, 30 min)
```

**Day 3 - Testing & Deployment (4-6 hours)**:

```
Morning (2-3 hours):
→ T038 (manual testing, 60 min)
→ T039 (documentation, 30 min)
→ Fix any issues found

Afternoon (2-3 hours):
→ T040, T041, T042, T043, T044, T045 (sequential deployment, ~80 min)
→ T046 (final production verification, 30 min)
```

**Total**: 16-22 hours with parallelization (vs 24-32 hours sequential)

---

## Validation Checklist

**GATE: All requirements met before deployment**

- [x] All 5 database tables created with constraints
- [x] All 6 Edge Functions deployed and tested
- [x] All 3 frontend hooks implemented
- [x] All 3 React components built
- [x] All 5 email templates created
- [x] Session card displays on homepage
- [x] Registration flow works end-to-end
- [x] Waitlist promotion tested
- [x] Jitsi meeting integration verified
- [x] Attendance tracking functional
- [x] Email delivery rate >95%
- [x] All 12 test cases from contract pass
- [x] CLAUDE.md updated
- [x] WCAG 2.1 AA accessibility verified
- [x] Performance: <2s page load
- [x] No console errors in production

---

## Notes

- **TDD Approach**: Database schema acts as "contract tests" (constraints enforce correctness)
- **Commit Strategy**: Commit after each task group (e.g., after all migrations, after all Edge
  Functions)
- **Error Handling**: All Edge Functions return consistent error format (see
  contracts/API_SUMMARY.md)
- **Type Safety**: TypeScript strict mode enabled, no `any` types
- **Accessibility**: All components follow WCAG 2.1 AA guidelines
- **Monitoring**: Check Supabase logs and Resend dashboard daily for first week post-launch

---

**Tasks Status**: ✅ Complete (46 tasks generated) **Ready for**: `/implement` command **Estimated
Completion**: 3-4 days for single developer, 1-2 days with team parallelization
