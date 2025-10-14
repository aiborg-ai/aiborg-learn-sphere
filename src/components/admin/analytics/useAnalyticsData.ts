import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AdminAnalyticsService } from '@/services/analytics/AdminAnalyticsService';
import { logger } from '@/utils/logger';
import type {
  PlatformMetrics,
  UserGrowthData,
  CourseAnalytics,
  RevenueMetrics,
  EngagementMetrics,
  AssessmentAnalytics,
} from './types';

interface AnalyticsData {
  platformMetrics: PlatformMetrics | null;
  userGrowth: UserGrowthData[];
  courseAnalytics: CourseAnalytics[];
  revenueMetrics: RevenueMetrics | null;
  engagementMetrics: EngagementMetrics | null;
  assessmentAnalytics: AssessmentAnalytics | null;
}

export function useAnalyticsData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const [data, setData] = useState<AnalyticsData>({
    platformMetrics: null,
    userGrowth: [],
    courseAnalytics: [],
    revenueMetrics: null,
    engagementMetrics: null,
    assessmentAnalytics: null,
  });

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const [platform, growth, courses, revenue, engagement, assessments] = await Promise.all([
        AdminAnalyticsService.getPlatformMetrics(),
        AdminAnalyticsService.getUserGrowth(30),
        AdminAnalyticsService.getCourseAnalytics(),
        AdminAnalyticsService.getRevenueMetrics(30),
        AdminAnalyticsService.getEngagementMetrics(),
        AdminAnalyticsService.getAssessmentAnalytics(30),
      ]);

      setData({
        platformMetrics: platform,
        userGrowth: growth,
        courseAnalytics: courses,
        revenueMetrics: revenue,
        engagementMetrics: engagement,
        assessmentAnalytics: assessments,
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Analytics data refreshed',
    });
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  return {
    ...data,
    loading,
    refreshing,
    handleRefresh,
  };
}
