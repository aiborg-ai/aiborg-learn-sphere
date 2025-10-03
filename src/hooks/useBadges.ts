import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { GAMIFICATION_CONFIG, checkBadgeEarned, getBadgeInfo } from '@/config/gamification';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  icon_emoji: string;
  category: 'course_completion' | 'skill_mastery' | 'engagement' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: Record<string, number>;
  points: number;
  is_active: boolean;
  auto_allocate: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  awarded_by?: string;
  evidence?: any;
  is_featured: boolean;
  achievement?: Achievement;
}

export function useBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all achievements
  const {
    data: allAchievements,
    isLoading: achievementsLoading,
    error: achievementsError,
  } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('rarity', { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Fetch user's earned achievements
  const {
    data: earnedAchievements,
    isLoading: earnedLoading,
    error: earnedError,
  } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });

  // Award badge mutation
  const awardBadgeMutation = useMutation({
    mutationFn: async ({
      achievementId,
      evidence,
    }: {
      achievementId: string;
      evidence?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
          evidence,
        })
        .select(`
          *,
          achievement:achievements(*)
        `)
        .single();

      if (error) throw error;
      return data as UserAchievement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', user?.id] });

      const achievement = data.achievement as Achievement;
      toast.success(`🏆 Badge Unlocked: ${achievement.name}!`, {
        description: achievement.description,
      });

      logger.log('Badge awarded:', achievement);
    },
    onError: (error: any) => {
      // Ignore duplicate errors silently
      if (error?.code !== '23505') {
        logger.error('Error awarding badge:', error);
        toast.error('Failed to award badge');
      }
    },
  });

  // Toggle featured badge
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({
      userAchievementId,
      isFeatured,
    }: {
      userAchievementId: string;
      isFeatured: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_achievements')
        .update({ is_featured: isFeatured })
        .eq('id', userAchievementId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', user?.id] });
    },
  });

  // Check if user has earned a specific badge
  const hasBadge = (achievementId: string) => {
    return earnedAchievements?.some(ua => ua.achievement_id === achievementId) ?? false;
  };

  // Get featured badges
  const featuredBadges = earnedAchievements?.filter(ua => ua.is_featured) ?? [];

  // Check and award badges based on user stats
  const checkAndAwardBadges = async (userStats: Record<string, number>) => {
    if (!user || !allAchievements) return;

    // Check gamification config badges
    const configBadges = Object.values(GAMIFICATION_CONFIG.BADGES);

    for (const badge of configBadges) {
      // Check if user already has this badge
      if (hasBadge(badge.id)) continue;

      // Check if user meets criteria
      if (checkBadgeEarned(badge.id, userStats)) {
        // Find matching achievement in database or create if needed
        let achievement = allAchievements.find(a => a.name === badge.name);

        if (!achievement) {
          // Create achievement if it doesn't exist
          const { data: newAchievement, error } = await supabase
            .from('achievements')
            .insert({
              name: badge.name,
              description: badge.description,
              icon_emoji: badge.icon,
              category: badge.category as any,
              rarity: badge.rarity as any,
              criteria: badge.criteria,
              points: badge.points,
              auto_allocate: true,
            })
            .select()
            .single();

          if (error) {
            logger.error('Error creating achievement:', error);
            continue;
          }
          achievement = newAchievement;
        }

        // Award the badge
        awardBadgeMutation.mutate({
          achievementId: achievement.id,
          evidence: userStats,
        });
      }
    }
  };

  // Get badge progress for a specific badge
  const getBadgeProgress = (badgeId: string, userStats: Record<string, number>) => {
    const badge = getBadgeInfo(badgeId);
    if (!badge) return null;

    const progress: Record<string, { current: number; required: number; percentage: number }> = {};

    for (const [key, required] of Object.entries(badge.criteria)) {
      const current = userStats[key] || 0;
      progress[key] = {
        current,
        required,
        percentage: Math.min(100, (current / required) * 100),
      };
    }

    return progress;
  };

  return {
    // Data
    allAchievements,
    earnedAchievements,
    featuredBadges,

    // Loading states
    achievementsLoading,
    earnedLoading,
    isLoading: achievementsLoading || earnedLoading,

    // Errors
    achievementsError,
    earnedError,

    // Mutations
    awardBadge: awardBadgeMutation.mutate,
    isAwarding: awardBadgeMutation.isPending,
    toggleFeatured: toggleFeaturedMutation.mutate,
    isTogglingFeatured: toggleFeaturedMutation.isPending,

    // Utilities
    hasBadge,
    checkAndAwardBadges,
    getBadgeProgress,
  };
}
