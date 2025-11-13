/**
 * useSpacedRepetition Hook
 * React hooks for spaced repetition review management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { FlashcardService, type FlashcardReview, type ReviewStreak } from '@/services/spaced-repetition/FlashcardService';
import { SM2AlgorithmService } from '@/services/spaced-repetition/SM2AlgorithmService';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Get review state for a flashcard
 */
export function useReviewState(flashcardId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['review-state', flashcardId, user?.id],
    queryFn: () => FlashcardService.getReviewState(flashcardId!),
    enabled: !!flashcardId && !!user,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Submit a review for a flashcard
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      flashcardId,
      quality,
    }: {
      flashcardId: string;
      quality: number;
    }) => FlashcardService.submitReview(flashcardId, quality),
    onSuccess: (data, variables) => {
      const interval = SM2AlgorithmService.getIntervalLabel(data.interval_days);
      toast.success(`Review saved! Next review in ${interval}`);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['review-state', variables.flashcardId] });
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['review-streak'] });
    },
    onError: error => {
      logger.error('Failed to submit review:', error);
      toast.error('Failed to save review');
    },
  });
}

/**
 * Get review streak for current user
 */
export function useReviewStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['review-streak', user?.id],
    queryFn: () => FlashcardService.getStreak(),
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to preview intervals for each button choice
 * Used to show user what will happen before they make a choice
 */
export function useIntervalPreview(flashcardId: string | undefined) {
  const { data: reviewState } = useReviewState(flashcardId);

  if (!reviewState) {
    return null;
  }

  const currentState = {
    easinessFactor: reviewState.easiness_factor,
    intervalDays: reviewState.interval_days,
    repetitionCount: reviewState.repetition_count,
  };

  const intervals = SM2AlgorithmService.previewIntervals(currentState);

  return {
    again: SM2AlgorithmService.getIntervalLabel(intervals.again),
    hard: SM2AlgorithmService.getIntervalLabel(intervals.hard),
    good: SM2AlgorithmService.getIntervalLabel(intervals.good),
    easy: SM2AlgorithmService.getIntervalLabel(intervals.easy),
    intervals, // Raw interval values
  };
}

/**
 * Get difficulty category for a flashcard
 */
export function useCardDifficulty(flashcardId: string | undefined) {
  const { data: reviewState } = useReviewState(flashcardId);

  if (!reviewState) {
    return 'New';
  }

  return SM2AlgorithmService.getDifficultyCategory(reviewState.easiness_factor);
}

/**
 * Check if a card is due for review
 */
export function useIsDue(flashcardId: string | undefined) {
  const { data: reviewState } = useReviewState(flashcardId);

  if (!reviewState) {
    return true; // New cards are always "due"
  }

  return SM2AlgorithmService.isDue(new Date(reviewState.next_review_date));
}
