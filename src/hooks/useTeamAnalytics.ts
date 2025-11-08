/**
 * useTeamAnalytics Hook
 *
 * React Query hooks for team analytics and reporting
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TeamAnalyticsService } from '@/services/team';
import type {} from '@/services/team/types';

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (orgId: string) => [...analyticsKeys.all, 'summary', orgId] as const,
  cached: (orgId: string) => [...analyticsKeys.all, 'cached', orgId] as const,
  members: (orgId: string, filters?: unknown) =>
    [...analyticsKeys.all, 'members', orgId, filters] as const,
  member: (orgId: string, userId: string) =>
    [...analyticsKeys.all, 'member', orgId, userId] as const,
  trends: (orgId: string, days?: number) => [...analyticsKeys.all, 'trends', orgId, days] as const,
  topPerformers: (orgId: string, limit?: number) =>
    [...analyticsKeys.all, 'topPerformers', orgId, limit] as const,
  departments: (orgId: string) => [...analyticsKeys.all, 'departments', orgId] as const,
  courses: (orgId: string, limit?: number) =>
    [...analyticsKeys.all, 'courses', orgId, limit] as const,
  velocity: (orgId: string, months?: number) =>
    [...analyticsKeys.all, 'velocity', orgId, months] as const,
  engagement: (orgId: string) => [...analyticsKeys.all, 'engagement', orgId] as const,
  comprehensive: (orgId: string) => [...analyticsKeys.all, 'comprehensive', orgId] as const,
  // Enhanced analytics keys
  skillsGap: (orgId: string, dept?: string) =>
    [...analyticsKeys.all, 'skillsGap', orgId, dept] as const,
  momentum: (orgId: string, weeks?: number) =>
    [...analyticsKeys.all, 'momentum', orgId, weeks] as const,
  collaboration: (orgId: string) => [...analyticsKeys.all, 'collaboration', orgId] as const,
  learningPaths: (orgId: string) => [...analyticsKeys.all, 'learningPaths', orgId] as const,
  timeToCompetency: (orgId: string, filters?: unknown) =>
    [...analyticsKeys.all, 'timeToCompetency', orgId, filters] as const,
  healthScore: (orgId: string) => [...analyticsKeys.all, 'healthScore', orgId] as const,
  managerDashboard: (managerId: string) =>
    [...analyticsKeys.all, 'managerDashboard', managerId] as const,
  roi: (orgId: string) => [...analyticsKeys.all, 'roi', orgId] as const,
};

// ============================================================================
// Dashboard Metrics Hooks
// ============================================================================

/**
 * Get high-level progress summary
 */
