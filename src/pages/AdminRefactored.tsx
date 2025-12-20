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
  Gift,
  GraduationCap,
} from '@/components/ui/icons';

// Only import AccessDenied eagerly (used before tabs render)
import { AccessDenied } from '@/components/admin/AccessDenied';

// Import admin components directly (not lazy) to avoid React hook issues
// These are only loaded when /admin route is accessed, so still code-split at route level
import { UserManagement } from '@/components/admin/UserManagement';
import { CourseManagementEnhanced } from '@/components/admin/CourseManagementEnhanced';
import { AnnouncementManagementEnhanced } from '@/components/admin/AnnouncementManagementEnhanced';
import { ReviewsManagement } from '@/components/admin/ReviewsManagement';
import { EventsManagementEnhanced } from '@/components/admin/EventsManagementEnhanced';
import { AchievementManager } from '@/components/admin/AchievementManager';
import BlogManager from './Admin/BlogManager';
import { RoleManagementPanel } from '@/components/admin/RoleManagementPanel';
// Lazy load analytics dashboard (contains heavy recharts bundle)
const EnhancedAnalyticsDashboard = lazy(() =>
  import('@/components/admin/EnhancedAnalyticsDashboard').then(m => ({
    default: m.EnhancedAnalyticsDashboard,
  }))
);
import { EnrollmentManagementEnhanced } from '@/components/admin/EnrollmentManagementEnhanced';
import { RefundProcessor } from '@/components/admin/RefundProcessor';
import { ProgressTrackingDashboard } from '@/components/admin/ProgressTrackingDashboard';
import { AssignmentTracker } from '@/components/admin/AssignmentTracker';
import { ResourcesManagement } from '@/components/admin/ResourcesManagement';
import { AttendanceTicketManagement } from '@/components/admin/AttendanceTicketManagement';
import { FamilyPassManagement } from '@/components/admin/FamilyPassManagement';
import { ModeratorDashboard } from '@/components/admin/ModeratorDashboard';
import { RegistrantsManagement } from '@/components/admin/RegistrantsManagement';
import { VaultClaimsManagement } from '@/components/admin/VaultClaimsManagement';
import { UserProgressDashboard } from '@/components/admin/user-progress';

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
              value="vault-claims"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Gift className="h-4 w-4 mr-2" />
              Vault Claims
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
            <TabsTrigger
              value="user-progress"
              className="text-white data-[state=active]:bg-white/20"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              User Progress
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="analytics">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading analytics...</p>
                  </div>
                </div>
              }
            >
              <EnhancedAnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="role-management">
            <RoleManagementPanel users={users} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} setUsers={() => refetch()} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="courses">
            <CourseManagementEnhanced
              courses={courses}
              setCourses={() => refetch()}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="enrollments">
            <EnrollmentManagementEnhanced enrollments={enrollments} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="family-pass">
            <FamilyPassManagement />
          </TabsContent>

          <TabsContent value="vault-claims">
            <VaultClaimsManagement />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementManagementEnhanced
              announcements={announcements}
              setAnnouncements={() => refetch()}
              userId={user?.id || ''}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="events">
            <EventsManagementEnhanced />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementManager />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundProcessor />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTrackingDashboard />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentTracker />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesManagement />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTicketManagement />
          </TabsContent>

          <TabsContent value="moderation">
            <ModeratorDashboard />
          </TabsContent>

          <TabsContent value="registrants">
            <RegistrantsManagement />
          </TabsContent>

          <TabsContent value="user-progress">
            <UserProgressDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
