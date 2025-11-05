/**
 * Review Request Service
 *
 * Service for managing review requests from admins to session participants.
 * Handles CRUD operations, status updates, and bulk operations.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ReviewRequest,
  SessionType,
  ReviewRequestStatus,
  SendReviewRequestPayload,
  SendReviewRequestResponse,
  SessionParticipant,
  SessionWithReviewInfo,
  ReviewRequestFilters,
  ReviewRequestWithDetails,
} from '@/types/reviewRequest';

/**
 * Send review requests to session participants
 */
export async function sendReviewRequests(
  payload: SendReviewRequestPayload
): Promise<SendReviewRequestResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-review-request', {
      body: payload,
    });

    if (error) {
      logger.error('Error invoking send-review-request function:', error);
      return {
        success: false,
        requestsCreated: 0,
        notificationsCreated: 0,
        emailsSent: 0,
        errors: [error.message],
      };
    }

    return data as SendReviewRequestResponse;
  } catch (error) {
    logger.error('Error sending review requests:', error);
    return {
      success: false,
      requestsCreated: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      errors: [(error as Error).message],
    };
  }
}

/**
 * Get review requests for a specific session
 */
export async function getReviewRequestsForSession(
  sessionId: string,
  sessionType: SessionType
): Promise<ReviewRequestWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('review_requests')
      .select(
        `
        *,
        profiles!review_requests_user_id_fkey (
          display_name,
          email,
          avatar_url
        ),
        reviews (
          rating,
          created_at
        )
      `
      )
      .eq('session_id', sessionId)
      .eq('session_type', sessionType)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return (
      data?.map(item => ({
        ...item,
        user_name: item.profiles?.display_name || null,
        user_email: item.profiles?.email || null,
        user_avatar: item.profiles?.avatar_url || null,
        review_rating: item.reviews?.[0]?.rating || null,
        review_created_at: item.reviews?.[0]?.created_at || null,
      })) || []
    );
  } catch (error) {
    logger.error('Error fetching review requests for session:', error);
    return [];
  }
}

/**
 * Get review requests for a specific user
 */
export async function getReviewRequestsForUser(
  userId: string,
  status?: ReviewRequestStatus
): Promise<ReviewRequest[]> {
  try {
    let query = supabase
      .from('review_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error fetching review requests for user:', error);
    return [];
  }
}

/**
 * Get pending review requests for a user (for login notification)
 */
export async function getPendingReviewRequestsForUser(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_pending_review_requests', {
      p_user_id: userId,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error fetching pending review requests:', error);
    return [];
  }
}

/**
 * Mark a review request as completed
 */
