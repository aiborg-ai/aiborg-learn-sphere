import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  BookOpen,
  DollarSign,
  Target,
  MessageSquare,
  UsersIcon,
  TrendingUp,
} from 'lucide-react';
import {
  PlatformMetricsCards,
  UserGrowthChart,
  EngagementMetricsCard,
  UserDistributionChart,
  UserActivityChart,
  CourseEnrollmentChart,
  CoursePerformanceTable,
  RevenueTrendChart,
  RevenueByCourseChart,
  RevenueSummaryCard,
  AssessmentPerformanceChart,
  AssessmentTypesChart,
  AssessmentMetricsCard,
  useAnalyticsData,
} from './analytics';
import { DateRangeProvider, useDateRange } from '@/contexts/DateRangeContext';
import { DateRangeSelector } from '@/components/analytics/DateRangeSelector';
import { AutoRefreshControl } from './AutoRefreshControl';
import { CustomViewSelector } from './CustomViewSelector';
import { ChatbotAnalyticsTab } from './analytics/ChatbotAnalyticsTab';
import { TeamAnalyticsTab } from './analytics/TeamAnalyticsTab';
import { PredictiveAnalyticsSection } from './analytics/PredictiveAnalyticsSection';
import type { ViewConfig } from '@/services/analytics/CustomViewsService';

/**
 * Inner dashboard component that uses DateRangeContext
 */
function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [forecastDays, setForecastDays] = useState<30 | 60 | 90>(30);
  const { startDate, endDate } = useDateRange();

  // Construct date range for analytics
  const dateRange = {
    start: startDate?.toISOString().split('T')[0] || '',
    end: endDate?.toISOString().split('T')[0] || '',
  };

  const {
    platformMetrics,
    userGrowth,
    courseAnalytics,
    revenueMetrics,
    engagementMetrics,
    assessmentAnalytics,
    chatbotMetrics,
    teamMetrics,
    loading,
    refreshing,
    handleRefresh,
    fetchAllAnalytics,
  } = useAnalyticsData({ dateRange, forecastDays });

  // View configuration state
  const [currentViewConfig, setCurrentViewConfig] = useState<ViewConfig>({
    visibleSections: [
      'overview',
      'users',
      'courses',
      'revenue',
      'assessments',
      'chatbot',
      'teams',
      'predictive',
    ],
    defaultTab: 'overview',
    refreshInterval: 300000, // 5 minutes
  });

  const handleViewLoad = (config: ViewConfig) => {
    setCurrentViewConfig(config);
    if (config.defaultTab) {
      setActiveTab(config.defaultTab);
    }
  };

  const handleAutoRefresh = async () => {
    await fetchAllAnalytics(dateRange, forecastDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            Admin Analytics Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleRefresh(dateRange, forecastDays)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <DateRangeSelector
          onApply={() => handleRefresh(dateRange, forecastDays)}
          showComparison={true}
          enablePreferences={true}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <AutoRefreshControl
            onRefresh={handleAutoRefresh}
            defaultInterval={currentViewConfig.refreshInterval}
          />
          <CustomViewSelector currentConfig={currentViewConfig} onViewLoad={handleViewLoad} />
        </div>
      </div>

      {/* Platform Overview Metrics */}
      <PlatformMetricsCards platformMetrics={platformMetrics} revenueMetrics={revenueMetrics} />

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {currentViewConfig.visibleSections.includes('overview') && (
            <TabsTrigger value="overview">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('users') && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('courses') && (
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('revenue') && (
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('assessments') && (
            <TabsTrigger value="assessments">
              <Target className="h-4 w-4 mr-2" />
              Assessments
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('chatbot') && (
            <TabsTrigger value="chatbot">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chatbot
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('teams') && (
            <TabsTrigger value="teams">
              <UsersIcon className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
          )}
          {currentViewConfig.visibleSections.includes('predictive') && (
            <TabsTrigger value="predictive">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predictive
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <UserGrowthChart data={userGrowth} />
            <EngagementMetricsCard data={engagementMetrics} />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <UserDistributionChart platformMetrics={platformMetrics} />
            <UserActivityChart data={userGrowth} />
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <CourseEnrollmentChart data={courseAnalytics} />
          <CoursePerformanceTable data={courseAnalytics} />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <RevenueTrendChart data={revenueMetrics} />
            <RevenueByCourseChart data={revenueMetrics} />
          </div>
          <RevenueSummaryCard data={revenueMetrics} />
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <AssessmentPerformanceChart data={assessmentAnalytics} />
            <AssessmentTypesChart data={assessmentAnalytics} />
          </div>
          <AssessmentMetricsCard data={assessmentAnalytics} />
        </TabsContent>

        {/* Chatbot Analytics Tab */}
        {currentViewConfig.visibleSections.includes('chatbot') && (
          <TabsContent value="chatbot" className="space-y-6">
            <ChatbotAnalyticsTab />
          </TabsContent>
        )}

        {/* Team Analytics Tab */}
        {currentViewConfig.visibleSections.includes('teams') && (
          <TabsContent value="teams" className="space-y-6">
            <TeamAnalyticsTab />
          </TabsContent>
        )}

        {/* Predictive Analytics Tab */}
        {currentViewConfig.visibleSections.includes('predictive') && (
          <TabsContent value="predictive" className="space-y-6">
            <PredictiveAnalyticsSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/**
 * Main dashboard component wrapped with DateRangeProvider
 */
export function EnhancedAnalyticsDashboard() {
  return (
    <DateRangeProvider>
      <DashboardContent />
    </DateRangeProvider>
  );
}
