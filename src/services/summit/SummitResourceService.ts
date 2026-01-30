/**
 * Summit Resource Service
 * Handles CRUD operations for Summit resources and themes
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  SummitTheme,
  SummitResource,
  SummitResourceFilters,
  SummitStats,
  SummitResourceType,
} from '@/types/summit';

export class SummitResourceService {
  /**
   * Get all active themes (The 7 Chakras)
   */
  static async getThemes(): Promise<SummitTheme[]> {
    const { data, error } = await supabase
      .from('summit_themes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as SummitTheme[];
  }

  /**
   * Get a single theme by slug
   */
  static async getThemeBySlug(slug: string): Promise<SummitTheme | null> {
    const { data, error } = await supabase
      .from('summit_themes')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SummitTheme;
  }

  /**
   * Get resources with filters and pagination
   */
  static async getResources(filters: SummitResourceFilters = {}) {
    let query = supabase
      .from('summit_resources')
      .select('*, theme:summit_themes(*)', { count: 'exact' });

    // Filter by theme_id
    if (filters.theme_id) {
      query = query.eq('theme_id', filters.theme_id);
    }

    // Filter by theme_slug (need to join)
    if (filters.theme_slug) {
      const theme = await this.getThemeBySlug(filters.theme_slug);
      if (theme) {
        query = query.eq('theme_id', theme.id);
      } else {
        return { resources: [], count: 0, page: 1, limit: 12, totalPages: 0 };
      }
    }

    // Filter by status (default to published for public)
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'published');
    }

    // Filter by resource type
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }

    // Filter by featured
    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Search
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'featured':
        query = query
          .order('is_featured', { ascending: false })
          .order('featured_order', { ascending: true })
          .order('created_at', { ascending: false });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
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

    return {
      resources: (data || []) as SummitResource[],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get a single resource by slug
   */
  static async getResourceBySlug(slug: string): Promise<SummitResource | null> {
    const { data, error } = await supabase
      .from('summit_resources')
      .select('*, theme:summit_themes(*)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SummitResource;
  }

  /**
   * Get a single resource by ID (for CMS)
   */
  static async getResourceById(id: string): Promise<SummitResource | null> {
    const { data, error } = await supabase
      .from('summit_resources')
      .select('*, theme:summit_themes(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SummitResource;
  }

  /**
   * Get resources by theme
   */
  static async getResourcesByTheme(themeSlug: string, limit = 10): Promise<SummitResource[]> {
    const theme = await this.getThemeBySlug(themeSlug);
    if (!theme) return [];

    const { data, error } = await supabase
      .from('summit_resources')
      .select('*, theme:summit_themes(*)')
      .eq('theme_id', theme.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as SummitResource[];
  }

  /**
   * Get featured resources
   */
  static async getFeaturedResources(limit = 6): Promise<SummitResource[]> {
    const { data, error } = await supabase
      .from('summit_resources')
      .select('*, theme:summit_themes(*)')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as SummitResource[];
  }

  /**
   * Create a new resource
   */
  static async createResource(resource: Partial<SummitResource>): Promise<SummitResource> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate slug from title
    const slug = this.generateSlug(resource.title || 'untitled');

    const { data, error } = await supabase
      .from('summit_resources')
      .insert({
        ...resource,
        slug,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('*, theme:summit_themes(*)')
      .single();

    if (error) throw error;
    return data as SummitResource;
  }

  /**
   * Update an existing resource
   */
  static async updateResource(
    id: string,
    updates: Partial<SummitResource>
  ): Promise<SummitResource> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // If title changed, update slug
    let slug = updates.slug;
    if (updates.title && !updates.slug) {
      slug = this.generateSlug(updates.title);
    }

    const { data, error } = await supabase
      .from('summit_resources')
      .update({
        ...updates,
        slug,
        updated_by: user.id,
      })
      .eq('id', id)
      .select('*, theme:summit_themes(*)')
      .single();

    if (error) throw error;
    return data as SummitResource;
  }

  /**
   * Delete a resource
   */
  static async deleteResource(id: string): Promise<void> {
    const { error } = await supabase.from('summit_resources').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(id: string): Promise<void> {
    try {
      // Try using RPC if available
      const { error } = await supabase.rpc('increment', {
        table_name: 'summit_resources',
        column_name: 'view_count',
        row_id: id,
      });

      if (error) {
        // Fallback: manual update
        const { data: resource } = await supabase
          .from('summit_resources')
          .select('view_count')
          .eq('id', id)
          .single();

        if (resource) {
          await supabase
            .from('summit_resources')
            .update({ view_count: (resource.view_count || 0) + 1 })
            .eq('id', id);
        }
      }
    } catch (err) {
      logger.error('Error incrementing view count:', err);
    }
  }

  /**
   * Get statistics
   */
  static async getStats(): Promise<SummitStats> {
    // Get theme stats from view
    const { data: themeStats } = await supabase.from('summit_theme_stats').select('*');

    // Get type counts
    const { data: typeData } = await supabase
      .from('summit_resources')
      .select('resource_type')
      .eq('status', 'published');

    // Count by type
    const typeCounts: Record<string, number> = {};
    (typeData || []).forEach(item => {
      const type = item.resource_type as SummitResourceType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const byType = Object.entries(typeCounts).map(([type, count]) => ({
      type: type as SummitResourceType,
      count,
    }));

    // Calculate totals
    const stats: SummitStats = {
      total_resources: 0,
      total_views: 0,
      published_count: 0,
      draft_count: 0,
      featured_count: 0,
      by_theme: (themeStats || []).map(ts => ({
        theme_id: ts.theme_id,
        theme_slug: ts.theme_slug,
        theme_name: ts.theme_name,
        published_count: ts.published_count || 0,
        draft_count: ts.draft_count || 0,
        total_count: ts.total_count || 0,
        total_views: ts.total_views || 0,
      })),
      by_type: byType,
    };

    // Sum up totals
    stats.by_theme.forEach(ts => {
      stats.total_resources += ts.total_count;
      stats.total_views += ts.total_views;
      stats.published_count += ts.published_count;
      stats.draft_count += ts.draft_count;
    });

    // Get featured count
    const { count: featuredCount } = await supabase
      .from('summit_resources')
      .select('id', { count: 'exact', head: true })
      .eq('is_featured', true);

    stats.featured_count = featuredCount || 0;

    return stats;
  }

  /**
   * Get all unique tags across resources
   */
  static async getAllTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('summit_resources')
      .select('tags')
      .eq('status', 'published');

    if (error) throw error;

    const allTags = new Set<string>();
    (data || []).forEach(resource => {
      (resource.tags || []).forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }

  /**
   * Generate a URL-safe slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Update theme (for CMS)
   */
  static async updateTheme(id: string, updates: Partial<SummitTheme>): Promise<SummitTheme> {
    const { data, error } = await supabase
      .from('summit_themes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SummitTheme;
  }
}
