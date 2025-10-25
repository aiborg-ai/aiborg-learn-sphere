/**
 * Forum Thread Service
 * Handles forum thread operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ForumThread,
  ForumThreadWithDetails,
  CreateThreadRequest,
  UpdateThreadRequest,
  ThreadFilters,
  ThreadListResponse,
} from '@/types/forum';

export class ForumThreadService {
  /**
   * Create a new thread
   */
  static async createThread(data: CreateThreadRequest): Promise<ForumThread> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user can post
      const { data: canPost } = await supabase.rpc('check_can_post', {
        p_user_id: user.id,
      });

      if (!canPost) {
        throw new Error('Rate limit exceeded or you are banned from posting');
      }

      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create thread
      const { data: thread, error } = await supabase
        .from('forum_threads')
        .insert({
          category_id: data.category_id,
          user_id: user.id,
          title: data.title,
          content: data.content,
          slug,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Thread created:', thread.id);

      // Award points for creating thread
      await supabase.rpc('award_forum_points', {
        p_user_id: user.id,
        p_action_type: 'create_thread',
        p_amount: 10,
      });

      return thread;
    } catch (error) {
      logger.error('Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Get threads with filters and pagination
   */
  static async getThreads(filters: ThreadFilters = {}): Promise<ThreadListResponse> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('forum_threads')
        .select(
          `
          *,
          category:forum_categories(*),
          user:profiles(id, email, full_name, avatar_url)
        `,
          { count: 'exact' }
        )
        .eq('is_deleted', false);

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.is_pinned !== undefined) {
        query = query.eq('is_pinned', filters.is_pinned);
      }

      if (filters.is_locked !== undefined) {
        query = query.eq('is_locked', filters.is_locked);
      }

      if (filters.has_best_answer !== undefined) {
        query = query.eq('has_best_answer', filters.has_best_answer);
      }

      // Search
      if (filters.search_query) {
        query = query.or(
          `title.ilike.%${filters.search_query}%,content.ilike.%${filters.search_query}%`
        );
      }

      // Time range filter
      if (filters.time_range && filters.time_range !== 'all') {
        const now = new Date();
        const startDate = new Date();

        switch (filters.time_range) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      // Sorting
      const sortBy = filters.sort_by || 'new';
      switch (sortBy) {
        case 'hot':
          // Hot algorithm: combine upvotes, replies, and recency
          query = query.order('upvote_count', { ascending: false });
          query = query.order('reply_count', { ascending: false });
          query = query.order('last_activity_at', { ascending: false });
          break;
        case 'top':
          query = query.order('upvote_count', { ascending: false });
          break;
        case 'controversial':
          // Controversial: high votes but close upvote/downvote ratio
          query = query.order('upvote_count', { ascending: false });
          query = query.order('downvote_count', { ascending: false });
          break;
        case 'new':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      // Get pinned threads separately
      let pinnedThreads: ForumThreadWithDetails[] = [];
      if (page === 1 && !filters.is_pinned) {
        const { data: pinned } = await supabase
          .from('forum_threads')
          .select(
            `
            *,
            category:forum_categories(*),
            user:profiles(id, email, full_name, avatar_url)
          `
          )
          .eq('is_pinned', true)
          .eq('is_deleted', false)
          .order('last_activity_at', { ascending: false })
          .limit(3);

        pinnedThreads = (pinned || []) as ForumThreadWithDetails[];
      }

      return {
        data: (data || []) as ForumThreadWithDetails[],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
        pinned_threads: pinnedThreads,
      };
    } catch (error) {
      logger.error('Error fetching threads:', error);
      throw error;
    }
  }

  /**
   * Get thread by ID with details
   */
  static async getThreadById(threadId: string): Promise<ForumThreadWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select(
          `
          *,
          category:forum_categories(*),
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('id', threadId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Increment view count
      await this.incrementViewCount(threadId);

      // Get user's vote and bookmark status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: vote } = await supabase
          .from('forum_votes')
          .select('vote_type')
          .eq('user_id', user.id)
          .eq('votable_type', 'thread')
          .eq('votable_id', threadId)
          .maybeSingle();

        const { data: bookmark } = await supabase
          .from('forum_bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('thread_id', threadId)
          .maybeSingle();

        const { data: follow } = await supabase
          .from('forum_follows')
          .select('id')
          .eq('user_id', user.id)
          .eq('thread_id', threadId)
          .maybeSingle();

        return {
          ...data,
          user_vote: vote?.vote_type || null,
          is_bookmarked: !!bookmark,
          is_following: !!follow,
        } as ForumThreadWithDetails;
      }

      return data as ForumThreadWithDetails;
    } catch (error) {
      logger.error('Error fetching thread:', error);
      throw error;
    }
  }

  /**
   * Get thread by slug
   */
  static async getThreadBySlug(
    categorySlug: string,
    threadSlug: string
  ): Promise<ForumThreadWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select(
          `
          *,
          category:forum_categories!inner(*),
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('slug', threadSlug)
        .eq('category.slug', categorySlug)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.getThreadById(data.id);
    } catch (error) {
      logger.error('Error fetching thread by slug:', error);
      throw error;
    }
  }

  /**
   * Update thread
   */
  static async updateThread(threadId: string, updates: UpdateThreadRequest): Promise<ForumThread> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check ownership or moderator status
      const thread = await this.getThreadById(threadId);
      if (!thread) throw new Error('Thread not found');

      if (thread.user_id !== user.id) {
        // Check if user is moderator
        const { data: isModerator } = await supabase
          .from('forum_moderators')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!isModerator) {
          throw new Error('Unauthorized');
        }
      }

      const { data, error } = await supabase
        .from('forum_threads')
        .update(updates)
        .eq('id', threadId)
        .select()
        .single();

      if (error) throw error;

      logger.log('Thread updated:', threadId);
      return data;
    } catch (error) {
      logger.error('Error updating thread:', error);
      throw error;
    }
  }

  /**
   * Delete thread (soft delete)
   */
  static async deleteThread(threadId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_threads')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', threadId);

      if (error) throw error;

      logger.log('Thread deleted:', threadId);
    } catch (error) {
      logger.error('Error deleting thread:', error);
      throw error;
    }
  }

  /**
   * Pin/Unpin thread (moderators only)
   */
  static async togglePinThread(threadId: string): Promise<ForumThread> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) throw new Error('Thread not found');

      return this.updateThread(threadId, {
        is_pinned: !thread.is_pinned,
      });
    } catch (error) {
      logger.error('Error toggling pin:', error);
      throw error;
    }
  }

  /**
   * Lock/Unlock thread (moderators only)
   */
  static async toggleLockThread(threadId: string): Promise<ForumThread> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) throw new Error('Thread not found');

      return this.updateThread(threadId, {
        is_locked: !thread.is_locked,
      });
    } catch (error) {
      logger.error('Error toggling lock:', error);
      throw error;
    }
  }

  /**
   * Move thread to different category
   */
  static async moveThread(threadId: string, newCategoryId: string): Promise<ForumThread> {
    try {
      return this.updateThread(threadId, {
        ...({ category_id: newCategoryId } as UpdateThreadRequest),
      });
    } catch (error) {
      logger.error('Error moving thread:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  private static async incrementViewCount(threadId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment', {
        table_name: 'forum_threads',
        row_id: threadId,
        column_name: 'view_count',
      });

      if (error) {
        // If RPC doesn't exist, fallback to UPDATE
        await supabase
          .from('forum_threads')
          .update({ view_count: supabase.sql`view_count + 1` })
          .eq('id', threadId);
      }
    } catch (error) {
      // Silent fail - view count is not critical
      logger.log('Error incrementing view count:', error);
    }
  }

  /**
   * Get trending threads (hot threads from past week)
   */
  static async getTrendingThreads(limit: number = 10): Promise<ForumThreadWithDetails[]> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('forum_threads')
        .select(
          `
          *,
          category:forum_categories(*),
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('is_deleted', false)
        .gte('created_at', weekAgo.toISOString())
        .order('upvote_count', { ascending: false })
        .order('reply_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ForumThreadWithDetails[];
    } catch (error) {
      logger.error('Error fetching trending threads:', error);
      throw error;
    }
  }

  /**
   * Get hot threads (active recently)
   */
  static async getHotThreads(limit: number = 10): Promise<ForumThreadWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select(
          `
          *,
          category:forum_categories(*),
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('is_deleted', false)
        .order('last_activity_at', { ascending: false })
        .order('reply_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ForumThreadWithDetails[];
    } catch (error) {
      logger.error('Error fetching hot threads:', error);
      throw error;
    }
  }

  /**
   * Get user's threads
   */
  static async getUserThreads(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ThreadListResponse> {
    return this.getThreads({
      user_id: userId,
      page,
      limit,
    });
  }

  /**
   * Search threads
   */
  static async searchThreads(
    query: string,
    filters: Partial<ThreadFilters> = {}
  ): Promise<ThreadListResponse> {
    return this.getThreads({
      ...filters,
      search_query: query,
    });
  }

  /**
   * Get thread count
   */
  static async getThreadCount(categoryId?: string): Promise<number> {
    try {
      let query = supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting thread count:', error);
      return 0;
    }
  }
}
