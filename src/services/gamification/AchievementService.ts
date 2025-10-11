/**
 * Achievement Service
 * Handles achievement unlocking, tracking, and display
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Achievement, UserAchievement, AchievementTier, AchievementCategory } from './types';

export class AchievementService {
  /**
   * Get all available achievements
   */
  static async getAll(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true })
        .order('points_value', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      return [];
    }
  }

  /**
   * Get achievements by category
   */
  static async getByCategory(category: AchievementCategory): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('points_value', { ascending: true});

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching achievements by category:', error);
      return [];
    }
  }

  /**
   * Get achievements by tier
   */
  static async getByTier(tier: AchievementTier): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .eq('tier', tier)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching achievements by tier:', error);
      return [];
    }
  }

  /**
   * Get user's unlocked achievements
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[] || [];
    } catch (error) {
      logger.error('Error fetching user achievements:', error);
      return [];
    }
  }

  /**
   * Get user's achievement progress
   */
  static async getUserProgress(userId: string): Promise<{
    unlocked: number;
    total: number;
    percentage: number;
    byTier: Record<AchievementTier, number>;
    byCategory: Record<AchievementCategory, number>;
  }> {
    try {
      const [allAchievements, userAchievements] = await Promise.all([
        this.getAll(),
        this.getUserAchievements(userId),
      ]);

      const total = allAchievements.length;
      const unlocked = userAchievements.length;
      const percentage = total > 0 ? (unlocked / total) * 100 : 0;

      // Count by tier
      const byTier: Record<AchievementTier, number> = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        diamond: 0,
      };

      userAchievements.forEach(ua => {
        if (ua.achievement) {
          byTier[ua.achievement.tier]++;
        }
      });

      // Count by category
      const byCategory: Record<AchievementCategory, number> = {
        completion: 0,
        performance: 0,
        streak: 0,
        social: 0,
        special: 0,
      };

      userAchievements.forEach(ua => {
        if (ua.achievement) {
          byCategory[ua.achievement.category]++;
        }
      });

      return {
        unlocked,
        total,
        percentage: Math.round(percentage),
        byTier,
        byCategory,
      };
    } catch (error) {
      logger.error('Error calculating user achievement progress:', error);
      return {
        unlocked: 0,
        total: 0,
        percentage: 0,
        byTier: { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 },
        byCategory: { completion: 0, performance: 0, streak: 0, social: 0, special: 0 },
      };
    }
  }

  /**
   * Unlock an achievement for a user
   */
  static async unlock(
    userId: string,
    achievementId: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('unlock_achievement', {
        p_user_id: userId,
        p_achievement_id: achievementId,
        p_metadata: metadata,
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      logger.error('Error unlocking achievement:', error);
      return false;
    }
  }

  /**
   * Check if user has specific achievement
   */
  static async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return !!data;
    } catch (error) {
      logger.error('Error checking achievement:', error);
      return false;
    }
  }

  /**
   * Check multiple achievements and unlock if criteria met
   * This is called after specific user actions
   */
  static async checkAndUnlock(
    userId: string,
    context: {
      action: 'assessment_completed' | 'streak_updated' | 'share' | 'group_joined';
      metadata: Record<string, any>;
    }
  ): Promise<UserAchievement[]> {
    const unlockedAchievements: UserAchievement[] = [];

    try {
      // Get all achievements that might be unlockable
      const achievements = await this.getAll();

      // Get user's current achievements
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

      // Check each achievement
      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue; // Already unlocked

        const shouldUnlock = await this.checkCriteria(achievement, context, userId);

        if (shouldUnlock) {
          const unlocked = await this.unlock(userId, achievement.id, context.metadata);
          if (unlocked) {
            unlockedAchievements.push({
              id: '', // Will be set by database
              user_id: userId,
              achievement_id: achievement.id,
              earned_at: new Date().toISOString(),
              metadata: context.metadata,
              achievement,
            });
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      logger.error('Error checking and unlocking achievements:', error);
      return unlockedAchievements;
    }
  }

  /**
   * Check if achievement criteria is met
   */
  private static async checkCriteria(
    achievement: Achievement,
    context: {
      action: string;
      metadata: Record<string, any>;
    },
    userId: string
  ): Promise<boolean> {
    const criteria = achievement.criteria as any;

    switch (criteria.type) {
      case 'count':
        return this.checkCountCriteria(criteria, context, userId);

      case 'score':
        return this.checkScoreCriteria(criteria, context);

      case 'time':
        return this.checkTimeCriteria(criteria, context);

      case 'streak':
        return this.checkStreakCriteria(criteria, context);

      case 'boolean':
        return context.action === criteria.metric;

      case 'improvement':
        return this.checkImprovementCriteria(criteria, context);

      case 'time_of_day':
        return this.checkTimeOfDayCriteria(criteria);

      case 'day_of_week':
        return this.checkDayOfWeekCriteria();

      default:
        return false;
    }
  }

  private static async checkCountCriteria(
    criteria: any,
    context: any,
    userId: string
  ): Promise<boolean> {
    // For assessments_completed
    if (criteria.metric === 'assessments_completed') {
      const { data } = await supabase
        .from('user_ai_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_complete', true);

      const count = (data as any)?.count || 0;
      return count >= criteria.threshold;
    }

    // For shares
    if (criteria.metric === 'shares') {
      const { data } = await supabase
        .from('engagement_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'result_shared');

      const count = (data as any)?.count || 0;
      return count >= criteria.threshold;
    }

    return false;
  }

  private static checkScoreCriteria(criteria: any, context: any): boolean {
    if (criteria.metric === 'ability_percentage') {
      const abilityPercentage = context.metadata?.ability_percentage || 0;
      return abilityPercentage >= criteria.threshold;
    }
    return false;
  }

  private static checkTimeCriteria(criteria: any, context: any): boolean {
    if (criteria.metric === 'completion_time') {
      const timeSeconds = context.metadata?.completion_time_seconds || Infinity;
      return timeSeconds <= criteria.threshold;
    }
    return false;
  }

  private static checkStreakCriteria(criteria: any, context: any): boolean {
    if (criteria.metric === 'login_streak') {
      const streak = context.metadata?.current_streak || 0;
      return streak >= criteria.threshold;
    }
    return false;
  }

  private static checkImprovementCriteria(criteria: any, context: any): boolean {
    if (criteria.metric === 'score_improvement') {
      const improvement = context.metadata?.improvement_percentage || 0;
      return improvement >= criteria.threshold;
    }
    return false;
  }

  private static checkTimeOfDayCriteria(criteria: any): boolean {
    const hour = new Date().getHours();
    if (criteria.threshold < 12) {
      // Early bird (before threshold)
      return hour < criteria.threshold;
    } else {
      // Night owl (after threshold)
      return hour >= criteria.threshold;
    }
  }

  private static checkDayOfWeekCriteria(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Get recently unlocked achievements across all users (for showcasing)
   */
  static async getRecentlyUnlocked(limit: number = 10): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*),
          user:profiles!user_achievements_user_id_fkey(display_name, avatar_url)
        `)
        .order('earned_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as UserAchievement[] || [];
    } catch (error) {
      logger.error('Error fetching recently unlocked achievements:', error);
      return [];
    }
  }

  /**
   * Get rare achievements (earned by <10% of users)
   */
  static async getRareAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .lte('rarity_percentage', 10)
        .order('rarity_percentage', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching rare achievements:', error);
      return [];
    }
  }
}
