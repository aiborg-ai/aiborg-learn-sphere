/**
 * Forum Moderation Service
 * Handles moderation actions: ban, warn, delete, purge
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ForumBan,
  ForumWarning,
  ForumReport,
  ForumModerator,
  BanUserRequest,
  WarnUserRequest,
  CreateReportRequest,
  AssignModeratorRequest,
  ForumReportWithDetails,
  ForumModeratorAction,
} from '@/types/forum';

export class ForumModerationService {
  /**
   * Check if user is a moderator
   */
  static async isModerator(userId: string, categoryId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('forum_moderators')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (categoryId) {
        // Check if moderator for specific category or global moderator
        query = query.or(`category_id.eq.${categoryId},category_id.is.null`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (_error) {
      logger.error('Error checking moderator status:', _error);
      return false;
    }
  }

  /**
   * Ban a user
   */
  static async banUser(request: BanUserRequest): Promise<ForumBan> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check moderator status
      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized - not a moderator');

      // Create ban
      const { data, error } = await supabase
        .from('forum_bans')
        .insert({
          user_id: request.user_id,
          banned_by: user.id,
          ban_type: request.ban_type,
          reason: request.reason,
          end_date: request.end_date,
          notes: request.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Log action
      await this.logModeratorAction(user.id, 'ban_user', 'user', request.user_id, request.reason, {
        ban_type: request.ban_type,
        end_date: request.end_date,
      });

      logger.log('User banned:', request.user_id);
      return data;
    } catch (_error) {
      logger.error('Error banning user:', _error);
      throw error;
    }
  }

  /**
   * Unban a user
   */
  static async unbanUser(userId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('forum_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      await this.logModeratorAction(user.id, 'unban_user', 'user', userId);

      logger.log('User unbanned:', userId);
    } catch (_error) {
      logger.error('Error unbanning user:', _error);
      throw error;
    }
  }

  /**
   * Warn a user
   */
  static async warnUser(request: WarnUserRequest): Promise<ForumWarning> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized');

      // Create warning
      const { data: warning, error } = await supabase
        .from('forum_warnings')
        .insert({
          user_id: request.user_id,
          issued_by: user.id,
          severity: request.severity,
          reason: request.reason,
          description: request.description,
        })
        .select()
        .single();

      if (error) throw error;

      // Check if user should be auto-banned
      const { count: warningCount } = await supabase
        .from('forum_warnings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', request.user_id);

      if (warningCount && warningCount >= 3) {
        // Auto-ban after 3 warnings
        await this.banUser({
          user_id: request.user_id,
          ban_type: 'temporary',
          reason: 'Automatic ban after 3 warnings',
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
      }

      await this.logModeratorAction(user.id, 'warn_user', 'user', request.user_id, request.reason, {
        severity: request.severity,
      });

      logger.log('User warned:', request.user_id);
      return warning;
    } catch (_error) {
      logger.error('Error warning user:', _error);
      throw error;
    }
  }

  /**
   * Purge user content (soft delete all posts and threads)
   */
  static async purgeUserContent(
    userId: string,
    _reason: string
  ): Promise<{
    threads_deleted: number;
    posts_deleted: number;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized');

      // Use database function
      const { data, error } = await supabase.rpc('soft_delete_user_content', {
        p_user_id: userId,
        p_moderator_id: user.id,
      });

      if (error) throw error;

      logger.log('User content purged:', userId, data);
      return data as { threads_deleted: number; posts_deleted: number };
    } catch (_error) {
      logger.error('Error purging user content:', _error);
      throw error;
    }
  }

  /**
   * Delete a thread
   */
  static async deleteThread(threadId: string, reason: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('forum_threads')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', threadId);

      if (error) throw error;

      await this.logModeratorAction(user.id, 'delete_thread', 'thread', threadId, reason);

      logger.log('Thread deleted by moderator:', threadId);
    } catch (_error) {
      logger.error('Error deleting thread:', _error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string, reason: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('forum_posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', postId);

      if (error) throw error;

      await this.logModeratorAction(user.id, 'delete_post', 'post', postId, reason);

      logger.log('Post deleted by moderator:', postId);
    } catch (_error) {
      logger.error('Error deleting post:', _error);
      throw error;
    }
  }

  /**
   * Create a report
   */
  static async createReport(request: CreateReportRequest): Promise<ForumReport> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forum_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: request.reported_user_id,
          reportable_type: request.reportable_type,
          reportable_id: request.reportable_id,
          reason: request.reason,
          description: request.description,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Report created:', data.id);
      return data;
    } catch (_error) {
      logger.error('Error creating report:', _error);
      throw error;
    }
  }

  /**
   * Get all pending reports
   */
  static async getPendingReports(): Promise<ForumReportWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('forum_reports')
        .select(
          `
          *,
          reporter:profiles!reporter_id(id, email, full_name),
          reported_user:profiles!reported_user_id(id, email, full_name)
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get content preview for each report
      const reportsWithPreview = await Promise.all(
        (data || []).map(async report => {
          let contentPreview = '';

          if (report.reportable_type === 'thread') {
            const { data: thread } = await supabase
              .from('forum_threads')
              .select('title, content')
              .eq('id', report.reportable_id)
              .single();

            contentPreview = thread?.title || thread?.content?.substring(0, 100) || '';
          } else if (report.reportable_type === 'post') {
            const { data: post } = await supabase
              .from('forum_posts')
              .select('content')
              .eq('id', report.reportable_id)
              .single();

            contentPreview = post?.content?.substring(0, 100) || '';
          }

          return {
            ...report,
            content_preview: contentPreview,
          };
        })
      );

      return reportsWithPreview as ForumReportWithDetails[];
    } catch (_error) {
      logger.error('Error fetching reports:', _error);
      throw error;
    }
  }

  /**
   * Review and action a report
   */
  static async reviewReport(
    reportId: string,
    status: 'reviewed' | 'actioned' | 'dismissed',
    actionTaken?: string
  ): Promise<ForumReport> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isMod = await this.isModerator(user.id);
      if (!isMod) throw new Error('Unauthorized');

      const { data, error } = await supabase
        .from('forum_reports')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          action_taken: actionTaken,
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      logger.log('Report reviewed:', reportId, status);
      return data;
    } catch (_error) {
      logger.error('Error reviewing report:', _error);
      throw error;
    }
  }

  /**
   * Assign moderator role
   */
  static async assignModerator(request: AssignModeratorRequest): Promise<ForumModerator> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        throw new Error('Unauthorized - admin only');
      }

      const { data, error } = await supabase
        .from('forum_moderators')
        .insert({
          user_id: request.user_id,
          category_id: request.category_id,
          assigned_by: user.id,
          permissions: request.permissions || {
            delete: true,
            edit: true,
            pin: true,
            lock: true,
            ban: true,
            warn: true,
          },
          notes: request.notes,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Moderator assigned:', request.user_id);
      return data;
    } catch (_error) {
      logger.error('Error assigning moderator:', _error);
      throw error;
    }
  }

  /**
   * Remove moderator role
   */
  static async removeModerator(userId: string, categoryId?: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('forum_moderators')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { error } = await query;
      if (error) throw error;

      logger.log('Moderator removed:', userId);
    } catch (_error) {
      logger.error('Error removing moderator:', _error);
      throw error;
    }
  }

  /**
   * Get all moderators
   */
  static async getModerators(): Promise<ForumModerator[]> {
    try {
      const { data, error } = await supabase
        .from('forum_moderators')
        .select(
          `
          *,
          user:profiles!user_id(id, email, full_name),
          category:forum_categories(id, name)
        `
        )
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as ForumModerator[];
    } catch (_error) {
      logger.error('Error fetching moderators:', _error);
      throw error;
    }
  }

  /**
   * Get moderator actions log
   */
  static async getModeratorActions(
    moderatorId?: string,
    limit: number = 50
  ): Promise<ForumModeratorAction[]> {
    try {
      let query = supabase
        .from('forum_moderator_actions')
        .select(
          `
          *,
          moderator:profiles!moderator_id(id, email, full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (moderatorId) {
        query = query.eq('moderator_id', moderatorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ForumModeratorAction[];
    } catch (_error) {
      logger.error('Error fetching moderator actions:', _error);
      throw error;
    }
  }

  /**
   * Log a moderator action
   */
  private static async logModeratorAction(
    moderatorId: string,
    actionType: ForumModeratorAction['action_type'],
    targetType?: 'thread' | 'post' | 'user' | null,
    targetId?: string | null,
    reason?: string | null,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('forum_moderator_actions').insert({
        moderator_id: moderatorId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
    } catch (_error) {
      logger.error('Error logging moderator action:', _error);
    }
  }

  /**
   * Get user's bans
   */
  static async getUserBans(userId: string): Promise<ForumBan[]> {
    try {
      const { data, error } = await supabase
        .from('forum_bans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching user bans:', _error);
      throw error;
    }
  }

  /**
   * Get user's warnings
   */
  static async getUserWarnings(userId: string): Promise<ForumWarning[]> {
    try {
      const { data, error } = await supabase
        .from('forum_warnings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (_error) {
      logger.error('Error fetching user warnings:', _error);
      throw error;
    }
  }

  /**
   * Check if user is currently banned
   */
  static async isUserBanned(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('forum_bans')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('end_date.is.null,end_date.gt.' + new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (_error) {
      logger.error('Error checking ban status:', _error);
      return false;
    }
  }
}
