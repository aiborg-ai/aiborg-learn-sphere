/**
 * Stats Widget
 *
 * Displays key metrics (courses, achievements, certificates, streaks)
 */

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Trophy, Award, Flame } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, StatsWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function StatsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as StatsWidgetConfig;
  const layout = config.layout || 'grid';
  const showIcons = config.showIcons !== false;
  const showTrends = config.showTrends || false;

  // Fetch stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', widget.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all stats in parallel
      const [enrollments, achievements, certificates, streaks] = await Promise.all([
        supabase.from('course_enrollments').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_achievements').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('certificates').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_streaks').select('current_streak').eq('user_id', user.id).single(),
      ]);

      return {
        courses: enrollments.count || 0,
        achievements: achievements.count || 0,
        certificates: certificates.count || 0,
        streaks: streaks.data?.current_streak || 0,
      };
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className={cn('grid gap-4', getLayoutClass(layout))}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const metrics = [
    {
      key: 'courses',
      label: 'Enrolled Courses',
      value: stats?.courses || 0,
      icon: BookOpen,
      color: 'text-blue-500',
      trend: showTrends ? '+2 this month' : null,
    },
    {
      key: 'achievements',
      label: 'Achievements',
      value: stats?.achievements || 0,
      icon: Trophy,
      color: 'text-yellow-500',
      trend: showTrends ? '+5 this week' : null,
    },
    {
      key: 'certificates',
      label: 'Certificates',
      value: stats?.certificates || 0,
      icon: Award,
      color: 'text-green-500',
      trend: showTrends ? '+1 this month' : null,
    },
    {
      key: 'streaks',
      label: 'Day Streak',
      value: stats?.streaks || 0,
      icon: Flame,
      color: 'text-orange-500',
      trend: showTrends ? 'Keep it up!' : null,
    },
  ];

  const displayedMetrics = metrics.filter(m =>
    config.metrics
      ? config.metrics.includes(m.key as 'courses' | 'achievements' | 'certificates' | 'streaks')
      : true
  );

  return (
    <div className={cn('grid gap-4', getLayoutClass(layout))}>
      {displayedMetrics.map(metric => (
        <div key={metric.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          {showIcons && (
            <div className={cn('p-2 rounded-lg bg-background', metric.color)}>
              <metric.icon className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            {metric.trend && <p className="text-xs text-muted-foreground mt-0.5">{metric.trend}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function getLayoutClass(layout: string): string {
  switch (layout) {
    case 'horizontal':
      return 'grid-cols-4';
    case 'vertical':
      return 'grid-cols-1';
    case 'grid':
    default:
      return 'grid-cols-2';
  }
}

export default StatsWidget;
