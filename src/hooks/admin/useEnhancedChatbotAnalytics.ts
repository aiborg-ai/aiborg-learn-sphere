/**
 * Enhanced Chatbot Analytics Hooks
 * React Query hooks for chatbot session, topic, sentiment, and feedback analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EnhancedChatbotAnalyticsService,
  type DateRangeParams,
} from '@/services/EnhancedChatbotAnalyticsService';
import type { ChatbotTopic } from '@/types';

// Query keys for cache management
export const enhancedChatbotKeys = {
  all: ['enhanced-chatbot'] as const,
  sessions: () => [...enhancedChatbotKeys.all, 'sessions'] as const,
  sessionAnalytics: (params: DateRangeParams) =>
    [...enhancedChatbotKeys.sessions(), 'analytics', params] as const,
  userSessions: (userId: string, params: object) =>
    [...enhancedChatbotKeys.sessions(), 'user', userId, params] as const,
  topics: () => [...enhancedChatbotKeys.all, 'topics'] as const,
  topicAnalytics: (params: DateRangeParams) =>
    [...enhancedChatbotKeys.topics(), 'analytics', params] as const,
  sentiment: (params: DateRangeParams) =>
    [...enhancedChatbotKeys.all, 'sentiment', params] as const,
  feedback: () => [...enhancedChatbotKeys.all, 'feedback'] as const,
  feedbackSummary: (params: DateRangeParams) =>
    [...enhancedChatbotKeys.feedback(), 'summary', params] as const,
  userFeedback: (userId: string, params: object) =>
    [...enhancedChatbotKeys.feedback(), 'user', userId, params] as const,
  dashboard: (params: DateRangeParams) =>
    [...enhancedChatbotKeys.all, 'dashboard', params] as const,
  summary: (params: DateRangeParams) => [...enhancedChatbotKeys.all, 'summary', params] as const,
};

// ============================================================================
// Session Hooks
// ============================================================================

/**
 * Get session analytics
 */
export function useSessionAnalytics(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.sessionAnalytics(params),
    queryFn: () => EnhancedChatbotAnalyticsService.getSessionAnalytics(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get user sessions
 */
export function useUserSessions(userId: string, params: object = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.userSessions(userId, params),
    queryFn: () => EnhancedChatbotAnalyticsService.getUserSessions(userId, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!userId,
  });
}

/**
 * Create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      deviceType,
      userAgent,
    }: {
      userId: string;
      deviceType?: 'mobile' | 'tablet' | 'desktop';
      userAgent?: string;
    }) => EnhancedChatbotAnalyticsService.createSession(userId, deviceType, userAgent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.sessions() });
    },
  });
}

/**
 * Get or create active session
 */
export function useGetOrCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      deviceType,
      userAgent,
    }: {
      userId: string;
      deviceType?: 'mobile' | 'tablet' | 'desktop';
      userAgent?: string;
    }) => EnhancedChatbotAnalyticsService.getOrCreateSession(userId, deviceType, userAgent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.sessions() });
    },
  });
}

/**
 * Update session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      updates,
    }: {
      sessionId: string;
      updates: {
        messageCount?: number;
        totalTokens?: number;
        totalCost?: number;
      };
    }) => EnhancedChatbotAnalyticsService.updateSession(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.sessions() });
    },
  });
}

/**
 * Close session
 */
export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => EnhancedChatbotAnalyticsService.closeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.sessions() });
    },
  });
}

/**
 * Close inactive sessions
 */
export function useCloseInactiveSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => EnhancedChatbotAnalyticsService.closeInactiveSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.sessions() });
    },
  });
}

// ============================================================================
// Topic Hooks
// ============================================================================

/**
 * Get all topics
 */
export function useTopics(params: { parentTopicId?: string; includeChildren?: boolean } = {}) {
  return useQuery({
    queryKey: [...enhancedChatbotKeys.topics(), params],
    queryFn: () => EnhancedChatbotAnalyticsService.getTopics(params),
    staleTime: 1000 * 60 * 15, // 15 minutes (topics change infrequently)
  });
}

