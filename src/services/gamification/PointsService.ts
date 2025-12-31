/**
 * Points Service
 * Handles points, levels, streaks, and user progress
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  UserProgress,
  PointTransaction,
  PointsAwardResult,
  StreakUpdateResult,
} from './types';

/**
 * Level calculation constants
 * Level formula: Level = floor(sqrt(total_points / 100))
 * This creates an exponential curve where higher levels require more points
 */
const POINTS_PER_LEVEL_BASE = 100;

/**
 * Level tier definitions
 */
export const LEVEL_TIERS = [
  { min: 1, max: 10, name: 'Novice', color: '#94a3b8' },
  { min: 11, max: 20, name: 'Learner', color: '#3b82f6' },
  { min: 21, max: 30, name: 'Practitioner', color: '#8b5cf6' },
  { min: 31, max: 40, name: 'Expert', color: '#f59e0b' },
  { min: 41, max: 50, name: 'Master', color: '#ef4444' },
  { min: 51, max: Infinity, name: 'Legend', color: '#ec4899' },
];

/**
 * Streak multiplier tiers
 */
export const STREAK_MULTIPLIERS = [
  { minStreak: 30, multiplier: 2.0, label: '2x (30+ days)' },
  { minStreak: 14, multiplier: 1.5, label: '1.5x (14+ days)' },
  { minStreak: 7, multiplier: 1.25, label: '1.25x (7+ days)' },
  { minStreak: 0, multiplier: 1.0, label: '1x' },
];

export class PointsService {
  /**
   * Initialize user progress (called on first user action)
   */
  static async initializeUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('initialize_user_progress', {
        p_user_id: userId,
      });

