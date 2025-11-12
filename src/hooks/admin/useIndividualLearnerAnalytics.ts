/**
 * Individual Learner Analytics Hooks
 * React Query hooks for individual learner performance tracking
 */

import { useQuery } from '@tanstack/react-query';
import {
  IndividualLearnerAnalyticsService,
  type LearnerFilters,
} from '@/services/IndividualLearnerAnalyticsService';

// Query keys for cache management
export const learnerAnalyticsKeys = {
  all: ['learner-analytics'] as const,
  summary: (userId: string) => [...learnerAnalyticsKeys.all, 'summary', userId] as const,
  summaries: (filters: LearnerFilters) =>
    [...learnerAnalyticsKeys.all, 'summaries', filters] as const,
  healthScore: (userId: string) => [...learnerAnalyticsKeys.all, 'health-score', userId] as const,
  insights: (userId: string) => [...learnerAnalyticsKeys.all, 'insights', userId] as const,
  courses: (userId: string) => [...learnerAnalyticsKeys.all, 'courses', userId] as const,
  course: (userId: string, courseId: number) =>
    [...learnerAnalyticsKeys.all, 'course', userId, courseId] as const,
  topCourses: (userId: string, limit: number) =>
    [...learnerAnalyticsKeys.all, 'top-courses', userId, limit] as const,
  strugglingCourses: (userId: string, limit: number) =>
    [...learnerAnalyticsKeys.all, 'struggling-courses', userId, limit] as const,
  velocity: (userId: string, weeks: number) =>
    [...learnerAnalyticsKeys.all, 'velocity', userId, weeks] as const,
  currentVelocity: (userId: string) =>
    [...learnerAnalyticsKeys.all, 'current-velocity', userId] as const,
  assessments: (userId: string) => [...learnerAnalyticsKeys.all, 'assessments', userId] as const,
  timeline: (userId: string, days: number) =>
    [...learnerAnalyticsKeys.all, 'timeline', userId, days] as const,
  engagementByType: (userId: string, days: number) =>
    [...learnerAnalyticsKeys.all, 'engagement-by-type', userId, days] as const,
  atRisk: (userId: string) => [...learnerAnalyticsKeys.all, 'at-risk', userId] as const,
  allAtRisk: (filters: LearnerFilters) =>
    [...learnerAnalyticsKeys.all, 'all-at-risk', filters] as const,
  highRisk: (organizationId?: string) =>
    [...learnerAnalyticsKeys.all, 'high-risk', organizationId] as const,
  learningPaths: (userId: string) =>
    [...learnerAnalyticsKeys.all, 'learning-paths', userId] as const,
  activePaths: (userId: string) => [...learnerAnalyticsKeys.all, 'active-paths', userId] as const,
  skills: (userId: string) => [...learnerAnalyticsKeys.all, 'skills', userId] as const,
  skillsByProficiency: (
    userId: string,
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ) => [...learnerAnalyticsKeys.all, 'skills-by-proficiency', userId, proficiency] as const,
  skillCategories: (userId: string) =>
    [...learnerAnalyticsKeys.all, 'skill-categories', userId] as const,
  dashboard: (userId: string) => [...learnerAnalyticsKeys.all, 'dashboard', userId] as const,
  manager: (managerId: string) => [...learnerAnalyticsKeys.all, 'manager', managerId] as const,
  directReports: (managerId: string) =>
    [...learnerAnalyticsKeys.all, 'direct-reports', managerId] as const,
  atRiskReports: (managerId: string, minRiskScore: number) =>
    [...learnerAnalyticsKeys.all, 'at-risk-reports', managerId, minRiskScore] as const,
  topReports: (managerId: string, limit: number) =>
    [...learnerAnalyticsKeys.all, 'top-reports', managerId, limit] as const,
  departmentComparison: (userId: string, department: string) =>
    [...learnerAnalyticsKeys.all, 'dept-comparison', userId, department] as const,
  percentile: (userId: string, organizationId: string) =>
    [...learnerAnalyticsKeys.all, 'percentile', userId, organizationId] as const,
};

// ============================================================================
// Learner Summary Hooks
// ============================================================================

