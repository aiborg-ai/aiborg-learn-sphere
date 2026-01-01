/**
 * useFeedbackLoop Hook
 *
 * React hooks for the Assessment Feedback Controller.
 * Provides answer submission with trigger detection and plan adjustments.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { feedbackController, studyPlanAdjustmentService } from '@/services/feedback-loop';
import type {
  AnswerEvent,
  TriggerDetectionResult,
  DetectedTrigger,
  FeedbackLoopEvent,
  PlanAdjustmentResult,
  RecommendedAction,
} from '@/services/feedback-loop/FeedbackLoopTypes';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AnswerSubmission {
  assessmentId: string;
  questionId: string;
  isCorrect: boolean;
  selectedOptions: string[];
  correctOptions: string[];
  timeSpent: number;
  abilityBefore: number;
  abilityAfter: number;
  standardError: number;
  questionDifficulty: number;
  questionCategory?: string;
  questionTopics?: string[];
}

interface FeedbackState {
  lastEvent: FeedbackLoopEvent | null;
  triggersDetected: DetectedTrigger[];
  recommendedAction: RecommendedAction | null;
  isProcessing: boolean;
}

interface FeedbackEventRow {
  id: string;
  user_id: string;
  assessment_id: string;
  event_type: string;
  ability_before: number;
  ability_after: number;
  triggers_fired: string[];
  trigger_data: Record<string, unknown>;
  created_at: string;
}

/**
 * Hook for submitting answers with feedback loop processing
 */
export function useAnswerSubmit(assessmentId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    lastEvent: null,
    triggersDetected: [],
    recommendedAction: null,
    isProcessing: false,
  });

  const mutation = useMutation({
    mutationFn: async (submission: AnswerSubmission) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const answerEvent: AnswerEvent = {
        userId: user.id,
        assessmentId: submission.assessmentId,
        questionId: submission.questionId,
        isCorrect: submission.isCorrect,
        selectedOptions: submission.selectedOptions,
        correctOptions: submission.correctOptions,
        timeSpent: submission.timeSpent,
        abilityBefore: submission.abilityBefore,
        abilityAfter: submission.abilityAfter,
        standardError: submission.standardError,
        questionDifficulty: submission.questionDifficulty,
        questionCategory: submission.questionCategory,
        questionTopics: submission.questionTopics,
        timestamp: new Date(),
      };

      return feedbackController.processAnswer(answerEvent);
    },
    onMutate: () => {
      setFeedbackState(prev => ({ ...prev, isProcessing: true }));
    },
    onSuccess: result => {
      if (result) {
        setFeedbackState({
          lastEvent: result.event,
          triggersDetected: result.triggers,
          recommendedAction: result.recommendation,
          isProcessing: false,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['feedbackEvents'] });
      queryClient.invalidateQueries({ queryKey: ['assessmentProgress'] });
    },
    onError: error => {
      logger.error('Failed to submit answer with feedback:', error);
      setFeedbackState(prev => ({ ...prev, isProcessing: false }));
    },
  });

  const submitAnswer = useCallback(
    (submission: Omit<AnswerSubmission, 'assessmentId'>) => {
      return mutation.mutateAsync({ ...submission, assessmentId });
    },
    [mutation, assessmentId]
  );

  return {
    submitAnswer,
    isSubmitting: mutation.isPending,
    feedbackState,
    lastResult: mutation.data,
    error: mutation.error,
  };
}

/**
 * Hook for fetching recent feedback events
 */
export function useFeedbackEvents(limit: number = 20) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['feedbackEvents', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('feedback_loop_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch feedback events:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  const events = useMemo(() => {
    return (query.data || []).map((event: FeedbackEventRow) => ({
      id: event.id,
      userId: event.user_id,
      assessmentId: event.assessment_id,
      eventType: event.event_type,
      abilityBefore: event.ability_before,
      abilityAfter: event.ability_after,
      triggersFired: event.triggers_fired,
      triggerData: event.trigger_data,
      createdAt: new Date(event.created_at),
    })) as FeedbackLoopEvent[];
  }, [query.data]);

  const eventsByType = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const event of events) {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
    }
    return byType;
  }, [events]);

  return {
    events,
    eventsByType,
    totalEvents: events.length,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for applying plan adjustments
 */
export function usePlanAdjustments(planId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adjustmentHistory, setAdjustmentHistory] = useState<PlanAdjustmentResult[]>([]);

  const mutation = useMutation({
    mutationFn: async (action: RecommendedAction) => {
      if (!user?.id || !planId) {
        throw new Error('User or plan not available');
      }

      return studyPlanAdjustmentService.applyAdjustment({
        userId: user.id,
        planId,
        action: action.action,
        severity: action.severity,
        categories: action.categories,
        topics: action.topics,
      });
    },
    onSuccess: result => {
      if (result) {
        setAdjustmentHistory(prev => [result, ...prev]);
      }

      queryClient.invalidateQueries({ queryKey: ['studyPlan', planId] });
      queryClient.invalidateQueries({ queryKey: ['planTasks', planId] });
    },
    onError: error => {
      logger.error('Failed to apply plan adjustment:', error);
    },
  });

  const applyAdjustment = useCallback(
    (action: RecommendedAction) => {
      return mutation.mutateAsync(action);
    },
    [mutation]
  );

  return {
    applyAdjustment,
    isApplying: mutation.isPending,
    lastResult: mutation.data as PlanAdjustmentResult | undefined,
    adjustmentHistory,
    error: mutation.error,
  };
}

