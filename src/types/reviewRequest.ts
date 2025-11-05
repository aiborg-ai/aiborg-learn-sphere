/**
 * Review Request Type Definitions
 *
 * Types for the post-session review request system where admins
 * can send review requests to participants with login notifications.
 */

export type SessionType = 'workshop' | 'free_session' | 'classroom';

export type ReviewRequestStatus = 'pending' | 'completed' | 'dismissed';

/**
 * Review Request Database Record
 */
export interface ReviewRequest {
  id: string;
  session_id: string;
  session_type: SessionType;
  user_id: string;
  requested_at: string;
  responded_at: string | null;
  review_id: string | null;
  status: ReviewRequestStatus;
  notification_id: string | null;
  reminder_count: number;
  last_reminder_sent_at: string | null;
  custom_message: string | null;
  session_title: string | null;
  session_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Session Participant Info
 * Used for displaying participants in admin panel
 */
export interface SessionParticipant {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  attendance_status?: string;
  role?: string;
  review_request_status: ReviewRequestStatus | null;
  review_request_id: string | null;
  requested_at: string | null;
  review_submitted: boolean;
}

/**
 * Session with Review Request Info
 * Extended session info for admin management
 */
export interface SessionWithReviewInfo {
  id: string;
  title: string;
  session_type: SessionType;
  session_date: string;
  status: string;
  participant_count: number;
  review_requests_sent_at: string | null;
  review_requests_count: number;
  pending_requests: number;
  completed_requests: number;
  response_rate: number;
}

/**
 * Review Request Statistics
 */
export interface ReviewRequestStats {
  session_id: string;
  session_type: SessionType;
  session_title: string | null;
  session_date: string | null;
  total_requests: number;
  pending_count: number;
  completed_count: number;
  dismissed_count: number;
  response_rate_pct: number | null;
  first_request_sent: string | null;
  last_response_received: string | null;
  avg_response_hours: number | null;
}

/**
 * Payload for sending review requests
 */
export interface SendReviewRequestPayload {
  sessionId: string;
  sessionType: SessionType;
  userIds: string[];
  customMessage?: string;
  sessionTitle: string;
  sessionDate: string;
}

/**
 * Response from send review request operation
 */
export interface SendReviewRequestResponse {
  success: boolean;
  requestsCreated: number;
  notificationsCreated: number;
  emailsSent: number;
  errors: string[];
  details?: {
    successfulUserIds: string[];
    failedUserIds: string[];
  };
}

/**
 * Pending review request for user (from helper function)
 */
export interface PendingReviewRequest {
  request_id: string;
  session_title: string | null;
  session_date: string | null;
  session_type: SessionType;
  requested_at: string;
  notification_id: string | null;
  custom_message: string | null;
}

/**
 * Review request filter options
 */
export interface ReviewRequestFilters {
  sessionType?: SessionType;
  status?: ReviewRequestStatus;
  dateFrom?: Date;
  dateTo?: Date;
  sessionId?: string;
  userId?: string;
}

/**
 * Review request with user and session details
 * For admin display
 */
export interface ReviewRequestWithDetails extends ReviewRequest {
  user_name: string | null;
  user_email: string | null;
  user_avatar: string | null;
  review_rating: number | null;
  review_created_at: string | null;
}