      if (error) throw error;
      return true;
    } catch (_error) {
      logger._error('Error initializing user progress:', _error);
      return false;
    }
  }

  /**
   * Get user's current progress
   */
  static async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      // Ensure user is initialized
      await this.initializeUser(userId);

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as UserProgress;
    } catch (_error) {
      logger._error('Error fetching user progress:', _error);
      return null;
    }
  }

  /**
   * Award points to a user
   */
  static async awardPoints(
    userId: string,
    amount: number,
    source: string,
    description?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<PointsAwardResult | null> {
    try {
      const { data, error } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source,
        p_description: description,
        p_metadata: metadata,
      });

      if (error) throw error;
      return data as PointsAwardResult;
    } catch (_error) {
      logger._error('Error awarding points:', _error);
      return null;
    }
  }

  /**
   * Update user's daily streak
   */
  static async updateStreak(userId: string): Promise<StreakUpdateResult | null> {
    try {
      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data as StreakUpdateResult;
    } catch (_error) {
      logger._error('Error updating streak:', _error);
      return null;
    }
  }

  /**
   * Get user's point transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as PointTransaction[]) || [];
    } catch (_error) {
      logger._error('Error fetching transaction history:', _error);
      return [];
    }
  }

  /**
   * Get recent transactions (for activity feed)
   */
  static async getRecentTransactions(
    userId: string,
    limit: number = 10
  ): Promise<PointTransaction[]> {
    return this.getTransactionHistory(userId, limit);
  }

  /**
   * Calculate points required for next level
   */
  static calculatePointsForLevel(level: number): number {
    return level * level * POINTS_PER_LEVEL_BASE;
  }

  /**
   * Calculate level from total points
   */
  static calculateLevelFromPoints(points: number): number {
    return Math.max(1, Math.floor(Math.sqrt(points / POINTS_PER_LEVEL_BASE)));
  }

  /**
   * Get points needed for next level
   */
  static getPointsToNextLevel(currentPoints: number, currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    const pointsForNextLevel = this.calculatePointsForLevel(nextLevel);
    return Math.max(0, pointsForNextLevel - currentPoints);
  }

  /**
   * Get progress percentage to next level
   */
  static getLevelProgress(currentPoints: number, currentLevel: number): number {
    const currentLevelPoints = this.calculatePointsForLevel(currentLevel);
    const nextLevelPoints = this.calculatePointsForLevel(currentLevel + 1);
    const pointsInLevel = nextLevelPoints - currentLevelPoints;
    const pointsEarned = currentPoints - currentLevelPoints;
    const progress = (pointsEarned / pointsInLevel) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Get level tier information
   */
  static getLevelTier(level: number): {
    name: string;
    color: string;
    min: number;
    max: number;
  } {
    const tier = LEVEL_TIERS.find(t => level >= t.min && level <= t.max);
    return tier || LEVEL_TIERS[0];
  }

  /**
   * Get streak multiplier for current streak
   */
  static getStreakMultiplier(streak: number): {
    multiplier: number;
    label: string;
    nextTier?: { minStreak: number; multiplier: number };
  } {
    const current =
      STREAK_MULTIPLIERS.find(sm => streak >= sm.minStreak) ||
      STREAK_MULTIPLIERS[STREAK_MULTIPLIERS.length - 1];

    // Find next tier
    const nextTierIndex = STREAK_MULTIPLIERS.findIndex(sm => streak < sm.minStreak);
    const nextTier = nextTierIndex >= 0 ? STREAK_MULTIPLIERS[nextTierIndex] : undefined;

    return {
      multiplier: current.multiplier,
      label: current.label,
      nextTier,
    };
  }

  /**
   * Get leaderboard statistics for user
   */
  static async getLeaderboardStats(userId: string): Promise<{
    totalPoints: number;
    level: number;
    rank: number | null;
    percentile: number | null;
  }> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) {
        return { totalPoints: 0, level: 1, rank: null, percentile: null };
      }

      // Get user's global rank
      const { data: rankData, error: _rankError } = await supabase
        .from('user_progress')
        .select('user_id', { count: 'exact', head: false })
        .gt('total_points', progress.total_points);

      const rank = rankData ? rankData.length + 1 : null;

      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true });

      const percentile =
        totalUsers && rank ? Math.round(((totalUsers - rank) / totalUsers) * 100) : null;

      return {
        totalPoints: progress.total_points,
        level: progress.current_level,
        rank,
        percentile,
      };
    } catch (_error) {
      logger._error('Error fetching leaderboard stats:', _error);
      return { totalPoints: 0, level: 1, rank: null, percentile: null };
    }
  }

  /**
   * Get user summary (all key metrics)
   */
  static async getUserSummary(userId: string): Promise<{
    progress: UserProgress | null;
    levelTier: ReturnType<typeof PointsService.getLevelTier>;
    pointsToNextLevel: number;
    levelProgress: number;
    streakMultiplier: ReturnType<typeof PointsService.getStreakMultiplier>;
    recentTransactions: PointTransaction[];
    leaderboardStats: Awaited<ReturnType<typeof PointsService.getLeaderboardStats>>;
  }> {
    const progress = await this.getUserProgress(userId);
    const currentLevel = progress?.current_level || 1;
    const currentPoints = progress?.total_points || 0;
    const currentStreak = progress?.current_streak || 0;

    const [recentTransactions, leaderboardStats] = await Promise.all([
      this.getRecentTransactions(userId, 10),
      this.getLeaderboardStats(userId),
    ]);

    return {
      progress,
      levelTier: this.getLevelTier(currentLevel),
      pointsToNextLevel: this.getPointsToNextLevel(currentPoints, currentLevel),
      levelProgress: this.getLevelProgress(currentPoints, currentLevel),
      streakMultiplier: this.getStreakMultiplier(currentStreak),
      recentTransactions,
      leaderboardStats,
    };
  }

  /**
   * Award points for specific assessment actions
   */
  static async awardAssessmentPoints(
    userId: string,
    action: {
      type: 'complete' | 'correct_answer' | 'first_try' | 'speed_bonus' | 'perfect_score';
      points: number;
      metadata: Record<string, unknown>;
    }
  ): Promise<PointsAwardResult | null> {
    const descriptions: Record<string, string> = {
      complete: 'Assessment completed',
      correct_answer: 'Correct answer',
      first_try: 'First try bonus',
      speed_bonus: 'Speed bonus',
      perfect_score: 'Perfect score bonus',
    };

    return this.awardPoints(
      userId,
      action.points,
      `assessment_${action.type}`,
      descriptions[action.type],
      action.metadata
    );
  }

  /**
   * Award daily login bonus
   */
  static async awardDailyBonus(userId: string): Promise<{
    streakUpdate: StreakUpdateResult | null;
    pointsAwarded: PointsAwardResult | null;
  }> {
    // Update streak first
    const streakUpdate = await this.updateStreak(userId);

    // Award base daily login points (10 points)
    const pointsAwarded = await this.awardPoints(userId, 10, 'daily_login', 'Daily login bonus');

    return {
      streakUpdate,
      pointsAwarded,
    };
  }

  /**
   * Award referral points
   */
  static async awardReferralPoints(
    referrerId: string,
    referredUserId: string
  ): Promise<PointsAwardResult | null> {
    return this.awardPoints(referrerId, 500, 'referral', 'Friend referral bonus', {
      referred_user_id: referredUserId,
    });
  }

  /**
   * Award social sharing points
   */
  static async awardSharePoints(
    userId: string,
    platform: string
  ): Promise<PointsAwardResult | null> {
    return this.awardPoints(userId, 25, 'social_share', `Shared on ${platform}`, { platform });
  }

  /**
   * Get top performers (for showcasing)
   */
  static async getTopPerformers(limit: number = 10): Promise<
    Array<{
      user_id: string;
      total_points: number;
      current_level: number;
      current_streak: number;
      display_name?: string;
      avatar_url?: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(
          `
          user_id,
          total_points,
          current_level,
          current_streak,
          profiles!user_progress_user_id_fkey(display_name, avatar_url)
        `
        )
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger._error('Error fetching top performers:', _error);
      return [];
    }
  }

  /**
   * Get users with longest streaks
   */
  static async getLongestStreaks(limit: number = 10): Promise<
    Array<{
      user_id: string;
      current_streak: number;
      longest_streak: number;
      total_points: number;
      display_name?: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(
          `
          user_id,
          current_streak,
          longest_streak,
          total_points,
          profiles!user_progress_user_id_fkey(display_name)
        `
        )
        .order('current_streak', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger._error('Error fetching longest streaks:', _error);
      return [];
    }
  }
}
