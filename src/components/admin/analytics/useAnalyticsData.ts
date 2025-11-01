import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AdminAnalyticsService, type DateRange, type ChatbotMetrics, type TeamMetrics } from '@/services/analytics/AdminAnalyticsService';
import { ForecastingService, type ForecastResult } from '@/services/analytics/ForecastingService';
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
  chatbotMetrics: ChatbotMetrics | null;
  teamMetrics: TeamMetrics | null;
  revenueForecast: ForecastResult | null;
  userGrowthForecast: ForecastResult | null;
  enrollmentForecast: ForecastResult | null;
}

interface UseAnalyticsDataParams {
  dateRange?: DateRange;
  forecastDays?: 30 | 60 | 90;
}

export function useAnalyticsData({ dateRange, forecastDays = 30 }: UseAnalyticsDataParams = {}) {
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
    chatbotMetrics: null,
    teamMetrics: null,
    revenueForecast: null,
    userGrowthForecast: null,
    enrollmentForecast: null,
  });

  const fetchAllAnalytics = useCallback(async (customDateRange?: DateRange, customForecastDays?: 30 | 60 | 90) => {
    try {
      setLoading(true);

      const effectiveDateRange = customDateRange || dateRange;
      const effectiveForecastDays = customForecastDays || forecastDays;

      // Fetch core analytics (date range-independent)
      const [platform, courses, engagement] = await Promise.all([
        AdminAnalyticsService.getPlatformMetrics(),
        AdminAnalyticsService.getCourseAnalytics(),
        AdminAnalyticsService.getEngagementMetrics(),
      ]);

      // Default date range (last 30 days) for metrics that need it
      const defaultDateRange: DateRange = effectiveDateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      };

      // Fetch date-range-dependent analytics in parallel
      const [growth, revenue, assessments, chatbot, team] = await Promise.all([
        AdminAnalyticsService.getUserGrowth(30),
        AdminAnalyticsService.getRevenueMetrics(30),
        AdminAnalyticsService.getAssessmentAnalytics(30),
        AdminAnalyticsService.getChatbotAnalytics(defaultDateRange),
        AdminAnalyticsService.getTeamAnalytics(defaultDateRange),
      ]);

      // Fetch forecasting data (using revenue data for forecasting)
      let revenueForecast: ForecastResult | null = null;
      let userGrowthForecast: ForecastResult | null = null;
      let enrollmentForecast: ForecastResult | null = null;

      try {
        // Generate forecasts using historical data
        // Note: In production, fetch real historical data from database
        const revenueHistorical = revenue?.revenueByDay || [];
        const userGrowthHistorical = growth.map(g => ({
          date: g.date,
          userCount: g.activeUsers,
        }));

        const [revenueF, userGrowthF, enrollmentF] = await Promise.all([
          revenueHistorical.length >= 60
            ? ForecastingService.forecastRevenue(revenueHistorical, effectiveForecastDays)
            : Promise.resolve(null),
          userGrowthHistorical.length >= 60
            ? ForecastingService.forecastUserGrowth(userGrowthHistorical, effectiveForecastDays)
            : Promise.resolve(null),
          // For enrollment forecast, we'll need enrollment historical data
          // Placeholder: using null for now
          Promise.resolve(null),
        ]);

        revenueForecast = revenueF;
        userGrowthForecast = userGrowthF;
        enrollmentForecast = enrollmentF;
      } catch (forecastError) {
        logger.warn('Forecasting failed, insufficient data:', forecastError);
        // Continue without forecasts
      }

      setData({
        platformMetrics: platform,
        userGrowth: growth,
        courseAnalytics: courses,
        revenueMetrics: revenue,
        engagementMetrics: engagement,
        assessmentAnalytics: assessments,
        chatbotMetrics: chatbot,
        teamMetrics: team,
        revenueForecast,
        userGrowthForecast,
        enrollmentForecast,
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
  }, [dateRange, forecastDays, toast]);

  const handleRefresh = async (customDateRange?: DateRange, customForecastDays?: 30 | 60 | 90) => {
    setRefreshing(true);
    await fetchAllAnalytics(customDateRange, customForecastDays);
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
    fetchAllAnalytics,
  };
}
