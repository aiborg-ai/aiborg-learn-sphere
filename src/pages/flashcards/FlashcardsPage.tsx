/**
 * FlashcardsPage
 * Main page showing all flashcard decks
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DeckList } from '@/components/flashcards/DeckList';
import { FlashcardHelp } from '@/components/flashcards/FlashcardHelp';
import { useFlashcardDecks, useCreateDeck, useDeleteDeck } from '@/hooks/useFlashcards';
import { useReviewStreak } from '@/hooks/useSpacedRepetition';
import { Plus, Flame, Trophy, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');

  const { data: decks, isLoading } = useFlashcardDecks();
  const { data: streak } = useReviewStreak();
  const createDeck = useCreateDeck();
  const deleteDeck = useDeleteDeck();

  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;

    await createDeck.mutateAsync({
      title: newDeckTitle,
      description: newDeckDescription || undefined,
    });

    setIsCreateDialogOpen(false);
    setNewDeckTitle('');
    setNewDeckDescription('');
  };

  const handleSelectDeck = (deckId: string) => {
    navigate(`/flashcards/${deckId}`);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck? All cards will be lost.')) {
      return;
    }
    await deleteDeck.mutateAsync(deckId);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Study with spaced repetition for better retention
          </p>
        </div>
        <div className="flex gap-2">
          <FlashcardHelp />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Deck
          </Button>
        </div>
      </div>

      {/* Stats */}
      {streak && streak.current_streak > 0 && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{streak.current_streak} Day Streak!</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep it going! Longest streak: {streak.longest_streak} days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{streak.total_review_days}</div>
                  <div className="text-xs text-muted-foreground">Total Days</div>
                </div>
                <div>
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto" />
                  <div className="text-xs text-muted-foreground mt-1">Dedicated Learner</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decks */}
      <DeckList
        decks={decks || []}
        onSelectDeck={handleSelectDeck}
        onDeleteDeck={handleDeleteDeck}
        isLoading={isLoading}
      />

      {/* Create Deck Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deck</DialogTitle>
            <DialogDescription>
              Create a new flashcard deck to organize your learning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Deck Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Spanish Vocabulary"
                value={newDeckTitle}
                onChange={e => setNewDeckTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this deck for?"
                value={newDeckDescription}
                onChange={e => setNewDeckDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeck}
              disabled={!newDeckTitle.trim() || createDeck.isPending}
            >
              {createDeck.isPending ? 'Creating...' : 'Create Deck'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