export function useLearnerSummary(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.summary(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerSummary(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
}

export function useLearnerSummaries(filters: LearnerFilters = {}) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.summaries(filters),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerSummaries(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLearnerHealthScore(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.healthScore(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerHealthScore(userId),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!userId,
  });
}

export function useLearnerInsights(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.insights(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerInsights(userId),
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}

// ============================================================================
// Course Performance Hooks
// ============================================================================

export function useLearnerCoursePerformance(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.courses(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerCoursePerformance(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useCoursePerformance(userId: string, courseId: number) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.course(userId, courseId),
    queryFn: () => IndividualLearnerAnalyticsService.getCoursePerformance(userId, courseId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId && !!courseId,
  });
}

export function useTopPerformingCourses(userId: string, limit: number = 5) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.topCourses(userId, limit),
    queryFn: () => IndividualLearnerAnalyticsService.getTopPerformingCourses(userId, limit),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useStrugglingCourses(userId: string, limit: number = 5) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.strugglingCourses(userId, limit),
    queryFn: () => IndividualLearnerAnalyticsService.getStrugglingCourses(userId, limit),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

// ============================================================================
// Learning Velocity Hooks
// ============================================================================

export function useLearningVelocity(userId: string, weeks: number = 12) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.velocity(userId, weeks),
    queryFn: () => IndividualLearnerAnalyticsService.getLearningVelocity(userId, weeks),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useCurrentWeekVelocity(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.currentVelocity(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getCurrentWeekVelocity(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes for current week
    enabled: !!userId,
  });
}

// ============================================================================
// Assessment Hooks
// ============================================================================

export function useAssessmentPatterns(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.assessments(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getAssessmentPatterns(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

// ============================================================================
// Engagement Hooks
// ============================================================================

export function useEngagementTimeline(userId: string, days: number = 30) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.timeline(userId, days),
    queryFn: () => IndividualLearnerAnalyticsService.getEngagementTimeline(userId, days),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useEngagementByType(userId: string, days: number = 30) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.engagementByType(userId, days),
    queryFn: () => IndividualLearnerAnalyticsService.getEngagementByType(userId, days),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

// ============================================================================
// At-Risk Hooks
// ============================================================================

export function useIsLearnerAtRisk(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.atRisk(userId),
    queryFn: () => IndividualLearnerAnalyticsService.isLearnerAtRisk(userId),
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}

export function useAtRiskLearners(filters: LearnerFilters = {}) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.allAtRisk(filters),
    queryFn: () => IndividualLearnerAnalyticsService.getAtRiskLearners(filters),
    staleTime: 1000 * 60 * 10,
  });
}

export function useHighRiskLearners(organizationId?: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.highRisk(organizationId),
    queryFn: () => IndividualLearnerAnalyticsService.getHighRiskLearners(organizationId),
    staleTime: 1000 * 60 * 10,
  });
}

// ============================================================================
// Learning Paths Hooks
// ============================================================================

export function useLearningPathProgress(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.learningPaths(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearningPathProgress(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useActiveLearningPaths(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.activePaths(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getActiveLearningPaths(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

// ============================================================================
// Skills Hooks
// ============================================================================

export function useSkillsProgress(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.skills(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getSkillsProgress(userId),
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}

export function useSkillsByProficiency(
  userId: string,
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.skillsByProficiency(userId, proficiency),
    queryFn: () => IndividualLearnerAnalyticsService.getSkillsByProficiency(userId, proficiency),
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}

export function useSkillCategoriesSummary(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.skillCategories(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getSkillCategoriesSummary(userId),
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

export function useLearnerDashboard(userId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.dashboard(userId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerDashboard(userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useManagerDashboard(managerId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.manager(managerId),
    queryFn: () => IndividualLearnerAnalyticsService.getManagerDashboard(managerId),
    staleTime: 1000 * 60 * 5,
    enabled: !!managerId,
  });
}

// ============================================================================
// Manager Hooks
// ============================================================================

export function useManagerDirectReports(managerId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.directReports(managerId),
    queryFn: () => IndividualLearnerAnalyticsService.getManagerDirectReports(managerId),
    staleTime: 1000 * 60 * 5,
    enabled: !!managerId,
  });
}

export function useAtRiskDirectReports(managerId: string, minRiskScore: number = 40) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.atRiskReports(managerId, minRiskScore),
    queryFn: () =>
      IndividualLearnerAnalyticsService.getAtRiskDirectReports(managerId, minRiskScore),
    staleTime: 1000 * 60 * 5,
    enabled: !!managerId,
  });
}

export function useTopPerformingReports(managerId: string, limit: number = 5) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.topReports(managerId, limit),
    queryFn: () => IndividualLearnerAnalyticsService.getTopPerformingReports(managerId, limit),
    staleTime: 1000 * 60 * 5,
    enabled: !!managerId,
  });
}

// ============================================================================
// Comparison Hooks
// ============================================================================

export function useDepartmentComparison(userId: string, department: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.departmentComparison(userId, department),
    queryFn: () => IndividualLearnerAnalyticsService.compareToDepartmentAverage(userId, department),
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: !!userId && !!department,
  });
}

export function useLearnerPercentile(userId: string, organizationId: string) {
  return useQuery({
    queryKey: learnerAnalyticsKeys.percentile(userId, organizationId),
    queryFn: () => IndividualLearnerAnalyticsService.getLearnerPercentile(userId, organizationId),
    staleTime: 1000 * 60 * 15,
    enabled: !!userId && !!organizationId,
  });
}
