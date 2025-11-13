/**
 * useFlashcards Hook
 * React hooks for flashcard and deck management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { FlashcardService, type FlashcardDeck, type Flashcard } from '@/services/spaced-repetition/FlashcardService';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Get all flashcard decks
 */
export function useFlashcardDecks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcard-decks', user?.id],
    queryFn: () => FlashcardService.getDecks(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get single deck by ID
 */
export function useFlashcardDeck(deckId: string | undefined) {
  return useQuery({
    queryKey: ['flashcard-deck', deckId],
    queryFn: () => FlashcardService.getDeck(deckId!),
    enabled: !!deckId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create a new deck
 */
export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      course_id?: number;
      is_public?: boolean;
    }) => FlashcardService.createDeck(data),
    onSuccess: () => {
      toast.success('Deck created successfully!');
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
    onError: error => {
      logger.error('Failed to create deck:', error);
      toast.error('Failed to create deck');
    },
  });
}

/**
 * Update deck
 */
export function useUpdateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deckId,
      updates,
    }: {
      deckId: string;
      updates: Partial<Pick<FlashcardDeck, 'title' | 'description' | 'is_public'>>;
    }) => FlashcardService.updateDeck(deckId, updates),
    onSuccess: (_, variables) => {
      toast.success('Deck updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
    onError: error => {
      logger.error('Failed to update deck:', error);
      toast.error('Failed to update deck');
    },
  });
}

/**
 * Delete deck
 */
export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckId: string) => FlashcardService.deleteDeck(deckId),
    onSuccess: () => {
      toast.success('Deck deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
    onError: error => {
      logger.error('Failed to delete deck:', error);
      toast.error('Failed to delete deck');
    },
  });
}

/**
 * Get all flashcards in a deck
 */
export function useFlashcards(deckId: string | undefined) {
  return useQuery({
    queryKey: ['flashcards', deckId],
    queryFn: () => FlashcardService.getFlashcards(deckId!),
    enabled: !!deckId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get single flashcard
 */
export function useFlashcard(cardId: string | undefined) {
  return useQuery({
    queryKey: ['flashcard', cardId],
    queryFn: () => FlashcardService.getFlashcard(cardId!),
    enabled: !!cardId,
  });
}

/**
 * Create a new flashcard
 */
export function useCreateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      deck_id: string;
      front_content: string;
      back_content: string;
      front_image_url?: string;
      back_image_url?: string;
      tags?: string[];
      difficulty?: number;
    }) => FlashcardService.createFlashcard(data),
    onSuccess: (_, variables) => {
      toast.success('Flashcard created!');
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.deck_id] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-deck', variables.deck_id] });
    },
    onError: error => {
      logger.error('Failed to create flashcard:', error);
      toast.error('Failed to create flashcard');
    },
  });
}

/**
 * Update flashcard
 */
export function useUpdateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      updates,
    }: {
      cardId: string;
      updates: Partial<Omit<Flashcard, 'id' | 'deck_id' | 'created_at' | 'updated_at'>>;
    }) => FlashcardService.updateFlashcard(cardId, updates),
    onSuccess: (data) => {
      toast.success('Flashcard updated!');
      queryClient.invalidateQueries({ queryKey: ['flashcard', data.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards', data.deck_id] });
    },
    onError: error => {
      logger.error('Failed to update flashcard:', error);
      toast.error('Failed to update flashcard');
    },
  });
}

/**
 * Delete flashcard
 */
export function useDeleteFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => FlashcardService.deleteFlashcard(cardId),
    onSuccess: () => {
      toast.success('Flashcard deleted!');
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: error => {
      logger.error('Failed to delete flashcard:', error);
      toast.error('Failed to delete flashcard');
    },
  });
}

/**
 * Get due cards for a deck
 */
export function useDueCards(deckId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['due-cards', deckId, user?.id],
    queryFn: () => FlashcardService.getDueCards(deckId!),
    enabled: !!deckId && !!user,
    staleTime: 1000 * 30, // 30 seconds (fresher data for active review)
  });
}
