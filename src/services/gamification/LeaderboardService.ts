/**
 * Leaderboard Service
 * Handles rankings, positions, and leaderboard management
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardCriteria,
  TimePeriod,
  UserLeaderboardPreferences,
  UserLeaderboardPosition,
} from './types';

export class LeaderboardService {
  /**
   * Get all active leaderboards
   */
  static async getAll(): Promise<Leaderboard[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true });

      if (error) throw error;
      return data as Leaderboard[] || [];
    } catch (error) {
      logger.error('Error fetching leaderboards:', error);
      return [];
    }
  }

  /**
   * Get leaderboards by type
   */
  static async getByType(type: LeaderboardType): Promise<Leaderboard[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('is_active', true)
        .eq('type', type);

      if (error) throw error;
      return data as Leaderboard[] || [];
    } catch (error) {
      logger.error('Error fetching leaderboards by type:', error);
      return [];
    }
  }

  /**
   * Get specific leaderboard by ID
   */
  static async getById(leaderboardId: string): Promise<Leaderboard | null> {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('id', leaderboardId)
        .single();

      if (error) throw error;
      return data as Leaderboard;
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      return null;
    }
  }

  /**
   * Get leaderboard entries (top users)
   */
  static async getEntries(
    leaderboardId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles!leaderboard_entries_user_id_fkey(display_name, avatar_url)
        `)
        .eq('leaderboard_id', leaderboardId)
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Merge profile data into metadata
      return (data || []).map(entry => ({
        ...entry,
        metadata: {
          ...entry.metadata,
          display_name: entry.profiles?.display_name,
          avatar_url: entry.profiles?.avatar_url,
        },
      })) as LeaderboardEntry[];
    } catch (error) {
      logger.error('Error fetching leaderboard entries:', error);
      return [];
    }
  }

  /**
   * Get top N entries
   */
  static async getTopEntries(
    leaderboardId: string,
    topN: number = 10
  ): Promise<LeaderboardEntry[]> {
    return this.getEntries(leaderboardId, topN, 0);
  }

  /**
   * Get user's position in a leaderboard
   */
  static async getUserPosition(
    userId: string,
    leaderboardId: string
  ): Promise<UserLeaderboardPosition | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_leaderboard_position', {
        p_user_id: userId,
        p_leaderboard_id: leaderboardId,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      const position = data[0];
      const percentile = position.total_entries > 0
        ? Math.round(((position.total_entries - position.rank) / position.total_entries) * 100)
        : 0;

      return {
        ...position,
        percentile,
      };
    } catch (error) {
      logger.error('Error fetching user leaderboard position:', error);
      return null;
    }
  }

  /**
   * Get users near current user in leaderboard (context ranking)
   */
  static async getNearbyUsers(
    userId: string,
    leaderboardId: string,
    range: number = 5
  ): Promise<{
    above: LeaderboardEntry[];
    current: LeaderboardEntry | null;
    below: LeaderboardEntry[];
  }> {
    try {
      const position = await this.getUserPosition(userId, leaderboardId);

      if (!position) {
        return { above: [], current: null, below: [] };
      }

      const startRank = Math.max(1, position.rank - range);
      const endRank = position.rank + range;

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles!leaderboard_entries_user_id_fkey(display_name, avatar_url)
        `)
        .eq('leaderboard_id', leaderboardId)
        .gte('rank', startRank)
        .lte('rank', endRank)
        .order('rank', { ascending: true });

      if (error) throw error;

      const entries = (data || []).map(entry => ({
        ...entry,
        metadata: {
          ...entry.metadata,
          display_name: entry.profiles?.display_name,
          avatar_url: entry.profiles?.avatar_url,
        },
      })) as LeaderboardEntry[];

      const current = entries.find(e => e.user_id === userId) || null;
      const above = entries.filter(e => e.rank < position.rank);
      const below = entries.filter(e => e.rank > position.rank);

      return { above, current, below };
    } catch (error) {
      logger.error('Error fetching nearby users:', error);
      return { above: [], current: null, below: [] };
    }
  }

  /**
   * Get user's leaderboard preferences
   */
  static async getUserPreferences(userId: string): Promise<UserLeaderboardPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_leaderboard_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

      return data as UserLeaderboardPreferences;
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Update user's leaderboard preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserLeaderboardPreferences, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_leaderboard_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Opt user in/out of leaderboards
   */
  static async setOptIn(userId: string, optIn: boolean): Promise<boolean> {
    return this.updateUserPreferences(userId, { opt_in: optIn });
  }

  /**
   * Refresh leaderboard rankings (admin/cron function)
   * This recalculates and caches the leaderboard entries
   */
  static async refreshLeaderboard(leaderboardId: string): Promise<boolean> {
    try {
      const leaderboard = await this.getById(leaderboardId);
      if (!leaderboard) return false;

      // Build query based on criteria and time period
      let query = supabase.from('user_progress').select(`
        user_id,
        total_points,
        current_level,
        current_streak,
        longest_streak,
        profiles!user_progress_user_id_fkey(display_name, avatar_url)
      `);

      // Filter by time period
      if (leaderboard.time_period !== 'all_time') {
        const daysBack = leaderboard.time_period === 'weekly' ? 7 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        // For weekly/monthly, we'd need to filter point_transactions
        // For now, this is simplified to all_time data
      }

      // Order by criteria
      const orderColumn = this.getOrderColumn(leaderboard.criteria);
      query = query.order(orderColumn, { ascending: false }).limit(1000);

      const { data: users, error: queryError } = await query;
      if (queryError) throw queryError;

      // Clear existing entries for this leaderboard
      await supabase
        .from('leaderboard_entries')
        .delete()
        .eq('leaderboard_id', leaderboardId);

      // Insert new entries
      const entries = (users || []).map((user: any, index: number) => ({
        leaderboard_id: leaderboardId,
        user_id: user.user_id,
        rank: index + 1,
        score: this.getScore(user, leaderboard.criteria),
        metadata: {
          display_name: user.profiles?.display_name,
          avatar_url: user.profiles?.avatar_url,
          level: user.current_level,
          assessments_completed: 0, // Would need to join with assessments table
        },
        updated_at: new Date().toISOString(),
      }));

      if (entries.length > 0) {
        const { error: insertError } = await supabase
          .from('leaderboard_entries')
          .insert(entries);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      logger.error('Error refreshing leaderboard:', error);
      return false;
    }
  }

  /**
   * Refresh all active leaderboards
   */
  static async refreshAllLeaderboards(): Promise<{
    success: number;
    failed: number;
  }> {
    const leaderboards = await this.getAll();
    let success = 0;
    let failed = 0;

    for (const leaderboard of leaderboards) {
      const result = await this.refreshLeaderboard(leaderboard.id);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get multiple leaderboards with their top entries
   */
  static async getLeaderboardsWithEntries(
    topN: number = 10
  ): Promise<Array<{
    leaderboard: Leaderboard;
    entries: LeaderboardEntry[];
  }>> {
    const leaderboards = await this.getAll();

    const results = await Promise.all(
      leaderboards.map(async leaderboard => ({
        leaderboard,
        entries: await this.getTopEntries(leaderboard.id, topN),
      }))
    );

    return results;
  }

  /**
   * Get user's positions across all leaderboards
   */
  static async getUserPositions(userId: string): Promise<Array<{
    leaderboard: Leaderboard;
    position: UserLeaderboardPosition | null;
  }>> {
    const leaderboards = await this.getAll();

    const results = await Promise.all(
      leaderboards.map(async leaderboard => ({
        leaderboard,
        position: await this.getUserPosition(userId, leaderboard.id),
      }))
    );

    return results.filter(r => r.position !== null);
  }

  /**
   * Search for users in leaderboard by name
   */
  static async searchUsers(
    leaderboardId: string,
    searchTerm: string
  ): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profiles!leaderboard_entries_user_id_fkey(display_name, avatar_url)
        `)
        .eq('leaderboard_id', leaderboardId)
        .ilike('profiles.display_name', `%${searchTerm}%`)
        .order('rank', { ascending: true })
        .limit(20);

      if (error) throw error;

      return (data || []).map(entry => ({
        ...entry,
        metadata: {
          ...entry.metadata,
          display_name: entry.profiles?.display_name,
          avatar_url: entry.profiles?.avatar_url,
        },
      })) as LeaderboardEntry[];
    } catch (error) {
      logger.error('Error searching users:', error);
      return [];
    }
  }

  // ========== Helper Methods ==========

  private static getOrderColumn(criteria: LeaderboardCriteria): string {
    switch (criteria) {
      case 'points':
        return 'total_points';
      case 'ability':
        return 'current_level'; // Simplified, would need to join with assessments
      case 'assessments':
        return 'total_points'; // Simplified, would need count from assessments
      case 'streak':
        return 'current_streak';
      case 'improvement':
        return 'total_points'; // Simplified, would need historical comparison
      default:
        return 'total_points';
    }
  }

  private static getScore(user: any, criteria: LeaderboardCriteria): number {
    switch (criteria) {
      case 'points':
        return user.total_points || 0;
      case 'ability':
        return user.current_level || 0;
      case 'assessments':
        return user.total_points || 0; // Simplified
      case 'streak':
        return user.current_streak || 0;
      case 'improvement':
        return user.total_points || 0; // Simplified
      default:
        return 0;
    }
  }
}
