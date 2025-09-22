import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  BookOpen, Trophy, Clock, FileText, Bell, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import dashboard components
import { DashboardStats, type DashboardStatsData } from '@/components/dashboard/DashboardStats';
import { CourseProgress, type UserProgress } from '@/components/dashboard/CourseProgress';
import { AchievementsSection, type Achievement } from '@/components/dashboard/AchievementsSection';
import { AssignmentsSection, type Assignment } from '@/components/dashboard/AssignmentsSection';
import { NotificationsSection, type Notification } from '@/components/dashboard/NotificationsSection';

export default function DashboardRefactored() {
  const [dataLoading, setDataLoading] = useState(true);
  const [lmsSetupRequired, setLmsSetupRequired] = useState(false);
  const [stats, setStats] = useState<DashboardStatsData>({
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
        logger.log('LMS tables not found in production');
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

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          *,
          courses!inner(title)
        `)
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false });

      if (progressError && progressError.code === '42P01') {
        logger.log('User progress table not found');
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

      // Fetch achievements
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements!inner(name, description, icon_emoji, rarity, is_featured)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementError && achievementError.code === '42P01') {
        logger.log('Achievements table not found');
      }

      if (achievementData) {
        setAchievements(achievementData.map(a => ({
          id: a.id,
          name: a.achievements?.name || 'Unknown Achievement',
          description: a.achievements?.description || '',
          iconEmoji: a.achievements?.icon_emoji || '🏆',
          rarity: a.achievements?.rarity || 'Common',
          earnedAt: a.earned_at,
          isFeatured: a.achievements?.is_featured || false
        })));
      }

      // Fetch notifications
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationError && notificationError.code === '42P01') {
        logger.log('Notifications table not found');
      }

      if (notificationData) {
        setNotifications(notificationData.map(n => ({
          id: n.id,
          type: n.type || 'info',
          title: n.title,
          message: n.message,
          isRead: n.is_read || false,
          createdAt: n.created_at,
          actionUrl: n.action_url
        })));
      }

      // Fetch assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('homework_assignments')
        .select(`
          *,
          courses!inner(title)
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (assignmentError && assignmentError.code === '42P01') {
        logger.log('Homework tables not found');
      }

      if (assignmentData) {
        setAssignments(assignmentData.map(a => ({
          id: a.id,
          title: a.title,
          courseTitle: a.courses?.title || 'Unknown Course',
          dueDate: a.due_date,
          status: a.status || 'pending'
        })));
      }

      // Update enrollments count in stats if we have the data
      if (enrollments) {
        setStats(prev => ({
          ...prev,
          enrolledCourses: enrollments.length
        }));
      }

    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ));
        setStats(prev => ({
          ...prev,
          unreadNotifications: Math.max(0, prev.unreadNotifications - 1)
        }));
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setStats(prev => ({ ...prev, unreadNotifications: 0 }));
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="btn-outline-ai mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Welcome back, {profile?.display_name || 'Learner'}!
              </h1>
              <p className="text-white/80">
                Track your learning progress and manage your courses
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Member since</p>
              <p className="text-white font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {lmsSetupRequired && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Some features are currently being set up. Full functionality will be available soon.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-white data-[state=active]:bg-white/20">
              <Clock className="h-4 w-4 mr-2" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white/20">
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-white data-[state=active]:bg-white/20">
              <FileText className="h-4 w-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-white/20">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {stats.unreadNotifications > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {stats.unreadNotifications}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardStats stats={stats} />
            <CourseProgress
              userProgress={userProgress}
              enrollments={enrollments}
              courses={courses}
            />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CourseProgress
              userProgress={userProgress}
              enrollments={enrollments}
              courses={courses}
            />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsSection achievements={achievements} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsSection assignments={assignments} />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsSection
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}