/**
 * Hook for trigger detection without full processing
 */
export function useTriggerDetection() {
  const { user } = useAuth();
  const [detectionResult, setDetectionResult] = useState<TriggerDetectionResult | null>(null);

  const checkTriggers = useCallback(
    async (assessmentId: string): Promise<TriggerDetectionResult | null> => {
      if (!user?.id) return null;

      try {
        const result = await feedbackController.checkTriggers(user.id, assessmentId);
        setDetectionResult(result);
        return result;
      } catch (_error) {
        logger.error('Failed to check triggers:', _error);
        return null;
      }
    },
    [user?.id]
  );

  const hasTriggers = useMemo(() => {
    return (detectionResult?.triggers?.length ?? 0) > 0;
  }, [detectionResult]);

  const triggerSeverity = useMemo(() => {
    if (!detectionResult?.triggers?.length) return null;

    const severities = detectionResult.triggers.map(t => t.severity);
    if (severities.includes('severe')) return 'severe';
    if (severities.includes('moderate')) return 'moderate';
    return 'mild';
  }, [detectionResult]);

  return {
    checkTriggers,
    result: detectionResult,
    hasTriggers,
    triggerSeverity,
    recommendedAction: detectionResult?.recommendedAction ?? null,
  };
}

/**
 * Hook for sliding window metrics
 */
export function useSlidingWindowMetrics(assessmentId: string) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['slidingWindowMetrics', user?.id, assessmentId],
    queryFn: async () => {
      if (!user?.id) return null;
      return feedbackController.getSlidingWindowMetrics(user.id, assessmentId);
    },
    enabled: !!user?.id && !!assessmentId,
    staleTime: 5000, // 5 seconds (updates frequently during assessment)
  });

  const metrics = query.data;

  const trend = useMemo(() => {
    if (!metrics) return null;

    return {
      accuracy: metrics.accuracy,
      direction: metrics.abilityTrend,
      isImproving: metrics.abilityTrend === 'improving',
      isDeclining: metrics.abilityTrend === 'declining',
      recentAnswers: metrics.recentAnswers.length,
    };
  }, [metrics]);

  return {
    metrics,
    trend,
    accuracy: metrics?.accuracy ?? null,
    abilityTrend: metrics?.abilityTrend ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Composite hook for full feedback loop integration
 */
export function useFeedbackLoopIntegration(assessmentId: string, planId?: string) {
  const answerSubmit = useAnswerSubmit(assessmentId);
  const _triggerDetection = useTriggerDetection();
  const planAdjustments = usePlanAdjustments(planId || '');
  const slidingWindow = useSlidingWindowMetrics(assessmentId);

  const autoApplyRecommendations = useCallback(async () => {
    const { recommendedAction } = answerSubmit.feedbackState;

    if (recommendedAction && planId) {
      await planAdjustments.applyAdjustment(recommendedAction);
    }
  }, [answerSubmit.feedbackState, planId, planAdjustments]);

  return {
    // Answer submission
    submitAnswer: answerSubmit.submitAnswer,
    isSubmitting: answerSubmit.isSubmitting,

    // Current feedback state
    feedbackState: answerSubmit.feedbackState,
    triggersDetected: answerSubmit.feedbackState.triggersDetected,
    recommendedAction: answerSubmit.feedbackState.recommendedAction,

    // Sliding window
    accuracy: slidingWindow.accuracy,
    abilityTrend: slidingWindow.abilityTrend,

    // Plan adjustments
    applyAdjustment: planAdjustments.applyAdjustment,
    autoApplyRecommendations,
    adjustmentHistory: planAdjustments.adjustmentHistory,

    // State
    isProcessing:
      answerSubmit.isSubmitting || planAdjustments.isApplying || slidingWindow.isLoading,
  };
}
