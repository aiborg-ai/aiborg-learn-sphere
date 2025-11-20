import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
  Star,
  Play,
  Loader2,
  Award,
  Route as RouteIcon,
} from '@/components/ui/icons';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

interface CourseInPath {
  id: string;
  title: string;
  order_index: number;
  is_required: boolean;
  [key: string]: unknown;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnail_url?: string;
  difficulty_level: string;
  estimated_hours?: number;
  prerequisites?: string[];
  outcomes?: string[];
  is_published: boolean;
  created_at: string;
  courses: CourseInPath[];
  enrollment?: {
    started_at: string;
    completed_at?: string;
    progress_percentage: number;
    current_course_index: number;
  };
}

const difficultyConfig = {
  beginner: { color: 'bg-green-500', label: 'Beginner', icon: Star },
  intermediate: { color: 'bg-blue-500', label: 'Intermediate', icon: TrendingUp },
  advanced: { color: 'bg-purple-500', label: 'Advanced', icon: Target },
  expert: { color: 'bg-orange-500', label: 'Expert', icon: Award },
};

export default function LearningPathsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'enrolled' | 'completed'>('all');
  const [filteredPaths, setFilteredPaths] = useState<LearningPath[]>([]);

  const fetchLearningPaths = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all published learning paths with their courses
      const { data: pathsData, error: pathsError } = await supabase
        .from('learning_paths')
        .select(
          `
          *,
          learning_path_courses!inner(
            order_index,
            is_required,
            courses(*)
          )
        `
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (pathsError) throw pathsError;

      // Fetch user enrollments in learning paths
      const { data: enrollmentsData } = await supabase
        .from('user_learning_paths')
        .select('*')
        .eq('user_id', user.id);

      // Enrich paths with enrollment data
      const enrichedPaths =
        pathsData?.map(path => {
          const enrollment = enrollmentsData?.find(e => e.learning_path_id === path.id);
          const courses =
            path.learning_path_courses
              ?.sort(
                (a: { order_index: number }, b: { order_index: number }) =>
                  a.order_index - b.order_index
              )
              .map(
                (lpc: {
                  courses: Record<string, unknown>;
                  order_index: number;
                  is_required: boolean;
                }) => ({
                  ...lpc.courses,
                  order_index: lpc.order_index,
                  is_required: lpc.is_required,
                })
              ) || [];

          return {
            ...path,
            courses,
            enrollment: enrollment || undefined,
          };
        }) || [];

      setLearningPaths(enrichedPaths);
    } catch (error) {
      logger.error('Error fetching learning paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning paths',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const filterPaths = useCallback(() => {
    let filtered = [...learningPaths];

    if (activeTab === 'enrolled') {
      filtered = filtered.filter(p => p.enrollment && !p.enrollment.completed_at);
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(p => p.enrollment && p.enrollment.completed_at);
    }

    setFilteredPaths(filtered);
  }, [learningPaths, activeTab]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchLearningPaths();
  }, [user, navigate, fetchLearningPaths]);

  useEffect(() => {
    filterPaths();
  }, [filterPaths]);

  const handleEnroll = async (pathId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('user_learning_paths').insert({
        user_id: user.id,
        learning_path_id: pathId,
        started_at: new Date().toISOString(),
        progress_percentage: 0,
        current_course_index: 0,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Enrolled',
            description: 'You are already enrolled in this learning path',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Enrolled!',
        description: 'You have successfully enrolled in this learning path',
      });

      fetchLearningPaths();
    } catch (error) {
      logger.error('Error enrolling in learning path:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll in learning path',
        variant: 'destructive',
      });
    }
  };

  const LearningPathCard = ({ path }: { path: LearningPath }) => {
    const difficulty = path.difficulty_level || 'beginner';
    const difficultyInfo = difficultyConfig[difficulty as keyof typeof difficultyConfig];
    const isEnrolled = !!path.enrollment;
    const progress = path.enrollment?.progress_percentage || 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{path.title}</CardTitle>
              <CardDescription className="line-clamp-2">{path.description}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={difficultyInfo.color}>{difficultyInfo.label}</Badge>
            {path.estimated_hours && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {path.estimated_hours}h
              </Badge>
            )}
            <Badge variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              {path.courses.length} courses
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isEnrolled && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Course List Preview */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Courses:</p>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {path.courses.slice(0, 5).map((course, index: number) => (
                  <div key={course.id} className="flex items-center gap-2 text-sm">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="flex-1 truncate">{course.title}</span>
                    {course.is_required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                ))}
                {path.courses.length > 5 && (
                  <p className="text-xs text-muted-foreground pl-8">
                    +{path.courses.length - 5} more courses
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Outcomes */}
          {path.outcomes && path.outcomes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">What you'll learn:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {path.outcomes.slice(0, 3).map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isEnrolled ? (
              <Button
                className="flex-1"
                onClick={() => {
                  const currentCourse = path.courses[path.enrollment?.current_course_index || 0];
                  if (currentCourse) {
                    navigate(`/course/${currentCourse.id}`);
                  }
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/learning-path/${path.id}`)}
                >
                  View Details
                </Button>
                <Button className="flex-1" onClick={() => handleEnroll(path.id)}>
                  Enroll Now
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const stats = {
    total: learningPaths.length,
    enrolled: learningPaths.filter(p => p.enrollment && !p.enrollment.completed_at).length,
    completed: learningPaths.filter(p => p.enrollment && p.enrollment.completed_at).length,
  };

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

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                <RouteIcon className="h-8 w-8 text-purple-400" />
                Learning Paths
              </h1>
              <p className="text-white/80">
                Curated course sequences to help you master specific skills
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Available Paths</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <RouteIcon className="h-8 w-8 text-white/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/20 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-white">{stats.enrolled}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/20 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'all' | 'enrolled' | 'completed')}
        >
          <TabsList className="bg-white/10 border-white/20 mb-6">
            <TabsTrigger value="all" className="text-white data-[state=active]:bg-white/20">
              All Paths ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="text-white data-[state=active]:bg-white/20">
              My Paths ({stats.enrolled})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-white data-[state=active]:bg-white/20">
              Completed ({stats.completed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredPaths.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <RouteIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No learning paths found</p>
                  <p className="text-muted-foreground">
                    {activeTab === 'enrolled'
                      ? "You haven't enrolled in any learning paths yet"
                      : activeTab === 'completed'
                        ? "You haven't completed any learning paths yet"
                        : 'No learning paths are currently available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPaths.map(path => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
