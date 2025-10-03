/**
 * Peer Connection Service
 * Manages user-to-user connections (follow/unfollow)
 */

import { supabase } from '@/integrations/supabase/client';

export class PeerConnectionService {
  /**
   * Follow a user
   */
  static async follow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase.from('peer_connections').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) throw error;
  }

  /**
   * Unfollow a user
   */
  static async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('peer_connections')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  }

  /**
   * Get followers
   */
  static async getFollowers(userId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('peer_connections')
      .select(
        `
        follower_id,
        user:follower_id (id, email, user_profiles(username, avatar_url))
      `
      )
      .eq('following_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get following
   */
  static async getFollowing(userId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('peer_connections')
      .select(
        `
        following_id,
        user:following_id (id, email, user_profiles(username, avatar_url))
      `
      )
      .eq('follower_id', userId);

    if (error) throw error;
    return data || [];
  }
}
