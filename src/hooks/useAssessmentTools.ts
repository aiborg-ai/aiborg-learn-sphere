/**
 * useAssessmentTools Hook
 * Fetches available assessment tools filtered by user's selected audience
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssessmentTool, AssessmentToolWithProgress } from '@/types/assessmentTools';
import type { Audience } from '@/contexts/PersonalizationContext';
import { useAuth } from './useAuth';

/**
 * Map PersonalizationContext audience types to database audience strings
 */
const AUDIENCE_MAPPING: Record<Audience, string> = {
  All: 'All',
  primary: 'primary',
  secondary: 'secondary',
  professional: 'professional',
  business: 'business',
};

/**
 * Fetch assessment tools for a specific audience
 */
async function fetchAssessmentTools(
  audience: Audience,
  userId?: string
): Promise<AssessmentToolWithProgress[]> {
  try {
    const mappedAudience = AUDIENCE_MAPPING[audience] || 'All';

    // Call the database function to get tools for audience
    const { data: tools, error: toolsError } = await supabase.rpc(
      'get_assessment_tools_for_audience',
      {
        p_audience: mappedAudience,
      }
    );

    if (toolsError) throw toolsError;
    if (!tools) return [];

    // If user is not logged in, return tools without progress
    if (!userId) {
      return tools.map((tool: AssessmentTool) => ({
        ...tool,
        is_locked: !isToolAvailableForAudience(tool, audience),
      }));
    }

    // Fetch user's latest attempts for each tool
    const toolsWithProgress = await Promise.all(
      tools.map(async (tool: AssessmentTool) => {
        try {
          // Get latest attempt
          const { data: latestAttempt, error: attemptError } = await supabase.rpc(
            'get_latest_attempt_for_tool',
            {
              p_user_id: userId,
              p_tool_id: tool.id,
            }
          );

          if (attemptError) {
            logger.error('Error fetching latest attempt:', attemptError);
          }

          // Get total attempts count
          const { count: attemptCount } = await supabase
            .from('assessment_tool_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('tool_id', tool.id);

          // Get best score
          const { data: bestAttempt } = await supabase
            .from('assessment_tool_attempts')
            .select('score_percentage')
            .eq('user_id', userId)
            .eq('tool_id', tool.id)
            .eq('is_completed', true)
            .order('score_percentage', { ascending: false })
            .limit(1)
            .single();

          return {
            ...tool,
            user_attempts: attemptCount || 0,
            latest_attempt:
              latestAttempt && latestAttempt.length > 0
                ? {
                    attempt_number: latestAttempt[0].attempt_number,
                    score_percentage: latestAttempt[0].score_percentage,
                    ability_estimate: latestAttempt[0].ability_estimate,
                    is_completed: latestAttempt[0].is_completed,
                    completed_at: latestAttempt[0].completed_at,
                  }
                : undefined,
            best_score: bestAttempt?.score_percentage || undefined,
            is_locked: !isToolAvailableForAudience(tool, audience),
          } as AssessmentToolWithProgress;
        } catch (error) {
          logger.error(`Error enriching tool ${tool.id} with progress:`, error);
          return {
            ...tool,
            user_attempts: 0,
            is_locked: !isToolAvailableForAudience(tool, audience),
          } as AssessmentToolWithProgress;
        }
      })
    );

    return toolsWithProgress;
  } catch (error) {
    logger.error('Error fetching assessment tools:', error);
    throw error;
  }
}

/**
 * Check if a tool is available for the current audience
 */
function isToolAvailableForAudience(tool: AssessmentTool, audience: Audience): boolean {
  // "All" audience can see all tools
  if (audience === 'All') return true;

  // Check if audience is in target audiences
  const mappedAudience = AUDIENCE_MAPPING[audience];
  return tool.target_audiences.includes(mappedAudience);
}

/**
 * Hook to fetch assessment tools
 */
export function useAssessmentTools(selectedAudience: Audience) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessment-tools', selectedAudience, user?.id],
    queryFn: () => fetchAssessmentTools(selectedAudience, user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  });
}

/**
 * Hook to fetch a single assessment tool by slug
 */
export function useAssessmentTool(slug: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessment-tool', slug, user?.id],
    queryFn: async () => {
      try {
        // Fetch tool by slug
        const { data: tool, error: toolError } = await supabase
          .from('assessment_tools')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (toolError) throw toolError;
        if (!tool) throw new Error('Assessment tool not found');

        if (!user) {
          return tool as AssessmentToolWithProgress;
        }

        // Get user's progress
        const { data: latestAttempt } = await supabase.rpc('get_latest_attempt_for_tool', {
          p_user_id: user.id,
          p_tool_id: tool.id,
        });

        const { count: attemptCount } = await supabase
          .from('assessment_tool_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('tool_id', tool.id);

        const { data: bestAttempt } = await supabase
          .from('assessment_tool_attempts')
          .select('score_percentage')
          .eq('user_id', user.id)
          .eq('tool_id', tool.id)
          .eq('is_completed', true)
          .order('score_percentage', { ascending: false })
          .limit(1)
          .single();

        return {
          ...tool,
          user_attempts: attemptCount || 0,
          latest_attempt:
            latestAttempt && latestAttempt.length > 0
              ? {
                  attempt_number: latestAttempt[0].attempt_number,
                  score_percentage: latestAttempt[0].score_percentage,
                  ability_estimate: latestAttempt[0].ability_estimate,
                  is_completed: latestAttempt[0].is_completed,
                  completed_at: latestAttempt[0].completed_at,
                }
              : undefined,
          best_score: bestAttempt?.score_percentage || undefined,
        } as AssessmentToolWithProgress;
      } catch (error) {
        logger.error('Error fetching assessment tool:', error);
        throw error;
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
