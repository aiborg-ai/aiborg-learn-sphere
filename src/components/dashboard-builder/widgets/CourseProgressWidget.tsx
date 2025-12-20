/**
 * Course Progress Widget
 *
 * Displays progress across all enrolled courses
 */

import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, ProgressWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  duration: string | null;
}

interface CourseEnrollment {
  id: string;
  progress: number | null;
  completed_at: string | null;
  course: Course | null;
}

export function CourseProgressWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ProgressWidgetConfig;
  const showPercentage = config.showPercentage !== false;
  const showDetails = config.showDetails !== false;
  const sortBy = config.sortBy || 'progress';
  const limit = config.limit || 5;

  // Fetch course progress
  const { data: courses, isLoading } = useQuery({
    queryKey: ['course-progress', widget.id, sortBy, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          id,
          progress,
          completed_at,
          course:courses(
            id,
            title,
            duration
          )
        `
        )
        .eq('user_id', user.id)
        .order(
          sortBy === 'progress' ? 'progress' : sortBy === 'recent' ? 'updated_at' : 'progress',
          { ascending: false }
        )
        .limit(limit);

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No enrolled courses yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map(enrollment => {
        const course = enrollment.course;
        const progress = enrollment.progress || 0;
        const isCompleted = !!enrollment.completed_at;

        return (
          <div key={enrollment.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium line-clamp-1">{course?.title || 'Untitled Course'}</h4>
                {showDetails && course?.duration && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </p>
                )}
              </div>
              {showPercentage && (
                <div className="ml-2">
                  <span className={cn('text-sm font-semibold', isCompleted && 'text-green-600')}>
                    {Math.round(progress)}%
                  </span>
                </div>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            {isCompleted && showDetails && <p className="text-xs text-green-600">✓ Completed</p>}
          </div>
        );
      })}
    </div>
  );
}

export default CourseProgressWidget;
