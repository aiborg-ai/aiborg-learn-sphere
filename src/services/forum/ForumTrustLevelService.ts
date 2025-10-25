/**
 * Forum Trust Level Service
 * Implements Discourse-style trust level progression
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ForumUserTrustLevel, TrustLevel } from '@/types/forum';
import { TRUST_LEVEL_NAMES } from '@/types/forum';

export class ForumTrustLevelService {
  /**
   * Get user's trust level
   */
  static async getUserTrustLevel(userId: string): Promise<ForumUserTrustLevel | null> {
    try {
      const { data, error } = await supabase
        .from('forum_user_trust_levels')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // Initialize if not found
      if (!data) {
        return this.initializeUserTrustLevel(userId);
      }

      return data;
    } catch (error) {
      logger.error('Error fetching trust level:', error);
      return null;
    }
  }

  /**
   * Initialize trust level for new user
   */
  static async initializeUserTrustLevel(userId: string): Promise<ForumUserTrustLevel> {
    try {
      const { data, error } = await supabase
        .from('forum_user_trust_levels')
        .insert({
          user_id: userId,
          trust_level: 0,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Trust level initialized for user:', userId);
      return data;
    } catch (error) {
      logger.error('Error initializing trust level:', error);
      throw error;
    }
  }

  /**
   * Calculate and update trust level
   */
  static async calculateTrustLevel(userId: string): Promise<TrustLevel> {
    try {
      const { data, error } = await supabase.rpc('calculate_trust_level', {
        p_user_id: userId,
      });

      if (error) throw error;

      logger.log('Trust level calculated for user:', userId, '→', data);
      return data as TrustLevel;
    } catch (error) {
      logger.error('Error calculating trust level:', error);
      throw error;
    }
  }

  /**
   * Manually set trust level (admins only)
   */
  static async setTrustLevel(userId: string, level: TrustLevel): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        throw new Error('Unauthorized - admin only');
      }

      const { error } = await supabase
        .from('forum_user_trust_levels')
        .update({
          trust_level: level,
          last_promoted_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      logger.log('Trust level set manually:', userId, '→', level);
    } catch (error) {
      logger.error('Error setting trust level:', error);
      throw error;
    }
  }

  /**
   * Get trust level requirements
   */
  static getTrustLevelRequirements(level: TrustLevel): {
    posts_required: number;
    topics_required: number;
    days_visited_required: number;
    time_read_required: number;
    likes_received_required: number;
    flags_agreed_required: number;
  } {
    switch (level) {
      case 0:
        return {
          posts_required: 0,
          topics_required: 0,
          days_visited_required: 0,
          time_read_required: 0,
          likes_received_required: 0,
          flags_agreed_required: 0,
        };
      case 1:
        return {
          posts_required: 5,
          topics_required: 0,
          days_visited_required: 1,
          time_read_required: 30,
          likes_received_required: 0,
          flags_agreed_required: 0,
        };
      case 2:
        return {
          posts_required: 50,
          topics_required: 0,
          days_visited_required: 10,
          time_read_required: 120,
          likes_received_required: 10,
          flags_agreed_required: 0,
        };
      case 3:
        return {
          posts_required: 200,
          topics_required: 0,
          days_visited_required: 50,
          time_read_required: 1200,
          likes_received_required: 100,
          flags_agreed_required: 5,
        };
      case 4:
        return {
          posts_required: 500,
          topics_required: 50,
          days_visited_required: 100,
          time_read_required: 3600,
          likes_received_required: 500,
          flags_agreed_required: 25,
        };
      default:
        return this.getTrustLevelRequirements(0);
    }
  }

  /**
   * Get trust level abilities
   */
  static getTrustLevelAbilities(level: TrustLevel): {
    can_post: boolean;
    can_reply: boolean;
    can_upvote: boolean;
    can_downvote: boolean;
    can_upload_images: boolean;
    can_upload_files: boolean;
    can_edit_own_posts: boolean;
    can_flag_posts: boolean;
    can_create_polls: boolean;
    can_see_viewers: boolean;
    can_edit_others_posts: boolean;
    can_move_threads: boolean;
    can_create_categories: boolean;
    max_posts_per_day: number;
    max_file_size_mb: number;
  } {
    switch (level) {
      case 0:
        return {
          can_post: true,
          can_reply: true,
          can_upvote: true,
          can_downvote: false,
          can_upload_images: false,
          can_upload_files: false,
          can_edit_own_posts: false,
          can_flag_posts: false,
          can_create_polls: false,
          can_see_viewers: false,
          can_edit_others_posts: false,
          can_move_threads: false,
          can_create_categories: false,
          max_posts_per_day: 3,
          max_file_size_mb: 0,
        };
      case 1:
        return {
          can_post: true,
          can_reply: true,
          can_upvote: true,
          can_downvote: true,
          can_upload_images: true,
          can_upload_files: false,
          can_edit_own_posts: true,
          can_flag_posts: false,
          can_create_polls: false,
          can_see_viewers: false,
          can_edit_others_posts: false,
          can_move_threads: false,
          can_create_categories: false,
          max_posts_per_day: 10,
          max_file_size_mb: 5,
        };
      case 2:
        return {
          can_post: true,
          can_reply: true,
          can_upvote: true,
          can_downvote: true,
          can_upload_images: true,
          can_upload_files: true,
          can_edit_own_posts: true,
          can_flag_posts: true,
          can_create_polls: true,
          can_see_viewers: true,
          can_edit_others_posts: false,
          can_move_threads: false,
          can_create_categories: false,
          max_posts_per_day: 999999,
          max_file_size_mb: 10,
        };
      case 3:
        return {
          can_post: true,
          can_reply: true,
          can_upvote: true,
          can_downvote: true,
          can_upload_images: true,
          can_upload_files: true,
          can_edit_own_posts: true,
          can_flag_posts: true,
          can_create_polls: true,
          can_see_viewers: true,
          can_edit_others_posts: true,
          can_move_threads: true,
          can_create_categories: false,
          max_posts_per_day: 999999,
          max_file_size_mb: 20,
        };
      case 4:
        return {
          can_post: true,
          can_reply: true,
          can_upvote: true,
          can_downvote: true,
          can_upload_images: true,
          can_upload_files: true,
          can_edit_own_posts: true,
          can_flag_posts: true,
          can_create_polls: true,
          can_see_viewers: true,
          can_edit_others_posts: true,
          can_move_threads: true,
          can_create_categories: true,
          max_posts_per_day: 999999,
          max_file_size_mb: 50,
        };
      default:
        return this.getTrustLevelAbilities(0);
    }
  }

  /**
   * Check if user can perform action
   */
  static async canPerformAction(
    userId: string,
    action:
      | 'post'
      | 'reply'
      | 'upvote'
      | 'downvote'
      | 'upload_images'
      | 'upload_files'
      | 'edit_own'
      | 'flag'
      | 'edit_others'
      | 'move_threads'
  ): Promise<boolean> {
    try {
      const trustLevel = await this.getUserTrustLevel(userId);
      if (!trustLevel) return false;

      const abilities = this.getTrustLevelAbilities(trustLevel.trust_level);

      switch (action) {
        case 'post':
          return abilities.can_post;
        case 'reply':
          return abilities.can_reply;
        case 'upvote':
          return abilities.can_upvote;
        case 'downvote':
          return abilities.can_downvote;
        case 'upload_images':
          return abilities.can_upload_images;
        case 'upload_files':
          return abilities.can_upload_files;
        case 'edit_own':
          return abilities.can_edit_own_posts;
        case 'flag':
          return abilities.can_flag_posts;
        case 'edit_others':
          return abilities.can_edit_others_posts;
        case 'move_threads':
          return abilities.can_move_threads;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Get progress to next level
   */
  static async getProgressToNextLevel(userId: string): Promise<{
    current_level: TrustLevel;
    next_level: TrustLevel | null;
    progress_percentage: number;
    requirements: Record<string, { current: number; required: number; met: boolean }>;
  } | null> {
    try {
      const trustLevel = await this.getUserTrustLevel(userId);
      if (!trustLevel) return null;

      const currentLevel = trustLevel.trust_level;
      const nextLevel = currentLevel < 4 ? ((currentLevel + 1) as TrustLevel) : null;

      if (!nextLevel) {
        return {
          current_level: currentLevel,
          next_level: null,
          progress_percentage: 100,
          requirements: {},
        };
      }

      const requirements = this.getTrustLevelRequirements(nextLevel);

      const requirementsMet = {
        posts: {
          current: trustLevel.posts_count,
          required: requirements.posts_required,
          met: trustLevel.posts_count >= requirements.posts_required,
        },
        topics: {
          current: trustLevel.topics_created,
          required: requirements.topics_required,
          met: trustLevel.topics_created >= requirements.topics_required,
        },
        days_visited: {
          current: trustLevel.days_visited,
          required: requirements.days_visited_required,
          met: trustLevel.days_visited >= requirements.days_visited_required,
        },
        time_read: {
          current: trustLevel.time_read_minutes,
          required: requirements.time_read_required,
          met: trustLevel.time_read_minutes >= requirements.time_read_required,
        },
        likes_received: {
          current: trustLevel.likes_received,
          required: requirements.likes_received_required,
          met: trustLevel.likes_received >= requirements.likes_received_required,
        },
        flags_agreed: {
          current: trustLevel.flags_agreed,
          required: requirements.flags_agreed_required,
          met: trustLevel.flags_agreed >= requirements.flags_agreed_required,
        },
      };

      const metCount = Object.values(requirementsMet).filter(req => req.met).length;
      const totalCount = Object.keys(requirementsMet).length;
      const progress = Math.round((metCount / totalCount) * 100);

      return {
        current_level: currentLevel,
        next_level: nextLevel,
        progress_percentage: progress,
        requirements: requirementsMet,
      };
    } catch (error) {
      logger.error('Error getting progress:', error);
      return null;
    }
  }

  /**
   * Get trust level name
   */
  static getTrustLevelName(level: TrustLevel): string {
    return TRUST_LEVEL_NAMES[level];
  }

  /**
   * Get leaderboard (top users by trust level)
   */
  static async getTrustLevelLeaderboard(
    limit: number = 10
  ): Promise<Array<{ user_id: string; trust_level: TrustLevel; posts_count: number }>> {
    try {
      const { data, error } = await supabase
        .from('forum_user_trust_levels')
        .select('user_id, trust_level, posts_count, likes_received')
        .order('trust_level', { ascending: false })
        .order('likes_received', { ascending: false })
        .order('posts_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      return [];
    }
  }
}
