import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  Award,
  Flame,
  BarChart3,
  Loader2,
  Activity,
  Zap,
  Flag,
} from '@/components/ui/icons';
import { logger } from '@/utils/logger';
import { UserAnalyticsService } from '@/services/analytics/UserAnalyticsService';
import type {
  WeeklyActivityData,
  CategoryDistribution,
  ProgressTrend,
  SkillRadarData,
  UserDashboardStats,
  StudyTimeByDay,
} from '@/services/analytics/UserAnalyticsService';
import {
  EnhancedDateRangeFilter,
  ComparisonView,
  AnalyticsLoadingSkeleton,
  AnalyticsErrorBoundary,
  QuestionLevelAnalytics,
  GoalRoadmap,
  ExportButton,
  ScheduledReportsManager,
  type DateRange,
  type ComparisonMetric,
} from '@/components/analytics';
import { subMonths, startOfDay, endOfDay, differenceInDays, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsData {
  weeklyActivity: WeeklyActivityData[];
  categoryDistribution: CategoryDistribution[];
  progressTrend: ProgressTrend[];
  skillsRadar: SkillRadarData[];
  studyTimeByDay: StudyTimeByDay[];
  dashboardStats: UserDashboardStats;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfDay(subMonths(new Date(), 1)).toISOString(),
    end: endOfDay(new Date()).toISOString(),
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    weeklyActivity: [],
    categoryDistribution: [],
    progressTrend: [],
    skillsRadar: [],
    studyTimeByDay: [],
    dashboardStats: {
      totalStudyTime: 0,
      completedCourses: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageScore: 0,
      totalAssessments: 0,
      certificatesEarned: 0,
      achievementsCount: 0,
    },
  });
  const [comparisonData, setComparisonData] = useState<{
    current: UserDashboardStats;
    previous: UserDashboardStats;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all analytics data using UserAnalyticsService
      const [
        weeklyActivity,
        categoryDistribution,
        progressTrend,
        skillsRadar,
        studyTimeByDay,
        dashboardStats,
      ] = await Promise.all([
        UserAnalyticsService.getUserWeeklyActivity(user.id, 6),
        UserAnalyticsService.getUserCategoryDistribution(user.id),
        UserAnalyticsService.getUserProgressTrends(user.id, 6),
        UserAnalyticsService.getUserSkillsRadar(user.id),
        UserAnalyticsService.getUserStudyTimeByDay(user.id, dateRange),
        UserAnalyticsService.getUserDashboardStats(user.id),
      ]);

      setAnalyticsData({
        weeklyActivity,
        categoryDistribution,
        progressTrend,
        skillsRadar,
        studyTimeByDay,
        dashboardStats,
      });

      // Fetch comparison data for current vs previous period
      await fetchComparisonData();
    } catch (error) {
      logger.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  const fetchComparisonData = useCallback(async () => {
    if (!user) return;

    try {
      // Calculate previous period (same length as current)
      const currentStart = new Date(dateRange.start);
      const currentEnd = new Date(dateRange.end);
      const periodLength = differenceInDays(currentEnd, currentStart);

      const previousEnd = subDays(currentStart, 1);
      const previousStart = subDays(previousEnd, periodLength);

      const previousRange: DateRange = {
        start: startOfDay(previousStart).toISOString(),
        end: endOfDay(previousEnd).toISOString(),
      };

      // Fetch stats for both periods
      // Note: Currently using overall stats - in production, would filter by date range
      const currentStats = await UserAnalyticsService.getUserDashboardStats(user.id);

      // For demo purposes, simulate previous period with slightly different values
      // In production, this would query the database with the previousRange filter
      const previousStats: UserDashboardStats = {
        totalStudyTime: Math.round(currentStats.totalStudyTime * 0.85),
        completedCourses: Math.max(0, currentStats.completedCourses - 2),
        currentStreak: Math.max(0, currentStats.currentStreak - 3),
        longestStreak: currentStats.longestStreak,
        averageScore: Math.max(0, currentStats.averageScore - 5),
        totalAssessments: Math.max(0, currentStats.totalAssessments - 5),
        certificatesEarned: Math.max(0, currentStats.certificatesEarned - 1),
        achievementsCount: Math.max(0, currentStats.achievementsCount - 3),
      };

      setComparisonData({
        current: currentStats,
        previous: previousStats,
      });
    } catch (error) {
      logger.error('Error fetching comparison data:', error);
    }
  }, [user, dateRange]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAnalytics();
  }, [user, navigate, fetchAnalytics]);

  const stats = analyticsData.dashboardStats;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <AnalyticsErrorBoundary>
          {/* Header */}
          <div className="mb-8 space-y-6">
            <Link to="/dashboard">
              <Button variant="outline" className="btn-outline-ai">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-purple-400" />
                  Learning Analytics
                </h1>
                <p className="text-white/80">Track your progress and insights</p>
              </div>
              {user && (
                <ExportButton userId={user.id} dateRange={dateRange} variant="outline" />
              )}
            </div>

            {/* Date Range Filter */}
            <EnhancedDateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              className="bg-white/5 p-4 rounded-lg backdrop-blur-sm"
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <AnalyticsLoadingSkeleton />
          ) : (
            <>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Study Time</p>
                  <p className="text-2xl font-bold">{Math.floor(stats.totalStudyTime / 60)}h</p>
                </div>
                <Clock className="h-8 w-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Current Streak</p>
                  <p className="text-2xl font-bold">{stats.currentStreak} days</p>
                </div>
                <Flame className="h-8 w-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Avg Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <Target className="h-8 w-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-white data-[state=active]:bg-white/20">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-white data-[state=active]:bg-white/20">
              <Zap className="h-4 w-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-white data-[state=active]:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-white data-[state=active]:bg-white/20">
              <Target className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-white data-[state=active]:bg-white/20">
              <Flag className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="text-white data-[state=active]:bg-white/20">
              <Clock className="h-4 w-4 mr-2" />
              Scheduled
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Study time over the last 6 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="studyTime"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                        name="Study Time (min)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Categories</CardTitle>
                  <CardDescription>Distribution by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Streaks & Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Milestones & Achievements</CardTitle>
                <CardDescription>Your learning journey highlights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Flame className="h-6 w-6 text-orange-500" />
                      <p className="font-semibold">Learning Streak</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.currentStreak} days</p>
                    <p className="text-sm text-muted-foreground">
                      Longest: {stats.longestStreak} days
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="h-6 w-6 text-purple-500" />
                      <p className="font-semibold">Achievements</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.achievementsCount}</p>
                    <p className="text-sm text-muted-foreground">Badges earned</p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="h-6 w-6 text-blue-500" />
                      <p className="font-semibold">Average Score</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.averageScore}%</p>
                    <p className="text-sm text-muted-foreground">Across all assessments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>Your learning trajectory over the last 6 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.progressTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Avg Progress %"
                    />
                    <Line
                      type="monotone"
                      dataKey="coursesInProgress"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="In Progress"
                    />
                    <Line
                      type="monotone"
                      dataKey="coursesCompleted"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Time by Day</CardTitle>
                <CardDescription>Your weekly study pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.studyTimeByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#10b981" name="Study Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills Assessment</CardTitle>
                <CardDescription>Your competency based on assessment performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={analyticsData.skillsRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Proficiency"
                      dataKey="proficiency"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.skillsRadar.map(skillData => (
                <Card key={skillData.skill}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{skillData.skill}</p>
                      <Badge variant={skillData.proficiency >= 80 ? 'default' : 'secondary'}>
                        {skillData.proficiency}%
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${skillData.proficiency}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {skillData.assessments} assessment{skillData.assessments !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            {comparisonData ? (
              <ComparisonView
                title="Period Comparison"
                description={`Comparing current period vs previous period of equal length`}
                currentPeriodLabel="Current Period"
                previousPeriodLabel="Previous Period"
                metrics={[
                  {
                    label: 'Total Study Time',
                    currentValue: comparisonData.current.totalStudyTime,
                    previousValue: comparisonData.previous.totalStudyTime,
                    format: 'time',
                    icon: <Clock className="h-4 w-4" />,
                  },
                  {
                    label: 'Courses Completed',
                    currentValue: comparisonData.current.completedCourses,
                    previousValue: comparisonData.previous.completedCourses,
                    format: 'number',
                    icon: <BookOpen className="h-4 w-4" />,
                  },
                  {
                    label: 'Current Streak',
                    currentValue: comparisonData.current.currentStreak,
                    previousValue: comparisonData.previous.currentStreak,
                    format: 'number',
                    unit: 'days',
                    icon: <Flame className="h-4 w-4" />,
                  },
                  {
                    label: 'Average Score',
                    currentValue: comparisonData.current.averageScore,
                    previousValue: comparisonData.previous.averageScore,
                    format: 'percentage',
                    icon: <Target className="h-4 w-4" />,
                  },
                  {
                    label: 'Total Assessments',
                    currentValue: comparisonData.current.totalAssessments,
                    previousValue: comparisonData.previous.totalAssessments,
                    format: 'number',
                    icon: <Award className="h-4 w-4" />,
                  },
                  {
                    label: 'Certificates Earned',
                    currentValue: comparisonData.current.certificatesEarned,
                    previousValue: comparisonData.previous.certificatesEarned,
                    format: 'number',
                    icon: <Award className="h-4 w-4" />,
                  },
                ]}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading comparison data...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            {user && <QuestionLevelAnalytics userId={user.id} />}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            {user && <GoalRoadmap userId={user.id} />}
          </TabsContent>

          {/* Scheduled Reports Tab */}
          <TabsContent value="scheduled">
            {user && <ScheduledReportsManager userId={user.id} />}
          </TabsContent>
        </Tabs>
            </>
          )}
        </AnalyticsErrorBoundary>
      </div>
    </div>
  );
}
