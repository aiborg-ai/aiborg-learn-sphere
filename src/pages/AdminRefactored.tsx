import { useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAdminData } from '@/hooks/useAdminData';
import {
  Loader2,
  Users,
  BookOpen,
  Megaphone,
  Shield,
  UserCheck,
  Star,
  Calendar,
  Trophy,
  Mail,
  FileJson,
  BarChart3,
  UserCog,
  Receipt,
  TrendingUp,
  FileCheck,
  Folder,
  Ticket,
  Crown,
  ShieldCheck,
} from 'lucide-react';

// Only import AccessDenied eagerly (used before tabs render)
import { AccessDenied } from '@/components/admin/AccessDenied';

// Lazy load all admin tab components for better code splitting
const UserManagement = lazy(() =>
  import('@/components/admin/UserManagement').then(m => ({ default: m.UserManagement }))
);
const CourseManagementEnhanced = lazy(() =>
  import('@/components/admin/CourseManagementEnhanced').then(m => ({
    default: m.CourseManagementEnhanced,
  }))
);
const AnnouncementManagementEnhanced = lazy(() =>
  import('@/components/admin/AnnouncementManagementEnhanced').then(m => ({
    default: m.AnnouncementManagementEnhanced,
  }))
);
const ReviewsManagement = lazy(() =>
  import('@/components/admin/ReviewsManagement').then(m => ({ default: m.ReviewsManagement }))
);
const EventsManagementEnhanced = lazy(() =>
  import('@/components/admin/EventsManagementEnhanced').then(m => ({
    default: m.EventsManagementEnhanced,
  }))
);
const AchievementManager = lazy(() =>
  import('@/components/admin/AchievementManager').then(m => ({ default: m.AchievementManager }))
);
const BlogManager = lazy(() => import('./Admin/BlogManager'));
const RoleManagementPanel = lazy(() =>
  import('@/components/admin/RoleManagementPanel').then(m => ({ default: m.RoleManagementPanel }))
);
const EnhancedAnalyticsDashboard = lazy(() =>
  import('@/components/admin/EnhancedAnalyticsDashboard').then(m => ({
    default: m.EnhancedAnalyticsDashboard,
  }))
);
const EnrollmentManagementEnhanced = lazy(() =>
  import('@/components/admin/EnrollmentManagementEnhanced').then(m => ({
    default: m.EnrollmentManagementEnhanced,
  }))
);
const RefundProcessor = lazy(() =>
  import('@/components/admin/RefundProcessor').then(m => ({ default: m.RefundProcessor }))
);
const ProgressTrackingDashboard = lazy(() =>
  import('@/components/admin/ProgressTrackingDashboard').then(m => ({
    default: m.ProgressTrackingDashboard,
  }))
);
const AssignmentTracker = lazy(() =>
  import('@/components/admin/AssignmentTracker').then(m => ({ default: m.AssignmentTracker }))
);
const ResourcesManagement = lazy(() =>
  import('@/components/admin/ResourcesManagement').then(m => ({ default: m.ResourcesManagement }))
);
const AttendanceTicketManagement = lazy(() =>
  import('@/components/admin/AttendanceTicketManagement').then(m => ({
    default: m.AttendanceTicketManagement,
  }))
);
const FamilyPassManagement = lazy(() =>
  import('@/components/admin/FamilyPassManagement').then(m => ({ default: m.FamilyPassManagement }))
);
const ModeratorDashboard = lazy(() =>
  import('@/components/admin/ModeratorDashboard').then(m => ({ default: m.ModeratorDashboard }))
);
const RegistrantsManagement = lazy(() =>
  import('@/components/admin/RegistrantsManagement').then(m => ({
    default: m.RegistrantsManagement,
  }))
);

// Loading component for tab content
const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
  </div>
);

