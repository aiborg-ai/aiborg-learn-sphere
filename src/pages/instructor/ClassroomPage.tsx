import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from '@/components/ui/icons';
import { LiveClassroomDashboard } from '@/components/instructor/LiveClassroomDashboard';
import { logger } from '@/utils/logger';

/**
 * Instructor Classroom Page
 *
 * Route: /instructor/classroom/:courseId
 * Query params: ?lessonId=xxx&lessonTitle=xxx
 *
 * Features:
 * - Access control (instructor/admin only)
 * - Real-time classroom management
 * - Student presence tracking
 * - Live Q&A
 * - Progress monitoring
 */
export default function ClassroomPage() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();

  const lessonId = searchParams.get('lessonId') || undefined;
  const lessonTitle = searchParams.get('lessonTitle') || undefined;

  // Access control
  useEffect(() => {
    if (!authLoading && !user) {
      logger.warn('Unauthenticated user trying to access classroom', { courseId });
      navigate('/auth');
      return;
    }

    if (profile && profile.role !== 'instructor' && profile.role !== 'admin') {
      logger.warn('Non-instructor trying to access classroom', {
        userId: user?.id,
        role: profile.role,
        courseId,
      });
      navigate('/dashboard');
      return;
    }
  }, [user, profile, authLoading, navigate, courseId]);

  // Find course details
  const course = courses.find(c => c.id === Number(courseId));

  if (authLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    return null; // Will redirect via useEffect
  }

  if (!courseId || !course) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Course Not Found</h1>
          <p className="text-white/80 mb-6">
            The classroom you're trying to access doesn't exist or you don't have permission to view
            it.
          </p>
          <Button variant="outline" className="btn-outline-ai" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <div className="container mx-auto px-4 pt-4">
        <Button
          variant="outline"
          className="btn-outline-ai mb-4"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </div>

      {/* Main Dashboard */}
      <LiveClassroomDashboard
        courseId={Number(courseId)}
        courseName={course.title}
        lessonId={lessonId}
        lessonTitle={lessonTitle}
      />
    </div>
  );
}
