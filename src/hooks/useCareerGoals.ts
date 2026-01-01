/**
 * useCareerGoals Hook
 * Fetches and manages user's career goals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkillExtractionService } from '@/services/skills/SkillExtractionService';
import { logger } from '@/utils/logger';
import { useAuth } from './useAuth';
import type { UserCareerGoal } from '@/types/skillsAssessment';

/**
 * Hook to fetch user's career goals
 */
export function useCareerGoals(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-career-goals', effectiveUserId],
    queryFn: async (): Promise<UserCareerGoal[]> => {
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }

      try {
        const goals = await SkillExtractionService.getCareerGoals(effectiveUserId);
        return goals as UserCareerGoal[];
      } catch (_error) {
        logger.error('Error fetching career goals:', _error);
        throw error;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to set a career goal
 */
interface SetCareerGoalParams {
  jobRoleId: string;
  targetDate?: Date;
}

export function useSetCareerGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobRoleId, targetDate }: SetCareerGoalParams) => {
      if (!user?.id) {
        throw new Error('User must be authenticated');
      }

      try {
        await SkillExtractionService.setCareerGoal(user.id, jobRoleId, targetDate);
      } catch (_error) {
        logger.error('Error setting career goal:', _error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate career goals queries
      queryClient.invalidateQueries({
        queryKey: ['user-career-goals', user?.id],
      });
      logger.log('Career goal set successfully');
    },
    onError: error => {
      logger.error('Failed to set career goal:', error);
    },
  });
}