export default function AdminRefactored() {
  const { user } = useAuth();
  const { isAdmin, accessDenied, denialReason, loading: accessLoading } = useAdminAccess();
  const {
    users,
    courses,
    announcements,
    enrollments,
    loading: dataLoading,
    refetch,
  } = useAdminData();

  // Fetch data when admin access is granted
  useEffect(() => {
    if (isAdmin) {
      refetch();
    }
  }, [isAdmin, refetch]);

  // Show loading while checking access
  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show access denied message if user doesn't have admin access
  if (accessDenied) {
    return <AccessDenied reason={denialReason} />;
  }

  // Show loading while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-secondary" />
            <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/template-import">
              <Button variant="outline" className="btn-outline-ai flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Template Import
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="btn-outline-ai">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 flex-wrap h-auto p-2">
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="role-management"
              className="text-white data-[state=active]:bg-white/20"
            >
              <UserCog className="h-4 w-4 mr-2" />
              Role Management
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-white data-[state=active]:bg-white/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="text-white data-[state=active]:bg-white/20">
              <UserCheck className="h-4 w-4 mr-2" />
              Enrollments ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="family-pass" className="text-white data-[state=active]:bg-white/20">
              <Crown className="h-4 w-4 mr-2" />
              Family Pass
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Announcements ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-white/20">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-white data-[state=active]:bg-white/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Blog
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="refunds" className="text-white data-[state=active]:bg-white/20">
              <Receipt className="h-4 w-4 mr-2" />
              Refunds
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-white data-[state=active]:bg-white/20">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-white data-[state=active]:bg-white/20">
              <FileCheck className="h-4 w-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-white data-[state=active]:bg-white/20">
              <Folder className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-white data-[state=active]:bg-white/20">
              <Ticket className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-white data-[state=active]:bg-white/20">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="registrants" className="text-white data-[state=active]:bg-white/20">
              <Mail className="h-4 w-4 mr-2" />
              Registrants
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Each wrapped in Suspense for code splitting */}
          <TabsContent value="analytics">
            <Suspense fallback={<TabLoader />}>
              <EnhancedAnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="role-management">
            <Suspense fallback={<TabLoader />}>
              <RoleManagementPanel users={users} onRefresh={refetch} />
            </Suspense>
          </TabsContent>

          <TabsContent value="users">
            <Suspense fallback={<TabLoader />}>
              <UserManagement users={users} setUsers={() => refetch()} onRefresh={refetch} />
            </Suspense>
          </TabsContent>

          <TabsContent value="courses">
            <Suspense fallback={<TabLoader />}>
              <CourseManagementEnhanced
                courses={courses}
                setCourses={() => refetch()}
                onRefresh={refetch}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="enrollments">
            <Suspense fallback={<TabLoader />}>
              <EnrollmentManagementEnhanced enrollments={enrollments} onRefresh={refetch} />
            </Suspense>
          </TabsContent>

          <TabsContent value="family-pass">
            <Suspense fallback={<TabLoader />}>
              <FamilyPassManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="announcements">
            <Suspense fallback={<TabLoader />}>
              <AnnouncementManagementEnhanced
                announcements={announcements}
                setAnnouncements={() => refetch()}
                userId={user?.id || ''}
                onRefresh={refetch}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="reviews">
            <Suspense fallback={<TabLoader />}>
              <ReviewsManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="events">
            <Suspense fallback={<TabLoader />}>
              <EventsManagementEnhanced />
            </Suspense>
          </TabsContent>

          <TabsContent value="blog">
            <Suspense fallback={<TabLoader />}>
              <BlogManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="achievements">
            <Suspense fallback={<TabLoader />}>
              <AchievementManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="refunds">
            <Suspense fallback={<TabLoader />}>
              <RefundProcessor />
            </Suspense>
          </TabsContent>

          <TabsContent value="progress">
            <Suspense fallback={<TabLoader />}>
              <ProgressTrackingDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="assignments">
            <Suspense fallback={<TabLoader />}>
              <AssignmentTracker />
            </Suspense>
          </TabsContent>

          <TabsContent value="resources">
            <Suspense fallback={<TabLoader />}>
              <ResourcesManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="attendance">
            <Suspense fallback={<TabLoader />}>
              <AttendanceTicketManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="moderation">
            <Suspense fallback={<TabLoader />}>
              <ModeratorDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="registrants">
            <Suspense fallback={<TabLoader />}>
              <RegistrantsManagement />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
