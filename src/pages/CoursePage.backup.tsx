import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useExercises } from '@/hooks/useExercises';
import { useWorkshops } from '@/hooks/useWorkshops';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Lock,
  Loader2,
  AlertCircle,
  HelpCircle,
  PenTool,
  UsersRound,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import type {
  Course,
  UserProgress,
  CourseMaterial,
  Assignment,
} from '@/components/course-page/types';
import { CourseHeader } from '@/components/course-page/CourseHeader';
import { CourseOverviewTab } from '@/components/course-page/CourseOverviewTab';
import { CourseMaterialsTab } from '@/components/course-page/CourseMaterialsTab';
import { CourseQuizzesTab } from '@/components/course-page/CourseQuizzesTab';
import { CourseExercisesTab } from '@/components/course-page/CourseExercisesTab';
import { CourseWorkshopsTab } from '@/components/course-page/CourseWorkshopsTab';
import { CourseAssignmentsTab } from '@/components/course-page/CourseAssignmentsTab';
import { MaterialViewerDialog } from '@/components/course-page/MaterialViewerDialog';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments, loading: enrollmentsLoading } = useEnrollments();

  // Gamification hooks
  const { quizzes, quizzesLoading } = useQuizzes(courseId ? parseInt(courseId) : undefined);
  const { exercises, exercisesLoading } = useExercises(courseId ? parseInt(courseId) : undefined);
  const { workshops, workshopsLoading } = useWorkshops(courseId ? parseInt(courseId) : undefined);

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewingMaterial, setViewingMaterial] = useState<CourseMaterial | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!enrollmentsLoading && courseId) {
      fetchCourseData();
    }
  }, [user, courseId, enrollmentsLoading]);

  useEffect(() => {
    if (enrollments && courseId) {
      const enrolled = enrollments.some(e => e.course_id === parseInt(courseId));
      setIsEnrolled(enrolled);
    }
  }, [enrollments, courseId]);

  const fetchCourseData = async () => {
    if (!courseId || !user) return;

    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      setProgress(progressData);

      // Fetch course materials
      const { data: materialsData } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      setMaterials(materialsData || []);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      setAssignments(assignmentsData || []);
    } catch (error) {
      logger.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newProgress: number) => {
    if (!user || !courseId) return;

    try {
      const { error } = await supabase.from('user_progress').upsert({
        user_id: user.id,
        course_id: parseInt(courseId),
        progress_percentage: newProgress,
        last_accessed: new Date().toISOString(),
      });

      if (!error) {
        setProgress(prev => ({
          ...prev,
          progress_percentage: newProgress,
          last_accessed: new Date().toISOString(),
        }));
      }
    } catch (error) {
      logger.error('Error updating progress:', error);
    }
  };

  if (loading || enrollmentsLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-hero flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-white" aria-label="Loading course content" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center" role="alert">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/dashboard')} aria-label="Return to dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center" role="alert">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto text-yellow-500 mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold mb-2">Enrollment Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to enroll in this course to access its content.
            </p>
            <div className="flex gap-3" role="group" aria-label="Course enrollment actions">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                aria-label="Return to dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Back to Dashboard
              </Button>
              <Button
                onClick={() => navigate('/#training-programs')}
                aria-label="Browse available courses"
              >
                <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = progress?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div
        className="container mx-auto px-4 py-8"
        role="main"
        aria-label={`${course.title} course content`}
      >
        {/* Header */}
        <CourseHeader
          course={course}
          progressPercentage={progressPercentage}
          courseId={courseId!}
          onBack={() => navigate('/dashboard')}
        />

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
          aria-label="Course content sections"
        >
          <TabsList
            className="bg-white/10 border-white/20"
            role="tablist"
            aria-label="Course navigation tabs"
          >
            <TabsTrigger
              value="overview"
              className="text-white data-[state=active]:bg-white/20"
              aria-label="Overview tab"
              aria-controls="overview-panel"
            >
              <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              className="text-white data-[state=active]:bg-white/20"
              aria-label="Course materials tab"
              aria-controls="materials-panel"
            >
              <Video className="h-4 w-4 mr-2" aria-hidden="true" />
              Materials
            </TabsTrigger>
            <TabsTrigger
              value="quizzes"
              className="text-white data-[state=active]:bg-white/20"
              aria-label={`Quizzes tab, ${quizzes?.length || 0} quizzes available`}
              aria-controls="quizzes-panel"
            >
              <HelpCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              Quizzes ({quizzes?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="exercises"
              className="text-white data-[state=active]:bg-white/20"
              aria-label={`Exercises tab, ${exercises?.length || 0} exercises available`}
              aria-controls="exercises-panel"
            >
              <PenTool className="h-4 w-4 mr-2" aria-hidden="true" />
              Exercises ({exercises?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="workshops"
              className="text-white data-[state=active]:bg-white/20"
              aria-label={`Workshops tab, ${workshops?.length || 0} workshops available`}
              aria-controls="workshops-panel"
            >
              <UsersRound className="h-4 w-4 mr-2" aria-hidden="true" />
              Workshops ({workshops?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="text-white data-[state=active]:bg-white/20"
              aria-label={`Assignments tab, ${assignments.length} assignments available`}
              aria-controls="assignments-panel"
            >
              <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
              Assignments ({assignments.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <CourseOverviewTab course={course} materials={materials} assignments={assignments} />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <CourseMaterialsTab
              materials={materials}
              courseId={courseId!}
              onViewMaterial={setViewingMaterial}
            />
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <CourseQuizzesTab quizzes={quizzes} loading={quizzesLoading} onNavigate={navigate} />
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises">
            <CourseExercisesTab
              exercises={exercises}
              loading={exercisesLoading}
              onNavigate={navigate}
            />
          </TabsContent>

          {/* Workshops Tab */}
          <TabsContent value="workshops">
            <CourseWorkshopsTab
              workshops={workshops}
              loading={workshopsLoading}
              onNavigate={navigate}
            />
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <CourseAssignmentsTab assignments={assignments} onNavigate={navigate} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Material Viewer Dialog */}
      <MaterialViewerDialog
        material={viewingMaterial}
        courseId={courseId!}
        isOpen={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
      />
    </div>
  );
}
