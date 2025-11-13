/**
 * SM-2 Algorithm Service
 * Implements the SuperMemo SM-2 spaced repetition algorithm
 *
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Algorithm Overview:
 * - Quality scores: 0-5 (0 = complete blackout, 5 = perfect recall)
 * - Easiness Factor (EF): 1.3-2.5+ (measures card difficulty, default 2.5)
 * - Interval: Days until next review
 * - Repetition: Count of consecutive correct reviews
 */

import { logger } from '@/utils/logger';

export interface SM2State {
  easinessFactor: number; // 1.3-2.5+
  intervalDays: number; // Days until next review
  repetitionCount: number; // Consecutive correct reviews
}

export interface SM2Review {
  quality: number; // 0-5 quality score
  previousState: SM2State;
  newState: SM2State;
  nextReviewDate: Date;
}

/**
 * Quality score meanings:
 * 5 - Perfect response
 * 4 - Correct response after hesitation
 * 3 - Correct response with difficulty
 * 2 - Incorrect response; correct answer seemed easy to recall
 * 1 - Incorrect response; correct answer seemed familiar
 * 0 - Complete blackout (no recollection)
 */
export enum ReviewQuality {
  BLACKOUT = 0,
  FAMILIAR = 1,
  EASY_RECALL = 2,
  DIFFICULT = 3,
  HESITANT = 4,
  PERFECT = 5,
}

export class SM2AlgorithmService {
  // SM-2 Constants
  private static readonly MIN_EASINESS_FACTOR = 1.3;
  private static readonly DEFAULT_EASINESS_FACTOR = 2.5;
  private static readonly INITIAL_INTERVAL = 1; // 1 day
  private static readonly SECOND_INTERVAL = 6; // 6 days
  private static readonly PASSING_QUALITY = 3; // Minimum quality to pass

  /**
   * Initialize a new card's SM-2 state
   */
  static initializeState(): SM2State {
    return {
      easinessFactor: this.DEFAULT_EASINESS_FACTOR,
      intervalDays: 0,
      repetitionCount: 0,
    };
  }

  /**
   * Calculate next review based on quality score
   *
   * @param currentState - Current SM-2 state
   * @param quality - Quality score (0-5)
   * @returns Updated SM-2 state and next review date
   */
  static calculateNextReview(
    currentState: SM2State,
    quality: number
  ): SM2Review {
    // Validate quality score
    if (quality < 0 || quality > 5) {
      logger.error(`Invalid quality score: ${quality}. Must be 0-5.`);
      quality = Math.max(0, Math.min(5, Math.round(quality)));
    }

    const previousState = { ...currentState };
    const newState = { ...currentState };

    // Calculate new easiness factor
    // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    newState.easinessFactor = Math.max(
      this.MIN_EASINESS_FACTOR,
      currentState.easinessFactor + efDelta
    );

    // Calculate new interval and repetition count
    if (quality < this.PASSING_QUALITY) {
      // Failed review - start over
      newState.repetitionCount = 0;
      newState.intervalDays = this.INITIAL_INTERVAL;
    } else {
      // Passed review - calculate next interval
      newState.repetitionCount = currentState.repetitionCount + 1;

      if (newState.repetitionCount === 1) {
        newState.intervalDays = this.INITIAL_INTERVAL;
      } else if (newState.repetitionCount === 2) {
        newState.intervalDays = this.SECOND_INTERVAL;
      } else {
        // I(n) = I(n-1) * EF
        newState.intervalDays = Math.round(
          currentState.intervalDays * newState.easinessFactor
        );
      }
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newState.intervalDays);

    logger.info('SM-2 calculation', {
      quality,
      previousEF: previousState.easinessFactor.toFixed(2),
      newEF: newState.easinessFactor.toFixed(2),
      previousInterval: previousState.intervalDays,
      newInterval: newState.intervalDays,
      repetitionCount: newState.repetitionCount,
      nextReview: nextReviewDate.toISOString(),
    });

