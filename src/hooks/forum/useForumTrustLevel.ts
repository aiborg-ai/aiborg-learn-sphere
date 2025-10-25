/**
 * useForumTrustLevel Hook
 * Manages user trust levels and permissions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ForumTrustLevelService } from '@/services/forum';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { TrustLevel } from '@/types/forum';

export function useForumTrustLevel(userId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetUserId = userId || user?.id;

  const { data: trustLevel, isLoading } = useQuery({
    queryKey: ['forum', 'trust-level', targetUserId],
    queryFn: () => (targetUserId ? ForumTrustLevelService.getUserTrustLevel(targetUserId) : null),
    enabled: !!targetUserId,
  });

  // Get progress to next level
  const { data: progress } = useQuery({
    queryKey: ['forum', 'trust-level-progress', targetUserId],
    queryFn: () =>
      targetUserId ? ForumTrustLevelService.getProgressToNextLevel(targetUserId) : null,
    enabled: !!targetUserId,
  });

  // Calculate trust level mutation (manually trigger recalculation)
  const recalculateTrustLevel = useMutation({
    mutationFn: () =>
      targetUserId ? ForumTrustLevelService.calculateTrustLevel(targetUserId) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'trust-level'] });
      toast({
        title: 'Success',
        description: 'Trust level recalculated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to recalculate trust level',
        variant: 'destructive',
      });
    },
  });

  // Set trust level mutation (admin only)
  const setTrustLevel = useMutation({
    mutationFn: ({ userId, level }: { userId: string; level: TrustLevel }) =>
      ForumTrustLevelService.setTrustLevel(userId, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'trust-level'] });
      toast({
        title: 'Success',
        description: 'Trust level updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set trust level',
        variant: 'destructive',
      });
    },
  });

  // Get abilities for current trust level
  const abilities = trustLevel
    ? ForumTrustLevelService.getTrustLevelAbilities(trustLevel.trust_level)
    : null;

  // Get requirements for next level
  const nextLevelRequirements = progress?.next_level
    ? ForumTrustLevelService.getTrustLevelRequirements(progress.next_level)
    : null;

  return {
    trustLevel,
    abilities,
    progress,
    nextLevelRequirements,
    isLoading,
    recalculateTrustLevel: recalculateTrustLevel.mutate,
    setTrustLevel: setTrustLevel.mutate,
    isRecalculating: recalculateTrustLevel.isPending,
  };
}

export function useCanPerformAction(action: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['forum', 'can-perform', action, user?.id],
    queryFn: () =>
      user?.id
        ? ForumTrustLevelService.canPerformAction(
            user.id,
            action as Parameters<typeof ForumTrustLevelService.canPerformAction>[1]
          )
        : false,
    enabled: !!user?.id,
  });
}

export function useTrustLevelLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ['forum', 'trust-level-leaderboard', limit],
    queryFn: () => ForumTrustLevelService.getTrustLevelLeaderboard(limit),
  });
}
