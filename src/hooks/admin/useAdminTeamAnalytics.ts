/**
 * useAdminTeamAnalytics Hook
 * React Query hooks for admin-level team analytics
 */

import { useQuery } from '@tanstack/react-query';
import {
  AdminAnalyticsService,
  type DateRange,
  type TeamMetrics,
  type TeamPerformanceData,
} from '@/services/analytics/AdminAnalyticsService';

/**
 * Query keys for team analytics
 */
export const teamAnalyticsKeys = {
  all: ['admin', 'team-analytics'] as const,
  metrics: (dateRange: DateRange) => [...teamAnalyticsKeys.all, 'metrics', dateRange] as const,
  performance: (dateRange: DateRange) =>
    [...teamAnalyticsKeys.all, 'performance', dateRange] as const,
};

/**
 * Fetch team analytics metrics
 *
 * @example
 * ```tsx
 * const { data: metrics, isLoading } = useTeamMetrics({
 *   start: '2025-01-01',
 *   end: '2025-01-31'
 * });
 *
 * logger.info(metrics?.totalTeams);
 * logger.info(metrics?.avgEngagementScore);
 * ```
 */
export function useTeamMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: teamAnalyticsKeys.metrics(dateRange),
    queryFn: () => AdminAnalyticsService.getTeamAnalytics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(dateRange.start && dateRange.end),
  });
}

/**
 * Fetch team performance data
 *
 * @example
 * ```tsx
 * const { data: performance, isLoading } = useTeamPerformance({
 *   start: '2025-01-01',
 *   end: '2025-01-31'
 * });
 *
 * // Use for bar chart comparing team performance
 * ```
 */
export function useTeamPerformance(dateRange: DateRange) {
  return useQuery({
    queryKey: teamAnalyticsKeys.performance(dateRange),
    queryFn: () => AdminAnalyticsService.getTeamPerformance(dateRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!(dateRange.start && dateRange.end),
  });
}

/**
 * Combined hook for all team analytics
 *
 * Fetches metrics and performance data in parallel
 *
 * @example
 * ```tsx
 * const analytics = useAllTeamAnalytics(dateRange);
 *
 * if (analytics.isLoading) return <Spinner />;
 *
 * return (
 *   <>
 *     <MetricsCards metrics={analytics.metrics} />
 *     <PerformanceChart data={analytics.performance} />
 *   </>
 * );
 * ```
 */
export function useAllTeamAnalytics(dateRange: DateRange) {
  const metricsQuery = useTeamMetrics(dateRange);
  const performanceQuery = useTeamPerformance(dateRange);

  return {
    metrics: metricsQuery.data,
    performance: performanceQuery.data,
    isLoading: metricsQuery.isLoading || performanceQuery.isLoading,
    isError: metricsQuery.isError || performanceQuery.isError,
    error: metricsQuery.error || performanceQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      performanceQuery.refetch();
    },
  };
}

/**
 * Export team analytics data
 */
export function prepareTeamDataForExport(
  metrics: TeamMetrics | null,
  performance: TeamPerformanceData[] | undefined,
  dateRange: DateRange
) {
  return {
    summary: {
      dateRange: `${dateRange.start} to ${dateRange.end}`,
      totalTeams: metrics?.totalTeams || 0,
      totalMembers: metrics?.totalMembers || 0,
      avgEngagementScore: metrics?.avgEngagementScore.toFixed(1) || '0.0',
      avgCompletionRate: `${(metrics?.avgCompletionRate || 0).toFixed(1)}%`,
      activeTeamsWeek: metrics?.activeTeamsWeek || 0,
    },
    performance: performance || [],
  };
}
