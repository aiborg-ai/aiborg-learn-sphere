/**
 * useRetentionPrediction Hook
 *
 * React hooks for the Retention Prediction service.
 * Provides personalized forgetting curves and retention estimates.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { retentionPredictionService } from '@/services/feedback-loop';
import type {
  RetentionPrediction,
  ForgettingCurve,
  RetentionObservation,
} from '@/services/feedback-loop/FeedbackLoopTypes';
import { logger } from '@/utils/logger';

interface RetentionStats {
  totalObservations: number;
  recallRate: number;
  averageDaysBetweenReviews: number;
  averageQualityScore: number;
  predictionAccuracy: number;
  forgettingCurve: {
    decayConstant: number;
    halfLife: number;
    confidence: number;
  } | null;
}

interface DueItemWithRetention {
  id: string;
  front: string;
  daysSinceReview: number;
  retention: number;
  confidence: number;
  optimalReviewDate: Date;
  urgency: 'overdue' | 'due_soon' | 'optimal' | 'early';
  daysUntilOptimal: number;
}

/**
 * Hook for predicting retention for a specific topic
 */
export function usePredictRetention(topicId?: string, daysSinceReview: number = 0) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['retentionPrediction', user?.id, topicId, daysSinceReview],
    queryFn: async () => {
      if (!user?.id) return null;
      return retentionPredictionService.predictCurrentRetention(user.id, topicId, daysSinceReview);
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  const prediction = query.data as RetentionPrediction | null;

  return {
    prediction,
    retention: prediction?.retention ?? null,
    urgency: prediction?.urgency ?? null,
    optimalReviewDate: prediction?.optimalReviewDate ?? null,
    confidence: prediction?.confidence ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook for getting personalized forgetting curve
 */
export function useForgettingCurve(topicId?: string) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['forgettingCurve', user?.id, topicId],
    queryFn: async () => {
      if (!user?.id) return null;
      return retentionPredictionService.buildForgettingCurve(user.id, topicId);
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const curve = query.data as ForgettingCurve | null;

  // Generate curve points for visualization
  const curvePoints = useMemo(() => {
    if (!curve) return [];

    const points = [];
    const decayConstant = curve.decayConstant;

    for (let days = 0; days <= 30; days++) {
      const retention = Math.exp(-decayConstant * days);
      points.push({ days, retention: retention * 100 });
    }

    return points;
  }, [curve]);

  return {
    curve,
    curvePoints,
    halfLife: curve?.halfLife ?? null,
    confidence: curve?.confidence ?? null,
    dataPoints: curve?.dataPoints ?? 0,
    hasEnoughData: (curve?.dataPoints ?? 0) >= 5,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook for recording retention observations
 */
export function useRecordRetention() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (observation: Omit<RetentionObservation, 'id' | 'userId'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return retentionPredictionService.recordRetentionObservation({
        ...observation,
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forgettingCurve'] });
      queryClient.invalidateQueries({ queryKey: ['retentionStats'] });
    },
    onError: error => {
      logger.error('Failed to record retention observation:', error);
    },
  });

  const recordObservation = useCallback(
    (observation: Omit<RetentionObservation, 'id' | 'userId'>) => {
      return mutation.mutateAsync(observation);
    },
    [mutation]
  );

  return {
    recordObservation,
    isRecording: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for overall retention statistics
 */
export function useRetentionStats() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['retentionStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return retentionPredictionService.getRetentionStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  const stats = query.data as RetentionStats | null;

  return {
    stats,
    recallRate: stats?.recallRate ?? null,
    predictionAccuracy: stats?.predictionAccuracy ?? null,
    averageQuality: stats?.averageQualityScore ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for getting items due for review with retention predictions
 */
export function useDueItemsWithRetention(targetRetention: number = 0.85) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dueItemsWithRetention', user?.id, targetRetention],
    queryFn: async () => {
      if (!user?.id) return [];
      return retentionPredictionService.getDueItemsWithRetention(user.id, targetRetention);
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  const items = useMemo(() => {
    return (query.data || []) as DueItemWithRetention[];
  }, [query.data]);

  const urgencyBreakdown = useMemo(() => {
    const breakdown = {
      overdue: 0,
      due_soon: 0,
      optimal: 0,
      early: 0,
    };

    for (const item of items) {
      breakdown[item.urgency]++;
    }

    return breakdown;
  }, [items]);

  return {
    items,
    totalItems: items.length,
    urgencyBreakdown,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for optimal study schedule based on retention patterns
 */
export function useOptimalReviewSchedule() {
  const { stats } = useRetentionStats();
  const { curve } = useForgettingCurve();

  const schedule = useMemo(() => {
    if (!curve || !stats) return null;

    // Calculate optimal review interval based on target retention
    const targetRetention = 0.85;
    const optimalDays = -Math.log(targetRetention) / curve.decayConstant;

    // Calculate daily review load
    const estimatedDailyCards = Math.ceil(20 / optimalDays); // Assuming 20 cards in rotation

    return {
      optimalIntervalDays: Math.round(optimalDays),
      estimatedDailyCards,
      targetRetention,
      currentRecallRate: stats.recallRate,
      halfLife: curve.halfLife,
      recommendation:
        stats.recallRate < 0.7
          ? 'Review more frequently - retention is low'
          : stats.recallRate > 0.9
            ? 'Consider longer intervals - you are over-reviewing'
            : 'Current schedule is optimal',
    };
  }, [curve, stats]);

  return {
    schedule,
    hasEnoughData: !!curve && !!stats,
  };
}

/**
 * Composite hook for retention dashboard
 */
export function useRetentionDashboard() {
  const retentionStats = useRetentionStats();
  const forgettingCurve = useForgettingCurve();
  const dueItems = useDueItemsWithRetention();
  const schedule = useOptimalReviewSchedule();

  const isLoading = retentionStats.isLoading || forgettingCurve.isLoading || dueItems.isLoading;

  const hasData =
    retentionStats.stats !== null || forgettingCurve.curve !== null || dueItems.items.length > 0;

  const loadDashboardData = useCallback(() => {
    retentionStats.refetch();
    dueItems.refetch();
  }, [retentionStats, dueItems]);

  return {
    // Stats
    stats: retentionStats.stats,
    recallRate: retentionStats.recallRate,
    predictionAccuracy: retentionStats.predictionAccuracy,

    // Forgetting curve
    curve: forgettingCurve.curve,
    curvePoints: forgettingCurve.curvePoints,
    halfLife: forgettingCurve.halfLife,

    // Due items
    dueItems: dueItems.items,
    urgencyBreakdown: dueItems.urgencyBreakdown,

    // Schedule
    schedule: schedule.schedule,

    // State
    isLoading,
    hasData,
    loadDashboardData,
    errors: {
      stats: retentionStats.error,
      curve: forgettingCurve.error,
      items: dueItems.error,
    },
  };
}
