# API Contracts Summary

**Feature**: Free Introductory AI Session **Base URL**: `https://[project-ref].supabase.co`
**Date**: 2025-10-29

---

## Edge Functions

| Function                    | Method | Endpoint                                | Auth        | Purpose                                            |
| --------------------------- | ------ | --------------------------------------- | ----------- | -------------------------------------------------- |
| **register-for-session**    | POST   | `/functions/v1/register-for-session`    | Public/Auth | Register user for session (FR-008, FR-010, FR-012) |
| **create-session-meeting**  | POST   | `/functions/v1/create-session-meeting`  | Admin       | Generate Jitsi room for session (FR-015)           |
| **send-confirmation-email** | POST   | `/functions/v1/send-confirmation-email` | Service     | Send confirmation email (FR-013, FR-014)           |
| **promote-waitlist**        | POST   | `/functions/v1/promote-waitlist`        | Service     | Promote next waitlisted user (FR-021)              |
| **track-attendance**        | POST   | `/functions/v1/track-attendance`        | Public      | Record join/leave events (FR-018)                  |
| **send-session-reminder**   | POST   | `/functions/v1/send-session-reminder`   | Service     | Send pre-session reminders (pg_cron trigger)       |
| **send-post-session-email** | POST   | `/functions/v1/send-post-session-email` | Service     | Send recording + survey (FR-019)                   |

---

## Database REST API

| Table                     | Method | Endpoint                         | Auth       | Purpose                       |
| ------------------------- | ------ | -------------------------------- | ---------- | ----------------------------- |
| **free_sessions**         | GET    | `/rest/v1/free_sessions`         | Public     | Fetch active session (FR-001) |
| **session_registrations** | GET    | `/rest/v1/session_registrations` | User/Admin | View own registrations        |
| **session_waitlist**      | GET    | `/rest/v1/session_waitlist`      | User/Admin | Check waitlist status         |

---

## Detailed Contracts

1. **register-for-session.md** - Main registration endpoint with capacity + waitlist logic
2. _(Additional contracts to be created during implementation)_

---

## Authentication Types

### Public

- No authentication required
- Rate limited by IP address (future)
- Used for: Registration, attendance tracking

### Authenticated

- Requires Supabase auth token: `Authorization: Bearer <token>`
- User can only access their own data
- Used for: Viewing registrations, cancellation

### Service Role

- Requires service role key: `Authorization: Bearer <service-role-key>`
- Full database access (bypasses RLS)
- Used for: Internal Edge Function calls (emails, promotions)

### Admin

- Requires authenticated user with `role = 'admin'` in user metadata
- Can manage all sessions and registrations
- Used for: Creating sessions, viewing analytics

---

## Error Response Format

All endpoints follow a consistent error format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: Array<{
      // Optional field-specific errors
      field: string;
      message: string;
    }>;
  };
}
```

### Standard Error Codes

| Code                      | HTTP Status | Meaning                                             |
| ------------------------- | ----------- | --------------------------------------------------- |
| `VALIDATION_ERROR`        | 400         | Request data failed validation                      |
| `AUTHENTICATION_REQUIRED` | 401         | Missing or invalid auth token                       |
| `FORBIDDEN`               | 403         | User lacks permission                               |
| `NOT_FOUND`               | 404         | Resource doesn't exist                              |
| `ALREADY_EXISTS`          | 409         | Duplicate resource (e.g., already registered)       |
| `GONE`                    | 410         | Resource no longer available (e.g., session passed) |
| `RATE_LIMIT_EXCEEDED`     | 429         | Too many requests                                   |
| `INTERNAL_ERROR`          | 500         | Server error                                        |

---

## Success Response Format

All endpoints follow a consistent success format:

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}
```

---

## Webhooks (Resend)

### Email Delivery Webhook

**Endpoint**: `POST /functions/v1/resend-webhook` **Purpose**: Receive delivery status updates from
Resend **Authentication**: Resend signing secret

**Payload**:

```json
{
  "type": "email.delivered",
  "data": {
    "email_id": "resend_id_here",
    "to": "student@example.com",
    "subject": "Session Confirmed",
    "delivered_at": "2025-10-29T12:00:00Z"
  }
}
```

**Handled Events**:

- `email.sent` - Email accepted by mail server
- `email.delivered` - Email delivered to inbox
- `email.opened` - Recipient opened email (tracked)
- `email.clicked` - Recipient clicked link (tracked)
- `email.bounced` - Email bounced (permanent failure)
- `email.complained` - Recipient marked as spam

**Action**: Update `email_logs` table with delivery status

---

## Database Realtime Subscriptions

Supabase Realtime channels for live updates:

### 1. Session Capacity Updates

```typescript
const subscription = supabase
  .channel('session-capacity')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'free_sessions',
      filter: `id=eq.${sessionId}`,
    },
    payload => {
      console.log('Capacity updated:', payload.new.registered_count);
      // Update UI to show "Session Full" if needed
    }
  )
  .subscribe();
```

### 2. Waitlist Promotion Notifications

```typescript
const subscription = supabase
  .channel('waitlist-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'session_waitlist',
      filter: `registration_id=eq.${registrationId}`,
    },
    payload => {
      if (payload.new.status === 'promoted') {
        showNotification('A spot opened up! Check your email.');
      }
    }
  )
  .subscribe();
```

---

## API Versioning

**Current Version**: v1 (initial release)

**Versioning Strategy**:

- Breaking changes require new version (`/functions/v2/...`)
- Non-breaking changes deployed to existing version
- Deprecation notices sent 90 days before removal

---

## Rate Limits (Future Phase 2)

| User Type         | Limit                | Window   |
| ----------------- | -------------------- | -------- |
| **Anonymous**     | 10 requests/minute   | Per IP   |
| **Authenticated** | 100 requests/minute  | Per user |
| **Admin**         | 1000 requests/minute | Per user |

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432
```

---

## CORS Policy

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // MVP: allow all
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};
```

**Production**: Restrict to `https://aiborg-ai-web.vercel.app`

---

## Monitoring & Observability

### Metrics Tracked

- Request count by endpoint
- Error rate by endpoint
- Response time (p50, p95, p99)
- Registration conversion rate
- Email delivery rate
- Waitlist promotion rate

### Logs

- All Edge Function invocations logged
- Database queries logged (slow query log enabled)
- Email send attempts logged in `email_logs` table

### Alerts (Phase 2)

- Error rate > 5% for 5 minutes → Slack alert
- Email delivery rate < 90% → Email admin
- Session at 90% capacity → Notify admin (prepare for waitlist)

---

**Contracts Status**: ✅ Summary Complete **Detailed Contracts**: 1/7 created
(register-for-session.md) **Implementation Priority**: Create remaining contracts during /tasks
phase
