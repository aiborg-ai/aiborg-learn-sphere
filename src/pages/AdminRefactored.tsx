import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
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
  FileJson,
  BarChart3,
  UserCog,
  Receipt,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Home,
  Folder,
  Ticket,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import the new components
import { UserManagement, type UserProfile } from '@/components/admin/UserManagement';
import { CourseManagementEnhanced } from '@/components/admin/CourseManagementEnhanced';
import { EnrollmentManagement, type Enrollment } from '@/components/admin/EnrollmentManagement';
import {
  AnnouncementManagementEnhanced,
  type Announcement,
} from '@/components/admin/AnnouncementManagementEnhanced';
import { EventsManagementEnhanced } from '@/components/admin/EventsManagementEnhanced';
import { AchievementManager } from '@/components/admin/AchievementManager';
import BlogManager from './Admin/BlogManager';
// Phase 1: Admin Management Panel Components
import { RoleManagementPanel } from '@/components/admin/RoleManagementPanel';
import { AnalyticsDashboardEnhanced } from '@/components/admin/AnalyticsDashboardEnhanced';
// Phase 2: Enhanced Enrollment Components
import { EnrollmentManagementEnhanced } from '@/components/admin/EnrollmentManagementEnhanced';
import { RefundProcessor } from '@/components/admin/RefundProcessor';
// Phase 3: Progress Tracking Components
import { ProgressTrackingDashboard } from '@/components/admin/ProgressTrackingDashboard';
import { AssignmentTracker } from '@/components/admin/AssignmentTracker';

// Resources Management Component
import { ResourcesManagement } from '@/components/admin/ResourcesManagement';

// Attendance Ticket Management Component
import { AttendanceTicketManagement } from '@/components/admin/AttendanceTicketManagement';

// Import the existing components that were already separated
interface Review {
  id: string;
  user_id: string;
  course_id: number;
  display_name_option: 'full_name' | 'first_name' | 'anonymous';
  review_type: 'written' | 'voice' | 'video';
  written_review: string | null;
  voice_review_url: string | null;
  video_review_url: string | null;
  course_period: string;
  course_mode: 'online' | 'in-person' | 'hybrid';
  rating: number;
  display: boolean;
  approved: boolean;
  created_at: string;
  profiles?: { display_name?: string; email?: string };
  courses?: { title: string };
}

