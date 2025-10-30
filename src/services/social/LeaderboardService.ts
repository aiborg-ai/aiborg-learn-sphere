/**
 * Leaderboard Service
 * Manages leaderboards, rankings, and user scores
 */

import { supabase } from '@/integrations/supabase/client';
import type { LeaderboardEntry } from './types';

export class LeaderboardService {
  /**
   * Get leaderboard with privacy controls
   */
  static async get(
    leaderboardType: string,
    category?: string,
    _timeframe: string = 'all_time',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const { data: currentUser } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(
        `
        *,
        user:user_id (
          id,
          email,
          user_profiles(username, avatar_url),
          user_privacy_settings(show_on_leaderboards, show_real_name)
        )
      `
      )
      .eq('leaderboard_id', leaderboardType)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Filter based on privacy settings
    const entries: LeaderboardEntry[] = (data || [])
      .filter((entry: unknown) => {
        const e = entry as {
          user_id: string;
          user?: { user_privacy_settings?: { show_on_leaderboards?: boolean } };
        };
        // Always show current user
        if (e.user_id === currentUser?.user?.id) return true;
        // Respect privacy settings
        return e.user?.user_privacy_settings?.show_on_leaderboards !== false;
      })
      .map((entry: unknown) => {
        const e = entry as {
          rank: number;
          user_id: string;
          score: number;
          metadata?: Record<string, unknown>;
          user?: {
            email?: string;
            user_profiles?: { username?: string };
            user_privacy_settings?: { show_real_name?: boolean };
          };
        };
        return {
          rank: e.rank,
          user_id: e.user_id,
          username: e.user?.user_profiles?.username || 'Anonymous',
          display_name:
            e.user?.user_privacy_settings?.show_real_name === true
              ? e.user?.email
              : e.user?.user_profiles?.username,
          score: e.score,
          metadata: e.metadata,
          is_current_user: e.user_id === currentUser?.user?.id,
        };
      });

    return entries;
  }

  /**
   * Update user's leaderboard entry
   */
  static async updateEntry(
    leaderboardId: string,
    userId: string,
    score: number,
    metadata?: unknown
  ): Promise<void> {
    const { error } = await supabase
      .from('leaderboard_entries')
      .upsert({
        leaderboard_id: leaderboardId,
        user_id: userId,
        score,
        metadata,
        rank: 0, // Will be updated by ranking function
      })
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update rankings
    await supabase.rpc('update_leaderboard_rankings', {
      leaderboard_uuid: leaderboardId,
    });
  }

  /**
   * Get user's rank in leaderboard
   */
  static async getUserRank(leaderboardId: string, userId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('rank')
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data?.rank || null;
  }
}
