# Data Model: Free Introductory AI Session

**Feature**: 001-create-a-free **Date**: 2025-10-29 **Status**: Design Complete

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  free_sessions  │
│  (Event master) │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴───────────────┐
│ session_registrations  │
│  (User registrations)  │
└────────┬───────────────┘
         │ 1
         │
         │
    ┌────┴──────┐
    │ N       N │
┌───┴────────┐ ┌┴──────────────┐
│  session_  │ │    session_   │
│ waitlist   │ │   attendance  │
│ (Queue)    │ │  (Tracking)   │
└────────────┘ └───────────────┘

         ┌────────────────┐
         │   email_logs   │
         │  (Audit trail) │
         └────────────────┘
```

---

## 1. free_sessions

**Purpose**: Master table for free introductory session events

**Attributes**:

```sql
CREATE TABLE public.free_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT NOT NULL CHECK (length(description) >= 10),
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90 CHECK (duration_minutes > 0),
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Capacity Management
  capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity > 0 AND capacity <= 500),
  registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  waitlist_count INTEGER NOT NULL DEFAULT 0 CHECK (waitlist_count >= 0),
  is_full BOOLEAN GENERATED ALWAYS AS (registered_count >= capacity) STORED,

  -- Meeting Details
  meeting_url TEXT,
  meeting_room_name TEXT,
  meeting_provider TEXT DEFAULT 'jitsi' CHECK (meeting_provider IN ('jitsi', 'google_meet', 'zoom')),

  -- Target Audience
  target_age_min INTEGER NOT NULL DEFAULT 9 CHECK (target_age_min >= 0),
  target_age_max INTEGER NOT NULL DEFAULT 18 CHECK (target_age_max >= target_age_min),

  -- Pricing
  price_currency TEXT NOT NULL DEFAULT 'GBP' CHECK (price_currency IN ('GBP', 'USD', 'EUR')),
  price_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_amount >= 0),

  -- Status Management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  -- Recording (future use)
  recording_url TEXT,
  recording_available_at TIMESTAMPTZ,

  -- Email Tracking
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  post_session_email_sent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Support
  support_contact TEXT,
  support_whatsapp TEXT DEFAULT '+44 7404568207',

  -- Admin
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_session_date CHECK (session_date > created_at),
  CONSTRAINT valid_age_range CHECK (target_age_max > target_age_min),
  CONSTRAINT published_requires_meeting CHECK (
    is_published = FALSE OR (meeting_url IS NOT NULL AND meeting_room_name IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_free_sessions_status ON public.free_sessions(status) WHERE is_published = TRUE;
CREATE INDEX idx_free_sessions_date ON public.free_sessions(session_date) WHERE status IN ('scheduled', 'in_progress');
CREATE INDEX idx_free_sessions_reminders ON public.free_sessions(session_date, reminder_24h_sent, reminder_1h_sent);

-- Updated at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.free_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

**Relationships**:

- One session → Many registrations (1:N)
- One session → Many waitlist entries (1:N)
- One session → Many attendance records (1:N)

**Business Rules**:

- Only one active free session can be published at a time (application-level enforcement)
- Session must have meeting URL before publishing
- `registered_count` updated via trigger when registrations inserted/updated
- Cannot delete session if registrations exist (enforce via FK with ON DELETE RESTRICT)

---

## 2. session_registrations

**Purpose**: User registrations for free sessions (both confirmed and waitlisted)

**Attributes**:

```sql
CREATE TABLE public.session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID NOT NULL REFERENCES public.free_sessions(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Optional: for logged-in users

  -- Personal Information
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  birthdate DATE NOT NULL,
  age_at_registration INTEGER GENERATED ALWAYS AS (
    DATE_PART('year', AGE(birthdate))
  ) STORED,

  -- COPPA Compliance
  parent_email TEXT CHECK (
    parent_email IS NULL OR
    parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  parent_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  parent_consent_at TIMESTAMPTZ,

  -- Registration Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'waitlisted', 'cancelled', 'expired')
  ),
  registration_source TEXT DEFAULT 'web' CHECK (
    registration_source IN ('web', 'mobile', 'admin', 'api')
  ),

  -- Notifications
  confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  confirmation_email_sent_at TIMESTAMPTZ,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  -- Timestamps
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_email_per_session UNIQUE (session_id, email),
  CONSTRAINT require_parent_email_if_under_13 CHECK (
    (age_at_registration >= 13) OR
    (parent_email IS NOT NULL AND parent_consent_given = TRUE)
  ),
  CONSTRAINT confirmed_requires_timestamp CHECK (
    (status != 'confirmed') OR (confirmed_at IS NOT NULL)
  ),
  CONSTRAINT cancelled_requires_timestamp CHECK (
    (status != 'cancelled') OR (cancelled_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_registrations_session ON public.session_registrations(session_id, status);
CREATE INDEX idx_registrations_email ON public.session_registrations(email);
CREATE INDEX idx_registrations_user ON public.session_registrations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_registrations_pending_consent ON public.session_registrations(parent_email)
  WHERE age_at_registration < 13 AND parent_consent_given = FALSE;

-- Trigger: Update free_sessions.registered_count
CREATE OR REPLACE FUNCTION update_session_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    -- Increment count
    UPDATE public.free_sessions
    SET registered_count = registered_count + 1
    WHERE id = NEW.session_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status != 'confirmed') OR
        (TG_OP = 'DELETE' AND OLD.status = 'confirmed') THEN
    -- Decrement count
    UPDATE public.free_sessions
    SET registered_count = registered_count - 1
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registered_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.session_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_session_registered_count();

-- Trigger: Update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.session_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

**Relationships**:

- Many registrations → One session (N:1)
- One registration → One user (optional, 1:1)
- One registration → Zero or one waitlist entry (1:0..1)
- One registration → Many attendance records (1:N)

**Business Rules**:

- Email must be unique per session (cannot register twice)
- Under-13 users require parent email and consent
- Status transitions: `pending` → `confirmed` or `waitlisted` → `cancelled` or `expired`
- Cannot change status from `cancelled` or `expired` back to active states

**State Transitions**:

```
pending ──────────┬──────────> confirmed
                  └──────────> waitlisted ──────> confirmed
                  └──────────> cancelled
                  └──────────> expired
```

---

## 3. session_waitlist

**Purpose**: FIFO queue for users waiting for session spots

**Attributes**:

```sql
CREATE TABLE public.session_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID NOT NULL REFERENCES public.free_sessions(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.session_registrations(id) ON DELETE CASCADE,

  -- Waitlist Position (1-indexed)
  position INTEGER NOT NULL CHECK (position > 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (
    status IN ('waiting', 'promoted', 'expired', 'declined')
  ),

  -- Promotion Details
  promoted_at TIMESTAMPTZ,
  promotion_expires_at TIMESTAMPTZ,  -- 24 hours after promotion
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  -- Response
  accepted_promotion BOOLEAN,
  responded_at TIMESTAMPTZ,

  -- Timestamps
  joined_waitlist_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_registration_waitlist UNIQUE (registration_id),
  CONSTRAINT promoted_requires_timestamp CHECK (
    (status != 'promoted') OR (promoted_at IS NOT NULL)
  ),
  CONSTRAINT response_requires_timestamp CHECK (
    (accepted_promotion IS NULL) OR (responded_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_waitlist_session_position ON public.session_waitlist(session_id, position)
  WHERE status = 'waiting';
CREATE INDEX idx_waitlist_session_status ON public.session_waitlist(session_id, status);
CREATE INDEX idx_waitlist_expired_promotions ON public.session_waitlist(promotion_expires_at)
  WHERE status = 'promoted' AND accepted_promotion IS NULL;

-- Trigger: Assign position on insert
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Get next position in queue
  SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
  FROM public.session_waitlist
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_position
  BEFORE INSERT ON public.session_waitlist
  FOR EACH ROW
  WHEN (NEW.position IS NULL)
  EXECUTE FUNCTION assign_waitlist_position();

-- Trigger: Update free_sessions.waitlist_count
CREATE OR REPLACE FUNCTION update_session_waitlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.free_sessions
    SET waitlist_count = waitlist_count + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.free_sessions
    SET waitlist_count = waitlist_count - 1
    WHERE id = OLD.session_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'waiting' AND NEW.status != 'waiting' THEN
    UPDATE public.free_sessions
    SET waitlist_count = waitlist_count - 1
    WHERE id = NEW.session_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waitlist_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.session_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_session_waitlist_count();

-- Trigger: Updated at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.session_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

**Relationships**:

- Many waitlist entries → One session (N:1)
- One waitlist entry → One registration (1:1)

**Business Rules**:

- Position automatically assigned on insert (next available number)
- FIFO promotion: lowest position number promoted first
- Promotion expires after 24 hours if not accepted
- Position numbers do NOT shift when users are promoted/removed (maintain creation order)

**Promotion Algorithm**:

```sql
-- Find next user to promote (in Edge Function)
SELECT wl.id, wl.registration_id, wl.position
FROM session_waitlist wl
WHERE wl.session_id = $1
  AND wl.status = 'waiting'
ORDER BY wl.position ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;  -- Prevent race conditions
```

---

## 4. session_attendance

**Purpose**: Track who joined the session and for how long

**Attributes**:

```sql
CREATE TABLE public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID NOT NULL REFERENCES public.free_sessions(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.session_registrations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Jitsi Participant Details
  jitsi_participant_id TEXT,  -- From Jitsi API
  display_name TEXT,          -- Name shown in meeting

  -- Attendance Times
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN left_at IS NOT NULL THEN EXTRACT(EPOCH FROM (left_at - joined_at))::INTEGER
      ELSE NULL
    END
  ) STORED,

  -- Device Info (optional)
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,

  -- Status
  still_in_session BOOLEAN GENERATED ALWAYS AS (left_at IS NULL) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_attendance_times CHECK (left_at IS NULL OR left_at > joined_at)
);

-- Indexes
CREATE INDEX idx_attendance_session ON public.session_attendance(session_id, joined_at DESC);
CREATE INDEX idx_attendance_registration ON public.session_attendance(registration_id);
CREATE INDEX idx_attendance_active ON public.session_attendance(session_id)
  WHERE left_at IS NULL;

-- Trigger: Updated at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.session_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

**Relationships**:

- Many attendance records → One session (N:1)
- Many attendance records → One registration (N:1, one user might join multiple times)

**Business Rules**:

- One user can have multiple attendance records (e.g., rejoins after disconnect)
- Duration calculated automatically when user leaves
- Null `left_at` means user still in session or tracking failed

**Analytics Queries**:

```sql
-- Total unique attendees
SELECT COUNT(DISTINCT registration_id) FROM session_attendance WHERE session_id = $1;

-- Average session duration
SELECT AVG(duration_seconds) / 60 AS avg_minutes FROM session_attendance WHERE session_id = $1;

-- Attendance rate
SELECT
  COUNT(DISTINCT sa.registration_id)::FLOAT /
  COUNT(DISTINCT sr.id) * 100 AS attendance_percentage
FROM session_registrations sr
LEFT JOIN session_attendance sa ON sa.registration_id = sr.id
WHERE sr.session_id = $1 AND sr.status = 'confirmed';
```

---

## 5. email_logs

**Purpose**: Audit trail for all emails sent (compliance, debugging, analytics)

**Attributes**:

```sql
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  session_id UUID REFERENCES public.free_sessions(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES public.session_registrations(id) ON DELETE SET NULL,

  -- Email Details
  email_type TEXT NOT NULL CHECK (
    email_type IN (
      'confirmation',
      'waitlist_promotion',
      'reminder_24h',
      'reminder_1h',
      'post_session',
      'parent_consent',
      'cancellation',
      'admin_notification'
    )
  ),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,

  -- Resend Integration
  resend_email_id TEXT,  -- Resend's email ID
  resend_status TEXT CHECK (
    resend_status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')
  ),

  -- Delivery Tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,

  -- Metadata
  template_version TEXT,
  locale TEXT DEFAULT 'en-GB',

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_logs_session ON public.email_logs(session_id, email_type);
CREATE INDEX idx_email_logs_registration ON public.email_logs(registration_id);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_resend ON public.email_logs(resend_email_id) WHERE resend_email_id IS NOT NULL;
CREATE INDEX idx_email_logs_status ON public.email_logs(resend_status, sent_at DESC);
CREATE INDEX idx_email_logs_failures ON public.email_logs(sent_at DESC)
  WHERE resend_status IN ('bounced', 'failed');

-- No foreign key constraints on registrations to preserve logs even after deletion
```

**Relationships**:

- Many emails → One session (N:1, optional)
- Many emails → One registration (N:1, optional)
- Soft relationship: logs preserved even if session/registration deleted

**Business Rules**:

- Immutable: emails never updated, only inserted
- Resend webhook updates delivery status
- Retain logs for 2 years for compliance (application-level archival)

**Analytics Queries**:

```sql
-- Email delivery rate
SELECT
  email_type,
  COUNT(*) AS sent,
  COUNT(delivered_at) AS delivered,
  ROUND(100.0 * COUNT(delivered_at) / COUNT(*), 2) AS delivery_rate
FROM email_logs
WHERE session_id = $1
GROUP BY email_type;

-- Bounce investigation
SELECT recipient_email, bounce_reason, COUNT(*)
FROM email_logs
WHERE resend_status = 'bounced'
GROUP BY recipient_email, bounce_reason
ORDER BY COUNT(*) DESC;
```

---

## Row Level Security (RLS) Policies

### free_sessions

```sql
-- Enable RLS
ALTER TABLE public.free_sessions ENABLE ROW LEVEL SECURITY;

-- Public can view published sessions
CREATE POLICY "Public can view published sessions"
  ON public.free_sessions
  FOR SELECT
  USING (is_published = TRUE AND status IN ('scheduled', 'in_progress'));

-- Authenticated users can view all published
CREATE POLICY "Authenticated can view all published"
  ON public.free_sessions
  FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage sessions"
  ON public.free_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### session_registrations

```sql
ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
  ON public.session_registrations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can insert their own registrations
CREATE POLICY "Users can register"
  ON public.session_registrations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (TRUE);  -- Validation in Edge Function

-- Users can cancel their own registrations
CREATE POLICY "Users can cancel own registrations"
  ON public.session_registrations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    status = 'cancelled' AND cancelled_at IS NOT NULL
  );

-- Admins can manage all
CREATE POLICY "Admins can manage registrations"
  ON public.session_registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### session_waitlist

```sql
ALTER TABLE public.session_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist status
CREATE POLICY "Users can view own waitlist status"
  ON public.session_waitlist
  FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM session_registrations WHERE user_id = auth.uid()
    )
  );

-- Service role can manage (Edge Functions)
-- (handled via service_role key, bypasses RLS)
```

### session_attendance

```sql
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance"
  ON public.session_attendance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage (Edge Functions handle writes)
```

### email_logs

```sql
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can insert (Edge Functions)
```

---

## Helper Functions

```sql
-- Calculate age from birthdate
CREATE OR REPLACE FUNCTION calculate_age(birthdate DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN DATE_PART('year', AGE(birthdate));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if session is full
CREATE OR REPLACE FUNCTION is_session_full(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INTEGER;
  v_registered INTEGER;
BEGIN
  SELECT capacity, registered_count
  INTO v_capacity, v_registered
  FROM free_sessions
  WHERE id = p_session_id;

  RETURN v_registered >= v_capacity;
END;
$$ LANGUAGE plpgsql STABLE;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Migration Files

These entities will be created via the following migration files:

1. `20251029000100_create_free_sessions_table.sql` → `free_sessions` table
2. `20251029000101_create_session_registrations_table.sql` → `session_registrations` + triggers
3. `20251029000102_create_waitlist_table.sql` → `session_waitlist` + triggers
4. `20251029000103_create_attendance_table.sql` → `session_attendance`
5. `20251029000104_create_email_logs_table.sql` → `email_logs`
6. `20251029000105_create_rls_policies.sql` → All RLS policies + helper functions

---

## Validation Rules Summary

| Field                   | Validation                                                           |
| ----------------------- | -------------------------------------------------------------------- |
| **Email**               | RFC 5322 regex pattern                                               |
| **Age**                 | Calculated from birthdate, 9-18 warning, <13 requires parent consent |
| **Capacity**            | 1-500 (prevents abuse)                                               |
| **Session Date**        | Must be future date                                                  |
| **Parent Email**        | Required if age < 13, must be valid email                            |
| **Waitlist Position**   | Auto-assigned, immutable                                             |
| **Registration Status** | State machine enforced (see diagram)                                 |

---

## Performance Considerations

**Indexed Columns**:

- `free_sessions.status` + `is_published` (filtered queries)
- `session_registrations.session_id` + `status` (registration lookups)
- `session_waitlist.session_id` + `position` (promotion queries)
- `email_logs.session_id` + `email_type` (analytics)

**Expected Query Performance** (at scale):

- Find active session: <5ms (1 row, indexed)
- Register user: <50ms (insert + triggers)
- Promote from waitlist: <100ms (transaction with locks)
- Fetch session stats: <20ms (indexed aggregation)

**Scalability**:

- Design supports 100+ sessions/month
- Up to 50,000 registrations/month
- Email logs partition by month if volume exceeds 100k/month

---

**Data Model Status**: ✅ Complete **Ready for Contract Generation**: ✅ Yes **Database
Migrations**: Ready to implement
