/**
 * useSkillBenchmarks Hook
 * Fetches skill percentiles for peer benchmarking
 */

import { useQuery } from '@tanstack/react-query';
import { SkillExtractionService } from '@/services/skills/SkillExtractionService';
import { logger } from '@/utils/logger';
import { useAuth } from './useAuth';
import type { SkillPercentile, BenchmarkGroup } from '@/types/skillsAssessment';

/**
 * Hook to fetch skill percentiles for multiple skills
 */
export function useSkillBenchmarks(
  userId?: string,
  skillIds?: string[],
  benchmarkGroup: BenchmarkGroup = 'industry'
) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['skill-benchmarks', effectiveUserId, skillIds, benchmarkGroup],
    queryFn: async (): Promise<SkillPercentile[]> => {
      if (!effectiveUserId || !skillIds || skillIds.length === 0) {
        return [];
      }

      try {
        // Fetch user skills to get scores and names
        const userSkills = await SkillExtractionService.getUserSkills(effectiveUserId);
        const skillsMap = new Map(userSkills.map(s => [s.skill_id, s]));

        // Fetch percentile for each skill
        const percentiles = await Promise.all(
          skillIds.map(async skillId => {
            const userSkill = skillsMap.get(skillId);
            if (!userSkill) {
              return null;
            }

            const percentile = await SkillExtractionService.getSkillPercentile(
              effectiveUserId,
              skillId,
              benchmarkGroup
            );

            return {
              skillId,
              skillName: userSkill.skill.name,
              userScore: userSkill.proficiency_score,
              peerAverage: 0, // Will be calculated from percentile
              percentile,
              category: userSkill.skill.category,
            };
          })
        );

        // Filter out null values and return
        return percentiles.filter((p): p is SkillPercentile => p !== null);
      } catch (_error) {
        logger.error('Error fetching skill benchmarks:', _error);
        throw error;
      }
    },
    enabled: !!effectiveUserId && !!skillIds && skillIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch overall percentile rank across all skills
 */
export function useOverallPercentile(userId?: string, benchmarkGroup: BenchmarkGroup = 'industry') {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['overall-percentile', effectiveUserId, benchmarkGroup],
    queryFn: async (): Promise<number> => {
      if (!effectiveUserId) {
        return 0;
      }

      try {
        // Fetch all user skills
        const userSkills = await SkillExtractionService.getUserSkills(effectiveUserId);

        if (userSkills.length === 0) {
          return 0;
        }

        // Get percentiles for all skills
        const percentiles = await Promise.all(
          userSkills.map(skill =>
            SkillExtractionService.getSkillPercentile(
              effectiveUserId,
              skill.skill_id,
              benchmarkGroup
            )
          )
        );

        // Calculate average percentile
        const sum = percentiles.reduce((acc, p) => acc + p, 0);
        return Math.round(sum / percentiles.length);
      } catch (_error) {
        logger.error('Error fetching overall percentile:', _error);
        throw error;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
