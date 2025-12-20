/**
 * useEnhancedSM2 Hook
 *
 * React hooks for the Enhanced SM-2 spaced repetition service.
 * Provides ability-adjusted review scheduling and personalized parameters.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { enhancedSM2Service } from '@/services/feedback-loop';
import type {
  EnhancedReviewResult,
  PersonalizedSM2Params,
} from '@/services/feedback-loop/FeedbackLoopTypes';
import { logger } from '@/utils/logger';

interface DueFlashcard {
  id: string;
  front: string;
  back: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_review_date?: string;
  estimatedRetention: number;
  urgency: 'critical' | 'high' | 'normal';
}

interface ReviewSubmission {
  flashcardId: string;
  quality: number;
  responseTime?: number;
}

/**
 * Hook for submitting enhanced reviews with ability adjustment
 */
export function useEnhancedReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ flashcardId, quality, responseTime }: ReviewSubmission) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return enhancedSM2Service.processReview(user.id, flashcardId, quality, responseTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dueCardsWithRetention'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: error => {
      logger.error('Failed to submit enhanced review:', error);
    },
  });

  const submitReview = useCallback(
    (flashcardId: string, quality: number, responseTime?: number) => {
      return mutation.mutateAsync({ flashcardId, quality, responseTime });
    },
    [mutation]
  );

  return {
    submitReview,
    isSubmitting: mutation.isPending,
    lastResult: mutation.data as EnhancedReviewResult | undefined,
    error: mutation.error,
  };
}

/**
 * Hook for fetching due flashcards sorted by retention urgency
 */
export function useDueCardsWithRetention(limit: number = 20) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dueCardsWithRetention', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      return enhancedSM2Service.getDueFlashcardsWithRetention(user.id, limit);
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const dueCards = useMemo(() => {
    return (query.data || []) as DueFlashcard[];
  }, [query.data]);

  const urgencyCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, normal: 0 };
    for (const card of dueCards) {
      counts[card.urgency]++;
    }
    return counts;
  }, [dueCards]);

  return {
    dueCards,
    urgencyCounts,
    totalDue: dueCards.length,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for personalized SM-2 parameters
 */
export function usePersonalizedParams() {
  const { user } = useAuth();
  const [isCalibrating, setIsCalibrating] = useState(false);

  const query = useQuery({
    queryKey: ['personalizedSM2Params', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return enhancedSM2Service.getPersonalizedParams(user.id);
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const calibrate = useCallback(async () => {
    if (!user?.id) return null;

    setIsCalibrating(true);
    try {
      const params = await enhancedSM2Service.getPersonalizedParams(user.id);
      return params;
    } finally {
      setIsCalibrating(false);
    }
  }, [user?.id]);

  return {
    params: query.data as PersonalizedSM2Params | null,
    hasEnoughData: !!query.data,
    isLoading: query.isLoading,
    isCalibrating,
    calibrate,
    error: query.error,
  };
}

/**
 * Hook for syncing ability changes to flashcard EFs
 */
export function useSyncAbility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<{ updatedCount: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async (newAbility: number) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return enhancedSM2Service.syncUserAbility(user.id, newAbility);
    },
    onSuccess: updatedCount => {
      setSyncResult({ updatedCount });
      queryClient.invalidateQueries({ queryKey: ['dueCardsWithRetention'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: error => {
      logger.error('Failed to sync ability:', error);
    },
  });

  const syncAbility = useCallback(
    (newAbility: number) => {
      return mutation.mutateAsync(newAbility);
    },
    [mutation]
  );

  return {
    syncAbility,
    isSyncing: mutation.isPending,
    syncResult,
    error: mutation.error,
  };
}

/**
 * Hook for preview intervals before choosing answer
 */
export function useIntervalPreview(currentState: {
  easinessFactor: number;
  interval: number;
  repetitions: number;
}) {
  const preview = useMemo(() => {
    // Calculate what intervals would result from each choice
    const { easinessFactor, interval, repetitions } = currentState;

    const calculateInterval = (quality: number) => {
      const newRepetitions = quality >= 3 ? repetitions + 1 : 0;

      if (quality < 3) return 1;
      if (newRepetitions === 1) return 1;
      if (newRepetitions === 2) return 6;

      return Math.round(interval * easinessFactor);
    };

    return {
      again: calculateInterval(1), // Failed
      hard: calculateInterval(3), // Passed with difficulty
      good: calculateInterval(4), // Passed comfortably
      easy: Math.round(calculateInterval(5) * 1.3), // Perfect with bonus
    };
  }, [currentState]);

  const getIntervalLabel = useCallback((days: number) => {
    if (days === 0) return 'Now';
    if (days === 1) return '1d';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
  }, []);

  return {
    intervals: preview,
    labels: {
      again: getIntervalLabel(preview.again),
      hard: getIntervalLabel(preview.hard),
      good: getIntervalLabel(preview.good),
      easy: getIntervalLabel(preview.easy),
    },
  };
}

/**
 * Composite hook for complete review session
 */
export function useReviewSession(_deckId?: string) {
  const { dueCards, urgencyCounts, isLoading, refetch } = useDueCardsWithRetention(50);
  const { submitReview, isSubmitting, lastResult } = useEnhancedReview();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    incorrect: 0,
    startTime: Date.now(),
  });

  const currentCard = useMemo(() => {
    return dueCards[currentIndex] || null;
  }, [dueCards, currentIndex]);

  const handleReview = useCallback(
    async (quality: number, responseTime?: number) => {
      if (!currentCard) return;

      await submitReview(currentCard.id, quality, responseTime);

      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
      }));

      setCurrentIndex(prev => prev + 1);
    },
    [currentCard, submitReview]
  );

  const skipCard = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setSessionStats({
      reviewed: 0,
      correct: 0,
      incorrect: 0,
      startTime: Date.now(),
    });
    refetch();
  }, [refetch]);

  const sessionDuration = useMemo(() => {
    return Math.floor((Date.now() - sessionStats.startTime) / 1000);
  }, [sessionStats.startTime]);

  const isComplete = currentIndex >= dueCards.length && dueCards.length > 0;

  return {
    // Current state
    currentCard,
    currentIndex,
    totalCards: dueCards.length,
    isComplete,
    isLoading,
    isSubmitting,

    // Actions
    handleReview,
    skipCard,
    resetSession,

    // Stats
    sessionStats: {
      ...sessionStats,
      accuracy: sessionStats.reviewed > 0 ? sessionStats.correct / sessionStats.reviewed : 0,
      duration: sessionDuration,
    },
    urgencyCounts,
    lastResult,
  };
}
