# API Contract: Register for Session

**Endpoint**: `POST /functions/v1/register-for-session` **Purpose**: Register a user for the free
introductory AI session **Authentication**: Public (no auth required) or Authenticated **Maps to**:
FR-008, FR-010, FR-012 from spec.md

---

## Request

### Headers

```http
Content-Type: application/json
Authorization: Bearer <optional-user-token>
```

### Body Schema

```typescript
interface RegisterForSessionRequest {
  sessionId: string; // UUID of the free session
  fullName: string; // 2-100 characters
  email: string; // Valid email format
  birthdate: string; // ISO 8601 date (YYYY-MM-DD)
  parentEmail?: string; // Required if age < 13
  source?: 'web' | 'mobile' | 'admin' | 'api'; // Default: 'web'
}
```

### Validation Rules

```typescript
const schema = z
  .object({
    sessionId: z.string().uuid(),
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    parentEmail: z.string().email().optional(),
    source: z.enum(['web', 'mobile', 'admin', 'api']).default('web'),
  })
  .refine(data => {
    const age = calculateAge(new Date(data.birthdate));
    if (age < 13 && !data.parentEmail) {
      throw new Error('Parent/guardian email required for users under 13');
    }
    return true;
  });
```

### Example Request

```json
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "fullName": "Alice Johnson",
  "email": "alice.johnson@example.com",
  "birthdate": "2012-05-15",
  "parentEmail": "parent@example.com",
  "source": "web"
}
```

---

## Response

### Success Response (201 Created)

#### Status: Confirmed

```json
{
  "success": true,
  "data": {
    "registrationId": "987fcdeb-51a2-43d7-9012-345678901234",
    "status": "confirmed",
    "sessionDetails": {
      "title": "Free AI Intro Session",
      "date": "2025-11-08T17:00:00Z",
      "duration": 90
    },
    "ageWarning": "This session is designed for ages 9-18, but all ages welcome.",
    "nextSteps": [
      "Check your email for confirmation",
      "Add session to calendar",
      "Join via Google Meet link on November 8th"
    ]
  }
}
```

#### Status: Waitlisted

```json
{
  "success": true,
  "data": {
    "registrationId": "987fcdeb-51a2-43d7-9012-345678901234",
    "status": "waitlisted",
    "waitlistPosition": 3,
    "sessionDetails": {
      "title": "Free AI Intro Session",
      "date": "2025-11-08T17:00:00Z",
      "capacity": 50
    },
    "message": "Session is full. You are #3 on the waitlist. We'll email you if a spot opens."
  }
}
```

#### Status: Pending Parent Consent (Under 13)

```json
{
  "success": true,
  "data": {
    "registrationId": "987fcdeb-51a2-43d7-9012-345678901234",
    "status": "pending",
    "parentConsentRequired": true,
    "message": "Registration pending parent/guardian approval. An email has been sent to parent@example.com."
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "parentEmail",
        "message": "Parent/guardian email required for users under 13"
      }
    ]
  }
}
```

#### 409 Conflict - Already Registered

```json
{
  "success": false,
  "error": {
    "code": "ALREADY_REGISTERED",
    "message": "This email is already registered for the session",
    "existingRegistrationId": "987fcdeb-51a2-43d7-9012-345678901234",
    "status": "confirmed"
  }
}
```

#### 404 Not Found - Session Not Found

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "The requested session does not exist or is no longer available"
  }
}
```

#### 410 Gone - Session Passed

```json
{
  "success": false,
  "error": {
    "code": "SESSION_PASSED",
    "message": "Registration closed. This session has already occurred.",
    "sessionDate": "2025-11-08T17:00:00Z"
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

---

## Business Logic

### Registration Flow

```
1. Validate request data (Zod schema)
2. Check session exists and is published
3. Check session hasn't passed
4. Calculate user's age from birthdate
5. If age < 9 OR > 18: Set warning flag (but continue)
6. If age < 13: Validate parent email provided
7. Check if email already registered for this session
8. Check session capacity:
   a. If spots available:
      - Create registration with status='confirmed' (or 'pending' if under-13)
      - Increment free_sessions.registered_count
      - Trigger confirmation email
      - If under-13: Send parent consent email
   b. If full:
      - Create registration with status='waitlisted'
      - Create session_waitlist entry (position auto-assigned)
      - Increment free_sessions.waitlist_count
      - Trigger waitlist confirmation email
9. Return registration details
```

### Database Transaction

```sql
BEGIN;

-- Insert registration
INSERT INTO session_registrations (
  session_id, user_id, full_name, email, birthdate, parent_email, status, registration_source
) VALUES (
  $1, $2, $3, $4, $5, $6,
  CASE
    WHEN is_session_full($1) THEN 'waitlisted'
    WHEN calculate_age($5) < 13 THEN 'pending'
    ELSE 'confirmed'
  END,
  $7
) RETURNING *;

-- If waitlisted, insert into waitlist
INSERT INTO session_waitlist (session_id, registration_id)
SELECT $1, registration.id
WHERE registration.status = 'waitlisted';

COMMIT;
```

---

## Side Effects

1. **Database**:
   - Creates record in `session_registrations`
   - Optionally creates record in `session_waitlist`
   - Updates `free_sessions.registered_count` (trigger)
   - Updates `free_sessions.waitlist_count` (trigger)

2. **Emails Triggered** (async via Edge Function invocation):
   - Confirmation email (if confirmed)
   - Waitlist notification (if waitlisted)
   - Parent consent email (if under-13)
   - Creates record in `email_logs` table

3. **Analytics** (future):
   - Track conversion rate (page view → registration)
   - Track age distribution
   - Track waitlist conversion rate

---

## Rate Limiting

**Not implemented in MVP**, but recommended for Phase 2:

- 10 registrations per email per day
- 100 registrations per IP per hour
- Implemented via Edge Function middleware

---

## Testing Checklist

- [ ] Valid registration (age 9-18, spots available) → Confirmed
- [ ] Valid registration (age < 13, spots available) → Pending + parent email
- [ ] Valid registration (age < 9 or > 18) → Warning shown + Confirmed
- [ ] Valid registration (session full) → Waitlisted
- [ ] Duplicate email for same session → 409 Conflict
- [ ] Same email for different session → Success (allowed)
- [ ] Invalid email format → 400 Validation Error
- [ ] Missing parent email for under-13 → 400 Validation Error
- [ ] Session doesn't exist → 404 Not Found
- [ ] Session date in past → 410 Gone
- [ ] Concurrent registrations at capacity → One confirmed, one waitlisted (no race)

---

**Contract Status**: ✅ Defined **Implementation Ready**: Yes **Edge Function**:
`supabase/functions/register-for-session/index.ts`
