/**
 * Forum Category Service
 * Handles forum category operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ForumCategory, ForumCategoryWithStats, CategoryStats } from '@/types/forum';

export class ForumCategoryService {
  /**
   * Get all active categories
   */
  static async getCategories(): Promise<ForumCategory[]> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching forum categories:', error);
      throw error;
    }
  }

  /**
   * Get all categories with stats (thread count, latest post)
   */
  static async getCategoriesWithStats(): Promise<ForumCategoryWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select(
          `
          *,
          latest_thread:forum_threads(
            id,
            title,
            created_at,
            user:profiles(id, email, full_name)
          )
        `
        )
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false, foreignTable: 'forum_threads' })
        .limit(1, { foreignTable: 'forum_threads' });

      if (error) throw error;

      return (data || []).map(category => ({
        ...category,
        latest_thread: category.latest_thread?.[0] || undefined,
      })) as ForumCategoryWithStats[];
    } catch (error) {
      logger.error('Error fetching categories with stats:', error);
      throw error;
    }
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error fetching category by slug:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<ForumCategory | null> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error fetching category by ID:', error);
      throw error;
    }
  }

  /**
   * Get category stats (detailed analytics)
   */
  static async getCategoryStats(categoryId: string): Promise<CategoryStats | null> {
    try {
      const category = await this.getCategoryById(categoryId);
      if (!category) return null;

      // Get thread count
      const { count: threadCount } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('is_deleted', false);

      // Get post count
      const { count: postCount } = await supabase
        .from('forum_posts')
        .select('thread:forum_threads!inner(category_id)', { count: 'exact', head: true })
        .eq('thread.category_id', categoryId)
        .eq('is_deleted', false);

      // Get unique participants
      const { data: participants } = await supabase
        .from('forum_threads')
        .select('user_id')
        .eq('category_id', categoryId);

      const uniqueParticipants = new Set(participants?.map(p => p.user_id) || []).size;

      // Get most active users
      const { data: mostActiveUsers } = await supabase
        .rpc('get_category_most_active_users', {
          p_category_id: categoryId,
          p_limit: 5,
        })
        .select('user_id, email, post_count');

      // Calculate avg replies per thread
      const avgRepliesPerThread =
        threadCount && threadCount > 0 ? Math.round((postCount || 0) / threadCount) : 0;

      return {
        category,
        thread_count: threadCount || 0,
        post_count: postCount || 0,
        unique_participants: uniqueParticipants,
        avg_replies_per_thread: avgRepliesPerThread,
        most_active_users: mostActiveUsers || [],
      };
    } catch (error) {
      logger.error('Error fetching category stats:', error);
      throw error;
    }
  }

  /**
   * Get popular categories (by activity)
   */
  static async getPopularCategories(limit: number = 6): Promise<ForumCategory[]> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('thread_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching popular categories:', error);
      throw error;
    }
  }

  /**
   * Create a new category (admin only)
   */
  static async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order?: number;
    requires_auth?: boolean;
  }): Promise<ForumCategory> {
    try {
      const { data: category, error } = await supabase
        .from('forum_categories')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description,
          icon: data.icon,
          color: data.color || '#3b82f6',
          display_order: data.display_order || 0,
          requires_auth: data.requires_auth || false,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Category created:', category.slug);
      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update category (admin only)
   */
  static async updateCategory(
    categoryId: string,
    updates: Partial<{
      name: string;
      description: string;
      icon: string;
      color: string;
      display_order: number;
      is_active: boolean;
      requires_auth: boolean;
    }>
  ): Promise<ForumCategory> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;

      logger.log('Category updated:', categoryId);
      return data;
    } catch (error) {
      logger.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete category (admin only) - soft delete
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('forum_categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      if (error) throw error;

      logger.log('Category deleted:', categoryId);
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(orderedIds: string[]): Promise<void> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('forum_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      logger.log('Categories reordered');
    } catch (error) {
      logger.error('Error reordering categories:', error);
      throw error;
    }
  }

  /**
   * Get category count
   */
  static async getCategoryCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('forum_categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting category count:', error);
      return 0;
    }
  }
}
