/**
 * useReviewRequests Hook
 *
 * Custom hook for managing review requests with real-time updates
 * Handles fetching, sending, and managing review request state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  sendReviewRequests,
  getReviewRequestsForSession,
  getReviewRequestsForUser,
  getPendingReviewRequestsForUser,
  markRequestCompleted,
  dismissRequest,
  sendReminder,
  getSessionsWithReviewInfo,
  getSessionParticipants,
  getReviewRequestStats,
} from '@/services/review/ReviewRequestService';
import type {
  SessionType,
  ReviewRequestStatus,
  ReviewRequestFilters,
  SendReviewRequestPayload,
} from '@/types/reviewRequest';

/**
 * Hook options for fetching review requests
 */
interface UseReviewRequestsOptions {
  sessionId?: string;
  sessionType?: SessionType;
  userId?: string;
  filters?: ReviewRequestFilters;
  enableRealtime?: boolean;
}

/**
 * Hook for fetching session-specific review requests
 */
export function useSessionReviewRequests(sessionId: string, sessionType: SessionType) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['review-requests', 'session', sessionId, sessionType],
    queryFn: () => getReviewRequestsForSession(sessionId, sessionType),
    enabled: !!sessionId && !!sessionType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Real-time subscription for updates
  useEffect(() => {
    if (!sessionId || !sessionType) return;

    const channel = supabase
      .channel(`review-requests-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_requests',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Invalidate query to refetch
          queryClient.invalidateQueries({
            queryKey: ['review-requests', 'session', sessionId, sessionType],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, sessionType, queryClient]);

  return query;
}

/**
 * Hook for fetching user-specific review requests
 */
export function useUserReviewRequests(userId: string, status?: ReviewRequestStatus) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['review-requests', 'user', userId, status],
    queryFn: () => getReviewRequestsForUser(userId, status),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Real-time subscription for user's review requests
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`review-requests-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_requests',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['review-requests', 'user', userId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

/**
 * Hook for fetching pending review requests (for login notification)
 */
export function usePendingReviewRequests(userId: string) {
  return useQuery({
    queryKey: ['review-requests', 'pending', userId],
    queryFn: () => getPendingReviewRequestsForUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: true,
  });
}

/**
 * Hook for fetching sessions with review info (admin dashboard)
 */
export function useSessionsWithReviewInfo(sessionType?: SessionType, status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sessions-with-review-info', sessionType, status],
    queryFn: () => getSessionsWithReviewInfo(sessionType, status),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Real-time subscription for any review request changes
  useEffect(() => {
    const channel = supabase
      .channel('review-requests-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_requests',
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['sessions-with-review-info'],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

/**
 * Hook for fetching session participants
 */
export function useSessionParticipants(sessionId: string, sessionType: SessionType) {
  return useQuery({
    queryKey: ['session-participants', sessionId, sessionType],
    queryFn: () => getSessionParticipants(sessionId, sessionType),
    enabled: !!sessionId && !!sessionType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching review request statistics
 */
export function useReviewRequestStats(filters?: ReviewRequestFilters) {
  return useQuery({
    queryKey: ['review-request-stats', filters],
    queryFn: () => getReviewRequestStats(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for sending review requests (admin action)
 */
export function useSendReviewRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: SendReviewRequestPayload) => sendReviewRequests(payload),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['review-requests'],
      });
      queryClient.invalidateQueries({
        queryKey: ['sessions-with-review-info'],
      });
      queryClient.invalidateQueries({
        queryKey: ['session-participants', variables.sessionId, variables.sessionType],
      });

      // Show success toast
      if (data.success) {
        toast({
          title: 'Review Requests Sent',
          description: `Successfully sent ${data.requestsCreated} review request(s). ${data.emailsSent} email(s) sent.`,
        });
      } else if (data.errors.length > 0) {
        toast({
          title: 'Partial Success',
          description: `Sent ${data.requestsCreated} requests, but encountered ${data.errors.length} error(s).`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Sending Review Requests',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for marking a review request as completed
 */
export function useMarkRequestCompleted() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, reviewId }: { requestId: string; reviewId: string }) =>
      markRequestCompleted(requestId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['review-requests'],
      });

      toast({
        title: 'Thank You!',
        description: 'Your review has been submitted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Submitting Review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for dismissing a review request
 */
export function useDismissRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (requestId: string) => dismissRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['review-requests'],
      });

      toast({
        title: 'Request Dismissed',
        description: 'The review request has been dismissed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Dismissing Request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for sending a reminder
 */
export function useSendReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (requestId: string) => sendReminder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['review-requests'],
      });

      toast({
        title: 'Reminder Sent',
        description: 'Review request reminder has been sent successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Sending Reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Combined hook with all review request operations
 */
export function useReviewRequests(options: UseReviewRequestsOptions = {}) {
  const { sessionId, sessionType, userId, filters, _enableRealtime = true } = options;

  // Fetch data based on options
  const sessionRequests = useSessionReviewRequests(sessionId || '', sessionType || 'free_session');
  const userRequests = useUserReviewRequests(userId || '', filters?.status);
  const pendingRequests = usePendingReviewRequests(userId || '');
  const sessionsWithInfo = useSessionsWithReviewInfo(filters?.sessionType, filters?.status);
  const stats = useReviewRequestStats(filters);

  // Mutations
  const sendRequests = useSendReviewRequests();
  const markCompleted = useMarkRequestCompleted();
  const dismiss = useDismissRequest();
  const reminder = useSendReminder();

  return {
    // Queries
    sessionRequests: sessionRequests.data || [],
    userRequests: userRequests.data || [],
    pendingRequests: pendingRequests.data || [],
    sessionsWithInfo: sessionsWithInfo.data || [],
    stats: stats.data || [],

    // Loading states
    isLoadingSession: sessionRequests.isLoading,
    isLoadingUser: userRequests.isLoading,
    isLoadingPending: pendingRequests.isLoading,
    isLoadingSessions: sessionsWithInfo.isLoading,
    isLoadingStats: stats.isLoading,

    // Error states
    sessionError: sessionRequests.error,
    userError: userRequests.error,
    pendingError: pendingRequests.error,
    sessionsError: sessionsWithInfo.error,
    statsError: stats.error,

    // Mutations
    sendReviewRequests: sendRequests.mutate,
    sendReviewRequestsAsync: sendRequests.mutateAsync,
    isSending: sendRequests.isPending,

    markRequestCompleted: markCompleted.mutate,
    markRequestCompletedAsync: markCompleted.mutateAsync,
    isMarkingCompleted: markCompleted.isPending,

    dismissRequest: dismiss.mutate,
    dismissRequestAsync: dismiss.mutateAsync,
    isDismissing: dismiss.isPending,

    sendReminder: reminder.mutate,
    sendReminderAsync: reminder.mutateAsync,
    isSendingReminder: reminder.isPending,

    // Refetch functions
    refetchSessionRequests: sessionRequests.refetch,
    refetchUserRequests: userRequests.refetch,
    refetchPendingRequests: pendingRequests.refetch,
    refetchSessions: sessionsWithInfo.refetch,
    refetchStats: stats.refetch,
  };
}
