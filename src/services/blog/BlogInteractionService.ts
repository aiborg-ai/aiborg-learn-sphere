/**
 * Blog Interaction Service
 * Handles user interactions (likes, bookmarks, shares)
 */

import { supabase } from '@/integrations/supabase/client';

export class BlogInteractionService {
  // ========== Likes ==========

  /**
   * Like a post
   */
  static async likePost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('blog_likes').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  }

  /**
   * Unlike a post
   */
  static async unlikePost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blog_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Check if user has liked a post
   */
  static async isPostLiked(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return !!data && !error;
  }

  /**
   * Get like count for a post
   */
  static async getPostLikeCount(postId: string) {
    const { count, error } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  }

  // ========== Bookmarks ==========

  /**
   * Bookmark a post
   */
  static async bookmarkPost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('blog_bookmarks').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error && error.code !== '23505') throw error;
  }

  /**
   * Remove bookmark from a post
   */
  static async unbookmarkPost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blog_bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Check if user has bookmarked a post
   */
  static async isPostBookmarked(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('blog_bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return !!data && !error;
  }

  /**
   * Get user's bookmarked posts
   */
  static async getUserBookmarks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blog_bookmarks')
      .select(
        `
        blog_posts (
          *,
          profiles!blog_posts_author_id_fkey(display_name, avatar_url),
          blog_categories(name, slug, color)
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (
      data?.map(item => ({
        ...item.blog_posts,
        author_name: item.blog_posts?.profiles?.display_name,
        author_avatar: item.blog_posts?.profiles?.avatar_url,
        category_name: item.blog_posts?.blog_categories?.name,
        category_slug: item.blog_posts?.blog_categories?.slug,
        category_color: item.blog_posts?.blog_categories?.color,
      })) || []
    );
  }

  // ========== Shares ==========

  /**
   * Track post share
   */
  static async sharePost(postId: string, platform: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('blog_shares').insert({
      post_id: postId,
      user_id: user?.id || null,
      platform,
    });

    if (error) throw error;
  }
}
