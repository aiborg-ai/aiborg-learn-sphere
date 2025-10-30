# Feature Specification: Free Introductory AI Session for Students

**Feature Branch**: `001-create-a-free` **Created**: 2025-10-29 **Status**: Ready for Planning
**Last Updated**: 2025-10-29 (Clarifications resolved) **Input**: "Create a free introductory
session course card for students aged 9-18. This is a 90-minute online session on November 8th at 5
PM. The content covers AI use cases and how students can apply AI to real homework. Users should be
able to register for free (no payment required)."

## Execution Flow (main)

```
1. Parse user description from Input
   → DONE: Free intro session, ages 9-18, 90 mins, Nov 8 5pm, AI use cases
2. Extract key concepts from description
   → Actors: Students (9-18), Parents/Guardians (registration)
   → Actions: View session details, Register for free, Attend online
   → Data: Registration info, session details
   → Constraints: Free, specific date/time, age range
3. For each unclear aspect:
   → RESOLVED: All clarifications provided by stakeholder
4. Fill User Scenarios & Testing section
   → DONE: Primary flow and edge cases defined
5. Generate Functional Requirements
   → DONE: All 19 requirements testable and unambiguous
6. Identify Key Entities
   → DONE: Session Registration, Event Session, Google Meet Access
7. Run Review Checklist
   → PASS: All requirements clear and complete
8. Return: SUCCESS - Ready for planning phase
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd
   need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth
   method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous"
   checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

**As a parent or student (aged 9-18),** I want to discover and register for a free 90-minute
introductory AI session so that I can learn about AI use cases and how to apply AI to real homework
without any financial commitment.

**User Journey:**

1. User browses the platform and sees the free introductory session prominently displayed
2. User views session details: date (Nov 8th), time (5 PM GMT), duration (90 mins), content overview
3. User sees "Free" pricing and "Register Now" call-to-action
4. User completes a simple registration form (name, email, birthdate, parent email if under 13)
5. User receives immediate confirmation email with Google Meet link
6. On November 8th, user clicks Google Meet link in email to join session at 5 PM GMT
7. User attends the 90-minute online session
8. After session, user receives thank you email with session recording link and feedback survey

### Acceptance Scenarios

1. **Given** a visitor viewing the courses page, **When** they see the free introductory session
   card, **Then** it clearly displays "FREE", the date "November 8th", time "5 PM", duration "90
   minutes", and target age range "Ages 9-18"

2. **Given** a student aged 15, **When** they click "Register Now" on the free session, **Then**
   they are taken to a registration form that does NOT request payment information

3. **Given** a completed registration form, **When** the user submits it, **Then** they receive
   immediate confirmation and session access instructions

4. **Given** a registered user, **When** November 8th at 5 PM GMT arrives, **Then** they can click
   the Google Meet link from their confirmation email to join the session instantly

5. **Given** a user trying to register after the session has reached 50 participants, **When** they
   attempt registration, **Then** they are added to a waitlist and notified if a spot opens

6. **Given** a student aged 8 or 19 entering their birthdate, **When** they attempt to register,
   **Then** they see a warning that the session is designed for ages 9-18 but are allowed to proceed
   with registration if they choose

### Edge Cases

**Age Restrictions:**

- Users outside 9-18 range receive a warning message but can still register
- Birthdate is required for age verification (honor system)
- Users under 13 must provide parent/guardian email address for COPPA compliance

**Capacity & Registration:**

- Maximum 50 participants
- When 50 reached, new registrations go to waitlist
- Waitlisted users notified automatically if a spot opens (cancellation)
- Users can cancel/unregister up to 2 hours before session starts
- Cancellations after registration email sent free up spots for waitlist

**Session Access:**

- Lost confirmation email: Users can request resend via support or "Resend Confirmation" button
- Technical issues: Support WhatsApp number (+44 7404568207) included in confirmation email
- Google Meet link also available on user's account dashboard if logged in
- Backup: Support team available 30 minutes before session start

**Time Zone & Scheduling:**

- Session time is 5 PM GMT (clearly stated on card and in emails)
- Users see time converted to their local timezone in confirmation email
- Session IS recorded and made available within 24 hours
- If instructor cannot conduct: Backup instructor assigned OR session rescheduled with 48 hours
  notice

**Post-Session:**

- No formal certificate provided (free session)
- Recording link sent within 24 hours
- Feedback survey sent with recording
- Follow-up email with recommended paid courses based on survey responses
- Satisfaction survey includes opt-in for future free sessions

## Requirements _(mandatory)_

### Functional Requirements

**Session Display & Discovery:**

- **FR-001**: System MUST display a course card for the free introductory AI session on the main
  courses page
- **FR-002**: Session card MUST clearly show it is "FREE" (no cost)
- **FR-003**: Session card MUST display the date "November 8th, 2025"
- **FR-004**: Session card MUST display the start time "5 PM GMT" with user's local time shown in
  parentheses
- **FR-005**: Session card MUST display the duration "90 minutes"
- **FR-006**: Session card MUST indicate the target age range "Ages 9-18" or "Students aged 9-18"
- **FR-007**: Session card MUST describe the content as "AI Use Cases and Applying AI to Real
  Homework"

**Registration Process:**

- **FR-008**: System MUST provide a "Register Now" or similar call-to-action button on the session
  card
- **FR-009**: Registration form MUST NOT request payment information (since session is free)
- **FR-010**: Registration form MUST collect: Full name, email address, birthdate, parent/guardian
  email (if user is under 13)
- **FR-011**: System MUST validate age based on birthdate, showing a warning for ages outside 9-18
  range but allowing registration to proceed
- **FR-012**: System MUST check if 50 participant capacity is reached; if full, add new
  registrations to waitlist
- **FR-013**: Upon successful registration, system MUST send confirmation email immediately
- **FR-014**: Confirmation email MUST include Google Meet link, session date/time in GMT and user's
  local timezone, support contact (WhatsApp: +44 7404568207), and "Add to Calendar" link

**Session Access & Delivery:**

- **FR-015**: System MUST provide Google Meet link to registered users via confirmation email and
  user dashboard
- **FR-016**: System MUST record the session and provide recording link to all registered users
  within 24 hours
- **FR-017**: System MUST include technical support WhatsApp number (+44 7404568207) in all
  communications, with support team available 30 minutes before session

**Attendance & Follow-up:**

- **FR-018**: System MUST track which registered users joined the Google Meet session (via
  attendance log)
- **FR-019**: System MUST send post-session email with: session recording link, feedback survey,
  recommended paid courses, and opt-in for future free sessions

**Capacity & Waitlist Management:**

- **FR-020**: System MUST maintain a waitlist when capacity (50) is reached
- **FR-021**: System MUST automatically notify waitlisted users when a spot becomes available (due
  to cancellation)
- **FR-022**: System MUST allow registered users to cancel up to 2 hours before session start
- **FR-023**: System MUST provide "Resend Confirmation Email" functionality for users who lost
  access details

### Key Entities _(mandatory - feature involves data)_

**Session Registration:**

- Represents a user's registration for the free introductory session
- Attributes: Full name, email address, birthdate, parent/guardian email (for under 13),
  registration timestamp, confirmation sent status, waitlist status (true/false), waitlist position,
  cancellation status
- Relationships: Links to user account (if authenticated), links to the Event Session, links to
  attendance record
- Notes: Parent/guardian email is required for COPPA compliance (users under 13)

**Event Session:**

- Represents the scheduled free introductory AI session (one-time event)
- Attributes: Title ("Free AI Intro Session"), description ("AI Use Cases and Real Homework
  Applications"), date (November 8, 2025), time (5 PM GMT), duration (90 minutes), capacity limit
  (50), current registrations count, waitlist count, target age range (9-18), pricing (Free/£0),
  status (upcoming/in-progress/completed), recording URL (after session)
- Relationships: Has many Session Registrations, has one Google Meet Access record, has attendance
  records
- Notes: This is a one-time event; future sessions would be separate Event Session records

**Google Meet Access:**

- Represents the Google Meet session details
- Attributes: Google Meet link URL, meeting ID, session start time, session end time, recording
  status, recording URL (populated after session)
- Relationships: Associated with one Event Session, accessible by registered users
- Notes: Google Meet link generated when event is created, same link used for all participants

**Attendance Record:**

- Represents which registered users actually attended the session
- Attributes: Registration ID, join timestamp, leave timestamp, attended (boolean), duration in
  session
- Relationships: Links to Session Registration, links to Event Session
- Notes: Tracked via Google Meet attendance logs

**Waitlist Entry:**

- Represents users waiting for available spots
- Attributes: Registration ID, waitlist position, notification sent status, moved to confirmed
  status
- Relationships: Links to Session Registration, links to Event Session
- Notes: Automatically promoted when confirmed registrations cancel

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] **PASSED**: All clarifications resolved (6 items answered)
- [x] Requirements are testable and unambiguous (23 functional requirements)
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (single free session, 50 capacity, specific date/time)
- [x] Dependencies and assumptions identified

**All Clarifications Resolved:**

1. ✅ **Time zone:** 5 PM GMT with local time conversion displayed
2. ✅ **Registration data:** Name, email, birthdate, parent email (if under 13)
3. ✅ **Session join:** Google Meet link via confirmation email and dashboard
4. ✅ **Age verification:** Birthdate required, warning shown for out-of-range, registration allowed
5. ✅ **Capacity:** 50 participants max, waitlist when full, automatic promotion on cancellation
6. ✅ **Post-session:** Recording + survey + course recommendations within 24 hours

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted (free session, ages 9-18, 90 mins, Nov 8 @ 5pm GMT)
- [x] Ambiguities marked and resolved (6 clarifications answered)
- [x] User scenarios defined (primary flow + comprehensive edge cases)
- [x] Requirements generated (23 functional requirements, all testable)
- [x] Entities identified (5 entities: Registration, Event Session, Google Meet, Attendance,
      Waitlist)
- [x] Review checklist passed (all items complete)

**Status**: ✅ READY FOR PLANNING - Specification complete and approved. All clarifications
resolved. Ready to proceed to implementation planning phase.

---

## Next Steps

1. ✅ **Specification complete** - All requirements clear and approved
2. ➡️ **Proceed to `/plan`** - Generate technical implementation plan
3. **After planning** - Run `/tasks` to break down into executable tasks
4. **Then implement** - Run `/implement` to execute feature development

---

## Business Value & Impact

**Why This Matters:**

- **Acquisition:** Free introductory session serves as a low-barrier entry point to attract new
  families
- **Education:** 90 minutes allows meaningful demonstration of AI applications to homework
- **Target Market:** Ages 9-18 captures both secondary school segments (listed in CLAUDE.md)
- **Conversion Funnel:** Free session can convert attendees to paid courses
- **Brand Building:** Quality free content builds trust and authority

**Success Metrics (Proposed):**

- Registration rate (visitors → registrations)
- Attendance rate (registrations → actual attendees)
- Post-session conversion (attendees → course enrollments)
- Satisfaction score (post-session survey)
- Repeat engagement (attendees returning to platform)

---
