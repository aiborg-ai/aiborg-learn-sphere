/**
 * FlashcardEditor Component
 * Create/edit flashcards
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { X } from '@/components/ui/icons';
import type { Flashcard } from '@/services/spaced-repetition/FlashcardService';

interface FlashcardEditorProps {
  deckId: string;
  flashcard?: Flashcard;
  onSave: (data: { front_content: string; back_content: string; tags?: string[] }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function FlashcardEditor({
  deckId,
  flashcard,
  onSave,
  onCancel,
  isSaving = false,
}: FlashcardEditorProps) {
  const [frontContent, setFrontContent] = useState(flashcard?.front_content || '');
  const [backContent, setBackContent] = useState(flashcard?.back_content || '');
  const [tagsInput, setTagsInput] = useState(flashcard?.tags?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      front_content: frontContent,
      back_content: backContent,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const isValid = frontContent.trim().length > 0 && backContent.trim().length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{flashcard ? 'Edit Flashcard' : 'Create New Flashcard'}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Front */}
          <div className="space-y-2">
            <Label htmlFor="front">
              Front (Question) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="front"
              placeholder="What is the capital of France?"
              value={frontContent}
              onChange={e => setFrontContent(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is what you'll see when reviewing the card
            </p>
          </div>

          {/* Back */}
          <div className="space-y-2">
            <Label htmlFor="back">
              Back (Answer) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="back"
              placeholder="Paris"
              value={backContent}
              onChange={e => setBackContent(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is the answer you're trying to remember
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="geography, capitals, france"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSaving}>
            {isSaving ? 'Saving...' : flashcard ? 'Update Card' : 'Create Card'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
