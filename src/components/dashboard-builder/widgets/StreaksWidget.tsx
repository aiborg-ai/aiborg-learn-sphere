/**
 * Streaks Widget
 *
 * Track daily learning streaks and consistency
 */

import { useQuery } from '@tanstack/react-query';
import { Flame, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface StreakWidgetConfig extends BaseWidgetConfig {
  showCalendar?: boolean;
  showStats?: boolean;
}

export function StreaksWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as StreakWidgetConfig;
  const showCalendar = config.showCalendar !== false;
  const showStats = config.showStats !== false;

  const { data: streakData, isLoading } = useQuery({
    queryKey: ['streaks', widget.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        current_streak: 0,
        longest_streak: 0,
        total_days: 0,
        last_activity_date: new Date().toISOString().split('T')[0],
      };
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;
  const totalDays = streakData?.total_days || 0;

  // Generate last 7 days for mini calendar
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const lastActivityDate = streakData?.last_activity_date ? new Date(streakData.last_activity_date) : null;

  const isDayActive = (date: Date) => {
    if (!lastActivityDate) return false;
    const diffDays = Math.floor((lastActivityDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < currentStreak;
  };

  return (
    <div className="space-y-4">
      {/* Current Streak */}
      <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <Flame className="h-8 w-8 text-orange-500" />
        <div>
          <p className="text-3xl font-bold">{currentStreak}</p>
          <p className="text-sm text-muted-foreground">Day Streak</p>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Longest</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{totalDays}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
        </div>
      )}

      {/* Mini Calendar */}
      {showCalendar && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            <span>Last 7 Days</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((date, idx) => {
              const isActive = isDayActive(date);
              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'narrow' });

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{dayOfWeek}</span>
                  <div
                    className={cn(
                      'h-8 w-8 rounded-md flex items-center justify-center text-xs',
                      isActive
                        ? 'bg-orange-500 text-white font-semibold'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentStreak === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Start learning today to begin your streak!
        </p>
      )}
    </div>
  );
}

export default StreaksWidget;
