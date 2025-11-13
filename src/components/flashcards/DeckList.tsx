/**
 * DeckList Component
 * Shows list of flashcard decks with stats
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Edit, Trash2, Globe, Lock } from 'lucide-react';
import type { FlashcardDeck } from '@/services/spaced-repetition/FlashcardService';

interface DeckListProps {
  decks: FlashcardDeck[];
  onSelectDeck: (deckId: string) => void;
  onEditDeck?: (deckId: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  isLoading?: boolean;
}

export function DeckList({
  decks,
  onSelectDeck,
  onEditDeck,
  onDeleteDeck,
  isLoading = false,
}: DeckListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Decks Yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first flashcard deck to start learning with spaced repetition
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {decks.map(deck => (
        <Card key={deck.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {deck.title}
                  {deck.is_public ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {deck.description || 'No description'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                </span>
              </div>
              {deck.is_public && (
                <Badge variant="secondary" className="text-xs">
                  Public
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSelectDeck(deck.id)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Study
              </Button>
              {onEditDeck && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditDeck(deck.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDeleteDeck && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteDeck(deck.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
