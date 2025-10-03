import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getLevelInfo } from '@/config/gamification';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface UserAiborgPoints {
  user_id: string;
  total_points: number;
  level: number;
  level_progress: number;
  rank: string;
  points_this_week: number;
  points_this_month: number;
  streak_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points_earned: number;
  source_type: 'quiz' | 'exercise' | 'workshop' | 'assessment' | 'streak' | 'achievement' | 'bonus';
  source_id?: string;
  description: string;
  metadata?: any;
  earned_at: string;
}

export function useAiborgPoints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's current points
  const {
    data: pointsData,
    isLoading: pointsLoading,
    error: pointsError,
  } = useQuery({
    queryKey: ['aiborg-points', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_aiborg_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no record exists, create one
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_aiborg_points')
            .insert({
              user_id: user.id,
              total_points: 0,
              level: 1,
              level_progress: 0,
              rank: 'AI Newbie',
            })
            .select()
            .single();

          if (insertError) throw insertError;
          return newData as UserAiborgPoints;
        }
        throw error;
      }

      return data as UserAiborgPoints;
    },
    enabled: !!user,
  });

  // Fetch points history
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['aiborg-points-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('aiborg_points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PointsHistory[];
    },
    enabled: !!user,
  });

  // Mutation to award points
  const awardPointsMutation = useMutation({
    mutationFn: async ({
      points,
      sourceType,
      sourceId,
      description,
      metadata,
    }: {
      points: number;
      sourceType: PointsHistory['source_type'];
      sourceId?: string;
      description: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Call the database function to award points
      const { error } = await supabase.rpc('award_aiborg_points', {
        p_user_id: user.id,
        p_points: points,
        p_source_type: sourceType,
        p_source_id: sourceId || null,
        p_description: description,
      });

      if (error) throw error;

      return { points, description };
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['aiborg-points', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['aiborg-points-history', user?.id] });

      // Show success notification
      toast.success(`🎉 +${data.points} AIBORG Points`, {
        description: data.description,
      });

      logger.log('Points awarded:', data);
    },
    onError: (error) => {
      logger.error('Error awarding points:', error);
      toast.error('Failed to award points');
    },
  });

  // Get level information with progress
  const levelInfo = pointsData ? getLevelInfo(pointsData.total_points) : null;

  // Calculate if user recently leveled up
  const checkLevelUp = (oldPoints: number, newPoints: number) => {
    const oldLevel = getLevelInfo(oldPoints);
    const newLevel = getLevelInfo(newPoints);
    return oldLevel.level < newLevel.level;
  };

  return {
    // Data
    pointsData,
    historyData,
    levelInfo,

    // Loading states
    pointsLoading,
    historyLoading,

    // Errors
    pointsError,
    historyError,

    // Mutations
    awardPoints: awardPointsMutation.mutate,
    isAwarding: awardPointsMutation.isPending,

    // Utilities
    checkLevelUp,
  };
}
