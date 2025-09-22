import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Clock, CheckCircle, BookOpen, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export interface UserProgress {
  courseId: number;
  courseTitle: string;
  progressPercentage: number;
  timeSpentMinutes: number;
  lastAccessed: string;
  completedAt: string | null;
}

interface Enrollment {
  id: string;
  course_id: number;
  user_id: string;
  enrolled_at: string;
}

interface Course {
  id: number;
  title: string;
  level: string;
  duration: string;
  mode: string;
}

interface CourseProgressProps {
  userProgress: UserProgress[];
  enrollments: Enrollment[];
  courses: Course[];
}

export function CourseProgress({ userProgress, enrollments, courses }: CourseProgressProps) {
  const navigate = useNavigate();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEnrolledCourseDetails = (courseId: number) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    const course = courses.find(c => c.id === courseId);
    return { enrollment, course };
  };

  return (
    <>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Progress
          </CardTitle>
          <CardDescription>
            Track your progress across all enrolled courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {userProgress.length > 0 ? (
                userProgress.map((progress) => {
                  const { course } = getEnrolledCourseDetails(progress.courseId);
                  return (
                    <div
                      key={progress.courseId}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{progress.courseTitle}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(progress.timeSpentMinutes)}
                            </span>
                            <span>
                              Last accessed: {new Date(progress.lastAccessed).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {progress.completedAt && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-semibold">{progress.progressPercentage}%</span>
                        </div>
                        <Progress value={progress.progressPercentage} className="h-2" />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => course && navigate(`/course/${course.id}`)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Continue Learning
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No course progress yet. Start learning to track your progress!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Enrolled Courses
          </CardTitle>
          <CardDescription>
            All courses you're currently enrolled in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {enrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.course_id);
              const progress = userProgress.find(p => p.courseId === enrollment.course_id);

              if (!course) return null;

              return (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold">{course.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline">{course.level}</Badge>
                      <span>{course.duration}</span>
                      <span>{course.mode}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {progress && (
                      <div className="text-right">
                        <div className="text-sm font-medium">{progress.progressPercentage}%</div>
                        <Progress value={progress.progressPercentage} className="w-20 h-2" />
                      </div>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })}

            {enrollments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  You haven't enrolled in any courses yet.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}