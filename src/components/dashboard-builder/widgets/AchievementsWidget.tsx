/**
 * Achievements Widget
 *
 * Displays earned achievements and badges in a grid layout
 */

import { useQuery } from '@tanstack/react-query';
import { Trophy, Award, Star, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface AchievementWidgetConfig extends BaseWidgetConfig {
  limit?: number;
  sortBy?: 'recent' | 'name' | 'category';
  showIcons?: boolean;
  showDates?: boolean;
}

export function AchievementsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as AchievementWidgetConfig;
  const limit = config.limit || 6;
  const sortBy = config.sortBy || 'recent';
  const showIcons = config.showIcons !== false;
  const showDates = config.showDates !== false;

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements', widget.id, sortBy, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('user_achievements')
        .select(
          `
          id,
          earned_at,
          achievement:achievements(
            id,
            name,
            description,
            icon,
            category,
            points
          )
        `
        )
        .eq('user_id', user.id);

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('earned_at', { ascending: false });
      }

      query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No achievements yet</p>
        <p className="text-xs mt-1">Complete courses to earn achievements!</p>
      </div>
    );
  }

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'medal':
        return Medal;
      case 'star':
        return Star;
      case 'award':
        return Award;
      default:
        return Trophy;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {achievements.map(userAchievement => {
        const achievement = userAchievement.achievement as any;
        const IconComponent = getIconComponent(achievement?.icon);
        const earnedDate = new Date(userAchievement.earned_at);

        return (
          <div
            key={userAchievement.id}
            className="flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            {showIcons && (
              <div className="p-3 rounded-full bg-yellow-500/10 mb-2">
                <IconComponent className="h-6 w-6 text-yellow-600" />
              </div>
            )}
            <h4 className="font-semibold text-sm text-center line-clamp-2">
              {achievement?.name || 'Achievement'}
            </h4>
            {achievement?.category && (
              <Badge variant="secondary" className="text-xs mt-1">
                {achievement.category}
              </Badge>
            )}
            {achievement?.points && (
              <p className="text-xs text-muted-foreground mt-1">{achievement.points} pts</p>
            )}
            {showDates && (
              <p className="text-xs text-muted-foreground mt-1">
                {earnedDate.toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AchievementsWidget;
