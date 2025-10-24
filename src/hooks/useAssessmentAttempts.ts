/**
 * useAssessmentAttempts Hook
 * Manages assessment tool attempts - create, fetch history, track progress
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssessmentToolAttempt, AttemptHistoryItem } from '@/types/assessmentTools';
import { useAuth } from './useAuth';

/**
 * Fetch attempt history for a tool
 */
async function fetchAttemptHistory(userId: string, toolId: string): Promise<AttemptHistoryItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_attempt_history', {
      p_user_id: userId,
      p_tool_id: toolId,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching attempt history:', error);
    throw error;
  }
}

/**
 * Hook to fetch attempt history
 */
export function useAssessmentAttemptHistory(toolId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessment-attempt-history', toolId, user?.id],
    queryFn: () => fetchAttemptHistory(user!.id, toolId!),
    enabled: !!user && !!toolId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a specific attempt by ID
 */
async function fetchAttempt(attemptId: string): Promise<AssessmentToolAttempt> {
  try {
    const { data, error } = await supabase
      .from('assessment_tool_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Attempt not found');

    return data as AssessmentToolAttempt;
  } catch (error) {
    logger.error('Error fetching attempt:', error);
    throw error;
  }
}

/**
 * Hook to fetch a specific attempt
 */
export function useAssessmentAttempt(attemptId?: string) {
  return useQuery({
    queryKey: ['assessment-attempt', attemptId],
    queryFn: () => fetchAttempt(attemptId!),
    enabled: !!attemptId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Create a new assessment attempt
 */
interface CreateAttemptParams {
  toolId: string;
  userId: string;
}

async function createAttempt({
  toolId,
  userId,
}: CreateAttemptParams): Promise<AssessmentToolAttempt> {
  try {
    // Get next attempt number
    const { data: attempts, error: countError } = await supabase
      .from('assessment_tool_attempts')
      .select('attempt_number')
      .eq('user_id', userId)
      .eq('tool_id', toolId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextAttemptNumber = attempts && attempts.length > 0 ? attempts[0].attempt_number + 1 : 1;

    // Create new attempt
    const { data: newAttempt, error: createError } = await supabase
      .from('assessment_tool_attempts')
      .insert({
        user_id: userId,
        tool_id: toolId,
        attempt_number: nextAttemptNumber,
        is_completed: false,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;
    if (!newAttempt) throw new Error('Failed to create attempt');

    logger.log(`Created attempt #${nextAttemptNumber} for tool ${toolId}`, newAttempt.id);

    return newAttempt as AssessmentToolAttempt;
  } catch (error) {
    logger.error('Error creating assessment attempt:', error);
    throw error;
  }
}

/**
 * Hook to create a new attempt
 */
export function useCreateAssessmentAttempt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) => createAttempt({ toolId, userId: user!.id }),
    onSuccess: (data, toolId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['assessment-tools'],
      });
      queryClient.invalidateQueries({
        queryKey: ['assessment-attempt-history', toolId],
      });
      logger.log('New attempt created successfully:', data.id);
    },
    onError: error => {
      logger.error('Failed to create attempt:', error);
    },
  });
}

/**
 * Update an existing attempt
 */
interface UpdateAttemptParams {
  attemptId: string;
  updates: Partial<AssessmentToolAttempt>;
}

async function updateAttempt({
  attemptId,
  updates,
}: UpdateAttemptParams): Promise<AssessmentToolAttempt> {
  try {
    const { data, error } = await supabase
      .from('assessment_tool_attempts')
      .update(updates)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update attempt');

    return data as AssessmentToolAttempt;
  } catch (error) {
    logger.error('Error updating attempt:', error);
    throw error;
  }
}

/**
 * Hook to update an attempt
 */
export function useUpdateAssessmentAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAttempt,
    onSuccess: data => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['assessment-attempt', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['assessment-tools'],
      });
      queryClient.invalidateQueries({
        queryKey: ['assessment-attempt-history', data.tool_id],
      });
    },
    onError: error => {
      logger.error('Failed to update attempt:', error);
    },
  });
}

/**
 * Complete an assessment attempt
 */
interface CompleteAttemptParams {
  attemptId: string;
  assessmentId: string;
  totalScore: number;
  maxPossibleScore: number;
  abilityEstimate: number;
  abilityStandardError: number;
  questionsAnswered: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  performanceByCategory?: Record<string, unknown>;
}

async function completeAttempt(params: CompleteAttemptParams): Promise<AssessmentToolAttempt> {
  try {
    const scorePercentage =
      params.maxPossibleScore > 0 ? (params.totalScore / params.maxPossibleScore) * 100 : 0;

    const updates = {
      assessment_id: params.assessmentId,
      total_score: params.totalScore,
      max_possible_score: params.maxPossibleScore,
      score_percentage: scorePercentage,
      ability_estimate: params.abilityEstimate,
      ability_standard_error: params.abilityStandardError,
      questions_answered: params.questionsAnswered,
      correct_answers: params.correctAnswers,
      time_taken_seconds: params.timeSpentSeconds,
      performance_by_category: params.performanceByCategory || {},
      is_completed: true,
      completed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('assessment_tool_attempts')
      .update(updates)
      .eq('id', params.attemptId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to complete attempt');

    logger.log('Attempt completed successfully:', params.attemptId);

    return data as AssessmentToolAttempt;
  } catch (error) {
    logger.error('Error completing attempt:', error);
    throw error;
  }
}

/**
 * Hook to complete an attempt
 */
export function useCompleteAssessmentAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeAttempt,
    onSuccess: data => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ['assessment-attempt', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['assessment-tools'],
      });
      queryClient.invalidateQueries({
        queryKey: ['assessment-attempt-history', data.tool_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-assessments'],
      });
    },
    onError: error => {
      logger.error('Failed to complete attempt:', error);
    },
  });
}

/**
 * Fetch all user's assessment attempts across all tools
 */
async function fetchAllUserAttempts(userId: string): Promise<AssessmentToolAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('assessment_tool_attempts')
      .select(
        `
        *,
        assessment_tools (
          name,
          slug,
          icon,
          category_type
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AssessmentToolAttempt[];
  } catch (error) {
    logger.error('Error fetching all user attempts:', error);
    throw error;
  }
}

/**
 * Hook to fetch all user attempts
 */
export function useAllUserAttempts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-all-attempts', user?.id],
    queryFn: () => fetchAllUserAttempts(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
