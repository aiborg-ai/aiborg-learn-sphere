import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import {
  DollarSign,
  Users,
  TrendingUp,
  BookOpen,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    refundedAmount: number;
  };
  enrollments: {
    total: number;
    uniqueStudents: number;
    totalRevenue: number;
  };
  recentEnrollments: Array<{
    date: string;
    count: number;
  }>;
}

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: {
      total: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      refundedAmount: 0,
    },
    enrollments: {
      total: 0,
      uniqueStudents: 0,
      totalRevenue: 0,
    },
    recentEnrollments: [],
  });
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Get date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Fetch enrollment stats
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .gte('enrolled_at', startDate.toISOString())
        .lte('enrolled_at', endDate.toISOString());

      if (enrollmentError) throw enrollmentError;

      // Calculate enrollment metrics
      const uniqueStudents = new Set(enrollmentData?.map(e => e.user_id) || []).size;
      const totalRevenue = enrollmentData?.reduce((sum, e) => sum + (e.payment_amount || 0), 0) || 0;

      // Group enrollments by date for trend
      const enrollmentsByDate = (enrollmentData || []).reduce((acc, enrollment) => {
        const date = new Date(enrollment.enrolled_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentEnrollments = Object.entries(enrollmentsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Last 7 days

      setAnalytics({
        revenue: {
          total: totalRevenue,
          totalTransactions: enrollmentData?.length || 0,
          successfulTransactions: enrollmentData?.filter(e => e.payment_status === 'completed').length || 0,
          failedTransactions: enrollmentData?.filter(e => e.payment_status === 'failed').length || 0,
          refundedAmount: 0, // Will be calculated from payment_transactions table once populated
        },
        enrollments: {
          total: enrollmentData?.length || 0,
          uniqueStudents,
          totalRevenue,
        },
        recentEnrollments,
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

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSuccessRate = () => {
    const { successfulTransactions, totalTransactions } = analytics.revenue;
    if (totalTransactions === 0) return 0;
    return ((successfulTransactions / totalTransactions) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Last 30 days overview</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(analytics.revenue.total)}
            </div>
            <p className="text-xs text-green-700 mt-1">
              {analytics.revenue.successfulTransactions} successful payments
            </p>
          </CardContent>
        </Card>

        {/* Total Enrollments */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {analytics.enrollments.total}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Across all courses
            </p>
          </CardContent>
        </Card>

        {/* Unique Students */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Unique Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {analytics.enrollments.uniqueStudents}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Active learners
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Payment Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {calculateSuccessRate()}%
            </div>
            <p className="text-xs text-orange-700 mt-1">
              {analytics.revenue.failedTransactions} failed payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Payment statistics overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Transactions</span>
                  <span className="font-medium">{analytics.revenue.totalTransactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Successful</span>
                  <span className="font-medium text-green-600">
                    {analytics.revenue.successfulTransactions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-medium text-red-600">
                    {analytics.revenue.failedTransactions}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Net Revenue</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(analytics.revenue.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Enrollment Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollment Trend</CardTitle>
                <CardDescription>Last 7 days enrollment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentEnrollments.length > 0 ? (
                    analytics.recentEnrollments.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.count}</span>
                          {index > 0 && item.count > analytics.recentEnrollments[index - 1].count ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : index > 0 ? (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No enrollment data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Revenue charts and detailed analytics coming soon</p>
                <p className="text-sm mt-2">Phase 4 implementation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Analytics</CardTitle>
              <CardDescription>Course enrollment trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enrollment charts and course-wise analytics coming soon</p>
                <p className="text-sm mt-2">Phase 4 implementation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Student activity and engagement analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Engagement metrics and activity tracking coming soon</p>
                <p className="text-sm mt-2">Phase 4 implementation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
