/**
 * Tests for SM2AlgorithmService
 * Tests the SuperMemo SM-2 spaced repetition algorithm
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SM2AlgorithmService, SM2State, ReviewQuality } from '../SM2AlgorithmService';

vi.mock('@/utils/logger');

describe('SM2AlgorithmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeState', () => {
    it('should initialize with default values', () => {
      const state = SM2AlgorithmService.initializeState();

      expect(state.easinessFactor).toBe(2.5);
      expect(state.intervalDays).toBe(0);
      expect(state.repetitionCount).toBe(0);
    });
  });

  describe('calculateNextReview', () => {
    it('should handle perfect quality (5) - increase EF', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 0,
        repetitionCount: 0,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.PERFECT);

      expect(result.quality).toBe(5);
      expect(result.newState.easinessFactor).toBe(2.6); // 2.5 + 0.1
      expect(result.newState.repetitionCount).toBe(1);
      expect(result.newState.intervalDays).toBe(1); // First review
    });

    it('should handle good quality (4) - maintain EF approximately', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 0,
        repetitionCount: 0,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.HESITANT);

      expect(result.quality).toBe(4);
      // EF' = 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02))
      // EF' = 2.5 + (0.1 - 1 * (0.08 + 1 * 0.02))
      // EF' = 2.5 + (0.1 - 0.1) = 2.5
      expect(result.newState.easinessFactor).toBe(2.5);
      expect(result.newState.repetitionCount).toBe(1);
      expect(result.newState.intervalDays).toBe(1);
    });

    it('should handle difficult quality (3) - decrease EF slightly', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 0,
        repetitionCount: 0,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.DIFFICULT);

      expect(result.quality).toBe(3);
      // EF' = 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02))
      // EF' = 2.5 + (0.1 - 2 * (0.08 + 2 * 0.02))
      // EF' = 2.5 + (0.1 - 2 * 0.12) = 2.5 + (0.1 - 0.24) = 2.36
      expect(result.newState.easinessFactor).toBeCloseTo(2.36, 2);
      expect(result.newState.repetitionCount).toBe(1);
      expect(result.newState.intervalDays).toBe(1);
    });

    it('should handle failed quality (2) - reset repetition count', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 6,
        repetitionCount: 2,
      };

      const result = SM2AlgorithmService.calculateNextReview(
        currentState,
        ReviewQuality.EASY_RECALL
      );

      expect(result.quality).toBe(2);
      expect(result.newState.repetitionCount).toBe(0); // Reset!
      expect(result.newState.intervalDays).toBe(1); // Back to 1 day
      // EF still decreases even on failure
      // EF' = 2.5 + (0.1 - 3 * (0.08 + 3 * 0.02)) = 2.5 + (0.1 - 0.42) = 2.18
      expect(result.newState.easinessFactor).toBeCloseTo(2.18, 2);
    });

    it('should handle blackout quality (0) - reset and decrease EF significantly', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 15,
        repetitionCount: 3,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.BLACKOUT);

      expect(result.quality).toBe(0);
      expect(result.newState.repetitionCount).toBe(0); // Reset!
      expect(result.newState.intervalDays).toBe(1); // Back to 1 day
      // EF' = 2.5 + (0.1 - 5 * (0.08 + 5 * 0.02)) = 2.5 + (0.1 - 0.9) = 1.7
      expect(result.newState.easinessFactor).toBeCloseTo(1.7, 2);
    });

    it('should enforce minimum EF of 1.3', () => {
      const currentState: SM2State = {
        easinessFactor: 1.4,
        intervalDays: 1,
        repetitionCount: 0,
      };

      // Blackout should reduce EF below 1.3, but it gets clamped
      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.BLACKOUT);

      expect(result.newState.easinessFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should set second interval to 6 days', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 1,
        repetitionCount: 1,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.PERFECT);

      expect(result.newState.repetitionCount).toBe(2);
      expect(result.newState.intervalDays).toBe(6); // Second interval is always 6
    });

    it('should calculate subsequent intervals using formula I(n) = I(n-1) * EF', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 6,
        repetitionCount: 2,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.PERFECT);

      expect(result.newState.repetitionCount).toBe(3);
      // New EF = 2.5 + 0.1 = 2.6
      // New interval = 6 * 2.6 = 15.6 ≈ 16 days (rounded)
      expect(result.newState.intervalDays).toBe(16);
    });

    it('should return next review date based on interval', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 0,
        repetitionCount: 0,
      };

      const beforeTest = new Date();
      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.PERFECT);
      const afterTest = new Date();

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 1); // 1 day interval

      // Allow 1 second tolerance for test execution time
      expect(result.nextReviewDate.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(result.nextReviewDate.getTime()).toBeLessThanOrEqual(afterTest.getTime() + 86400000); // +1 day
    });

    it('should clamp invalid quality scores', () => {
      const currentState = SM2AlgorithmService.initializeState();

      // Quality too high
      const result1 = SM2AlgorithmService.calculateNextReview(currentState, 10);
      expect(result1.quality).toBe(5); // Clamped to max

      // Quality too low
      const result2 = SM2AlgorithmService.calculateNextReview(currentState, -5);
      expect(result2.quality).toBe(0); // Clamped to min
    });

    it('should preserve previous state in result', () => {
      const currentState: SM2State = {
        easinessFactor: 2.3,
        intervalDays: 10,
        repetitionCount: 3,
      };

      const result = SM2AlgorithmService.calculateNextReview(currentState, ReviewQuality.PERFECT);

      expect(result.previousState).toEqual(currentState);
      expect(result.previousState).not.toBe(currentState); // Should be a copy
    });
  });

  describe('estimateInterval', () => {
    it('should return 0 for repetition count 0', () => {
      const interval = SM2AlgorithmService.estimateInterval(0, 2.5);
      expect(interval).toBe(0);
    });

    it('should return 1 for first repetition', () => {
      const interval = SM2AlgorithmService.estimateInterval(1, 2.5);
      expect(interval).toBe(1);
    });

    it('should return 6 for second repetition', () => {
      const interval = SM2AlgorithmService.estimateInterval(2, 2.5);
      expect(interval).toBe(6);
    });

    it('should calculate subsequent intervals correctly', () => {
      // Rep 3: 6 * 2.5 = 15
      expect(SM2AlgorithmService.estimateInterval(3, 2.5)).toBe(15);

      // Rep 4: 15 * 2.5 = 37.5 ≈ 38
      expect(SM2AlgorithmService.estimateInterval(4, 2.5)).toBe(38);

      // Rep 5: 38 * 2.5 = 95
      expect(SM2AlgorithmService.estimateInterval(5, 2.5)).toBe(95);
    });

    it('should handle different easiness factors', () => {
      // Higher EF = faster interval growth
      const highEF = SM2AlgorithmService.estimateInterval(3, 3.0);
      expect(highEF).toBe(18); // 6 * 3.0

      // Lower EF = slower interval growth
      const lowEF = SM2AlgorithmService.estimateInterval(3, 1.5);
      expect(lowEF).toBe(9); // 6 * 1.5
    });
  });

  describe('getIntervalLabel', () => {
    it('should label new cards', () => {
      expect(SM2AlgorithmService.getIntervalLabel(0)).toBe('New');
    });

    it('should format single day', () => {
      expect(SM2AlgorithmService.getIntervalLabel(1)).toBe('1 day');
    });

    it('should format multiple days', () => {
      expect(SM2AlgorithmService.getIntervalLabel(5)).toBe('5 days');
    });

    it('should format single week', () => {
      expect(SM2AlgorithmService.getIntervalLabel(7)).toBe('1 week');
    });

    it('should format multiple weeks', () => {
      expect(SM2AlgorithmService.getIntervalLabel(14)).toBe('2 weeks');
      expect(SM2AlgorithmService.getIntervalLabel(21)).toBe('3 weeks');
    });

    it('should format single month', () => {
      expect(SM2AlgorithmService.getIntervalLabel(30)).toBe('1 month');
    });

    it('should format multiple months', () => {
      expect(SM2AlgorithmService.getIntervalLabel(60)).toBe('2 months');
      expect(SM2AlgorithmService.getIntervalLabel(180)).toBe('6 months');
    });

    it('should format single year', () => {
      expect(SM2AlgorithmService.getIntervalLabel(365)).toBe('1 year');
    });

    it('should format multiple years', () => {
      expect(SM2AlgorithmService.getIntervalLabel(730)).toBe('2 years');
    });
  });

  describe('isDue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      expect(SM2AlgorithmService.isDue(pastDate)).toBe(true);
    });

    it('should return true for current time', () => {
      const now = new Date();
      expect(SM2AlgorithmService.isDue(now)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      expect(SM2AlgorithmService.isDue(futureDate)).toBe(false);
    });
  });

  describe('filterDueCards', () => {
    it('should filter cards due for review', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000); // 1 day ago
      const future = new Date(now.getTime() + 86400000); // 1 day from now

      const cards = [
        { id: 1, nextReviewDate: past },
        { id: 2, nextReviewDate: now },
        { id: 3, nextReviewDate: future },
      ];

      const dueCards = SM2AlgorithmService.filterDueCards(cards);

      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].id).toBe(1);
      expect(dueCards[1].id).toBe(2);
    });

    it('should return empty array when no cards are due', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const cards = [
        { id: 1, nextReviewDate: future },
        { id: 2, nextReviewDate: future },
      ];

      const dueCards = SM2AlgorithmService.filterDueCards(cards);

      expect(dueCards).toHaveLength(0);
    });
  });

  describe('sortByDueDate', () => {
    it('should sort cards by next review date (earliest first)', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-05');
      const date3 = new Date('2025-01-03');

      const cards = [
        { id: 2, nextReviewDate: date2 },
        { id: 1, nextReviewDate: date1 },
        { id: 3, nextReviewDate: date3 },
      ];

      const sorted = SM2AlgorithmService.sortByDueDate(cards);

      expect(sorted[0].id).toBe(1); // Jan 1
      expect(sorted[1].id).toBe(3); // Jan 3
      expect(sorted[2].id).toBe(2); // Jan 5
    });

    it('should not mutate original array', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-05');

      const cards = [
        { id: 2, nextReviewDate: date2 },
        { id: 1, nextReviewDate: date1 },
      ];

      const sorted = SM2AlgorithmService.sortByDueDate(cards);

      expect(cards[0].id).toBe(2); // Original unchanged
      expect(sorted[0].id).toBe(1); // Sorted
    });
  });

  describe('estimateRetention', () => {
    it('should return high retention for recent reviews', () => {
      const retention = SM2AlgorithmService.estimateRetention(1, 2.5);
      expect(retention).toBeGreaterThan(0.9);
    });

    it('should return lower retention for older reviews', () => {
      const retention = SM2AlgorithmService.estimateRetention(30, 2.5);
      expect(retention).toBeLessThan(0.5);
    });

    it('should show higher EF leads to better retention', () => {
      const lowEF = SM2AlgorithmService.estimateRetention(10, 1.5);
      const highEF = SM2AlgorithmService.estimateRetention(10, 3.0);

      expect(highEF).toBeGreaterThan(lowEF);
    });

    it('should clamp retention between 0 and 1', () => {
      const retention1 = SM2AlgorithmService.estimateRetention(0, 2.5);
      expect(retention1).toBeLessThanOrEqual(1);

      const retention2 = SM2AlgorithmService.estimateRetention(1000, 2.5);
      expect(retention2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDifficultyCategory', () => {
    it('should categorize as Easy for high EF', () => {
      expect(SM2AlgorithmService.getDifficultyCategory(2.5)).toBe('Easy');
      expect(SM2AlgorithmService.getDifficultyCategory(3.0)).toBe('Easy');
    });

    it('should categorize as Medium for moderate EF', () => {
      expect(SM2AlgorithmService.getDifficultyCategory(2.0)).toBe('Medium');
      expect(SM2AlgorithmService.getDifficultyCategory(2.4)).toBe('Medium');
    });

    it('should categorize as Hard for lower EF', () => {
      expect(SM2AlgorithmService.getDifficultyCategory(1.7)).toBe('Hard');
      expect(SM2AlgorithmService.getDifficultyCategory(1.9)).toBe('Hard');
    });

    it('should categorize as Very Hard for lowest EF', () => {
      expect(SM2AlgorithmService.getDifficultyCategory(1.3)).toBe('Very Hard');
      expect(SM2AlgorithmService.getDifficultyCategory(1.6)).toBe('Very Hard');
    });
  });

  describe('getQualityDescription', () => {
    it('should return description for each quality level', () => {
      expect(SM2AlgorithmService.getQualityDescription(ReviewQuality.PERFECT)).toContain('Perfect');
      expect(SM2AlgorithmService.getQualityDescription(ReviewQuality.HESITANT)).toContain(
        'hesitation'
      );
      expect(SM2AlgorithmService.getQualityDescription(ReviewQuality.DIFFICULT)).toContain(
        'difficulty'
      );
      expect(SM2AlgorithmService.getQualityDescription(ReviewQuality.EASY_RECALL)).toContain(
        'easy'
      );
      expect(SM2AlgorithmService.getQualityDescription(ReviewQuality.FAMILIAR)).toContain(
        'familiar'
      );
      expect(SM2AlgorithmService.getQualityDescription(ReviewQuality.BLACKOUT)).toContain(
        'blackout'
      );
    });

    it('should return Unknown for invalid quality', () => {
      expect(SM2AlgorithmService.getQualityDescription(99)).toBe('Unknown');
    });
  });

  describe('mapButtonToQuality', () => {
    it('should map again button to FAMILIAR (1)', () => {
      expect(SM2AlgorithmService.mapButtonToQuality('again')).toBe(ReviewQuality.FAMILIAR);
    });

    it('should map hard button to DIFFICULT (3)', () => {
      expect(SM2AlgorithmService.mapButtonToQuality('hard')).toBe(ReviewQuality.DIFFICULT);
    });

    it('should map good button to HESITANT (4)', () => {
      expect(SM2AlgorithmService.mapButtonToQuality('good')).toBe(ReviewQuality.HESITANT);
    });

    it('should map easy button to PERFECT (5)', () => {
      expect(SM2AlgorithmService.mapButtonToQuality('easy')).toBe(ReviewQuality.PERFECT);
    });
  });

  describe('previewIntervals', () => {
    it('should return preview intervals for all buttons', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 6,
        repetitionCount: 2,
      };

      const preview = SM2AlgorithmService.previewIntervals(currentState);

      expect(preview.again).toBe(1); // Failed, back to 1 day
      expect(preview.hard).toBeGreaterThan(1); // Passed but difficult
      expect(preview.good).toBeGreaterThan(preview.hard); // Good > Hard
      expect(preview.easy).toBeGreaterThan(preview.good); // Easy > Good
    });

    it('should show again button resets to 1 day', () => {
      const currentState: SM2State = {
        easinessFactor: 2.0,
        intervalDays: 30,
        repetitionCount: 5,
      };

      const preview = SM2AlgorithmService.previewIntervals(currentState);

      expect(preview.again).toBe(1); // Always resets to 1
    });

    it('should show increasing intervals for better responses', () => {
      const currentState: SM2State = {
        easinessFactor: 2.5,
        intervalDays: 6,
        repetitionCount: 2,
      };

      const preview = SM2AlgorithmService.previewIntervals(currentState);

      // Verify ascending order
      expect(preview.again).toBeLessThan(preview.hard);
      expect(preview.hard).toBeLessThan(preview.good);
      expect(preview.good).toBeLessThan(preview.easy);
    });
  });
});