    return {
      quality,
      previousState,
      newState,
      nextReviewDate,
    };
  }

  /**
   * Get interval in days for a given repetition count and EF
   * (for preview/estimation purposes)
   */
  static estimateInterval(repetitionCount: number, easinessFactor: number): number {
    if (repetitionCount === 0) return 0;
    if (repetitionCount === 1) return this.INITIAL_INTERVAL;
    if (repetitionCount === 2) return this.SECOND_INTERVAL;

    let interval = this.SECOND_INTERVAL;
    for (let i = 3; i <= repetitionCount; i++) {
      interval = Math.round(interval * easinessFactor);
    }
    return interval;
  }

  /**
   * Get interval category label for UI
   */
  static getIntervalLabel(days: number): string {
    if (days === 0) return 'New';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 week' : `${weeks} weeks`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year' : `${years} years`;
  }

  /**
   * Determine if a card is due for review
   */
  static isDue(nextReviewDate: Date): boolean {
    return new Date() >= nextReviewDate;
  }

  /**
   * Get cards due today from a list of review states
   */
  static filterDueCards<T extends { nextReviewDate: Date }>(cards: T[]): T[] {
    const now = new Date();
    return cards.filter(card => card.nextReviewDate <= now);
  }

  /**
   * Sort cards by next review date (earliest first)
   */
  static sortByDueDate<T extends { nextReviewDate: Date }>(cards: T[]): T[] {
    return [...cards].sort(
      (a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime()
    );
  }

  /**
   * Calculate retention probability based on interval and EF
   * (Estimated using exponential decay model)
   */
  static estimateRetention(
    daysSinceReview: number,
    easinessFactor: number
  ): number {
    // Higher EF = slower decay
    // Rough approximation: R(t) = e^(-t / (k * EF))
    const k = 10; // Decay constant
    const retention = Math.exp(-daysSinceReview / (k * easinessFactor));
    return Math.max(0, Math.min(1, retention));
  }

  /**
   * Get difficulty category based on EF
   */
  static getDifficultyCategory(easinessFactor: number): string {
    if (easinessFactor >= 2.5) return 'Easy';
    if (easinessFactor >= 2.0) return 'Medium';
    if (easinessFactor >= 1.7) return 'Hard';
    return 'Very Hard';
  }

  /**
   * Get quality description for UI
   */
  static getQualityDescription(quality: number): string {
    switch (quality) {
      case ReviewQuality.PERFECT:
        return 'Perfect recall - knew answer immediately';
      case ReviewQuality.HESITANT:
        return 'Correct after slight hesitation';
      case ReviewQuality.DIFFICULT:
        return 'Correct with difficulty';
      case ReviewQuality.EASY_RECALL:
        return 'Incorrect - but answer seemed easy';
      case ReviewQuality.FAMILIAR:
        return 'Incorrect - but answer seemed familiar';
      case ReviewQuality.BLACKOUT:
        return 'Complete blackout - no recollection';
      default:
        return 'Unknown';
    }
  }

  /**
   * Map simple "Again/Hard/Good/Easy" buttons to quality scores
   */
  static mapButtonToQuality(button: 'again' | 'hard' | 'good' | 'easy'): number {
    switch (button) {
      case 'again':
        return ReviewQuality.FAMILIAR; // 1 - Failed, needs immediate review
      case 'hard':
        return ReviewQuality.DIFFICULT; // 3 - Passed but difficult
      case 'good':
        return ReviewQuality.HESITANT; // 4 - Passed comfortably
      case 'easy':
        return ReviewQuality.PERFECT; // 5 - Perfect recall
      default:
        return ReviewQuality.DIFFICULT;
    }
  }

  /**
   * Preview next intervals for each button choice
   * (Used to show user what will happen before they choose)
   */
  static previewIntervals(currentState: SM2State): {
    again: number;
    hard: number;
    good: number;
    easy: number;
  } {
    const again = this.calculateNextReview(
      currentState,
      this.mapButtonToQuality('again')
    ).newState.intervalDays;

    const hard = this.calculateNextReview(
      currentState,
      this.mapButtonToQuality('hard')
    ).newState.intervalDays;

    const good = this.calculateNextReview(
      currentState,
      this.mapButtonToQuality('good')
    ).newState.intervalDays;

    const easy = this.calculateNextReview(
      currentState,
      this.mapButtonToQuality('easy')
    ).newState.intervalDays;

    return { again, hard, good, easy };
  }
}
