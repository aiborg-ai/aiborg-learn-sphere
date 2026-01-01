/**
 * Forum Post Service
 * Handles forum post operations with nested replies
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ForumPost,
  ForumPostWithDetails,
  CreatePostRequest,
  UpdatePostRequest,
  PostTreeResponse,
} from '@/types/forum';

export class ForumPostService {
  /**
   * Create a new post/reply
   */
  static async createPost(data: CreatePostRequest): Promise<ForumPost> {
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

      // Check if thread is locked
      const { data: thread } = await supabase
        .from('forum_threads')
        .select('is_locked')
        .eq('id', data.thread_id)
        .single();

      if (thread?.is_locked) {
        throw new Error('This thread is locked');
      }

      // Create post
      const { data: post, error } = await supabase
        .from('forum_posts')
        .insert({
          thread_id: data.thread_id,
          user_id: user.id,
          content: data.content,
          parent_id: data.parent_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Post created:', post.id);

      // Award points for creating post
      await supabase.rpc('award_forum_points', {
        p_user_id: user.id,
        p_action_type: 'create_post',
        p_amount: 5,
      });

      // Auto-follow thread if not already following
      await supabase
        .from('forum_follows')
        .insert({
          user_id: user.id,
          thread_id: data.thread_id,
        })
        .onConflict('user_id,thread_id')
        .ignore();

      return post;
    } catch (_error) {
      logger.error('Error creating post:', _error);
      throw error;
    }
  }

  /**
   * Get posts for a thread in tree structure
   */
  static async getThreadPosts(
    threadId: string,
    sortBy: 'oldest' | 'newest' | 'top' = 'oldest'
  ): Promise<PostTreeResponse> {
    try {
      let query = supabase
        .from('forum_posts')
        .select(
          `
          *,
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('thread_id', threadId)
        .eq('is_deleted', false);

      // Sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'top':
          query = query.order('upvote_count', { ascending: false });
          break;
        case 'oldest':
        default:
          query = query.order('path', { ascending: true }); // Use path for proper tree order
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get user's votes
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userVotes: Record<string, 'upvote' | 'downvote'> = {};
      if (user) {
        const { data: votes } = await supabase
          .from('forum_votes')
          .select('votable_id, vote_type')
          .eq('user_id', user.id)
          .eq('votable_type', 'post')
          .in('votable_id', data?.map(p => p.id) || []);

        userVotes = (votes || []).reduce(
          (acc, vote) => ({
            ...acc,
            [vote.votable_id]: vote.vote_type,
          }),
          {}
        );
      }

      // Build tree structure
      const posts = (data || []).map(post => ({
        ...post,
        user_vote: userVotes[post.id] || null,
        replies: [],
      })) as ForumPostWithDetails[];

      const tree = this.buildPostTree(posts);

      // Get online users
      const { data: onlineUsers } = await supabase
        .from('forum_online_users')
        .select('*')
        .eq('thread_id', threadId)
        .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      return {
        posts: tree,
        total_count: posts.length,
        online_users: onlineUsers || [],
      };
    } catch (_error) {
      logger.error('Error fetching thread posts:', _error);
      throw error;
    }
  }

  /**
   * Build nested tree structure from flat list
   */
  private static buildPostTree(posts: ForumPostWithDetails[]): ForumPostWithDetails[] {
    const postMap = new Map<string, ForumPostWithDetails>();
    const rootPosts: ForumPostWithDetails[] = [];

    // Create map
    posts.forEach(post => {
      postMap.set(post.id, { ...post, replies: [] });
    });

    // Build tree
    posts.forEach(post => {
      const postNode = postMap.get(post.id);
      if (!postNode) return;

      if (post.parent_id) {
        const parent = postMap.get(post.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(postNode);
        } else {
          // Parent not found (deleted?), add to root
          rootPosts.push(postNode);
        }
      } else {
        rootPosts.push(postNode);
      }
    });

    return rootPosts;
  }

  /**
   * Get post by ID
   */
  static async getPostById(postId: string): Promise<ForumPostWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(
          `
          *,
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Get user's vote
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: vote } = await supabase
          .from('forum_votes')
          .select('vote_type')
          .eq('user_id', user.id)
          .eq('votable_type', 'post')
          .eq('votable_id', postId)
          .maybeSingle();

        return {
          ...data,
          user_vote: vote?.vote_type || null,
          replies: [],
        } as ForumPostWithDetails;
      }

      return { ...data, replies: [] } as ForumPostWithDetails;
    } catch (_error) {
      logger.error('Error fetching post:', _error);
      throw error;
    }
  }

  /**
   * Update post
   */
  static async updatePost(postId: string, updates: UpdatePostRequest): Promise<ForumPost> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forum_posts')
        .update({
          content: updates.content,
          is_edited: true,
          edited_at: new Date().toISOString(),
          edit_reason: updates.edit_reason,
        })
        .eq('id', postId)
        .eq('user_id', user.id) // Ensure user owns the post
        .select()
        .single();

      if (error) throw error;

      logger.log('Post updated:', postId);
      return data;
    } catch (_error) {
      logger.error('Error updating post:', _error);
      throw error;
    }
  }

  /**
   * Delete post (soft delete)
   */
  static async deletePost(postId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', postId);

      if (error) throw error;

      logger.log('Post deleted:', postId);
    } catch (_error) {
      logger.error('Error deleting post:', _error);
      throw error;
    }
  }

  /**
   * Mark post as best answer
   */
  static async markBestAnswer(postId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get post to find thread
      const post = await this.getPostById(postId);
      if (!post) throw new Error('Post not found');

      // Check if user owns the thread
      const { data: thread } = await supabase
        .from('forum_threads')
        .select('user_id')
        .eq('id', post.thread_id)
        .single();

      if (!thread || thread.user_id !== user.id) {
        throw new Error('Only thread author can mark best answer');
      }

      // Unmark previous best answer
      await supabase
        .from('forum_posts')
        .update({ is_best_answer: false })
        .eq('thread_id', post.thread_id);

      // Mark new best answer
      await supabase.from('forum_posts').update({ is_best_answer: true }).eq('id', postId);

      // Update thread
      await supabase
        .from('forum_threads')
        .update({
          has_best_answer: true,
          best_answer_id: postId,
        })
        .eq('id', post.thread_id);

      // Award points to post author
      await supabase.rpc('award_forum_points', {
        p_user_id: post.user_id,
        p_action_type: 'best_answer',
        p_amount: 25,
      });

      logger.log('Best answer marked:', postId);
    } catch (_error) {
      logger.error('Error marking best answer:', _error);
      throw error;
    }
  }

  /**
   * Unmark best answer
   */
  static async unmarkBestAnswer(threadId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Unmark all posts
      await supabase
        .from('forum_posts')
        .update({ is_best_answer: false })
        .eq('thread_id', threadId);

      // Update thread
      await supabase
        .from('forum_threads')
        .update({
          has_best_answer: false,
          best_answer_id: null,
        })
        .eq('id', threadId);

      logger.log('Best answer unmarked for thread:', threadId);
    } catch (_error) {
      logger.error('Error unmarking best answer:', _error);
      throw error;
    }
  }

  /**
   * Get post count for thread
   */
  static async getPostCount(threadId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId)
        .eq('is_deleted', false);

      if (error) throw error;
      return count || 0;
    } catch (_error) {
      logger.error('Error getting post count:', _error);
      return 0;
    }
  }

  /**
   * Get user's posts
   */
  static async getUserPosts(userId: string, limit: number = 20): Promise<ForumPostWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(
          `
          *,
          user:profiles(id, email, full_name, avatar_url),
          thread:forum_threads(id, title, category_id)
        `
        )
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(post => ({ ...post, replies: [] })) as ForumPostWithDetails[];
    } catch (_error) {
      logger.error('Error fetching user posts:', _error);
      throw error;
    }
  }

  /**
   * Update user online status in thread
   */
  static async updateOnlineStatus(threadId: string, isTyping: boolean = false): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('forum_online_users')
        .upsert({
          user_id: user.id,
          thread_id: threadId,
          is_typing: isTyping,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('thread_id', threadId);
    } catch (_error) {
      // Silent fail - online status is not critical
      logger.log('Error updating online status:', error);
    }
  }
}
