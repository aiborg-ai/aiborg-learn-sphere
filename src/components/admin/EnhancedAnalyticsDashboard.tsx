import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DollarSign,
  Users,
  TrendingUp,
  BookOpen,
  Activity,
  Loader2,
  RefreshCw,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AdminAnalyticsService } from '@/services/analytics/AdminAnalyticsService';
import { logger } from '@/utils/logger';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function EnhancedAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<any[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null);
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
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

      setPlatformMetrics(platform);
      setUserGrowth(growth);
      setCourseAnalytics(courses);
      setRevenueMetrics(revenue);
      setEngagementMetrics(engagement);
      setAssessmentAnalytics(assessments);
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
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Analytics data refreshed',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformMetrics?.totalUsers || 0)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {platformMetrics?.totalStudents || 0} Students
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {platformMetrics?.totalInstructors || 0} Instructors
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(platformMetrics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {revenueMetrics?.successfulTransactions || 0} successful transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(platformMetrics?.activeUsersMonth || 0)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span>Today: {platformMetrics?.activeUsersToday || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(platformMetrics?.totalEnrollments || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {platformMetrics?.totalCourses || 0} active courses
            </p>
          </CardContent>
        </Card>
      </div>

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
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth (30 Days)</CardTitle>
                <CardDescription>New users and total platform growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      name="New Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stackId="2"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
                <CardDescription>Platform engagement statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily Active Users</span>
                  <span className="font-bold">{engagementMetrics?.dailyActiveUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Weekly Active Users</span>
                  <span className="font-bold">{engagementMetrics?.weeklyActiveUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Session Duration</span>
                  <span className="font-bold">
                    {Math.round(engagementMetrics?.averageSessionDuration || 0)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Completion Rate</span>
                  <span className="font-bold">
                    {formatPercentage(engagementMetrics?.contentCompletionRate || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Assessment Take Rate</span>
                  <span className="font-bold">
                    {formatPercentage(engagementMetrics?.assessmentTakeRate || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Avg Courses per User</span>
                  <span className="font-bold text-purple-600">
                    {engagementMetrics?.averageCoursesPerUser.toFixed(1) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Students', value: platformMetrics?.totalStudents || 0 },
                        { name: 'Instructors', value: platformMetrics?.totalInstructors || 0 },
                        { name: 'Admins', value: platformMetrics?.totalAdmins || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map(index => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity Trend</CardTitle>
                <CardDescription>Active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Courses by Enrollment</CardTitle>
              <CardDescription>Most popular courses on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={courseAnalytics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseTitle" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrollments" fill="#8b5cf6" name="Enrollments" />
                  <Bar dataKey="completions" fill="#10b981" name="Completions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Performance Table</CardTitle>
              <CardDescription>Detailed course metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Course</th>
                      <th className="p-3 text-center font-medium">Enrollments</th>
                      <th className="p-3 text-center font-medium">Completion Rate</th>
                      <th className="p-3 text-center font-medium">Avg Rating</th>
                      <th className="p-3 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseAnalytics.slice(0, 10).map((course, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3">{course.courseTitle}</td>
                        <td className="p-3 text-center">{course.enrollments}</td>
                        <td className="p-3 text-center">
                          <Badge variant={course.completionRate >= 50 ? 'default' : 'secondary'}>
                            {formatPercentage(course.completionRate)}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            {course.averageRating.toFixed(1)}
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(course.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (30 Days)</CardTitle>
                <CardDescription>Daily revenue over the last month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueMetrics?.revenueByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course</CardTitle>
                <CardDescription>Top 10 revenue-generating courses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueMetrics?.revenueByCourse || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="courseTitle" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
              <CardDescription>Comprehensive revenue metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(revenueMetrics?.total || 0)}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{revenueMetrics?.transactions || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {revenueMetrics?.transactions > 0
                      ? formatPercentage(
                          ((revenueMetrics?.successfulTransactions || 0) /
                            revenueMetrics?.transactions) *
                            100
                        )
                      : '0%'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Transaction</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(revenueMetrics?.averageTransactionValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Performance Trend</CardTitle>
                <CardDescription>Average scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={assessmentAnalytics?.performanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="averageScore"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Average Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment Types</CardTitle>
                <CardDescription>Distribution by assessment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={assessmentAnalytics?.assessmentsByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(assessmentAnalytics?.assessmentsByType || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold">{assessmentAnalytics?.totalAssessments || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {assessmentAnalytics?.completedAssessments || 0}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(assessmentAnalytics?.completionRate || 0)}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage(assessmentAnalytics?.averageScore || 0)}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                  <p className="text-2xl font-bold">
                    {Math.round(assessmentAnalytics?.averageTimeMinutes || 0)} min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
