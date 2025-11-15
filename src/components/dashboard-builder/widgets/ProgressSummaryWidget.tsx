/**
 * Progress Summary Widget
 *
 * Overall progress summary with key milestones
 */

import { useQuery } from '@tanstack:react-query';
import { Target, Award, BookOpen, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface ProgressSummaryConfig extends BaseWidgetConfig {
  showMilestones?: boolean;
}

export function ProgressSummaryWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ProgressSummaryConfig;
  const showMilestones = config.showMilestones !== false;

  const { data: summary, isLoading } = useQuery({
    queryKey: ['progress-summary', widget.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all progress data
      const [enrollments, achievements, certificates] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('progress, completed_at')
          .eq('user_id', user.id),
        supabase
          .from('user_achievements')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('certificates')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
      ]);

      const totalCourses = enrollments.data?.length || 0;
      const completedCourses = enrollments.data?.filter(e => e.completed_at).length || 0;
      const avgProgress =
        totalCourses > 0
          ? enrollments.data.reduce((sum, e) => sum + (e.progress || 0), 0) / totalCourses
          : 0;

      const totalAchievements = achievements.count || 0;
      const totalCertificates = certificates.count || 0;

      // Calculate milestones
      const milestones = [
        {
          id: '1',
          title: 'First Course',
          description: 'Enroll in your first course',
          completed: totalCourses > 0,
          icon: BookOpen,
        },
        {
          id: '2',
          title: 'First Achievement',
          description: 'Earn your first achievement',
          completed: totalAchievements > 0,
          icon: Award,
        },
        {
          id: '3',
          title: 'Course Completion',
          description: 'Complete your first course',
          completed: completedCourses > 0,
          icon: Target,
        },
        {
          id: '4',
          title: 'Skill Master',
          description: 'Complete 5 courses',
          completed: completedCourses >= 5,
          icon: TrendingUp,
        },
      ];

      return {
        totalCourses,
        completedCourses,
        avgProgress,
        totalAchievements,
        totalCertificates,
        milestones,
      };
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!summary) {
    return null;
  }

  const completionRate = summary.totalCourses > 0
    ? (summary.completedCourses / summary.totalCourses) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Overall Progress</h4>
          <span className="text-sm font-semibold">{Math.round(summary.avgProgress)}%</span>
        </div>
        <Progress value={summary.avgProgress} className="h-2" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-blue-500/10">
          <p className="text-lg font-bold">{summary.completedCourses}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-500/10">
          <p className="text-lg font-bold">{summary.totalAchievements}</p>
          <p className="text-xs text-muted-foreground">Achievements</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <p className="text-lg font-bold">{summary.totalCertificates}</p>
          <p className="text-xs text-muted-foreground">Certificates</p>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Completion Rate</span>
          <span className="text-sm font-semibold">{Math.round(completionRate)}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>

      {/* Milestones */}
      {showMilestones && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Milestones</h4>
          {summary.milestones.map(milestone => {
            const IconComponent = milestone.icon;
            return (
              <div
                key={milestone.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  milestone.completed
                    ? 'bg-green-500/10 text-green-900 dark:text-green-100'
                    : 'bg-muted/50 text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    milestone.completed ? 'bg-green-500/20' : 'bg-background'
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{milestone.title}</p>
                  <p className="text-xs opacity-75">{milestone.description}</p>
                </div>
                {milestone.completed && (
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProgressSummaryWidget;
