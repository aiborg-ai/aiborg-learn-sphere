/**
 * ReviewSessionPage
 * Active review session for a deck
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FlashcardReview } from '@/components/flashcards/FlashcardReview';
import { useFlashcardDeck, useDueCards } from '@/hooks/useFlashcards';
import { useReviewStreak } from '@/hooks/useSpacedRepetition';
import { ArrowLeft, CheckCircle2, Trophy, Sparkles } from '@/components/ui/icons';
import { Loader2 } from '@/components/ui/icons';

export default function ReviewSessionPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { data: deck, isLoading: isDeckLoading } = useFlashcardDeck(deckId);
  const { data: dueCards, isLoading: isCardsLoading } = useDueCards(deckId);
  const { data: streak } = useReviewStreak();

  const isLoading = isDeckLoading || isCardsLoading;

  useEffect(() => {
    // Reset state when deck changes
    setCurrentIndex(0);
    setIsComplete(false);
  }, [deckId]);

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleComplete = () => {
    setIsComplete(true);
  };

  const handleBackToDeck = () => {
    navigate(`/flashcards/${deckId}`);
  };

  const handleBackToDecks = () => {
    navigate('/flashcards');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!deck || !dueCards) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto p-8 text-center">
          <p className="text-muted-foreground">Deck not found</p>
          <Button onClick={handleBackToDecks} className="mt-4">
            Back to Decks
          </Button>
        </Card>
      </div>
    );
  }

  if (dueCards.length === 0 && !isComplete) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
          <p className="text-muted-foreground mb-6">
            No cards due for review in this deck. Come back later!
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleBackToDeck}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Button>
            <Button onClick={handleBackToDecks}>All Decks</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="mb-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
            <p className="text-muted-foreground">
              Great job! You've reviewed all {dueCards.length} cards.
            </p>
          </div>

          {streak && (
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <span>{streak.current_streak} Day Streak!</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleBackToDeck}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Button>
            <Button onClick={handleBackToDecks}>All Decks</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBackToDeck} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {deck.title}
        </Button>
      </div>

      {/* Review Interface */}
      <FlashcardReview
        flashcards={dueCards.map(c => c)}
        currentIndex={currentIndex}
        onNext={handleNext}
        onComplete={handleComplete}
        streak={streak?.current_streak}
      />
    </div>
  );
}
