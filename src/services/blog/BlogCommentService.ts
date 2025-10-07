/**
 * Blog Comment Service
 * Handles blog comment operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { BlogComment } from '@/types/blog';

export class BlogCommentService {
  /**
   * Get all comments for a post in hierarchical structure
   */
  static async getPostComments(postId: string) {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform to hierarchical structure
    const comments = (data || []).map(comment => ({
      ...comment,
      user_name: 'User', // Default user name
      user_avatar: null,
    }));

    // Build tree structure for nested comments
    const commentMap = new Map();
    const rootComments: BlogComment[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }

  /**
   * Create a new comment
   */
  static async createComment(postId: string, content: string, parentId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId,
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      ...data,
      user_name: user.email?.split('@')[0] || 'User', // Use email prefix as name
      user_avatar: null,
    };
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, content: string) {
    const { data, error } = await supabase
      .from('blog_comments')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string) {
    const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);

    if (error) throw error;
  }

  /**
   * Get comment count for a post
   */
  static async getPostCommentCount(postId: string) {
    const { count, error } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_approved', true);

    if (error) throw error;
    return count || 0;
  }
}