/**
 * Get topic analytics
 */
export function useTopicAnalytics(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.topicAnalytics(params),
    queryFn: () => EnhancedChatbotAnalyticsService.getTopicAnalytics(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create topic
 */
export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topic: {
      name: string;
      description?: string;
      keywords?: string[];
      parentTopicId?: string;
      color?: string;
    }) => EnhancedChatbotAnalyticsService.createTopic(topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.topics() });
    },
  });
}

/**
 * Update topic
 */
export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      topicId,
      updates,
    }: {
      topicId: string;
      updates: Partial<Omit<ChatbotTopic, 'id' | 'created_at' | 'updated_at'>>;
    }) => EnhancedChatbotAnalyticsService.updateTopic(topicId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.topics() });
    },
  });
}

/**
 * Delete topic
 */
export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicId: string) => EnhancedChatbotAnalyticsService.deleteTopic(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.topics() });
    },
  });
}

/**
 * Auto-categorize message
 */
export function useAutoCategorizeMessage() {
  return useMutation({
    mutationFn: (messageText: string) =>
      EnhancedChatbotAnalyticsService.autoCategorizeMessage(messageText),
  });
}

// ============================================================================
// Sentiment Hooks
// ============================================================================

/**
 * Get sentiment analytics
 */
export function useSentimentAnalytics(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.sentiment(params),
    queryFn: () => EnhancedChatbotAnalyticsService.getSentimentAnalytics(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Update message sentiment
 */
export function useUpdateMessageSentiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, sentimentScore }: { messageId: string; sentimentScore: number }) =>
      EnhancedChatbotAnalyticsService.updateMessageSentiment(messageId, sentimentScore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.sentiment({}) });
    },
  });
}

// ============================================================================
// Feedback Hooks
// ============================================================================

/**
 * Get feedback summary
 */
export function useFeedbackSummary(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.feedbackSummary(params),
    queryFn: () => EnhancedChatbotAnalyticsService.getFeedbackSummary(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get user feedback
 */
export function useUserFeedback(userId: string, params: object = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.userFeedback(userId, params),
    queryFn: () => EnhancedChatbotAnalyticsService.getUserFeedback(userId, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!userId,
  });
}

/**
 * Submit message feedback
 */
export function useSubmitMessageFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedback: {
      messageId?: string;
      sessionId?: string;
      userId: string;
      rating: number;
      feedbackType: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'perfect';
      comment?: string;
    }) => EnhancedChatbotAnalyticsService.submitMessageFeedback(feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.feedback() });
    },
  });
}

/**
 * Update feedback
 */
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      feedbackId,
      updates,
    }: {
      feedbackId: string;
      updates: {
        rating?: number;
        feedbackType?: 'helpful' | 'not_helpful' | 'incorrect' | 'incomplete' | 'perfect';
        comment?: string;
      };
    }) => EnhancedChatbotAnalyticsService.updateFeedback(feedbackId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enhancedChatbotKeys.feedback() });
    },
  });
}

// ============================================================================
// Combined Analytics Hooks
// ============================================================================

/**
 * Get comprehensive dashboard data
 */
export function useChatbotDashboard(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.dashboard(params),
    queryFn: () => EnhancedChatbotAnalyticsService.getDashboardData(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get summary statistics
 */
export function useChatbotSummaryStats(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: enhancedChatbotKeys.summary(params),
    queryFn: () => EnhancedChatbotAnalyticsService.getSummaryStats(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate date range for common periods
 */
export function getDateRange(
  period: 'today' | '7d' | '30d' | '90d' | 'ytd' | 'all'
): DateRangeParams {
  const now = new Date();
  const endDate = now;
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
      return {}; // No date filter
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }

  return { startDate, endDate };
}
