import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, Trophy, Clock, TrendingUp, Award, Calendar,
  FileText, Users, Bell, ChevronRight, Play, BarChart,
  Target, Flame, Star, CheckCircle, AlertCircle, Loader2,
  Video, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  enrolledCourses: number;
  totalAchievements: number;
  certificatesEarned: number;
  currentStreak: number;
  pendingAssignments: number;
  unreadNotifications: number;
}

interface UserProgress {
  courseId: number;
  courseTitle: string;
  progressPercentage: number;
  timeSpentMinutes: number;
  lastAccessed: string;
  completedAt: string | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: string;
  earnedAt: string;
  isFeatured: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface Assignment {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: string;
}

export default function Dashboard() {
  const [dataLoading, setDataLoading] = useState(true);
  const [lmsSetupRequired, setLmsSetupRequired] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    enrolledCourses: 0,
    totalAchievements: 0,
    certificatesEarned: 0,
    currentStreak: 0,
    pendingAssignments: 0,
    unreadNotifications: 0
  });
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const { user, profile, loading: authLoading } = useAuth();
  const { enrollments } = useEnrollments();
  const { courses } = useCourses();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setDataLoading(true);

      // Fetch dashboard stats
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('user_dashboard')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (dashboardError && dashboardError.code === '42P01') {
        // Table doesn't exist - LMS not set up
        console.log('LMS tables not found in production');
        setLmsSetupRequired(true);
      }

      if (dashboardData) {
        setStats({
          enrolledCourses: dashboardData.enrolled_courses || 0,
          totalAchievements: dashboardData.total_achievements || 0,
          certificatesEarned: dashboardData.certificates_earned || 0,
          currentStreak: dashboardData.current_streak || 0,
          pendingAssignments: dashboardData.pending_assignments || 0,
          unreadNotifications: dashboardData.unread_notifications || 0
        });
      }

      // Fetch user progress for enrolled courses
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          *,
          courses!inner(title)
        `)
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false });

      if (progressError && progressError.code === '42P01') {
        // Table doesn't exist
        console.log('User progress table not found');
      }

      if (progressData) {
        setUserProgress(progressData.map(p => ({
          courseId: p.course_id,
          courseTitle: p.courses?.title || 'Unknown Course',
          progressPercentage: p.progress_percentage || 0,
          timeSpentMinutes: p.time_spent_minutes || 0,
          lastAccessed: p.last_accessed,
          completedAt: p.completed_at
        })));
      }

      // Fetch recent achievements
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements!inner(name, description, icon_emoji, rarity)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(6);

      if (achievementError && achievementError.code === '42P01') {
        // Table doesn't exist
        console.log('Achievements table not found');
      }

      if (achievementData) {
        setAchievements(achievementData.map(a => ({
          id: a.id,
          name: a.achievements?.name || '',
          description: a.achievements?.description || '',
          iconEmoji: a.achievements?.icon_emoji || '🏆',
          rarity: a.achievements?.rarity || 'common',
          earnedAt: a.earned_at,
          isFeatured: a.is_featured || false
        })));
      }

      // Fetch notifications
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationError && notificationError.code === '42P01') {
        // Table doesn't exist
        console.log('Notifications table not found');
      }

      if (notificationData) {
        setNotifications(notificationData);
      }

      // Fetch upcoming assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('homework_submissions')
        .select(`
          *,
          homework_assignments!inner(title, due_date, course_id),
          courses!inner(title)
        `)
        .eq('user_id', user.id)
        .in('status', ['draft', 'submitted'])
        .order('homework_assignments.due_date', { ascending: true })
        .limit(5);

      if (assignmentError && assignmentError.code === '42P01') {
        // Table doesn't exist
        console.log('Homework tables not found');
      }

      if (assignmentData) {
        setAssignments(assignmentData.map(a => ({
          id: a.id,
          title: a.homework_assignments?.title || '',
          courseTitle: a.courses?.title || '',
          dueDate: a.homework_assignments?.due_date || '',
          status: a.status
        })));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'epic': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'rare': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="h-4 w-4" />;
      case 'deadline': return <Calendar className="h-4 w-4" />;
      case 'grade': return <FileText className="h-4 w-4" />;
      case 'course_update': return <BookOpen className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || (dataLoading && !user)) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // If auth finished loading and no user, don't render (useEffect will redirect)
  if (!authLoading && !user) {
    return null;
  }

  // Show setup message if LMS tables don't exist
  if (lmsSetupRequired) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Learning Dashboard Coming Soon!</CardTitle>
              <CardDescription className="text-white/80">
                Your personalized learning dashboard is being set up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-white/90">
                  The Learning Management System features are currently being configured. This includes:
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Achievement System</p>
                    <p className="text-white/60 text-sm">Earn badges for your accomplishments</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Course Progress</p>
                    <p className="text-white/60 text-sm">Track your learning journey</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Assignments</p>
                    <p className="text-white/60 text-sm">Submit and track homework</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Notifications</p>
                    <p className="text-white/60 text-sm">Stay updated on your progress</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-white/80 text-sm">
                  Check back soon or explore our courses below!
                </p>
                <Button
                  onClick={() => navigate('/#training-programs')}
                  className="mt-4"
                >
                  Explore Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {profile?.display_name || user.email?.split('@')[0]}!
            </h1>
            <p className="text-white/80">Track your learning journey and achievements</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-white">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-2xl font-bold">{stats.currentStreak}</span>
              </div>
              <p className="text-xs text-white/60">Day Streak</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Enrolled</p>
                  <p className="text-2xl font-bold text-white">{stats.enrolledCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Achievements</p>
                  <p className="text-2xl font-bold text-white">{stats.totalAchievements}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Certificates</p>
                  <p className="text-2xl font-bold text-white">{stats.certificatesEarned}</p>
                </div>
                <Award className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingAssignments}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Notifications</p>
                  <p className="text-2xl font-bold text-white">{stats.unreadNotifications}</p>
                </div>
                <Bell className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Study Groups</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 bg-white/10 backdrop-blur-md border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-white data-[state=active]:bg-white/20">
              My Courses
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white/20">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-white data-[state=active]:bg-white/20">
              Assignments
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-white/20">
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Continue Learning</CardTitle>
                  <CardDescription className="text-white/60">
                    Pick up where you left off
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProgress.length > 0 ? (
                    <div className="space-y-4">
                      {userProgress.slice(0, 3).map((progress) => (
                        <div key={progress.courseId} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-white font-medium">{progress.courseTitle}</p>
                              <p className="text-white/60 text-sm">
                                {formatTime(progress.timeSpentMinutes)} spent
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white hover:bg-white/20"
                              onClick={() => navigate(`/course/${progress.courseId}`)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          </div>
                          <Progress
                            value={progress.progressPercentage}
                            className="h-2 bg-white/20"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-center py-8">
                      No courses in progress
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Achievements */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Achievements</CardTitle>
                  <CardDescription className="text-white/60">
                    Your latest accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {achievements.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`p-3 rounded-lg border ${getRarityColor(achievement.rarity)}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">{achievement.iconEmoji}</span>
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">
                                {achievement.name}
                              </p>
                              <p className="text-xs text-white/60 mt-1">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-center py-8">
                      No achievements yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            {assignments.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Deadlines</CardTitle>
                  <CardDescription className="text-white/60">
                    Don't miss these important dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{assignment.title}</p>
                          <p className="text-white/60 text-sm">{assignment.courseTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                          <Badge
                            variant={assignment.status === 'submitted' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">My Enrolled Courses</CardTitle>
                <CardDescription className="text-white/60">
                  Track your progress across all courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userProgress.map((progress) => (
                    <Card key={progress.courseId} className="bg-white/5 border-white/20">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="text-white font-medium">{progress.courseTitle}</h3>
                            {progress.completedAt && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/60">Progress</span>
                              <span className="text-white">{progress.progressPercentage}%</span>
                            </div>
                            <Progress
                              value={progress.progressPercentage}
                              className="h-2 bg-white/20"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-white/60">Time Spent</p>
                              <p className="text-white">{formatTime(progress.timeSpentMinutes)}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Last Accessed</p>
                              <p className="text-white">
                                {new Date(progress.lastAccessed).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => navigate(`/course/${progress.courseId}`)}
                          >
                            {progress.completedAt ? 'Review Course' : 'Continue Learning'}
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {userProgress.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">You haven't enrolled in any courses yet</p>
                    <Button onClick={() => navigate('/#training-programs')}>
                      Explore Courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Your Achievements</CardTitle>
                <CardDescription className="text-white/60">
                  Badges and milestones you've earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <Card
                        key={achievement.id}
                        className={`${getRarityColor(achievement.rarity)} border`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-center text-4xl mb-3">
                            {achievement.iconEmoji}
                          </div>
                          <h3 className="font-medium text-white text-center mb-2">
                            {achievement.name}
                          </h3>
                          <p className="text-white/80 text-sm text-center mb-3">
                            {achievement.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="text-xs">
                              {achievement.rarity}
                            </Badge>
                            {achievement.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">Start learning to earn achievements!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Assignments & Homework</CardTitle>
                <CardDescription className="text-white/60">
                  Track your submissions and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <Card key={assignment.id} className="bg-white/5 border-white/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-white font-medium">{assignment.title}</h3>
                              <p className="text-white/60 text-sm mt-1">{assignment.courseTitle}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="h-4 w-4 text-white/60" />
                                <span className="text-white/60 text-sm">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={assignment.status === 'submitted' ? 'default' : 'secondary'}
                              >
                                {assignment.status}
                              </Badge>
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => navigate(`/assignment/${assignment.id}`)}
                              >
                                {assignment.status === 'submitted' ? 'View' : 'Submit'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No assignments at the moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-white/60">
                  Stay updated with your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.isRead
                              ? 'bg-white/5 border-white/10'
                              : 'bg-white/10 border-white/20'
                          }`}
                          onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{notification.title}</p>
                              <p className="text-white/60 text-sm mt-1">{notification.message}</p>
                              <p className="text-white/40 text-xs mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-400 rounded-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">No notifications yet</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}