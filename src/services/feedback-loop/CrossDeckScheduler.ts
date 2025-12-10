/**
 * CrossDeckScheduler Service
 *
 * Optimizes review scheduling across all flashcard decks.
 * Provides unified review queues with load balancing and interleaving.
 *
 * Key features:
 * - Merge due cards from all decks into unified queue
 * - Prioritize by retention urgency
 * - Balance daily load to prevent burnout
 * - Suggest topic interleaving for better retention
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface DueCard {
  id: string;
  deckId: string;
  deckTitle: string;
  front: string;
  back: string;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  daysSinceReview: number;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  estimatedRetention: number;
  urgency: 'critical' | 'high' | 'normal' | 'low';
  topics: string[];
}

interface DailySchedule {
  date: Date;
  totalCards: number;
  byDeck: Record<string, number>;
  byUrgency: {
    critical: number;
    high: number;
    normal: number;
    low: number;
  };
  estimatedMinutes: number;
}

interface ReviewQueue {
  cards: DueCard[];
  totalCards: number;
  overdueCount: number;
  dailyTarget: number;
  estimatedMinutes: number;
  topicDistribution: Record<string, number>;
}

interface InterleavingSuggestion {
  card: DueCard;
  reason: string;
  topicSwitch: boolean;
}

export class CrossDeckScheduler {
  private defaultDailyLimit = 50;
  private avgSecondsPerCard = 30;
  private defaultDecayConstant = 0.3;

  /**
   * Get unified review queue from all decks
   */
  async getUnifiedReviewQueue(userId: string, limit: number = 100): Promise<ReviewQueue> {
    try {
      const now = new Date();
      const nowISO = now.toISOString();

      // Get all due flashcards across all decks
      const { data: deckCards, error: deckError } = await supabase
        .from('flashcards')
        .select(
          `
          id,
          deck_id,
          front_content,
          back_content,
          tags,
          difficulty,
          flashcard_decks!inner (
            id,
            title,
            created_by
          ),
          flashcard_reviews (
            easiness_factor,
            interval_days,
            repetition_count,
            next_review_date,
            last_reviewed
          )
        `
        )
        .eq('flashcard_decks.created_by', userId);

      // Get standalone flashcards
      const { data: standaloneCards, error: standaloneError } = await supabase
        .from('flashcards')
        .select(
          `
          id,
          front,
          back,
          tags,
          user_id,
          easiness_factor,
          interval,
          repetitions,
          next_review_date,
          last_review_date
        `
        )
        .eq('user_id', userId)
        .lte('next_review_date', nowISO);

      if (deckError) {
        logger.error('Error fetching deck cards:', deckError);
      }
      if (standaloneError) {
        logger.error('Error fetching standalone cards:', standaloneError);
      }

      const allCards: DueCard[] = [];

      // Process deck cards
      for (const card of deckCards || []) {
        const deck = card.flashcard_decks as any;
        const reviews = card.flashcard_reviews as any[];
        const review = reviews?.[0];

        if (!review || new Date(review.next_review_date) > now) continue;

        const daysSinceReview = review.last_reviewed
          ? Math.floor(
              (now.getTime() - new Date(review.last_reviewed).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        const retention = this.calculateRetention(daysSinceReview);
        const urgency = this.determineUrgency(retention, daysSinceReview, review.interval_days);

        allCards.push({
          id: card.id,
          deckId: deck.id,
          deckTitle: deck.title,
          front: card.front_content,
          back: card.back_content,
          nextReviewDate: new Date(review.next_review_date),
          lastReviewDate: review.last_reviewed ? new Date(review.last_reviewed) : undefined,
          daysSinceReview,
          easinessFactor: review.easiness_factor,
          interval: review.interval_days,
          repetitions: review.repetition_count,
          estimatedRetention: retention,
          urgency,
          topics: card.tags || [],
        });
      }

      // Process standalone cards
      for (const card of standaloneCards || []) {
        const daysSinceReview = card.last_review_date
          ? Math.floor(
              (now.getTime() - new Date(card.last_review_date).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        const retention = this.calculateRetention(daysSinceReview);
        const urgency = this.determineUrgency(retention, daysSinceReview, card.interval || 0);

        allCards.push({
          id: card.id,
          deckId: 'standalone',
          deckTitle: 'Standalone Cards',
          front: card.front || '',
          back: card.back || '',
          nextReviewDate: new Date(card.next_review_date),
          lastReviewDate: card.last_review_date ? new Date(card.last_review_date) : undefined,
          daysSinceReview,
          easinessFactor: card.easiness_factor || 2.5,
          interval: card.interval || 0,
          repetitions: card.repetitions || 0,
          estimatedRetention: retention,
          urgency,
          topics: card.tags || [],
        });
      }

      // Sort by urgency and retention
      const sortedCards = this.prioritizeByRetention(allCards);

      // Build topic distribution
      const topicDistribution: Record<string, number> = {};
      for (const card of sortedCards) {
        for (const topic of card.topics) {
          topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;
        }
      }

      const overdueCount = sortedCards.filter(
        c => c.urgency === 'critical' || c.urgency === 'high'
      ).length;

      return {
        cards: sortedCards.slice(0, limit),
        totalCards: sortedCards.length,
        overdueCount,
        dailyTarget: Math.min(this.defaultDailyLimit, sortedCards.length),
        estimatedMinutes: Math.ceil(
          (Math.min(limit, sortedCards.length) * this.avgSecondsPerCard) / 60
        ),
        topicDistribution,
      };
    } catch (error) {
      logger.error('Error building unified review queue:', error);
      return {
        cards: [],
        totalCards: 0,
        overdueCount: 0,
        dailyTarget: 0,
        estimatedMinutes: 0,
        topicDistribution: {},
      };
    }
  }

  /**
   * Prioritize cards by retention urgency
   */
  prioritizeByRetention(cards: DueCard[]): DueCard[] {
    const urgencyOrder = { critical: 0, high: 1, normal: 2, low: 3 };

    return [...cards].sort((a, b) => {
      // First by urgency
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;

      // Then by retention (lower first)
      return a.estimatedRetention - b.estimatedRetention;
    });
  }

  /**
   * Balance daily load to prevent burnout
   */
  async balanceDailyLoad(
    userId: string,
    daysAhead: number = 7,
    dailyLimit: number = 50
  ): Promise<DailySchedule[]> {
    try {
      const { cards, totalCards } = await this.getUnifiedReviewQueue(userId, 500);

      const schedules: DailySchedule[] = [];
      const usedCards = new Set<string>();

      for (let day = 0; day < daysAhead; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // Cards due by this day
        const dayCards = cards
          .filter(card => !usedCards.has(card.id) && card.nextReviewDate < nextDay)
          .slice(0, dailyLimit);

        // Mark as used
        for (const card of dayCards) {
          usedCards.add(card.id);
        }

        // Build deck breakdown
        const byDeck: Record<string, number> = {};
        const byUrgency = { critical: 0, high: 0, normal: 0, low: 0 };

        for (const card of dayCards) {
          byDeck[card.deckTitle] = (byDeck[card.deckTitle] || 0) + 1;
          byUrgency[card.urgency]++;
        }

        schedules.push({
          date,
          totalCards: dayCards.length,
          byDeck,
          byUrgency,
          estimatedMinutes: Math.ceil((dayCards.length * this.avgSecondsPerCard) / 60),
        });
      }

      return schedules;
    } catch (error) {
      logger.error('Error balancing daily load:', error);
      return [];
    }
  }

  /**
   * Suggest interleaving for better retention
   */
  suggestInterleaving(cards: DueCard[], maxCards: number = 20): InterleavingSuggestion[] {
    const suggestions: InterleavingSuggestion[] = [];
    const seenTopics = new Set<string>();
    let lastTopic = '';

    for (const card of cards.slice(0, maxCards * 2)) {
      if (suggestions.length >= maxCards) break;

      const cardTopics = card.topics.filter(
        t => !['auto-generated', 'easy', 'medium', 'hard'].includes(t)
      );
      const primaryTopic = cardTopics[0] || 'general';
      const isTopicSwitch = primaryTopic !== lastTopic;

      // Prefer topic switches for better interleaving
      if (isTopicSwitch || suggestions.length < 5) {
        suggestions.push({
          card,
          reason: isTopicSwitch
            ? `Switch to ${primaryTopic} for better retention`
            : 'Priority card',
          topicSwitch: isTopicSwitch,
        });
        lastTopic = primaryTopic;
        seenTopics.add(primaryTopic);
      }
    }

    return suggestions;
  }

  /**
   * Get study session recommendations
   */
  async getSessionRecommendations(
    userId: string,
    sessionMinutes: number = 15
  ): Promise<{
    recommendedCards: DueCard[];
    estimatedRetentionGain: number;
    topicsMixed: string[];
    suggestedBreaks: number[];
  }> {
    const cardsPerSession = Math.floor((sessionMinutes * 60) / this.avgSecondsPerCard);
    const { cards } = await this.getUnifiedReviewQueue(userId, cardsPerSession * 2);

    // Apply interleaving
    const interleaved = this.suggestInterleaving(cards, cardsPerSession);
    const recommendedCards = interleaved.map(s => s.card);

    // Estimate retention gain
    const avgRetentionBefore =
      recommendedCards.reduce((sum, c) => sum + c.estimatedRetention, 0) /
        recommendedCards.length || 0;
    const estimatedRetentionGain = (1 - avgRetentionBefore) * 0.8; // Assume 80% of potential retention recovered

    // Unique topics
    const topicsMixed = [...new Set(recommendedCards.flatMap(c => c.topics))];

    // Suggest breaks every 5 minutes
    const suggestedBreaks = [];
    for (let min = 5; min < sessionMinutes; min += 5) {
      suggestedBreaks.push(min);
    }

    return {
      recommendedCards,
      estimatedRetentionGain,
      topicsMixed: topicsMixed.slice(0, 5),
      suggestedBreaks,
    };
  }

  /**
   * Calculate estimated retention using exponential decay
   */
  private calculateRetention(daysSinceReview: number): number {
    // R = e^(-k * t)
    return Math.exp(-this.defaultDecayConstant * daysSinceReview);
  }

  /**
   * Determine urgency level based on retention and timing
   */
  private determineUrgency(
    retention: number,
    daysSinceReview: number,
    expectedInterval: number
  ): 'critical' | 'high' | 'normal' | 'low' {
    const overdueRatio = daysSinceReview / Math.max(1, expectedInterval);

    if (retention < 0.5 || overdueRatio > 2) return 'critical';
    if (retention < 0.7 || overdueRatio > 1.5) return 'high';
    if (retention < 0.85 || overdueRatio > 1) return 'normal';
    return 'low';
  }
}

// Singleton instance
export const crossDeckScheduler = new CrossDeckScheduler();
