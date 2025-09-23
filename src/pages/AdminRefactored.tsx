import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Users, BookOpen, Megaphone, Shield, UserCheck, Star, Calendar, Trophy, FileJson } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Import the new components
import { UserManagement, type UserProfile } from '@/components/admin/UserManagement';
import { CourseManagement, type Course } from '@/components/admin/CourseManagement';
import { EnrollmentManagement, type Enrollment } from '@/components/admin/EnrollmentManagement';
import { AnnouncementManagement, type Announcement } from '@/components/admin/AnnouncementManagement';
import { AchievementManager } from '@/components/admin/AchievementManager';
import BlogManager from './Admin/BlogManager';

// Import the existing components that were already separated
function ReviewsManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
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
        .select(`
          *,
          profiles(display_name, email),
          courses(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
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

      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, display: !currentDisplay } : r
      ));

      toast({
        title: "Success",
        description: `Review ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      logger.error('Error updating review display:', error);
      toast({
        title: "Error",
        description: "Failed to update review display",
        variant: "destructive",
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

      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, approved: !currentApproval } : r
      ));

      toast({
        title: "Success",
        description: `Review ${!currentApproval ? 'approved' : 'unapproved'}`,
      });
    } catch (error) {
      logger.error('Error updating review approval:', error);
      toast({
        title: "Error",
        description: "Failed to update review approval",
        variant: "destructive",
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
        {reviews.map(review => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{review.profiles?.display_name || 'Anonymous'}</p>
                <p className="text-sm text-gray-600">{review.courses?.title}</p>
                <p className="mt-2">{review.comment}</p>
                <div className="flex gap-2 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={review.display ? "default" : "outline"}
                  onClick={() => toggleReviewDisplay(review.id, review.display)}
                >
                  {review.display ? 'Hide' : 'Show'}
                </Button>
                <Button
                  size="sm"
                  variant={review.approved ? "success" : "outline"}
                  onClick={() => toggleReviewApproval(review.id, review.approved)}
                >
                  {review.approved ? 'Unapprove' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsManagement() {
  const [events, setEvents] = useState<any[]>([]);
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
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
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

      setEvents(events.map(e =>
        e.id === eventId ? { ...e, display: !currentDisplay } : e
      ));

      toast({
        title: "Success",
        description: `Event ${!currentDisplay ? 'shown' : 'hidden'} on frontend`,
      });
    } catch (error) {
      logger.error('Error updating event display:', error);
      toast({
        title: "Error",
        description: "Failed to update event display",
        variant: "destructive",
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

      setEvents(events.map(e =>
        e.id === eventId ? { ...e, is_active: !currentStatus } : e
      ));

      toast({
        title: "Success",
        description: `Event ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      logger.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
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
                  variant={event.display ? "default" : "outline"}
                  onClick={() => toggleEventDisplay(event.id, event.display)}
                >
                  {event.display ? 'Hide' : 'Show'}
                </Button>
                <Button
                  size="sm"
                  variant={event.is_active ? "success" : "outline"}
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

export default function AdminRefactored() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, profile, navigate]);

  const fetchData = async () => {
    setLoading(true);
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
        .select(`
          *,
          course_audiences(audience)
        `)
        .order('sort_order', { ascending: true });

      if (coursesError) throw coursesError;

      const coursesWithAudiences = (coursesData || []).map(course => ({
        ...course,
        audiences: course.course_audiences?.map((ca: any) => ca.audience) || []
      }));
      setCourses(coursesWithAudiences);

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles(display_name, email),
          courses(title, start_date, price)
        `)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

    } catch (error) {
      logger.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 flex-wrap h-auto p-2">
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
            <TabsTrigger value="announcements" className="text-white data-[state=active]:bg-white/20">
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
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white/20">
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement
              users={users}
              setUsers={setUsers}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="courses">
            <CourseManagement
              courses={courses}
              setCourses={setCourses}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="enrollments">
            <EnrollmentManagement enrollments={enrollments} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementManagement
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
            <EventsManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}