export async function markRequestCompleted(requestId: string, reviewId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('review_requests')
      .update({
        status: 'completed',
        review_id: reviewId,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw error;

    // Mark associated notification as read
    await markNotificationRead(requestId);

    return true;
  } catch (error) {
    logger.error('Error marking request as completed:', error);
    return false;
  }
}

/**
 * Dismiss a review request
 */
export async function dismissRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('review_requests')
      .update({
        status: 'dismissed',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw error;

    // Mark associated notification as read
    await markNotificationRead(requestId);

    return true;
  } catch (error) {
    logger.error('Error dismissing request:', error);
    return false;
  }
}

/**
 * Send reminder for a review request
 */
export async function sendReminder(requestId: string): Promise<boolean> {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await supabase
      .from('review_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;
    if (!request) return false;

    // Send reminder via edge function
    const { error: sendError } = await supabase.functions.invoke('send-review-request', {
      body: {
        sessionId: request.session_id,
        sessionType: request.session_type,
        userIds: [request.user_id],
        customMessage: request.custom_message,
        sessionTitle: request.session_title,
        sessionDate: request.session_date,
        isReminder: true,
      },
    });

    if (sendError) throw sendError;

    // Update reminder count
    const { error: updateError } = await supabase
      .from('review_requests')
      .update({
        reminder_count: request.reminder_count + 1,
        last_reminder_sent_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    logger.error('Error sending reminder:', error);
    return false;
  }
}

/**
 * Get sessions with review request info (for admin dashboard)
 */
export async function getSessionsWithReviewInfo(
  sessionType?: SessionType,
  status?: string
): Promise<SessionWithReviewInfo[]> {
  try {
    const sessions: SessionWithReviewInfo[] = [];

    if (!sessionType || sessionType === 'workshop') {
      const { data: workshopData } = await supabase
        .from('workshop_sessions')
        .select(
          `
          id,
          session_name,
          scheduled_start,
          status,
          review_requests_sent_at,
          review_requests_count
        `
        )
        .eq('status', status || 'completed')
        .order('scheduled_start', { ascending: false });

      if (workshopData) {
        for (const session of workshopData) {
          const { count } = await supabase
            .from('workshop_participants')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          const { data: requests } = await supabase
            .from('review_requests')
            .select('status')
            .eq('session_id', session.id)
            .eq('session_type', 'workshop');

          const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
          const completedCount = requests?.filter(r => r.status === 'completed').length || 0;
          const totalRequests = requests?.length || 0;

          sessions.push({
            id: session.id,
            title: session.session_name || 'Workshop Session',
            session_type: 'workshop',
            session_date: session.scheduled_start,
            status: session.status,
            participant_count: count || 0,
            review_requests_sent_at: session.review_requests_sent_at,
            review_requests_count: session.review_requests_count,
            pending_requests: pendingCount,
            completed_requests: completedCount,
            response_rate: totalRequests > 0 ? (completedCount / totalRequests) * 100 : 0,
          });
        }
      }
    }

    if (!sessionType || sessionType === 'free_session') {
      const { data: freeSessionData } = await supabase
        .from('free_sessions')
        .select(
          `
          id,
          title,
          session_date,
          status,
          review_requests_sent_at,
          review_requests_count,
          registered_count
        `
        )
        .eq('status', status || 'completed')
        .order('session_date', { ascending: false });

      if (freeSessionData) {
        for (const session of freeSessionData) {
          const { data: requests } = await supabase
            .from('review_requests')
            .select('status')
            .eq('session_id', session.id)
            .eq('session_type', 'free_session');

          const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
          const completedCount = requests?.filter(r => r.status === 'completed').length || 0;
          const totalRequests = requests?.length || 0;

          sessions.push({
            id: session.id,
            title: session.title,
            session_type: 'free_session',
            session_date: session.session_date,
            status: session.status,
            participant_count: session.registered_count || 0,
            review_requests_sent_at: session.review_requests_sent_at,
            review_requests_count: session.review_requests_count,
            pending_requests: pendingCount,
            completed_requests: completedCount,
            response_rate: totalRequests > 0 ? (completedCount / totalRequests) * 100 : 0,
          });
        }
      }
    }

    return sessions.sort(
      (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );
  } catch (error) {
    logger.error('Error fetching sessions with review info:', error);
    return [];
  }
}

/**
 * Get participants for a session
 */
export async function getSessionParticipants(
  sessionId: string,
  sessionType: SessionType
): Promise<SessionParticipant[]> {
  try {
    let participants: SessionParticipant[] = [];

    if (sessionType === 'workshop') {
      const { data } = await supabase
        .from('workshop_participants')
        .select(
          `
          user_id,
          role,
          attendance_status,
          profiles!workshop_participants_user_id_fkey (
            display_name,
            email
          )
        `
        )
        .eq('session_id', sessionId);

      if (data) {
        participants = data.map(p => ({
          user_id: p.user_id,
          user_name: p.profiles?.display_name || null,
          user_email: p.profiles?.email || null,
          attendance_status: p.attendance_status,
          role: p.role,
          review_request_status: null,
          review_request_id: null,
          requested_at: null,
          review_submitted: false,
        }));
      }
    } else if (sessionType === 'free_session') {
      const { data } = await supabase
        .from('session_registrations')
        .select('user_id, full_name, email, status')
        .eq('session_id', sessionId)
        .eq('status', 'confirmed');

      if (data) {
        participants = data.map(p => ({
          user_id: p.user_id,
          user_name: p.full_name,
          user_email: p.email,
          attendance_status: p.status,
          review_request_status: null,
          review_request_id: null,
          requested_at: null,
          review_submitted: false,
        }));
      }
    }

    // Fetch review request status for each participant
    if (participants.length > 0) {
      const { data: requests } = await supabase
        .from('review_requests')
        .select('user_id, id, status, requested_at, review_id')
        .eq('session_id', sessionId)
        .eq('session_type', sessionType);

      if (requests) {
        participants = participants.map(p => {
          const request = requests.find(r => r.user_id === p.user_id);
          return {
            ...p,
            review_request_status: request?.status || null,
            review_request_id: request?.id || null,
            requested_at: request?.requested_at || null,
            review_submitted: !!request?.review_id,
          };
        });
      }
    }

    return participants;
  } catch (error) {
    logger.error('Error fetching session participants:', error);
    return [];
  }
}

/**
 * Helper: Mark notification as read
 */
async function markNotificationRead(requestId: string): Promise<void> {
  try {
    const { data: request } = await supabase
      .from('review_requests')
      .select('notification_id')
      .eq('id', requestId)
      .single();

    if (request?.notification_id) {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', request.notification_id);
    }
  } catch (error) {
    logger.error('Error marking notification as read:', error);
  }
}

/**
 * Get review request statistics
 */
export async function getReviewRequestStats(filters?: ReviewRequestFilters) {
  try {
    let query = supabase.from('review_request_stats').select('*');

    if (filters?.sessionType) {
      query = query.eq('session_type', filters.sessionType);
    }

    if (filters?.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error fetching review request stats:', error);
    return [];
  }
}
