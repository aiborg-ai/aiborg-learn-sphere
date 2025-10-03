import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useEnrollments';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Download,
  CheckCircle,
  Lock,
  Play,
  Clock,
  Award,
  Users,
  Calendar,
  Target,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { EnhancedVideoPlayer } from '@/components/EnhancedVideoPlayer';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { DownloadButton } from '@/components/downloads/DownloadButton';
import { WatchLaterButton } from '@/components/playlists/WatchLaterButton';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments, loading: enrollmentsLoading } = useEnrollments();

  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewingMaterial, setViewingMaterial] = useState<any>(null);

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
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: parseInt(courseId),
          progress_percentage: newProgress,
          last_accessed: new Date().toISOString()
        });

      if (!error) {
        setProgress((prev: any) => ({
          ...prev,
          progress_percentage: newProgress,
          last_accessed: new Date().toISOString()
        }));
      }
    } catch (error) {
      logger.error('Error updating progress:', error);
    }
  };

  if (loading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Enrollment Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to enroll in this course to access its content.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate('/#training-programs')}>
                <BookOpen className="h-4 w-4 mr-2" />
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="btn-outline-ai mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-white">
                  {course.title}
                </h1>
                <BookmarkButton
                  type="course"
                  contentId={courseId!}
                  title={course.title}
                  variant="ghost"
                  size="default"
                  className="text-white hover:bg-white/10"
                  showLabel
                />
              </div>
              <p className="text-white/80 mb-4 max-w-3xl">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {course.level}
                </Badge>
                <span className="flex items-center gap-2 text-white/80">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-2 text-white/80">
                  <Users className="h-4 w-4" />
                  {course.mode}
                </span>
                <span className="flex items-center gap-2 text-white/80">
                  <Calendar className="h-4 w-4" />
                  Starts: {new Date(course.start_date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Card className="w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completion</span>
                    <span className="font-bold">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  {progressPercentage === 100 && (
                    <Badge variant="success" className="w-full justify-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-white data-[state=active]:bg-white/20">
              <Video className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-white data-[state=active]:bg-white/20">
              <FileText className="h-4 w-4 mr-2" />
              Assignments ({assignments.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Course Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.features && course.features.length > 0 ? (
                      course.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No features listed</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Prerequisites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {course.prerequisites || 'No prerequisites required'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {materials.length === 0 && assignments.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Course materials are being prepared. They will be available soon. Check back later or contact your instructor.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>
                  Access videos, documents, and resources for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.map((material) => {
                      const isPdf = material.material_type === 'handbook' ||
                                   material.file_url?.toLowerCase().endsWith('.pdf');
                      const isVideo = material.material_type === 'recording';

                      return (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isVideo && (
                              <Video className="h-5 w-5 text-blue-500" />
                            )}
                            {isPdf && (
                              <FileText className="h-5 w-5 text-green-500" />
                            )}
                            {!isVideo && !isPdf && (
                              <Download className="h-5 w-5 text-purple-500" />
                            )}
                            <div>
                              <h4 className="font-medium">{material.title}</h4>
                              {material.description && (
                                <p className="text-sm text-muted-foreground">
                                  {material.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {material.material_type}
                                </Badge>
                                {material.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.floor(material.duration / 60)} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <BookmarkButton
                              type="material"
                              contentId={material.id}
                              title={material.title}
                              courseId={courseId ? parseInt(courseId) : undefined}
                              variant="ghost"
                              size="sm"
                            />
                            {isVideo && (
                              <WatchLaterButton
                                materialId={material.id}
                                courseId={courseId ? parseInt(courseId) : undefined}
                                variant="ghost"
                                size="sm"
                              />
                            )}
                            {(isPdf || isVideo) && (
                              <Button
                                size="sm"
                                onClick={() => setViewingMaterial(material)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            <DownloadButton
                              materialId={material.id}
                              courseId={courseId ? parseInt(courseId) : undefined}
                              fileName={material.title || 'download'}
                              fileUrl={material.file_url}
                              fileSize={material.file_size}
                              fileType={
                                isVideo ? 'video' :
                                isPdf ? 'pdf' :
                                material.material_type === 'presentation' ? 'presentation' :
                                'other'
                              }
                              variant="outline"
                              size="sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No materials available yet. Materials will be added by your instructor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignments & Homework</CardTitle>
                <CardDescription>
                  View and submit your course assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.description}
                            </p>
                          </div>
                          {assignment.due_date && (
                            <Badge variant="outline">
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/assignment/${assignment.id}`)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Assignment
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No assignments yet. Assignments will be posted by your instructor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Material Viewer Dialog */}
      <Dialog open={!!viewingMaterial} onOpenChange={() => setViewingMaterial(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>{viewingMaterial?.title}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {viewingMaterial && (
              <>
                {/* PDF Viewer */}
                {(viewingMaterial.material_type === 'handbook' ||
                  viewingMaterial.file_url?.toLowerCase().endsWith('.pdf')) && (
                  <PDFViewer
                    fileUrl={viewingMaterial.file_url}
                    contentId={viewingMaterial.id}
                    courseId={courseId ? parseInt(courseId) : undefined}
                    title={viewingMaterial.title}
                    onProgressUpdate={(progress) => {
                      logger.log(`Material progress: ${progress}%`);
                    }}
                  />
                )}

                {/* Video Player */}
                {viewingMaterial.material_type === 'recording' && (
                  <EnhancedVideoPlayer
                    videoUrl={viewingMaterial.file_url}
                    contentId={viewingMaterial.id}
                    courseId={courseId ? parseInt(courseId) : undefined}
                    title={viewingMaterial.title}
                    onProgressUpdate={(progress) => {
                      logger.log(`Material progress: ${progress}%`);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
