/**
 * Blog Post Service
 * Handles core blog post CRUD operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { BlogPost, BlogFilters, BlogTag } from '@/types/blog';

export class BlogPostService {
  /**
   * Get blog posts with filters and pagination
   */
  static async getPosts(filters: BlogFilters = {}) {
    let query = supabase.from('blog_posts').select(`
        *,
        blog_categories(name, slug, color),
        blog_post_tags(
          blog_tags(id, name, slug)
        )
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      // Default to published posts for public
      query = query.eq('status', 'published').lte('published_at', new Date().toISOString());
    }

    if (filters.category) {
      query = query.eq('blog_categories.slug', filters.category);
    }

    if (filters.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }

    if (filters.author) {
      query = query.eq('author_id', filters.author);
    }

    if (filters.search) {
      query = query.textSearch('title', filters.search, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'trending':
        // Trending: combination of recent + popular
        query = query
          .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('view_count', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to match our types
    const posts = (data || []).map(post => ({
      ...post,
      author_name: 'Admin', // Default author name since profiles might not exist
      author_avatar: null,
      category_name: post.blog_categories?.name,
      category_slug: post.blog_categories?.slug,
      category_color: post.blog_categories?.color,
      tags: post.blog_post_tags?.map((pt: { blog_tags: BlogTag }) => pt.blog_tags) || [],
    }));

    return { posts, count };
  }

  /**
   * Get a single post by slug (without engagement stats)
   * For engagement stats, use BlogInteractionService and BlogCommentService separately
   */
  static async getPostBySlug(slug: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_categories(name, slug, color),
        blog_post_tags(
          blog_tags(id, name, slug)
        )
      `
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;

    return {
      ...data,
      author_name: 'Admin', // Default author name
      author_avatar: null,
      author_bio: null,
      category_name: data.blog_categories?.name,
      category_slug: data.blog_categories?.slug,
      category_color: data.blog_categories?.color,
      tags: data.blog_post_tags?.map((pt: { blog_tags: BlogTag }) => pt.blog_tags) || [],
    };
  }

  /**
   * Create a new blog post
   */
  static async createPost(post: Partial<BlogPost>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...post,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing blog post
   */
  static async updatePost(id: string, updates: Partial<BlogPost>) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a blog post
   */
  static async deletePost(id: string) {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Increment view count for a post
   */
  static async incrementViewCount(postId: string) {
    try {
      const { error } = await supabase.rpc('increment', {
        table_name: 'blog_posts',
        column_name: 'view_count',
        row_id: postId,
      });

      if (error) {
        // Fallback: Just log the error, don't try to update
        // The increment function needs to be created in the database
        logger.warn('Increment function not found. Please run the migration to create it.');
        logger.error('Failed to increment view count:', error);
      }
    } catch (err) {
      logger.error('Error incrementing view count:', err);
    }
  }
}
