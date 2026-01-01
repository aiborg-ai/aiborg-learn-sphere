/**
 * useSkillRecommendations Hook
 * Fetches and tiers skill recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SkillExtractionService,
  type SkillRecommendation,
} from '@/services/skills/SkillExtractionService';
import { logger } from '@/utils/logger';
import { useAuth } from './useAuth';
import type { TieredRecommendations } from '@/types/skillsAssessment';

/**
 * Tier recommendations into critical, accelerators, and bonus
 */
function tierRecommendations(recommendations: SkillRecommendation[]): TieredRecommendations {
  // Sort by priority score (descending)
  const sorted = [...recommendations].sort((a, b) => b.priority_score - a.priority_score);

  // Top 3-5 are critical (priority score > 80)
  const critical = sorted.filter(r => r.priority_score > 80).slice(0, 5);

  // Next 5-7 are accelerators (priority score 50-80)
  const accelerators = sorted
    .filter(r => r.priority_score >= 50 && r.priority_score <= 80)
    .slice(0, 7);

  // Remaining are bonus (priority score < 50)
  const bonus = sorted.filter(r => r.priority_score < 50);

  return {
    critical,
    accelerators,
    bonus,
  };
}

/**
 * Hook to fetch tiered skill recommendations
 */
export function useSkillRecommendations(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['skill-recommendations', effectiveUserId],
    queryFn: async (): Promise<TieredRecommendations> => {
      if (!effectiveUserId) {
        return {
          critical: [],
          accelerators: [],
          bonus: [],
        };
      }

      try {
        // Fetch recommendations
        const recommendations = await SkillExtractionService.getRecommendations(effectiveUserId);

        // Tier them
        return tierRecommendations(recommendations);
      } catch (_error) {
        logger.error('Error fetching skill recommendations:', _error);
        throw error;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to dismiss a recommendation
 */
export function useDismissRecommendation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendationId: string) => {
      try {
        await SkillExtractionService.dismissRecommendation(recommendationId);
      } catch (_error) {
        logger.error('Error dismissing recommendation:', _error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate recommendations queries
      queryClient.invalidateQueries({
        queryKey: ['skill-recommendations', user?.id],
      });
      logger.log('Recommendation dismissed successfully');
    },
    onError: error => {
      logger.error('Failed to dismiss recommendation:', error);
    },
  });
}
