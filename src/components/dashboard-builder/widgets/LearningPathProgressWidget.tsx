/**
 * Learning Path Progress Widget
 *
 * Track progress along AI-generated learning paths
 */

import { useQuery } from '@tanstack/react-query';
import { Route, Target, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { WidgetComponentProps, ProgressWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function LearningPathProgressWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ProgressWidgetConfig;
  const showPercentage = config.showPercentage !== false;
  const limit = config.limit || 3;

  const { data: paths, isLoading } = useQuery({
    queryKey: ['learning-paths', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_generated_learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Calculate progress for each path
      return data?.map(path => {
        const milestones = path.milestones || [];
        const completedMilestones = milestones.filter((m: any) => m.completed).length;
        const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

        return {
          ...path,
          progress,
          completedMilestones,
          totalMilestones: milestones.length,
        };
      });
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No learning paths yet</p>
        <p className="text-xs mt-1">Create an AI-generated learning path!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paths.map(path => (
        <div key={path.id} className="space-y-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <h4 className="font-medium text-sm line-clamp-1">{path.goal_title}</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {path.goal_description}
              </p>
            </div>
            {showPercentage && (
              <span className="text-sm font-semibold shrink-0">
                {Math.round(path.progress)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {path.skill_level}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {path.timeline}
            </Badge>
          </div>

          <Progress value={path.progress} className="h-2" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {path.completedMilestones} / {path.totalMilestones} milestones
            </span>
            {path.progress > 50 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>On track</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default LearningPathProgressWidget;
