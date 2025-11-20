/**
 * DeckPage
 * View and manage a single deck's cards
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlashcardEditor } from '@/components/flashcards/FlashcardEditor';
import {
  useFlashcardDeck,
  useFlashcards,
  useCreateFlashcard,
  useDeleteFlashcard,
  useDueCards,
} from '@/hooks/useFlashcards';
import { ArrowLeft, Plus, Play, Trash2, Loader2 } from '@/components/ui/icons';

export default function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const { data: deck, isLoading: isDeckLoading } = useFlashcardDeck(deckId);
  const { data: cards, isLoading: isCardsLoading } = useFlashcards(deckId);
  const { data: dueCards } = useDueCards(deckId);
  const createFlashcard = useCreateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();

  const isLoading = isDeckLoading || isCardsLoading;

  const handleCreateCard = async (data: {
    front_content: string;
    back_content: string;
    tags?: string[];
  }) => {
    if (!deckId) return;

    await createFlashcard.mutateAsync({
      deck_id: deckId,
      ...data,
    });

    setIsCreating(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    await deleteFlashcard.mutateAsync(cardId);
  };

  const handleStartReview = () => {
    navigate(`/flashcards/${deckId}/review`);
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

  if (!deck) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto p-8 text-center">
          <p className="text-muted-foreground">Deck not found</p>
          <Button onClick={() => navigate('/flashcards')} className="mt-4">
            Back to Decks
          </Button>
        </Card>
      </div>
    );
  }

  const dueCount = dueCards?.length || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/flashcards')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decks
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{deck.title}</h1>
            <p className="text-muted-foreground mt-1">{deck.description || 'No description'}</p>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary">
                {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
              </Badge>
              {dueCount > 0 && <Badge variant="default">{dueCount} due for review</Badge>}
            </div>
          </div>

          <div className="flex gap-2">
            {dueCount > 0 && (
              <Button onClick={handleStartReview}>
                <Play className="h-4 w-4 mr-2" />
                Start Review ({dueCount})
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </div>
      </div>

      {/* Create Card Form */}
      {isCreating && (
        <FlashcardEditor
          deckId={deckId!}
          onSave={handleCreateCard}
          onCancel={() => setIsCreating(false)}
          isSaving={createFlashcard.isPending}
        />
      )}

      {/* Cards List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>

        {cards && cards.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No cards in this deck yet</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Card
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards?.map(card => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{card.front_content}</CardTitle>
                      <CardDescription className="mt-1">{card.back_content}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {card.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCard(card.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
