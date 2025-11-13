/**
 * Flashcard Service
 * Handles CRUD operations for flashcards, decks, and reviews
 */

import { supabase } from '@/integrations/supabase/client';
import { SM2AlgorithmService, type SM2State } from './SM2AlgorithmService';
import { logger } from '@/utils/logger';

// Types
export interface FlashcardDeck {
  id: string;
  course_id: number | null;
  title: string;
  description: string | null;
  created_by: string;
  is_public: boolean;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  front_image_url: string | null;
  back_image_url: string | null;
  tags: string[] | null;
  difficulty: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  easiness_factor: number;
  interval_days: number;
  repetition_count: number;
  last_reviewed: string | null;
  next_review_date: string;
  total_reviews: number;
  total_correct: number;
  total_incorrect: number;
  review_history: ReviewHistoryEntry[];
  average_quality: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewHistoryEntry {
  date: string;
  quality: number;
  interval: number;
  ef: number;
}

export interface ReviewSession {
  id: string;
  user_id: string;
  deck_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  cards_reviewed: number;
  cards_correct: number;
  cards_incorrect: number;
  cards_skipped: number;
  average_response_time_ms: number | null;
  session_type: 'review' | 'learn' | 'cram';
  created_at: string;
}

export interface ReviewStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_review_date: string | null;
  total_review_days: number;
  created_at: string;
  updated_at: string;
}

export class FlashcardService {
  // ============================================================================
  // DECK OPERATIONS
  // ============================================================================

  /**
   * Create a new flashcard deck
   */
  static async createDeck(data: {
    title: string;
    description?: string;
    course_id?: number;
    is_public?: boolean;
  }): Promise<FlashcardDeck> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: deck, error } = await supabase
      .from('flashcard_decks')
      .insert({
        title: data.title,
        description: data.description || null,
        course_id: data.course_id || null,
        is_public: data.is_public || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create deck:', error);
      throw error;
    }

    return deck;
  }

  /**
   * Get all decks for current user (owned + public)
   */
  static async getDecks(): Promise<FlashcardDeck[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch decks:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get deck by ID
   */
  static async getDeck(deckId: string): Promise<FlashcardDeck> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('id', deckId)
      .single();

    if (error) {
      logger.error('Failed to fetch deck:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update deck
   */
  static async updateDeck(
    deckId: string,
    updates: Partial<Pick<FlashcardDeck, 'title' | 'description' | 'is_public'>>
  ): Promise<FlashcardDeck> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', deckId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update deck:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete deck (and all its cards)
   */
  static async deleteDeck(deckId: string): Promise<void> {
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', deckId);

    if (error) {
      logger.error('Failed to delete deck:', error);
      throw error;
    }
  }

  // ============================================================================
  // FLASHCARD OPERATIONS
  // ============================================================================

  /**
   * Create a new flashcard
   */
  static async createFlashcard(data: {
    deck_id: string;
    front_content: string;
    back_content: string;
    front_image_url?: string;
    back_image_url?: string;
    tags?: string[];
    difficulty?: number;
  }): Promise<Flashcard> {
    const { data: card, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: data.deck_id,
        front_content: data.front_content,
        back_content: data.back_content,
        front_image_url: data.front_image_url || null,
        back_image_url: data.back_image_url || null,
        tags: data.tags || null,
        difficulty: data.difficulty || 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create flashcard:', error);
      throw error;
    }

    return card;
  }

  /**
   * Get all flashcards in a deck
   */
  static async getFlashcards(deckId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('order_index', { ascending: true });

    if (error) {
      logger.error('Failed to fetch flashcards:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get single flashcard
   */
  static async getFlashcard(cardId: string): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) {
      logger.error('Failed to fetch flashcard:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update flashcard
   */
  static async updateFlashcard(
    cardId: string,
    updates: Partial<Omit<Flashcard, 'id' | 'deck_id' | 'created_at' | 'updated_at'>>
  ): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update flashcard:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete flashcard
   */
  static async deleteFlashcard(cardId: string): Promise<void> {
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);

    if (error) {
      logger.error('Failed to delete flashcard:', error);
      throw error;
    }
  }

  // ============================================================================
  // REVIEW OPERATIONS
  // ============================================================================

  /**
   * Get or create review state for a flashcard
   */
  static async getReviewState(flashcardId: string): Promise<FlashcardReview> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Try to get existing review state
    let { data, error } = await supabase
      .from('flashcard_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_id', flashcardId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      logger.error('Failed to fetch review state:', error);
      throw error;
    }

    // Create new review state if doesn't exist
    if (!data) {
      const initialState = SM2AlgorithmService.initializeState();
      const { data: newReview, error: insertError } = await supabase
        .from('flashcard_reviews')
        .insert({
          user_id: user.id,
          flashcard_id: flashcardId,
          easiness_factor: initialState.easinessFactor,
          interval_days: initialState.intervalDays,
          repetition_count: initialState.repetitionCount,
          next_review_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create review state:', insertError);
        throw insertError;
      }

      data = newReview;
    }

    return data;
  }

  /**
   * Submit a review and update SM-2 state
   */
  static async submitReview(
    flashcardId: string,
    quality: number
  ): Promise<FlashcardReview> {
    const reviewState = await this.getReviewState(flashcardId);

    const currentState: SM2State = {
      easinessFactor: reviewState.easiness_factor,
      intervalDays: reviewState.interval_days,
      repetitionCount: reviewState.repetition_count,
    };

    const review = SM2AlgorithmService.calculateNextReview(currentState, quality);

    // Prepare review history entry
    const historyEntry: ReviewHistoryEntry = {
      date: new Date().toISOString(),
      quality,
      interval: review.newState.intervalDays,
      ef: review.newState.easinessFactor,
    };

    const updatedHistory = [
      ...(reviewState.review_history || []),
      historyEntry,
    ];

    // Calculate new average quality
    const totalQuality =
      (reviewState.average_quality * reviewState.total_reviews) + quality;
    const newTotalReviews = reviewState.total_reviews + 1;
    const newAverageQuality = totalQuality / newTotalReviews;

    // Update review state
    const { data, error } = await supabase
      .from('flashcard_reviews')
      .update({
        easiness_factor: review.newState.easinessFactor,
        interval_days: review.newState.intervalDays,
        repetition_count: review.newState.repetitionCount,
        last_reviewed: new Date().toISOString(),
        next_review_date: review.nextReviewDate.toISOString(),
        total_reviews: newTotalReviews,
        total_correct:
          quality >= 3 ? reviewState.total_correct + 1 : reviewState.total_correct,
        total_incorrect:
          quality < 3 ? reviewState.total_incorrect + 1 : reviewState.total_incorrect,
        review_history: updatedHistory,
        average_quality: newAverageQuality,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewState.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to submit review:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get due cards for a deck
   */
  static async getDueCards(deckId: string): Promise<
    Array<Flashcard & { review: FlashcardReview }>
  > {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('flashcards')
      .select(`*, flashcard_reviews!inner(*)`)
      .eq('deck_id', deckId)
      .eq('flashcard_reviews.user_id', user.id)
      .lte('flashcard_reviews.next_review_date', new Date().toISOString())
      .order('flashcard_reviews.next_review_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch due cards:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get review streak for current user
   */
  static async getStreak(): Promise<ReviewStreak> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('review_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch streak:', error);
      throw error;
    }

    return (
      data || {
        id: '',
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        last_review_date: null,
        total_review_days: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  }
}
