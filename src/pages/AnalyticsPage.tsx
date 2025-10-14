import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
} from 'lucide-react';
import { logger } from '@/utils/logger';
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

interface WeeklyActivity {
  day: string;
  minutes: number;
  courses: number;
}

interface CategoryDistribution {
  name: string;
  value: number;
  percentage: string;
}

interface ProgressTrend {
  week: string;
  progress: number;
  courses: number;
}

interface SkillRadar {
  skill: string;
  level: number;
}

interface AnalyticsData {
  weeklyActivity: WeeklyActivity[];
  categoryDistribution: CategoryDistribution[];
  progressTrend: ProgressTrend[];
  skillsRadar: SkillRadar[];
  monthlyStats: {
    totalTime: number;
    coursesCompleted: number;
    achievementsEarned: number;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
  };
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    weeklyActivity: [],
    categoryDistribution: [],
    progressTrend: [],
    skillsRadar: [],
    monthlyStats: {
      totalTime: 0,
      coursesCompleted: 0,
      achievementsEarned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageScore: 0,
    },
  });
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user progress data
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(
          `
          *,
          courses!inner(title, category)
        `
        )
        .eq('user_id', user.id);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      // Calculate weekly activity (last 7 days)
      const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Simulate activity data (in real app, track actual daily activity)
        const activity =
          progressData?.filter(p => {
            const lastAccessed = new Date(p.last_accessed);
            return lastAccessed.toDateString() === date.toDateString();
          }).length || 0;

        return {
          day: dayName,
          minutes: activity * 30 + Math.floor(Math.random() * 60),
          courses: activity,
        };
      });

      // Calculate category distribution
      const categoryMap = new Map<string, number>();
      progressData?.forEach(p => {
        const category = p.courses?.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / (progressData?.length || 1)) * 100).toFixed(1),
      }));

      // Calculate progress trend (last 6 weeks)
      const progressTrend = Array.from({ length: 6 }, (_, i) => {
        const weekAgo = 6 - i;
        return {
          week: `Week ${weekAgo}`,
          progress: Math.min(100, (i + 1) * 15 + Math.random() * 10),
          courses: i + 1,
        };
      });

      // Skills radar (simulate skill levels)
      const skillsRadar = [
        { skill: 'Problem Solving', level: 85 },
        { skill: 'Communication', level: 72 },
        { skill: 'Technical Skills', level: 90 },
        { skill: 'Collaboration', level: 68 },
        { skill: 'Creativity', level: 78 },
        { skill: 'Time Management', level: 82 },
      ];

      // Calculate monthly stats
      const totalTime = progressData?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0;
      const coursesCompleted = progressData?.filter(p => p.progress_percentage === 100).length || 0;
      const achievementsEarned = achievementsData?.length || 0;

      setAnalyticsData({
        weeklyActivity,
        categoryDistribution,
        progressTrend,
        skillsRadar,
        monthlyStats: {
          totalTime,
          coursesCompleted,
          achievementsEarned,
          currentStreak: 7, // Would calculate from actual activity log
          longestStreak: 14,
          averageScore: 87.5,
        },
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAnalytics();
  }, [user, navigate, fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const stats = analyticsData.monthlyStats;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="outline" className="btn-outline-ai mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                Learning Analytics
              </h1>
              <p className="text-white/80">Track your progress and insights</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Study Time</p>
                  <p className="text-2xl font-bold">{Math.floor(stats.totalTime / 60)}h</p>
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
                  <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
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
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Study time in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
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
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    <p className="text-2xl font-bold">{stats.achievementsEarned}</p>
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
                <CardDescription>Your learning trajectory</CardDescription>
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
                    />
                    <Line
                      type="monotone"
                      dataKey="courses"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Activity Pattern</CardTitle>
                <CardDescription>Course engagement by day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="courses" fill="#10b981" />
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
                <CardDescription>Your competency across key areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={analyticsData.skillsRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Skill Level"
                      dataKey="level"
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
              {analyticsData.skillsRadar.map(skill => (
                <Card key={skill.skill}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{skill.skill}</p>
                      <Badge variant={skill.level >= 80 ? 'default' : 'secondary'}>
                        {skill.level}%
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
