/**
 * Knowledgebase Service
 * Handles CRUD operations for knowledgebase entries
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  KnowledgebaseEntry,
  KnowledgebaseFilters,
  KnowledgebaseTopicType,
  KnowledgebaseStats,
} from '@/types/knowledgebase';

export class KnowledgebaseService {
  /**
   * Get knowledgebase entries with filters and pagination
   */
  static async getEntries(filters: KnowledgebaseFilters = {}) {
    let query = supabase.from('knowledgebase_entries').select('*', { count: 'exact' });

    // Apply filters
    if (filters.topic_type) {
      query = query.eq('topic_type', filters.topic_type);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      // Default to published entries for public
      query = query.eq('status', 'published');
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
      );
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
          .order('published_at', { ascending: false });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
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

    return {
      entries: (data || []) as KnowledgebaseEntry[],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get a single entry by slug
   */
  static async getEntryBySlug(slug: string) {
    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Entry not found');
      }
      throw error;
    }

    return data as KnowledgebaseEntry;
  }

  /**
   * Get a single entry by ID (for CMS)
   */
  static async getEntryById(id: string) {
    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as KnowledgebaseEntry;
  }

  /**
   * Get featured entries
   */
  static async getFeaturedEntries(limit = 6) {
    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as KnowledgebaseEntry[];
  }

  /**
   * Get entries by topic type
   */
  static async getEntriesByTopic(topicType: KnowledgebaseTopicType, limit = 10) {
    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .select('*')
      .eq('status', 'published')
      .eq('topic_type', topicType)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as KnowledgebaseEntry[];
  }

  /**
   * Get related entries (same topic, different entry)
   */
  static async getRelatedEntries(entry: KnowledgebaseEntry, limit = 4) {
    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .select('*')
      .eq('status', 'published')
      .eq('topic_type', entry.topic_type)
      .neq('id', entry.id)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as KnowledgebaseEntry[];
  }

  /**
   * Create a new entry
   */
  static async createEntry(entry: Partial<KnowledgebaseEntry>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .insert({
        ...entry,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgebaseEntry;
  }

  /**
   * Update an existing entry
   */
  static async updateEntry(id: string, updates: Partial<KnowledgebaseEntry>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('knowledgebase_entries')
      .update({
        ...updates,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgebaseEntry;
  }

  /**
   * Delete an entry
   */
  static async deleteEntry(id: string) {
    const { error } = await supabase.from('knowledgebase_entries').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(id: string) {
    try {
      const { error } = await supabase.rpc('increment', {
        table_name: 'knowledgebase_entries',
        column_name: 'view_count',
        row_id: id,
      });

      if (error) {
        // Fallback: manual update
        const { data: entry } = await supabase
          .from('knowledgebase_entries')
          .select('view_count')
          .eq('id', id)
          .single();

        if (entry) {
          await supabase
            .from('knowledgebase_entries')
            .update({ view_count: (entry.view_count || 0) + 1 })
            .eq('id', id);
        }
      }
    } catch (err) {
      logger.error('Error incrementing view count:', err);
    }
  }

  /**
   * Get knowledgebase statistics
   */
  static async getStats(): Promise<KnowledgebaseStats> {
    try {
      // Try using the RPC function first (has SECURITY DEFINER)
      const { data: rpcStats, error: rpcError } = await supabase.rpc('get_knowledgebase_stats');

      let topicStats = rpcStats;

      // Fall back to view if RPC fails
      if (rpcError || !rpcStats) {
        logger.warn('RPC get_knowledgebase_stats failed, falling back to view:', rpcError);
        const { data: viewStats, error: viewError } = await supabase
          .from('knowledgebase_topic_stats')
          .select('*');

        if (viewError) {
          logger.warn('View query also failed:', viewError);
          topicStats = [];
        } else {
          topicStats = viewStats;
        }
      }

      // Calculate totals
      const stats: KnowledgebaseStats = {
        total_entries: 0,
        total_views: 0,
        published_count: 0,
        draft_count: 0,
        by_topic: (topicStats || []).map(ts => ({
          topic_type: ts.topic_type,
          published_count: Number(ts.published_count) || 0,
          draft_count: Number(ts.draft_count) || 0,
          total_count: Number(ts.total_count) || 0,
          total_views: Number(ts.total_views) || 0,
        })),
        featured_count: 0,
      };

      // Sum up totals
      stats.by_topic.forEach(ts => {
        stats.total_entries += ts.total_count;
        stats.total_views += ts.total_views;
        stats.published_count += ts.published_count;
        stats.draft_count += ts.draft_count;
      });

      // Get featured count
      const { count: featuredCount } = await supabase
        .from('knowledgebase_entries')
        .select('id', { count: 'exact', head: true })
        .eq('is_featured', true);

      stats.featured_count = featuredCount || 0;

      return stats;
    } catch (err) {
      logger.error('Error in getStats:', err);
      // Return empty stats on error
      return {
        total_entries: 0,
        total_views: 0,
        published_count: 0,
        draft_count: 0,
        by_topic: [],
        featured_count: 0,
      };
    }
  }

  /**
   * Get all unique tags across entries
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('knowledgebase_entries')
        .select('tags')
        .eq('status', 'published');

      if (error) {
        logger.warn('Error fetching tags:', error);
        return [];
      }

      const allTags = new Set<string>();
      (data || []).forEach(entry => {
        (entry.tags || []).forEach(tag => allTags.add(tag));
      });

      return Array.from(allTags).sort();
    } catch (err) {
      logger.error('Error in getAllTags:', err);
      return [];
    }
  }

  /**
   * Generate a slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
