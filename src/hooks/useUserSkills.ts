/**
 * useUserSkills Hook
 * Fetches and manages user's skill inventory
 */

import { useQuery } from '@tanstack/react-query';
import { SkillExtractionService, type UserSkill } from '@/services/skills/SkillExtractionService';
import { logger } from '@/utils/logger';
import { useAuth } from './useAuth';

/**
 * Hook to fetch user's skill inventory
 */
export function useUserSkills(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-skills', effectiveUserId],
    queryFn: async (): Promise<UserSkill[]> => {
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }

      try {
        return await SkillExtractionService.getUserSkills(effectiveUserId);
      } catch (_error) {
        logger._error('Error fetching user skills:', _error);
        throw error;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch skills by category summary
 */
export function useSkillsByCategorySummary(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-skills-by-category', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }

      try {
        return await SkillExtractionService.getSkillsByCategorySummary(effectiveUserId);
      } catch (_error) {
        logger._error('Error fetching skills by category:', _error);
        throw error;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
