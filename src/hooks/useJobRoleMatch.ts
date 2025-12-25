/**
 * useJobRoleMatch Hook
 * Fetches job role skill match and calculates career readiness
 */

import { useQuery } from '@tanstack/react-query';
import { SkillExtractionService } from '@/services/skills/SkillExtractionService';
import { logger } from '@/utils/logger';
import { useAuth } from './useAuth';
import type { EnhancedJobRoleMatch } from '@/types/skillsAssessment';

/**
 * Enhance job role match with career insights
 */
function enhanceJobRoleMatch(
  match: Awaited<ReturnType<typeof SkillExtractionService.getJobRoleMatch>>,
  jobRole: Awaited<ReturnType<typeof SkillExtractionService.getJobRoles>>[0]
): EnhancedJobRoleMatch {
  const matchPercentage = match.match_percentage;
  const gapsCount = match.skill_gaps.length;

  // Calculate estimated weeks to close gaps (assume 2-4 weeks per skill)
  const estimatedWeeksToClose = gapsCount * 3;

  // Determine next milestone
  let nextMilestone = '';
  if (matchPercentage < 50) {
    nextMilestone = '50% ready (Foundation)';
  } else if (matchPercentage < 70) {
    nextMilestone = '70% ready (Developing)';
  } else if (matchPercentage < 90) {
    nextMilestone = '90% ready (Proficient)';
  } else {
    nextMilestone = '100% ready (Expert)';
  }

  // Identify competitive advantages (skills where user exceeds requirements)
  const competitiveAdvantage = match.strengths.slice(0, 3).map(s => s.skill_name);

  // Determine readiness level
  let readinessLevel: EnhancedJobRoleMatch['readiness_level'];
  if (matchPercentage < 40) {
    readinessLevel = 'not_ready';
  } else if (matchPercentage < 70) {
    readinessLevel = 'developing';
  } else if (matchPercentage < 90) {
    readinessLevel = 'ready';
  } else {
    readinessLevel = 'exceeds';
  }

  return {
    ...match,
    job_role: jobRole,
    estimated_weeks_to_close: estimatedWeeksToClose,
    next_milestone: nextMilestone,
    competitive_advantage: competitiveAdvantage,
    readiness_level: readinessLevel,
  };
}

/**
 * Hook to fetch job role skill match with enhanced career insights
 */
export function useJobRoleMatch(userId?: string, jobRoleId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: ['job-role-match', effectiveUserId, jobRoleId],
    queryFn: async (): Promise<EnhancedJobRoleMatch | null> => {
      if (!effectiveUserId || !jobRoleId) {
        return null;
      }

      try {
        // Fetch job role match
        const match = await SkillExtractionService.getJobRoleMatch(effectiveUserId, jobRoleId);

        // Fetch job role details
        const roles = await SkillExtractionService.getJobRoles();
        const jobRole = roles.find(r => r.id === jobRoleId);

        if (!jobRole) {
          throw new Error('Job role not found');
        }

        // Enhance match with career insights
        return enhanceJobRoleMatch(match, jobRole);
      } catch (error) {
        logger.error('Error fetching job role match:', error);
        throw error;
      }
    },
    enabled: !!effectiveUserId && !!jobRoleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all available job roles
 */
export function useJobRoles(options?: { industry?: string; experience_level?: string }) {
  return useQuery({
    queryKey: ['job-roles', options],
    queryFn: async () => {
      try {
        return await SkillExtractionService.getJobRoles(options);
      } catch (error) {
        logger.error('Error fetching job roles:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (job roles change infrequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