function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          *,
          profiles(display_name, email),
          courses(title)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewDisplay = async (reviewId: string, currentDisplay: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ display: !currentDisplay })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r => (r.id === reviewId ? { ...r, display: !currentDisplay } : r)));

      toast({
        title: 'Success',
        description: `Review ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      logger.error('Error updating review display:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review display',
        variant: 'destructive',
      });
    }
  };

  const toggleReviewApproval = async (reviewId: string, currentApproval: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: !currentApproval })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r => (r.id === reviewId ? { ...r, approved: !currentApproval } : r)));

      toast({
        title: 'Success',
        description: `Review ${!currentApproval ? 'approved' : 'unapproved'}`,
      });
    } catch (error) {
      logger.error('Error updating review approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review approval',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Reviews Management</h2>
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews found</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{review.profiles?.display_name || review.profiles?.email || 'Anonymous'}</p>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {review.review_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.courses?.title}</p>

                  {review.review_type === 'written' && review.written_review && (
                    <p className="mt-2">{review.written_review}</p>
                  )}
                  {review.review_type === 'voice' && review.voice_review_url && (
                    <div className="mt-2">
                      <audio controls src={review.voice_review_url} className="w-full max-w-md" />
                    </div>
                  )}
                  {review.review_type === 'video' && review.video_review_url && (
                    <div className="mt-2">
                      <video controls src={review.video_review_url} className="w-full max-w-md" />
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Mode: {review.course_mode}</span>
                    <span>Period: {review.course_period}</span>
                    <span>Created: {new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={review.display ? 'default' : 'outline'}
                    onClick={() => toggleReviewDisplay(review.id, review.display)}
                  >
                    {review.display ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    size="sm"
                    variant={review.approved ? 'success' : 'outline'}
                    onClick={() => toggleReviewApproval(review.id, review.approved)}
                  >
                    {review.approved ? 'Unapprove' : 'Approve'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  display: boolean;
  is_active: boolean;
}

function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      logger.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEventDisplay = async (eventId: string, currentDisplay: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ display: !currentDisplay })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e => (e.id === eventId ? { ...e, display: !currentDisplay } : e)));

      toast({
        title: 'Success',
        description: `Event ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      logger.error('Error updating event display:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event display',
        variant: 'destructive',
      });
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e => (e.id === eventId ? { ...e, is_active: !currentStatus } : e)));

      toast({
        title: 'Success',
        description: `Event ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      logger.error('Error updating event status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Events Management</h2>
      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                </p>
                <p className="mt-2">{event.description}</p>
                <p className="text-sm mt-1">Location: {event.location}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={event.display ? 'default' : 'outline'}
                  onClick={() => toggleEventDisplay(event.id, event.display)}
                >
                  {event.display ? 'Hide' : 'Show'}
                </Button>
                <Button
                  size="sm"
                  variant={event.is_active ? 'success' : 'outline'}
                  onClick={() => toggleEventStatus(event.id, event.is_active)}
                >
                  {event.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Course {
  id: string;
  title: string;
  sort_order: number;
  course_audiences?: Array<{ audience: string }>;
  audiences?: string[];
  [key: string]: unknown;
}

export default function AdminRefactored() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState<string>('');
  const { user, profile, loading: authLoading, profileError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      logger.log('[Admin] Waiting for auth to load...');
      return;
    }

    logger.log('[Admin] Auth loaded, checking admin access:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasProfile: !!profile,
      profileRole: profile?.role,
      isAdmin: profile?.role === 'admin',
    });

    // Now check if user is admin
    if (!user) {
      logger.warn('[Admin] Access denied - no user authenticated');
      setAccessDenied(true);
      setDenialReason('not_authenticated');
      return;
    }

    if (!profile) {
      logger.warn('[Admin] Access denied - profile not loaded');
      setAccessDenied(true);
      setDenialReason('no_profile');
      return;
    }

    if (profile.role !== 'admin') {
      logger.warn('[Admin] Access denied - not admin role:', {
        currentRole: profile.role,
      });
      setAccessDenied(true);
      setDenialReason('not_admin');
      return;
    }

    logger.log('[Admin] Access granted - fetching admin data');
    setAccessDenied(false);
    fetchData();
  }, [user, profile, authLoading, navigate]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch courses with audiences
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(
          `
          *,
          course_audiences(audience)
        `
        )
        .order('sort_order', { ascending: true });

      if (coursesError) throw coursesError;

      const coursesWithAudiences = (coursesData || []).map(course => ({
        ...course,
        audiences: course.course_audiences?.map((ca: { audience: string }) => ca.audience) || [],
      }));
      setCourses(coursesWithAudiences);

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      // Fetch enrollments (non-fatal - page works even if this fails)
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(
          `
          *,
          profiles(display_name, email),
          courses(title, start_date, price)
        `
        )
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) {
        logger.warn('Error fetching enrollments (non-fatal):', enrollmentsError);
        setEnrollments([]);
      } else {
        setEnrollments(enrollmentsData || []);
      }
    } catch (error) {
      logger.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin data',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show access denied message if user doesn't have admin access
  if (accessDenied) {
    const getMessage = () => {
      switch (denialReason) {
        case 'not_authenticated':
          return {
            title: 'Authentication Required',
            description: 'You must be signed in to access the admin dashboard.',
            action: 'Sign In',
            actionLink: '/auth',
          };
        case 'no_profile':
          return {
            title: 'Profile Not Found',
            description:
              'Your user profile could not be loaded. Please try signing out and signing in again.',
            action: 'Go to Home',
            actionLink: '/',
          };
        case 'not_admin':
          return {
            title: 'Admin Access Required',
            description: `Your account (${user?.email}) does not have administrator privileges. Current role: ${profile?.role || 'none'}. Please contact the system administrator if you believe this is an error.`,
            action: 'Go to Home',
            actionLink: '/',
          };
        default:
          return {
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            action: 'Go to Home',
            actionLink: '/',
          };
      }
    };

    const message = getMessage();

    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="bg-white/95 backdrop-blur border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-lg font-semibold text-gray-900">{message.title}</AlertTitle>
            <AlertDescription className="mt-2 text-gray-700">
              {message.description}
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Link to={message.actionLink} className="flex-1">
                <Button className="w-full" variant="default">
                  <Home className="h-4 w-4 mr-2" />
                  {message.action}
                </Button>
              </Link>
              {denialReason === 'no_profile' && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Retry
                </Button>
              )}
            </div>
          </Alert>

          {/* Debug info in development */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-4 bg-black/80 rounded-lg text-white text-xs font-mono">
              <p className="font-bold mb-2">Debug Info:</p>
              <p>User ID: {user?.id || 'none'}</p>
              <p>Email: {user?.email || 'none'}</p>
              <p>Profile ID: {profile?.id || 'none'}</p>
              <p>Role: {profile?.role || 'none'}</p>
              <p>Denial Reason: {denialReason}</p>
              {profileError && <p className="text-red-400">Profile Error: {profileError}</p>}
              <p className="mt-2 text-yellow-400">Check browser console for detailed logs.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboardEnhanced />
          </TabsContent>

          <TabsContent value="role-management">
            <RoleManagementPanel users={users} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} setUsers={setUsers} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="courses">
            <CourseManagementEnhanced
              courses={courses}
              setCourses={setCourses}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="enrollments">
            <EnrollmentManagementEnhanced enrollments={enrollments} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementManagementEnhanced
              announcements={announcements}
              setAnnouncements={setAnnouncements}
              userId={user.id}
              onRefresh={fetchData}
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
        </Tabs>
      </div>
    </div>
  );
}
