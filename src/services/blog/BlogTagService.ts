/**
 * Blog Tag Service
 * Handles blog tag operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { BlogTag } from '@/types/blog';

export class BlogTagService {
  /**
   * Get all tags sorted by post count
   */
  static async getTags() {
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('post_count', { ascending: false });

    if (error) throw error;
    return data as BlogTag[];
  }

  /**
   * Get tags for a specific post
   */
  static async getPostTags(postId: string) {
    const { data, error } = await supabase
      .from('blog_post_tags')
      .select('blog_tags(*)')
      .eq('post_id', postId);

    if (error) throw error;
    return data?.map(item => item.blog_tags) || [];
  }

  /**
   * Update tags for a post
   */
  static async updatePostTags(postId: string, tagIds: string[]) {
    // Remove existing tags
    await supabase.from('blog_post_tags').delete().eq('post_id', postId);

    // Add new tags
    if (tagIds.length > 0) {
      const { error } = await supabase
        .from('blog_post_tags')
        .insert(tagIds.map(tagId => ({ post_id: postId, tag_id: tagId })));

      if (error) throw error;
    }
  }
}
