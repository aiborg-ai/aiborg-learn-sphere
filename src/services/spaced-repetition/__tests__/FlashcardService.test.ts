/**
 * Tests for FlashcardService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardService } from '../FlashcardService';
import { supabase } from '@/integrations/supabase/client';
import type { FlashcardDeck, Flashcard, FlashcardReview } from '../FlashcardService';

vi.mock('@/integrations/supabase/client');
vi.mock('@/utils/logger');
vi.mock('../SM2AlgorithmService', () => ({
  SM2AlgorithmService: {
    initializeState: vi.fn(() => ({
      easinessFactor: 2.5,
      intervalDays: 0,
      repetitionCount: 0,
    })),
    calculateNextReview: vi.fn((state, quality) => ({
      quality,
      previousState: state,
      newState: {
        easinessFactor: 2.5,
        intervalDays: 1,
        repetitionCount: 1,
      },
      nextReviewDate: new Date('2025-01-02'),
    })),
  },
}));

describe('FlashcardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock supabase.auth.getUser()
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  const mockDeck: FlashcardDeck = {
    id: 'deck-1',
    course_id: 1,
    title: 'Test Deck',
    description: 'Test description',
    created_by: 'user-1',
    is_public: false,
    card_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockFlashcard: Flashcard = {
    id: 'card-1',
    deck_id: 'deck-1',
    front_content: 'What is 2+2?',
    back_content: '4',
    front_image_url: null,
    back_image_url: null,
    tags: ['math'],
    difficulty: 1,
    order_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockReview: FlashcardReview = {
    id: 'review-1',
    user_id: 'user-1',
    flashcard_id: 'card-1',
    easiness_factor: 2.5,
    interval_days: 1,
    repetition_count: 0,
    last_reviewed: null,
    next_review_date: new Date().toISOString(),
    total_reviews: 0,
    total_correct: 0,
    total_incorrect: 0,
    review_history: [],
    average_quality: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // ============================================================================
  // DECK OPERATIONS
  // ============================================================================

  describe('createDeck', () => {
    it('should create a new deck with required fields', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockDeck,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const result = await FlashcardService.createDeck({
        title: 'Test Deck',
        description: 'Test description',
      });

      expect(result).toEqual(mockDeck);
      expect(mockInsert).toHaveBeenCalledWith({
        title: 'Test Deck',
        description: 'Test description',
        course_id: null,
        is_public: false,
        created_by: 'user-1',
      });
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FlashcardService.createDeck({ title: 'Test' })).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error on database failure', async () => {
      const mockError = new Error('Database error');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(FlashcardService.createDeck({ title: 'Test' })).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getDecks', () => {
    it('should fetch decks for current user', async () => {
      const mockDecks = [mockDeck, { ...mockDeck, id: 'deck-2' }];

      const mockQuery = Promise.resolve({ data: mockDecks, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FlashcardService.getDecks();

      expect(result).toEqual(mockDecks);
      expect(mockOr).toHaveBeenCalledWith('created_by.eq.user-1,is_public.eq.true');
    });

    it('should return empty array when no decks found', async () => {
      const mockQuery = Promise.resolve({ data: null, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FlashcardService.getDecks();

      expect(result).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FlashcardService.getDecks()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getDeck', () => {
    it('should fetch deck by ID', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDeck,
              error: null,
            }),
          }),
        }),
      });

      const result = await FlashcardService.getDeck('deck-1');

      expect(result).toEqual(mockDeck);
    });

    it('should throw error when deck not found', async () => {
      const mockError = new Error('Not found');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(FlashcardService.getDeck('deck-1')).rejects.toThrow('Not found');
    });
  });

  describe('updateDeck', () => {
    it('should update deck with new values', async () => {
      const mockUpdated = { ...mockDeck, title: 'Updated Title' };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdated,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await FlashcardService.updateDeck('deck-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw error on update failure', async () => {
      const mockError = new Error('Update failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });

      await expect(FlashcardService.updateDeck('deck-1', { title: 'Updated' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteDeck', () => {
    it('should delete deck by ID', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await FlashcardService.deleteDeck('deck-1');

      expect(supabase.from).toHaveBeenCalledWith('flashcard_decks');
    });

    it('should throw error on delete failure', async () => {
      const mockError = new Error('Delete failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      await expect(FlashcardService.deleteDeck('deck-1')).rejects.toThrow('Delete failed');
    });
  });

  // ============================================================================
  // FLASHCARD OPERATIONS
  // ============================================================================

  describe('createFlashcard', () => {
    it('should create a new flashcard with required fields', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      const result = await FlashcardService.createFlashcard({
        deck_id: 'deck-1',
        front_content: 'What is 2+2?',
        back_content: '4',
      });

      expect(result).toEqual(mockFlashcard);
    });

    it('should create flashcard with optional fields', async () => {
      const mockWithImages = {
        ...mockFlashcard,
        front_image_url: 'https://example.com/front.jpg',
        back_image_url: 'https://example.com/back.jpg',
        tags: ['math', 'arithmetic'],
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockWithImages,
              error: null,
            }),
          }),
        }),
      });

      const result = await FlashcardService.createFlashcard({
        deck_id: 'deck-1',
        front_content: 'What is 2+2?',
        back_content: '4',
        front_image_url: 'https://example.com/front.jpg',
        back_image_url: 'https://example.com/back.jpg',
        tags: ['math', 'arithmetic'],
        difficulty: 2,
      });

      expect(result.front_image_url).toBe('https://example.com/front.jpg');
      expect(result.tags).toContain('math');
    });

    it('should throw error on creation failure', async () => {
      const mockError = new Error('Creation failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(
        FlashcardService.createFlashcard({
          deck_id: 'deck-1',
          front_content: 'Front',
          back_content: 'Back',
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getFlashcards', () => {
    it('should fetch all flashcards in a deck', async () => {
      const mockCards = [mockFlashcard, { ...mockFlashcard, id: 'card-2' }];

      const mockQuery = Promise.resolve({ data: mockCards, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FlashcardService.getFlashcards('deck-1');

      expect(result).toEqual(mockCards);
      expect(mockEq).toHaveBeenCalledWith('deck_id', 'deck-1');
    });

    it('should return empty array when no flashcards found', async () => {
      const mockQuery = Promise.resolve({ data: null, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FlashcardService.getFlashcards('deck-1');

      expect(result).toEqual([]);
    });
  });

  describe('getFlashcard', () => {
    it('should fetch single flashcard by ID', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcard,
              error: null,
            }),
          }),
        }),
      });

      const result = await FlashcardService.getFlashcard('card-1');

      expect(result).toEqual(mockFlashcard);
    });

    it('should throw error when flashcard not found', async () => {
      const mockError = new Error('Not found');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(FlashcardService.getFlashcard('card-1')).rejects.toThrow('Not found');
    });
  });

  describe('updateFlashcard', () => {
    it('should update flashcard with new values', async () => {
      const mockUpdated = { ...mockFlashcard, front_content: 'Updated question' };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdated,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await FlashcardService.updateFlashcard('card-1', {
        front_content: 'Updated question',
      });

      expect(result.front_content).toBe('Updated question');
    });

    it('should throw error on update failure', async () => {
      const mockError = new Error('Update failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });

      await expect(
        FlashcardService.updateFlashcard('card-1', { front_content: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteFlashcard', () => {
    it('should delete flashcard by ID', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await FlashcardService.deleteFlashcard('card-1');

      expect(supabase.from).toHaveBeenCalledWith('flashcards');
    });

    it('should throw error on delete failure', async () => {
      const mockError = new Error('Delete failed');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      await expect(FlashcardService.deleteFlashcard('card-1')).rejects.toThrow('Delete failed');
    });
  });

  // ============================================================================
  // REVIEW OPERATIONS
  // ============================================================================

  describe('getReviewState', () => {
    it('should fetch existing review state', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockReview,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await FlashcardService.getReviewState('card-1');

      expect(result).toEqual(mockReview);
    });

    it('should create new review state if not exists', async () => {
      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: check for existing
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // No rows found
                  }),
                }),
              }),
            }),
          };
        } else {
          // Second call: create new
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await FlashcardService.getReviewState('card-1');

      expect(result).toEqual(mockReview);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FlashcardService.getReviewState('card-1')).rejects.toThrow('Not authenticated');
    });

    it('should throw error on database failure (not PGRST116)', async () => {
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });

      await expect(FlashcardService.getReviewState('card-1')).rejects.toThrow();
    });
  });

  describe('submitReview', () => {
    it('should submit review and update state', async () => {
      const updatedReview = {
        ...mockReview,
        easiness_factor: 2.5,
        interval_days: 1,
        repetition_count: 1,
        total_reviews: 1,
        total_correct: 1,
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get existing review state
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockReview,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else {
          // Update review state
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedReview,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await FlashcardService.submitReview('card-1', 5);

      expect(result.total_reviews).toBe(1);
      expect(result.total_correct).toBe(1);
    });

    it('should increment total_incorrect for low quality scores', async () => {
      const updatedReview = {
        ...mockReview,
        total_reviews: 1,
        total_incorrect: 1,
        total_correct: 0,
      };

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockReview,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedReview,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await FlashcardService.submitReview('card-1', 2); // Quality < 3

      expect(result.total_incorrect).toBe(1);
      expect(result.total_correct).toBe(0);
    });

    it('should throw error on update failure', async () => {
      const mockError = new Error('Update failed');

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockReview,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: mockError,
                  }),
                }),
              }),
            }),
          };
        }
      });

      await expect(FlashcardService.submitReview('card-1', 5)).rejects.toThrow('Update failed');
    });
  });

  describe('getDueCards', () => {
    it('should fetch due cards for a deck', async () => {
      const mockDueCards = [
        { ...mockFlashcard, review: mockReview },
        { ...mockFlashcard, id: 'card-2', review: { ...mockReview, id: 'review-2' } },
      ];

      const mockQuery = Promise.resolve({ data: mockDueCards, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockLte = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ lte: mockLte });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FlashcardService.getDueCards('deck-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('review');
    });

    it('should return empty array when no due cards', async () => {
      const mockQuery = Promise.resolve({ data: null, error: null });
      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockLte = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = vi.fn().mockReturnValue({ lte: mockLte });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FlashcardService.getDueCards('deck-1');

      expect(result).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FlashcardService.getDueCards('deck-1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('getStreak', () => {
    it('should fetch existing streak', async () => {
      const mockStreak = {
        id: 'streak-1',
        user_id: 'user-1',
        current_streak: 5,
        longest_streak: 10,
        last_review_date: new Date().toISOString(),
        total_review_days: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockStreak,
              error: null,
            }),
          }),
        }),
      });

      const result = await FlashcardService.getStreak();

      expect(result).toEqual(mockStreak);
      expect(result.current_streak).toBe(5);
    });

    it('should return default streak when not exists', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows found
            }),
          }),
        }),
      });

      const result = await FlashcardService.getStreak();

      expect(result.current_streak).toBe(0);
      expect(result.longest_streak).toBe(0);
      expect(result.user_id).toBe('user-1');
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FlashcardService.getStreak()).rejects.toThrow('Not authenticated');
    });

    it('should throw error on database failure (not PGRST116)', async () => {
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(FlashcardService.getStreak()).rejects.toThrow();
    });
  });
});
