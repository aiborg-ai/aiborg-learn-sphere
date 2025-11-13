/**
 * useRecommendations Hook
 * React hooks for AI-powered recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  RecommendationEngineService,
  type RecommendationOptions,
} from '@/services/ai/RecommendationEngineService';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Get personalized course recommendations
 */
export function usePersonalizedRecommendations(
  type: 'course' | 'learning_path',
  options: RecommendationOptions = {}
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', type, user?.id, options],
    queryFn: async () => {
      if (!user?.id) return [];

      if (type === 'course') {
        return await RecommendationEngineService.getCourseRecommendations(user.id, options);
      } else {
        return await RecommendationEngineService.getLearningPathRecommendations(user.id, options);
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Get similar courses based on content similarity
 */
export function useSimilarContent(
  contentId: string,
  contentType: 'course' | 'learning_path',
  limit = 5
) {
  return useQuery({
    queryKey: ['similar-content', contentType, contentId, limit],
    queryFn: async () => {
      if (contentType === 'course') {
        return await RecommendationEngineService.getSimilarCourses(contentId, limit);
      }
      // TODO: Add similar learning paths
      return [];
    },
    enabled: !!contentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Submit feedback for a recommendation
 */
export function useRecommendationFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recommendationId,
      isHelpful,
      feedbackType,
      feedbackText,
    }: {
      recommendationId: string;
      isHelpful: boolean;
      feedbackType?: string;
      feedbackText?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      await RecommendationEngineService.submitFeedback(
        user.id,
        recommendationId,
        isHelpful,
        feedbackType,
        feedbackText
      );
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      // Invalidate recommendations to reflect feedback
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: error => {
      logger.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    },
  });
}

/**
 * Update recommendation interaction (clicked, enrolled, dismissed)
 */
export function useRecommendationInteraction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      recommendationId,
      interactionType,
    }: {
      recommendationId: string;
      interactionType: 'clicked' | 'enrolled' | 'dismissed';
    }) => {
      await RecommendationEngineService.updateRecommendationInteraction(
        recommendationId,
        interactionType
      );
    },
    onSuccess: (_, variables) => {
      if (variables.interactionType === 'dismissed') {
        // Invalidate recommendations to remove dismissed item
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      }
    },
    onError: error => {
      logger.error('Failed to update interaction:', error);
    },
  });

  return {
    trackClick: (recommendationId: string) =>
      mutation.mutate({ recommendationId, interactionType: 'clicked' }),
    trackEnrollment: (recommendationId: string) =>
      mutation.mutate({ recommendationId, interactionType: 'enrolled' }),
    dismiss: (recommendationId: string) =>
      mutation.mutate({ recommendationId, interactionType: 'dismissed' }),
  };
}

/**
 * Get recommendation history for the current user
 */
export function useRecommendationHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendation-history', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      // This would need a dedicated function in RecommendationEngineService
      // For now, we'll implement it here
      const { supabase } = await import('@/integrations/supabase/client');

      const { data, error } = await supabase
        .from('recommendation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('shown_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to check if recommendations are available/configured
 */
export function useRecommendationsAvailable() {
  return useQuery({
    queryKey: ['recommendations-available'],
    queryFn: async () => {
      const { EmbeddingService } = await import('@/services/ai/EmbeddingService');
      return EmbeddingService.isConfigured();
    },
    staleTime: Infinity, // Configuration doesn't change during session
  });
}
