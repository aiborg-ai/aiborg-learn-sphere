/**
 * useAdminChatbotAnalytics Hook
 * React Query hooks for admin-level chatbot analytics
 */

import { useQuery } from '@tanstack/react-query';
import {
  AdminAnalyticsService,
  type DateRange,
  type ChatbotMetrics,
  type ChatbotTrendData,
  type TopQuery,
} from '@/services/analytics/AdminAnalyticsService';

/**
 * Query keys for chatbot analytics
 */
export const chatbotAnalyticsKeys = {
  all: ['admin', 'chatbot-analytics'] as const,
  metrics: (dateRange: DateRange) => [...chatbotAnalyticsKeys.all, 'metrics', dateRange] as const,
  trends: (dateRange: DateRange) => [...chatbotAnalyticsKeys.all, 'trends', dateRange] as const,
  topQueries: (dateRange: DateRange, limit: number) =>
    [...chatbotAnalyticsKeys.all, 'top-queries', dateRange, limit] as const,
};

/**
 * Fetch chatbot analytics metrics
 *
 * @example
 * ```tsx
 * const { data: metrics, isLoading } = useChatbotMetrics({
 *   start: '2025-01-01',
 *   end: '2025-01-31'
 * });
 *
 * logger.info(metrics?.totalConversations);
 * logger.info(metrics?.avgSatisfaction);
 * ```
 */
export function useChatbotMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: chatbotAnalyticsKeys.metrics(dateRange),
    queryFn: () => AdminAnalyticsService.getChatbotAnalytics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(dateRange.start && dateRange.end),
  });
}

/**
 * Fetch chatbot conversation trends over time
 *
 * @example
 * ```tsx
 * const { data: trends, isLoading } = useChatbotTrends({
 *   start: '2025-01-01',
 *   end: '2025-01-31'
 * });
 *
 * // Use for line charts showing conversations over time
 * ```
 */
export function useChatbotTrends(dateRange: DateRange) {
  return useQuery({
    queryKey: chatbotAnalyticsKeys.trends(dateRange),
    queryFn: () => AdminAnalyticsService.getChatbotTrends(dateRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!(dateRange.start && dateRange.end),
  });
}

/**
 * Fetch top chatbot queries
 *
 * @example
 * ```tsx
 * const { data: topQueries } = useTopChatbotQueries(
 *   { start: '2025-01-01', end: '2025-01-31' },
 *   10
 * );
 *
 * // Use for bar chart or table showing most common queries
 * ```
 */
export function useTopChatbotQueries(dateRange: DateRange, limit: number = 10) {
  return useQuery({
    queryKey: chatbotAnalyticsKeys.topQueries(dateRange, limit),
    queryFn: () => AdminAnalyticsService.getTopQueries(dateRange, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!(dateRange.start && dateRange.end),
  });
}

/**
 * Combined hook for all chatbot analytics
 *
 * Fetches metrics, trends, and top queries in parallel
 *
 * @example
 * ```tsx
 * const analytics = useAllChatbotAnalytics(dateRange);
 *
 * if (analytics.isLoading) return <Spinner />;
 *
 * return (
 *   <>
 *     <MetricsCards metrics={analytics.metrics} />
 *     <TrendChart data={analytics.trends} />
 *     <TopQueriesTable data={analytics.topQueries} />
 *   </>
 * );
 * ```
 */
export function useAllChatbotAnalytics(dateRange: DateRange, topQueriesLimit: number = 10) {
  const metricsQuery = useChatbotMetrics(dateRange);
  const trendsQuery = useChatbotTrends(dateRange);
  const topQueriesQuery = useTopChatbotQueries(dateRange, topQueriesLimit);

  return {
    metrics: metricsQuery.data,
    trends: trendsQuery.data,
    topQueries: topQueriesQuery.data,
    isLoading: metricsQuery.isLoading || trendsQuery.isLoading || topQueriesQuery.isLoading,
    isError: metricsQuery.isError || trendsQuery.isError || topQueriesQuery.isError,
    error: metricsQuery.error || trendsQuery.error || topQueriesQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      trendsQuery.refetch();
      topQueriesQuery.refetch();
    },
  };
}

/**
 * Export chatbot analytics data
 */
export function prepareChatbotDataForExport(
  metrics: ChatbotMetrics | null,
  trends: ChatbotTrendData[] | undefined,
  topQueries: TopQuery[] | undefined,
  dateRange: DateRange
) {
  return {
    summary: {
      dateRange: `${dateRange.start} to ${dateRange.end}`,
      totalConversations: metrics?.totalConversations || 0,
      uniqueUsers: metrics?.uniqueUsers || 0,
      avgSatisfaction: metrics?.avgSatisfaction.toFixed(2) || '0.00',
      resolutionRate: `${(metrics?.resolutionRate || 0).toFixed(1)}%`,
      avgDuration: metrics?.avgDurationMinutes
        ? `${metrics.avgDurationMinutes.toFixed(1)} min`
        : '0.0 min',
    },
    trends: trends || [],
    topQueries: topQueries || [],
  };
}
