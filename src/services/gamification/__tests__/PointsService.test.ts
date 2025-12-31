/**
 * PointsService Tests
 * Tests for points, levels, streaks, and user progress management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PointsService } from '../PointsService';
import { supabase } from '@/integrations/supabase/client';
import type {
  UserProgress,
  PointTransaction,
  PointsAwardResult,
  StreakUpdateResult,
} from '../types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('PointsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeUser', () => {
    it('should initialize user progress successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.initializeUser('user-123');

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('initialize_user_progress', {
        p_user_id: 'user-123',
      });
    });

    it('should handle initialization errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.initializeUser('user-123');

      expect(result).toBe(false);
    });

    it('should handle initialization exceptions', async () => {
      const mockRpc = vi.fn().mockRejectedValue(new Error('Connection failed'));
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.initializeUser('user-123');

      expect(result).toBe(false);
    });
  });

  describe('getUserProgress', () => {
    const mockProgress: UserProgress = {
      user_id: 'user-123',
      total_points: 2500,
      current_level: 5,
      lifetime_points: 3000,
      current_streak: 7,
      longest_streak: 14,
      last_activity_date: '2025-12-29',
      points_multiplier: 1.25,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-12-29T00:00:00Z',
    };

    it('should fetch user progress successfully', async () => {
      // Mock RPC for initialization
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      // Mock query for progress
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProgress,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getUserProgress('user-123');

      expect(result).toEqual(mockProgress);
      expect(mockRpc).toHaveBeenCalledWith('initialize_user_progress', {
        p_user_id: 'user-123',
      });
      expect(mockFrom).toHaveBeenCalledWith('user_progress');
    });

    it('should handle query errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getUserProgress('user-123');

      expect(result).toBeNull();
    });
  });

  describe('awardPoints', () => {
    const mockAwardResult: PointsAwardResult = {
      points_awarded: 100,
      total_points: 2600,
      old_level: 5,
      new_level: 5,
      level_up: false,
    };

    it('should award points successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: mockAwardResult,
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.awardPoints(
        'user-123',
        100,
        'quiz_completion',
        'Completed quiz',
        { quiz_id: 'quiz-1' }
      );

      expect(result).toEqual(mockAwardResult);
      expect(mockRpc).toHaveBeenCalledWith('award_points', {
        p_user_id: 'user-123',
        p_amount: 100,
        p_source: 'quiz_completion',
        p_description: 'Completed quiz',
        p_metadata: { quiz_id: 'quiz-1' },
      });
    });

    it('should handle level up', async () => {
      const levelUpResult: PointsAwardResult = {
        points_awarded: 500,
        total_points: 3600,
        old_level: 5,
        new_level: 6,
        level_up: true,
      };

      const mockRpc = vi.fn().mockResolvedValue({
        data: levelUpResult,
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.awardPoints('user-123', 500, 'achievement');

      expect(result?.level_up).toBe(true);
      expect(result?.new_level).toBe(6);
    });

    it('should handle award errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insufficient data' },
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.awardPoints('user-123', 100, 'test');

      expect(result).toBeNull();
    });
  });

  describe('updateStreak', () => {
    const mockStreakResult: StreakUpdateResult = {
      current_streak: 8,
      longest_streak: 14,
      bonus_points: 20,
      multiplier: 1.25,
    };

    it('should update streak successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: mockStreakResult,
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.updateStreak('user-123');

      expect(result).toEqual(mockStreakResult);
      expect(mockRpc).toHaveBeenCalledWith('update_user_streak', {
        p_user_id: 'user-123',
      });
    });

    it('should handle streak update errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.updateStreak('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getTransactionHistory', () => {
    const mockTransactions: PointTransaction[] = [
      {
        id: 'tx-1',
        user_id: 'user-123',
        amount: 100,
        transaction_type: 'earned',
        source: 'quiz_completion',
        description: 'Completed quiz',
        metadata: {},
        created_at: '2025-12-29T12:00:00Z',
      },
      {
        id: 'tx-2',
        user_id: 'user-123',
        amount: 50,
        transaction_type: 'bonus',
        source: 'daily_login',
        description: 'Daily login',
        metadata: {},
        created_at: '2025-12-29T08:00:00Z',
      },
    ];

    it('should fetch transaction history with default limit', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getTransactionHistory('user-123');

      expect(result).toEqual(mockTransactions);
      expect(mockFrom).toHaveBeenCalledWith('point_transactions');
    });

    it('should fetch transaction history with custom limit', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTransactions,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getTransactionHistory('user-123', 10);

      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array on errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Query failed' },
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getTransactionHistory('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('Level Calculations', () => {
    describe('calculatePointsForLevel', () => {
      it('should calculate points required for level 1', () => {
        const points = PointsService.calculatePointsForLevel(1);
        expect(points).toBe(100); // 1 * 1 * 100
      });

      it('should calculate points required for level 5', () => {
        const points = PointsService.calculatePointsForLevel(5);
        expect(points).toBe(2500); // 5 * 5 * 100
      });

      it('should calculate points required for level 10', () => {
        const points = PointsService.calculatePointsForLevel(10);
        expect(points).toBe(10000); // 10 * 10 * 100
      });

      it('should calculate points required for level 20', () => {
        const points = PointsService.calculatePointsForLevel(20);
        expect(points).toBe(40000); // 20 * 20 * 100
      });
    });

    describe('calculateLevelFromPoints', () => {
      it('should calculate level 1 for 0 points', () => {
        const level = PointsService.calculateLevelFromPoints(0);
        expect(level).toBe(1); // Minimum level
      });

      it('should calculate level 5 for 2500 points', () => {
        const level = PointsService.calculateLevelFromPoints(2500);
        expect(level).toBe(5); // sqrt(2500 / 100) = 5
      });

      it('should calculate level 10 for 10000 points', () => {
        const level = PointsService.calculateLevelFromPoints(10000);
        expect(level).toBe(10);
      });

      it('should floor partial levels', () => {
        const level = PointsService.calculateLevelFromPoints(3000);
        expect(level).toBe(5); // sqrt(3000 / 100) = 5.47... → 5
      });
    });

    describe('getPointsToNextLevel', () => {
      it('should calculate points needed from level 5 with 2500 points', () => {
        const needed = PointsService.getPointsToNextLevel(2500, 5);
        expect(needed).toBe(1100); // 3600 - 2500
      });

      it('should return 0 if already at next level points', () => {
        const needed = PointsService.getPointsToNextLevel(3600, 5);
        expect(needed).toBe(0);
      });

      it('should handle edge case with exact level points', () => {
        const needed = PointsService.getPointsToNextLevel(2500, 5);
        expect(needed).toBeGreaterThan(0);
      });
    });

    describe('getLevelProgress', () => {
      it('should calculate 0% progress at level start', () => {
        const progress = PointsService.getLevelProgress(2500, 5);
        expect(progress).toBe(0);
      });

      it('should calculate 50% progress midway through level', () => {
        const progress = PointsService.getLevelProgress(3050, 5);
        expect(progress).toBe(50); // (3050 - 2500) / (3600 - 2500) = 50%
      });

      it('should cap at 100%', () => {
        const progress = PointsService.getLevelProgress(5000, 5);
        expect(progress).toBe(100);
      });

      it('should not go below 0%', () => {
        const progress = PointsService.getLevelProgress(1000, 5);
        expect(progress).toBe(0);
      });
    });
  });

  describe('getLevelTier', () => {
    it('should return Novice tier for level 1', () => {
      const tier = PointsService.getLevelTier(1);
      expect(tier.name).toBe('Novice');
      expect(tier.min).toBe(1);
      expect(tier.max).toBe(10);
    });

    it('should return Learner tier for level 15', () => {
      const tier = PointsService.getLevelTier(15);
      expect(tier.name).toBe('Learner');
      expect(tier.color).toBe('#3b82f6');
    });

    it('should return Legend tier for level 100', () => {
      const tier = PointsService.getLevelTier(100);
      expect(tier.name).toBe('Legend');
      expect(tier.max).toBe(Infinity);
    });

    it('should return first tier as fallback for invalid level', () => {
      const tier = PointsService.getLevelTier(0);
      expect(tier.name).toBe('Novice');
    });
  });

  describe('getStreakMultiplier', () => {
    it('should return 1x multiplier for 0 day streak', () => {
      const result = PointsService.getStreakMultiplier(0);
      expect(result.multiplier).toBe(1.0);
      expect(result.label).toBe('1x');
    });

    it('should return 1.25x multiplier for 7 day streak', () => {
      const result = PointsService.getStreakMultiplier(7);
      expect(result.multiplier).toBe(1.25);
      expect(result.label).toBe('1.25x (7+ days)');
    });

    it('should return 1.5x multiplier for 14 day streak', () => {
      const result = PointsService.getStreakMultiplier(14);
      expect(result.multiplier).toBe(1.5);
    });

    it('should return 2x multiplier for 30+ day streak', () => {
      const result = PointsService.getStreakMultiplier(50);
      expect(result.multiplier).toBe(2.0);
      expect(result.label).toBe('2x (30+ days)');
    });

    it('should provide next tier info for 5 day streak', () => {
      const result = PointsService.getStreakMultiplier(5);
      expect(result.nextTier).toBeDefined();
      expect(result.nextTier?.minStreak).toBe(30); // First tier above current
      expect(result.nextTier?.multiplier).toBe(2.0);
    });

    it('should not provide next tier for max streak', () => {
      const result = PointsService.getStreakMultiplier(50);
      expect(result.nextTier).toBeUndefined();
    });
  });

  describe('getLeaderboardStats', () => {
    it('should calculate user rank and percentile', async () => {
      const mockProgress: UserProgress = {
        user_id: 'user-123',
        total_points: 5000,
        current_level: 7,
        lifetime_points: 5000,
        current_streak: 10,
        longest_streak: 15,
        points_multiplier: 1.0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-12-29T00:00:00Z',
      };

      // Mock getUserProgress
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'user_progress') {
          callCount++;
          if (callCount === 1) {
            // First call: getUserProgress
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockProgress,
                    error: null,
                  }),
                }),
              }),
            };
          } else if (callCount === 2) {
            // Second call: rank query (with .gt() method)
            return {
              select: vi.fn().mockReturnValue({
                gt: vi.fn().mockResolvedValue({
                  data: [{}, {}, {}], // 3 users with more points
                  error: null,
                }),
              }),
            };
          } else {
            // Third call: total users count
            return {
              select: vi.fn().mockResolvedValue({
                count: 100,
                data: null,
                error: null,
              }),
            };
          }
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getLeaderboardStats('user-123');

      expect(result.totalPoints).toBe(5000);
      expect(result.level).toBe(7);
      expect(result.rank).toBe(4); // 3 users ahead + 1
      expect(result.percentile).toBe(96); // ((100 - 4) / 100) * 100
    });

    it('should handle missing progress', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getLeaderboardStats('user-123');

      expect(result.totalPoints).toBe(0);
      expect(result.level).toBe(1);
      expect(result.rank).toBeNull();
    });
  });

  describe('Specific Action Awards', () => {
    it('should award assessment completion points', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { points_awarded: 100 },
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      await PointsService.awardAssessmentPoints('user-123', {
        type: 'complete',
        points: 100,
        metadata: { assessment_id: 'test-1' },
      });

      expect(mockRpc).toHaveBeenCalledWith('award_points', {
        p_user_id: 'user-123',
        p_amount: 100,
        p_source: 'assessment_complete',
        p_description: 'Assessment completed',
        p_metadata: { assessment_id: 'test-1' },
      });
    });

    it('should award daily login bonus', async () => {
      const mockStreakResult: StreakUpdateResult = {
        current_streak: 5,
        longest_streak: 10,
        bonus_points: 10,
        multiplier: 1.0,
      };

      const mockPointsResult: PointsAwardResult = {
        points_awarded: 10,
        total_points: 1010,
        old_level: 3,
        new_level: 3,
        level_up: false,
      };

      const mockRpc = vi
        .fn()
        .mockResolvedValueOnce({ data: mockStreakResult, error: null })
        .mockResolvedValueOnce({ data: mockPointsResult, error: null });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await PointsService.awardDailyBonus('user-123');

      expect(result.streakUpdate).toEqual(mockStreakResult);
      expect(result.pointsAwarded).toEqual(mockPointsResult);
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });

    it('should award referral points', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { points_awarded: 500 },
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      await PointsService.awardReferralPoints('user-123', 'user-456');

      expect(mockRpc).toHaveBeenCalledWith('award_points', {
        p_user_id: 'user-123',
        p_amount: 500,
        p_source: 'referral',
        p_description: 'Friend referral bonus',
        p_metadata: { referred_user_id: 'user-456' },
      });
    });

    it('should award social share points', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { points_awarded: 25 },
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      await PointsService.awardSharePoints('user-123', 'twitter');

      expect(mockRpc).toHaveBeenCalledWith('award_points', {
        p_user_id: 'user-123',
        p_amount: 25,
        p_source: 'social_share',
        p_description: 'Shared on twitter',
        p_metadata: { platform: 'twitter' },
      });
    });
  });

  describe('Leaderboard Queries', () => {
    it('should fetch top performers with profile data', async () => {
      const mockData = [
        {
          user_id: 'user-1',
          total_points: 10000,
          current_level: 10,
          current_streak: 30,
          profiles: { display_name: 'John Doe', avatar_url: 'avatar1.jpg' },
        },
        {
          user_id: 'user-2',
          total_points: 8000,
          current_level: 9,
          current_streak: 20,
          profiles: { display_name: 'Jane Smith', avatar_url: 'avatar2.jpg' },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getTopPerformers(10);

      expect(result).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('user_progress');
    });

    it('should return empty array on top performers error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getTopPerformers(10);

      expect(result).toEqual([]);
    });

    it('should fetch longest streaks with profile data', async () => {
      const mockData = [
        {
          user_id: 'user-1',
          current_streak: 45,
          longest_streak: 50,
          total_points: 8000,
          profiles: { display_name: 'Streak Master' },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getLongestStreaks(10);

      expect(result).toEqual(mockData);
    });

    it('should return empty array on longest streaks error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await PointsService.getLongestStreaks(10);

      expect(result).toEqual([]);
    });
  });
});
