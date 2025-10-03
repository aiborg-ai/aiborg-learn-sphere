import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Filter,
  Grid,
  List,
  Search,
  TrendingUp,
  Loader2,
  Calendar,
  Award,
  Play
} from 'lucide-react';
import { logger } from '@/utils/logger';

interface EnrichedEnrollment {
  id: string;
  course_id: number;
  enrolled_at: string;
  status: string;
  course: any;
  progress?: {
    progress_percentage: number;
    time_spent_minutes: number;
    last_accessed: string;
    completed_at?: string;
  };
}

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments, loading: enrollmentsLoading } = useEnrollments();
  const { courses } = useCourses();

  const [enrichedEnrollments, setEnrichedEnrollments] = useState<EnrichedEnrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrichedEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!enrollmentsLoading && enrollments && courses) {
      fetchEnrichedData();
    }
  }, [user, enrollmentsLoading, enrollments, courses, navigate]);

  useEffect(() => {
    filterEnrollments();
  }, [enrichedEnrollments, searchQuery, activeTab]);

  const fetchEnrichedData = async () => {
    if (!user || !enrollments) return;

    try {
      setLoading(true);

      const enriched: EnrichedEnrollment[] = [];

      for (const enrollment of enrollments) {
        const course = courses?.find(c => c.id === enrollment.course_id);

        // Fetch progress for this course
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', enrollment.course_id)
          .single();

        enriched.push({
          id: enrollment.id,
          course_id: enrollment.course_id,
          enrolled_at: enrollment.enrolled_at,
          status: enrollment.status,
          course,
          progress: progressData || undefined
        });
      }

      setEnrichedEnrollments(enriched);
    } catch (error) {
      logger.error('Error fetching enriched enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = () => {
    let filtered = [...enrichedEnrollments];

    // Filter by status
    if (activeTab === 'in_progress') {
      filtered = filtered.filter(e =>
        e.progress &&
        e.progress.progress_percentage > 0 &&
        e.progress.progress_percentage < 100
      );
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(e =>
        e.progress &&
        e.progress.progress_percentage === 100
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.course?.title?.toLowerCase().includes(query) ||
        e.course?.description?.toLowerCase().includes(query) ||
        e.course?.category?.toLowerCase().includes(query)
      );
    }

    setFilteredEnrollments(filtered);
  };

  const getStatusBadge = (enrollment: EnrichedEnrollment) => {
    const progress = enrollment.progress?.progress_percentage || 0;

    if (progress === 100) {
      return <Badge className="bg-green-500">Completed</Badge>;
    } else if (progress > 0) {
      return <Badge className="bg-blue-500">In Progress</Badge>;
    } else {
      return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const CourseCard = ({ enrollment }: { enrollment: EnrichedEnrollment }) => {
    const progress = enrollment.progress?.progress_percentage || 0;
    const timeSpent = enrollment.progress?.time_spent_minutes || 0;
    const lastAccessed = enrollment.progress?.last_accessed;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                {enrollment.course?.title || 'Untitled Course'}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {enrollment.course?.description || 'No description'}
              </CardDescription>
            </div>
            {getStatusBadge(enrollment)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.floor(timeSpent / 60)}h {timeSpent % 60}m spent
              </div>
              {lastAccessed && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(lastAccessed).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Category & Price */}
            <div className="flex items-center gap-2 flex-wrap">
              {enrollment.course?.category && (
                <Badge variant="outline">{enrollment.course.category}</Badge>
              )}
              {enrollment.course?.price === 0 ? (
                <Badge variant="secondary">Free</Badge>
              ) : (
                <Badge variant="default">
                  ${enrollment.course?.price}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => navigate(`/course/${enrollment.course_id}`)}
              >
                <Play className="h-4 w-4 mr-2" />
                {progress > 0 ? 'Continue' : 'Start'} Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CourseListItem = ({ enrollment }: { enrollment: EnrichedEnrollment }) => {
    const progress = enrollment.progress?.progress_percentage || 0;
    const timeSpent = enrollment.progress?.time_spent_minutes || 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {enrollment.course?.title || 'Untitled Course'}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {enrollment.course?.description}
                  </p>
                </div>
                {getStatusBadge(enrollment)}
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <Progress value={progress} className="h-2" />
                </div>
                <span className="text-sm font-medium min-w-[3rem] text-right">
                  {progress}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(timeSpent / 60)}h {timeSpent % 60}m
                  </div>
                  {enrollment.course?.category && (
                    <Badge variant="outline" className="text-xs">
                      {enrollment.course.category}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/course/${enrollment.course_id}`)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {progress > 0 ? 'Continue' : 'Start'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const stats = {
    total: enrichedEnrollments.length,
    inProgress: enrichedEnrollments.filter(e =>
      e.progress && e.progress.progress_percentage > 0 && e.progress.progress_percentage < 100
    ).length,
    completed: enrichedEnrollments.filter(e =>
      e.progress && e.progress.progress_percentage === 100
    ).length,
    totalTime: enrichedEnrollments.reduce((sum, e) =>
      sum + (e.progress?.time_spent_minutes || 0), 0
    )
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
                <BookOpen className="h-8 w-8 text-blue-400" />
                My Courses
              </h1>
              <p className="text-white/80">
                Manage and track your learning journey
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Courses</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-white/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/20 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
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

            <Card className="bg-purple-500/20 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Time</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.floor(stats.totalTime / 60)}h
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-white/10 border-white/20 mb-6">
            <TabsTrigger value="all" className="text-white data-[state=active]:bg-white/20">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-white data-[state=active]:bg-white/20">
              In Progress ({stats.inProgress})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-white data-[state=active]:bg-white/20">
              Completed ({stats.completed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredEnrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No courses found</p>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Browse our course catalog to get started'}
                  </p>
                  <Link to="/">
                    <Button>Browse Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnrollments.map(enrollment => (
                  <CourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnrollments.map(enrollment => (
                  <CourseListItem key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