export function useProgressSummary(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.summary(organizationId),
    queryFn: () => TeamAnalyticsService.getProgressSummary(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get cached dashboard data (faster, updated hourly)
 */
export function useCachedDashboard(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.cached(organizationId),
    queryFn: () => TeamAnalyticsService.getCachedDashboard(organizationId),
    enabled: !!organizationId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Refresh dashboard cache
 */
export function useRefreshDashboardCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => TeamAnalyticsService.refreshDashboardCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

// ============================================================================
// Member Analytics Hooks
// ============================================================================

/**
 * Get activity summary for all members
 */
export function useMemberActivities(
  organizationId: string,
  filters?: {
    department?: string;
    minCoursesCompleted?: number;
    sortBy?: 'courses_completed' | 'avg_progress' | 'last_login';
    sortOrder?: 'asc' | 'desc';
  }
) {
  return useQuery({
    queryKey: analyticsKeys.members(organizationId, filters),
    queryFn: () => TeamAnalyticsService.getMemberActivities(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get detailed activity for specific member
 */
export function useMemberActivity(organizationId: string, userId: string) {
  return useQuery({
    queryKey: analyticsKeys.member(organizationId, userId),
    queryFn: () => TeamAnalyticsService.getMemberActivity(organizationId, userId),
    enabled: !!organizationId && !!userId,
  });
}

/**
 * Get top performers
 */
export function useTopPerformers(organizationId: string, limit: number = 10) {
  return useQuery({
    queryKey: analyticsKeys.topPerformers(organizationId, limit),
    queryFn: () => TeamAnalyticsService.getTopPerformers(organizationId, limit),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Department Analytics Hooks
// ============================================================================

/**
 * Compare performance across departments
 */
export function useDepartmentComparison(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.departments(organizationId),
    queryFn: () => TeamAnalyticsService.getDepartmentComparison(organizationId),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get member count by department
 */
export function useMemberCountByDepartment(organizationId: string) {
  return useQuery({
    queryKey: [...analyticsKeys.departments(organizationId), 'count'],
    queryFn: () => TeamAnalyticsService.getMemberCountByDepartment(organizationId),
    enabled: !!organizationId,
  });
}

// ============================================================================
// Course Analytics Hooks
// ============================================================================

/**
 * Get most popular courses
 */
export function usePopularCourses(organizationId: string, limit: number = 10) {
  return useQuery({
    queryKey: analyticsKeys.courses(organizationId, limit),
    queryFn: () => TeamAnalyticsService.getPopularCourses(organizationId, limit),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Get course completion rates
 */
export function useCourseCompletionRates(organizationId: string) {
  return useQuery({
    queryKey: [...analyticsKeys.courses(organizationId), 'completion'],
    queryFn: () => TeamAnalyticsService.getCourseCompletionRates(organizationId),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000,
  });
}

// ============================================================================
// Learning Trends Hooks
// ============================================================================

/**
 * Get learning trends over time
 */
export function useLearningTrends(organizationId: string, days: number = 90) {
  return useQuery({
    queryKey: analyticsKeys.trends(organizationId, days),
    queryFn: () => TeamAnalyticsService.getLearningTrends(organizationId, days),
    enabled: !!organizationId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get learning velocity (courses per member per month)
 */
export function useLearningVelocity(organizationId: string, months: number = 6) {
  return useQuery({
    queryKey: analyticsKeys.velocity(organizationId, months),
    queryFn: () => TeamAnalyticsService.getLearningVelocity(organizationId, months),
    enabled: !!organizationId,
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// Engagement Metrics Hooks
// ============================================================================

/**
 * Get active user counts for different time periods
 */
export function useActiveUserCounts(organizationId: string) {
  return useQuery({
    queryKey: [...analyticsKeys.engagement(organizationId), 'counts'],
    queryFn: () => TeamAnalyticsService.getActiveUserCounts(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get engagement rate
 */
export function useEngagementRate(organizationId: string) {
  return useQuery({
    queryKey: [...analyticsKeys.engagement(organizationId), 'rate'],
    queryFn: () => TeamAnalyticsService.getEngagementRate(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Export Data Hooks
// ============================================================================

/**
 * Export member progress data
 */
export function useExportMemberProgress() {
  return useMutation({
    mutationFn: (organizationId: string) =>
      TeamAnalyticsService.exportMemberProgress(organizationId),
  });
}

/**
 * Export assignment data
 */
export function useExportAssignmentData() {
  return useMutation({
    mutationFn: (organizationId: string) =>
      TeamAnalyticsService.exportAssignmentData(organizationId),
  });
}

// ============================================================================
// Comprehensive Stats Hook
// ============================================================================

/**
 * Get all statistics at once (for dashboard initialization)
 */
export function useComprehensiveStats(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.comprehensive(organizationId),
    queryFn: () => TeamAnalyticsService.getComprehensiveStats(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Assignment Analytics Hooks
// ============================================================================

/**
 * Get overdue assignments count
 */
export function useOverdueCount(organizationId: string) {
  return useQuery({
    queryKey: [...analyticsKeys.summary(organizationId), 'overdue'],
    queryFn: () => TeamAnalyticsService.getOverdueCount(organizationId),
    enabled: !!organizationId,
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Get assignment summaries with filters
 */
export function useAssignmentSummaries(
  organizationId: string,
  filters?: {
    status?: 'no_due_date' | 'overdue' | 'due_soon' | 'on_track';
    isMandatory?: boolean;
  }
) {
  return useQuery({
    queryKey: [...analyticsKeys.summary(organizationId), 'assignments', filters],
    queryFn: () => TeamAnalyticsService.getAssignmentSummaries(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Utility Hooks for CSV/Excel Export
// ============================================================================

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: Array<Record<string, string | number>>): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// Enhanced Team Analytics Hooks (8 New Metrics)
// ============================================================================

/**
 * METRIC 1: Skills Gap Analysis
 * Get skills not yet acquired by team members
 */
export function useSkillsGap(organizationId: string, department?: string) {
  return useQuery({
    queryKey: analyticsKeys.skillsGap(organizationId, department),
    queryFn: () => TeamAnalyticsService.getSkillsGap(organizationId, department),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * METRIC 2: Team Momentum Score
 * Track learning acceleration/deceleration
 */
export function useTeamMomentum(organizationId: string, weeks: number = 4) {
  return useQuery({
    queryKey: analyticsKeys.momentum(organizationId, weeks),
    queryFn: () => TeamAnalyticsService.getTeamMomentum(organizationId, weeks),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * METRIC 3: Collaboration Metrics
 * Analyze cross-team enrollment patterns
 */
export function useCollaborationMetrics(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.collaboration(organizationId),
    queryFn: () => TeamAnalyticsService.getCollaborationMetrics(organizationId),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * METRIC 4: Learning Path Effectiveness
 * Success rates and completion patterns for learning paths
 */
export function useLearningPathEffectiveness(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.learningPaths(organizationId),
    queryFn: () => TeamAnalyticsService.getLearningPathEffectiveness(organizationId),
    enabled: !!organizationId,
    staleTime: 20 * 60 * 1000, // 20 minutes
  });
}

/**
 * METRIC 5: Time-to-Competency
 * Time from enrollment to completion metrics
 */
export function useTimeToCompetency(
  organizationId: string,
  filters?: { department?: string; course_level?: string }
) {
  return useQuery({
    queryKey: analyticsKeys.timeToCompetency(organizationId, filters),
    queryFn: () => TeamAnalyticsService.getTimeToCompetency(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * METRIC 6: Team Health Score
 * Composite health metric with recommendations
 */
export function useTeamHealthScore(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.healthScore(organizationId),
    queryFn: () => TeamAnalyticsService.getTeamHealthScore(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes (fresher data for health monitoring)
  });
}

/**
 * METRIC 7: Manager Dashboard
 * Team metrics for managers (role='manager')
 */
export function useManagerDashboard(managerId: string) {
  return useQuery({
    queryKey: analyticsKeys.managerDashboard(managerId),
    queryFn: () => TeamAnalyticsService.getManagerDashboard(managerId),
    enabled: !!managerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

/**
 * METRIC 8: ROI Metrics
 * Financial return on learning investments
 */
export function useROIMetrics(organizationId: string) {
  return useQuery({
    queryKey: analyticsKeys.roi(organizationId),
    queryFn: () => TeamAnalyticsService.getROIMetrics(organizationId),
    enabled: !!organizationId,
    staleTime: 30 * 60 * 1000, // 30 minutes (financial data changes less frequently)
  });
}

/**
 * Combined hook for all enhanced metrics
 * Use this for comprehensive analytics dashboard
 */
export function useEnhancedTeamAnalytics(organizationId: string, managerId?: string) {
  const skillsGap = useSkillsGap(organizationId);
  const momentum = useTeamMomentum(organizationId);
  const collaboration = useCollaborationMetrics(organizationId);
  const learningPaths = useLearningPathEffectiveness(organizationId);
  const timeToCompetency = useTimeToCompetency(organizationId);
  const healthScore = useTeamHealthScore(organizationId);
  const managerDashboard = useManagerDashboard(managerId || '');
  const roi = useROIMetrics(organizationId);

  return {
    skillsGap,
    momentum,
    collaboration,
    learningPaths,
    timeToCompetency,
    healthScore,
    managerDashboard,
    roi,
    isLoading:
      skillsGap.isLoading ||
      momentum.isLoading ||
      collaboration.isLoading ||
      learningPaths.isLoading ||
      timeToCompetency.isLoading ||
      healthScore.isLoading ||
      roi.isLoading,
    isError:
      skillsGap.isError ||
      momentum.isError ||
      collaboration.isError ||
      learningPaths.isError ||
      timeToCompetency.isError ||
      healthScore.isError ||
      roi.isError,
  };
}
