// TypeScript types for Free Session System
// Based on database schema from migrations:
// - 20251029000100_create_free_sessions_table.sql
// - 20251029000101_create_session_registrations_table.sql
// - 20251029000102_create_waitlist_table.sql
// - 20251029000103_create_attendance_table.sql

export type SessionStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'expired';

export type RegistrationSource = 'web' | 'mobile' | 'admin' | 'api';

export type WaitlistStatus = 'waiting' | 'promoted' | 'expired' | 'declined';

export type MeetingProvider = 'jitsi' | 'google_meet' | 'zoom';

export type Currency = 'GBP' | 'USD' | 'EUR';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

// Free Session - Master table for session events
export interface FreeSession {
  id: string;

  // Event Details
  title: string;
  description: string;
  session_date: string; // ISO 8601 timestamp
  duration_minutes: number;
  timezone: string;

  // Capacity Management
  capacity: number;
  registered_count: number;
  waitlist_count: number;
  is_full: boolean; // Generated field

  // Meeting Details
  meeting_url: string | null;
  meeting_room_name: string | null;
  meeting_provider: MeetingProvider;

  // Target Audience
  target_age_min: number;
  target_age_max: number;

  // Pricing
  price_currency: Currency;
  price_amount: number;

  // Status Management
  status: SessionStatus;
  is_published: boolean;

  // Recording
  recording_url: string | null;
  recording_available_at: string | null;

  // Email Tracking
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
  post_session_email_sent: boolean;

  // Support
  support_contact: string | null;
  support_whatsapp: string;

  // Admin
  created_by: string | null; // UUID
  created_at: string;
  updated_at: string;
}

// Session Registration - User registrations for sessions
export interface SessionRegistration {
  id: string;

  // Foreign Keys
  session_id: string;
  user_id: string | null;

  // Personal Information
  full_name: string;
  email: string;
  birthdate: string; // ISO 8601 date
  age_at_registration: number; // Generated field

  // COPPA Compliance
  parent_email: string | null;
  parent_consent_given: boolean;
  parent_consent_at: string | null;

  // Registration Status
  status: RegistrationStatus;
  registration_source: RegistrationSource;

  // Notifications
  confirmation_email_sent: boolean;
  confirmation_email_sent_at: string | null;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;

  // Cancellation
  cancelled_at: string | null;
  cancelled_reason: string | null;

  // Timestamps
  registered_at: string;
  confirmed_at: string | null;
  updated_at: string;
}

// Session Waitlist - FIFO queue for waiting users
export interface SessionWaitlist {
  id: string;

  // Foreign Keys
  session_id: string;
  registration_id: string;

  // Waitlist Position (1-indexed)
  position: number;

  // Status
  status: WaitlistStatus;

  // Promotion Details
  promoted_at: string | null;
  promotion_expires_at: string | null;
  notified: boolean;
  notification_sent_at: string | null;

  // Response
  accepted_promotion: boolean | null;
  responded_at: string | null;

  // Timestamps
  joined_waitlist_at: string;
  updated_at: string;
}

// Session Attendance - Track attendance
export interface SessionAttendance {
  id: string;

  // Foreign Keys
  session_id: string;
  registration_id: string | null;
  user_id: string | null;

  // Jitsi Participant Details
  jitsi_participant_id: string | null;
  display_name: string | null;

  // Attendance Times
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null; // Generated field

  // Device Info
  device_type: DeviceType | null;
  browser: string | null;

  // Status
  still_in_session: boolean; // Generated field

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Extended types with related data

export interface SessionWithCounts extends FreeSession {
  available_spots: number;
  has_waitlist: boolean;
}

export interface SessionRegistrationWithSession extends SessionRegistration {
  session: FreeSession;
}

export interface SessionRegistrationWithWaitlist extends SessionRegistration {
  waitlist?: SessionWaitlist;
}

export interface WaitlistWithRegistration extends SessionWaitlist {
  registration: SessionRegistration;
}

// Form types for creating/updating

export interface CreateSessionInput {
  title: string;
  description: string;
  session_date: string;
  duration_minutes: number;
  timezone: string;
  capacity: number;
  target_age_min: number;
  target_age_max: number;
  price_currency?: Currency;
  price_amount?: number;
  meeting_provider?: MeetingProvider;
  support_contact?: string;
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {
  status?: SessionStatus;
  is_published?: boolean;
  meeting_url?: string;
  meeting_room_name?: string;
  recording_url?: string;
}

export interface CreateRegistrationInput {
  session_id: string;
  full_name: string;
  email: string;
  birthdate: string;
  parent_email?: string;
  parent_consent_given?: boolean;
}

export interface UpdateRegistrationInput {
  status?: RegistrationStatus;
  cancelled_reason?: string;
}

// API Response types

export interface SessionListResponse {
  sessions: FreeSession[];
  total: number;
  page: number;
  per_page: number;
}

export interface RegistrationResponse {
  registration: SessionRegistration;
  waitlist?: SessionWaitlist;
  message: string;
}

export interface WaitlistPromotionResponse {
  success: boolean;
  promoted_count: number;
  promotions: Array<{
    registration_id: string;
    email: string;
    position: number;
  }>;
}
