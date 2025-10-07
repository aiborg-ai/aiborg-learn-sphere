/**
 * Blog Category Service
 * Handles blog category operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { BlogCategory } from '@/types/blog';

export class BlogCategoryService {
  /**
   * Get all active blog categories
   */
  static async getCategories() {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as BlogCategory[];
  }

  /**
   * Create a new category
   */
  static async createCategory(category: Partial<BlogCategory>) {
    const { data, error } = await supabase
      .from('blog_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
