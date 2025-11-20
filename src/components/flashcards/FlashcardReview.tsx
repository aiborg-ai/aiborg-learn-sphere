/**
 * FlashcardReview Component
 * Main review interface with keyboard shortcuts
 */

import { useState, useEffect, useCallback } from 'react';
import { FlashcardCard } from './FlashcardCard';
import { ReviewButtons, ReviewKeyboardShortcuts } from './ReviewButtons';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubmitReview, useIntervalPreview } from '@/hooks/useSpacedRepetition';
import { SM2AlgorithmService } from '@/services/spaced-repetition/SM2AlgorithmService';
import type { Flashcard } from '@/services/spaced-repetition/FlashcardService';
import { Flame, Trophy } from '@/components/ui/icons';

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  currentIndex: number;
  onNext: () => void;
  onComplete: () => void;
  streak?: number;
}

export function FlashcardReview({
  flashcards,
  currentIndex,
  onNext,
  onComplete,
  streak = 0,
}: FlashcardReviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const currentCard = flashcards[currentIndex];
  const progress = (currentIndex / flashcards.length) * 100;
  const remaining = flashcards.length - currentIndex;

  const submitReview = useSubmitReview();
  const intervalPreview = useIntervalPreview(currentCard?.id);

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setShowButtons(false);
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
      setShowButtons(true);
    }
  }, [isFlipped]);

  const handleReview = useCallback(
    async (quality: 'again' | 'hard' | 'good' | 'easy') => {
      if (!currentCard || !isFlipped) return;

      const qualityScore = SM2AlgorithmService.mapButtonToQuality(quality);

      await submitReview.mutateAsync({
        flashcardId: currentCard.id,
        quality: qualityScore,
      });

      // Move to next card or complete
      if (currentIndex < flashcards.length - 1) {
        onNext();
      } else {
        onComplete();
      }
    },
    [currentCard, isFlipped, currentIndex, flashcards.length, submitReview, onNext, onComplete]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!isFlipped) {
            handleFlip();
          }
          break;
        case '1':
          if (isFlipped) handleReview('again');
          break;
        case '2':
          if (isFlipped) handleReview('hard');
          break;
        case '3':
          if (isFlipped) handleReview('good');
          break;
        case '4':
          if (isFlipped) handleReview('easy');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, handleFlip, handleReview]);

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No cards to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{remaining}</span> cards remaining
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {streak} day streak
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {currentIndex} / {flashcards.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      <div className="max-w-2xl mx-auto">
        <FlashcardCard flashcard={currentCard} showBack={isFlipped} onFlip={handleFlip} />
      </div>

      {/* Review Buttons (shown after flip) */}
      {showButtons && (
        <div className="max-w-2xl mx-auto space-y-4">
          <ReviewButtons
            onReview={handleReview}
            intervalPreview={intervalPreview}
            disabled={submitReview.isPending}
          />
          <ReviewKeyboardShortcuts />
        </div>
      )}

      {/* Hint (before flip) */}
      {!showButtons && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Click the card or press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to
            reveal the answer
          </p>
        </div>
      )}
    </div>
  );
}
