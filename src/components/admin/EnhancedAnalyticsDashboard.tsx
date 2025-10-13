import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  RefreshCw,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  BookOpen,
  DollarSign,
  Target,
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

export function EnhancedAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    platformMetrics,
    userGrowth,
    courseAnalytics,
    revenueMetrics,
    engagementMetrics,
    assessmentAnalytics,
    loading,
    refreshing,
    handleRefresh,
  } = useAnalyticsData();

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
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Platform Overview Metrics */}
      <PlatformMetricsCards platformMetrics={platformMetrics} revenueMetrics={revenueMetrics} />

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="assessments">
            <Target className="h-4 w-4 mr-2" />
            Assessments
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
}
