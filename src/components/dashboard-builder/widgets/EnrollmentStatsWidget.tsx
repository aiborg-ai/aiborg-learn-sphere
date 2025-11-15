/**
 * Enrollment Stats Widget
 *
 * Statistics about enrolled courses with breakdown
 */

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface EnrollmentStatsConfig extends BaseWidgetConfig {
  showBreakdown?: boolean;
  showProgress?: boolean;
}

export function EnrollmentStatsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as EnrollmentStatsConfig;
  const showBreakdown = config.showBreakdown !== false;
  const showProgress = config.showProgress !== false;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['enrollment-stats', widget.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all enrollments with course details
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          id,
          progress,
          status,
          completed_at,
          course:courses(
            category
          )
        `
        )
        .eq('user_id', user.id);

      if (error) throw error;

      const total = enrollments?.length || 0;
      const completed = enrollments?.filter(e => e.completed_at).length || 0;
      const inProgress = enrollments?.filter(e => !e.completed_at && (e.progress || 0) > 0).length || 0;
      const notStarted = enrollments?.filter(e => !e.progress || e.progress === 0).length || 0;
      const avgProgress =
        total > 0
          ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / total
          : 0;

      // Category breakdown
      const categoryCount: Record<string, number> = {};
      enrollments?.forEach(e => {
        const category = (e.course as any)?.category || 'Other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      return {
        total,
        completed,
        inProgress,
        notStarted,
        avgProgress,
        categoryCount,
      };
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No enrollments yet</p>
        <p className="text-xs mt-1">Enroll in your first course!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{Math.round(stats.avgProgress)}%</span>
          </div>
          <Progress value={stats.avgProgress} className="h-2" />
        </div>
      )}

      {/* Status Breakdown */}
      {showBreakdown && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-lg font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-500/10">
            <Clock className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-lg font-bold">{stats.notStarted}</p>
              <p className="text-xs text-muted-foreground">Not Started</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(stats.categoryCount).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">By Category</p>
          {Object.entries(stats.categoryCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category}</span>
                <span className="font-semibold">{count} courses</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default EnrollmentStatsWidget;
