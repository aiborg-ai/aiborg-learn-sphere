/**
 * Recent Activity Widget
 *
 * Timeline of recent learning activities
 */

import { useQuery } from '@tantml:react-query';
import { Activity, BookOpen, Trophy, FileCheck, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, ActivityWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function RecentActivityWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ActivityWidgetConfig;
  const limit = config.limit || 15;
  const showTimestamps = config.showTimestamps !== false;
  const groupByDate = config.groupByDate !== false;

  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch recent activities from various sources
      const [enrollments, completions, achievements, comments] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('created_at, course:courses(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('course_enrollments')
          .select('completed_at, course:courses(title)')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_achievements')
          .select('earned_at, achievement:achievements(name)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false })
          .limit(5),
        supabase
          .from('comments')
          .select('created_at, post:blog_posts(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const allActivities = [
        ...(enrollments.data || []).map(e => ({
          type: 'enrollment' as const,
          timestamp: e.created_at,
          description: `Enrolled in ${(e.course as any)?.title}`,
          icon: BookOpen,
        })),
        ...(completions.data || []).map(c => ({
          type: 'completion' as const,
          timestamp: c.completed_at,
          description: `Completed ${(c.course as any)?.title}`,
          icon: FileCheck,
        })),
        ...(achievements.data || []).map(a => ({
          type: 'achievement' as const,
          timestamp: a.earned_at,
          description: `Earned "${(a.achievement as any)?.name}"`,
          icon: Trophy,
        })),
        ...(comments.data || []).map(c => ({
          type: 'comment' as const,
          timestamp: c.created_at,
          description: `Commented on "${(c.post as any)?.title}"`,
          icon: MessageSquare,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return allActivities;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
        <p className="text-xs mt-1">Start learning to see your activity!</p>
      </div>
    );
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'text-blue-600 bg-blue-500/10';
      case 'completion':
        return 'text-green-600 bg-green-500/10';
      case 'achievement':
        return 'text-yellow-600 bg-yellow-500/10';
      case 'comment':
        return 'text-purple-600 bg-purple-500/10';
      default:
        return 'text-gray-600 bg-gray-500/10';
    }
  };

  const groupActivitiesByDate = (acts: typeof activities) => {
    if (!groupByDate) return { ungrouped: acts };

    const groups: Record<string, typeof activities> = {};
    acts.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return groups;
  };

  const grouped = groupActivitiesByDate(activities);

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {Object.entries(grouped).map(([date, dateActivities]) => (
        <div key={date}>
          {groupByDate && date !== 'ungrouped' && (
            <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
          )}
          <div className="space-y-2">
            {dateActivities.map((activity, idx) => {
              const IconComponent = activity.icon;
              const timestamp = new Date(activity.timestamp);

              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg', getActivityColor(activity.type))}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm line-clamp-2">{activity.description}</p>
                    {showTimestamps && (
                      <p className="text-xs text-muted-foreground">
                        {timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentActivityWidget;
