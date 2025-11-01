/**
 * Vault Content Service
 *
 * Handles vault content operations including:
 * - Content retrieval and filtering
 * - Access logging
 * - Bookmarks
 * - User statistics
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  VaultContent,
  VaultContentFilters,
  UserVaultBookmark,
  UserVaultStats,
  CreateVaultContentParams,
} from './types';

export class VaultContentService {
  // ============================================================================
  // CONTENT RETRIEVAL
  // ============================================================================

  /**
   * Get all published vault content with optional filters
   */
  static async getVaultContent(filters?: VaultContentFilters): Promise<VaultContent[]> {
    let query = supabase.from('vault_content').select('*').eq('is_published', true);

    // Apply filters
    if (filters?.content_type) {
      query = query.eq('content_type', filters.content_type);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.featured_only) {
      query = query.not('featured_order', 'is', null).order('featured_order');
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get vault content by slug
   */
  static async getVaultContentBySlug(slug: string): Promise<VaultContent | null> {
    const { data, error } = await supabase
      .from('vault_content')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Get featured vault content
   */
  static async getFeaturedContent(limit: number = 6): Promise<VaultContent[]> {
    const { data, error } = await supabase
      .from('vault_content')
      .select('*')
      .eq('is_published', true)
      .not('featured_order', 'is', null)
      .order('featured_order')
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent vault content
   */
  static async getRecentVaultContent(limit: number = 10): Promise<VaultContent[]> {
    const { data, error } = await supabase
      .from('vault_content')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get vault content by category
   */
  static async getVaultContentByCategory(category: string): Promise<VaultContent[]> {
    return this.getVaultContent({ category });
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('vault_content')
      .select('category')
      .eq('is_published', true);

    if (error) throw error;

    // Get unique categories
    const categories = Array.from(new Set(data?.map(item => item.category) || []));
    return categories.sort();
  }

  /**
   * Get all unique tags
   */
  static async getTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('vault_content')
      .select('tags')
      .eq('is_published', true);

    if (error) throw error;

    // Flatten and get unique tags
    const allTags = data?.flatMap(item => item.tags || []) || [];
    const uniqueTags = Array.from(new Set(allTags));
    return uniqueTags.sort();
  }

  // ============================================================================
  // ACCESS LOGGING
  // ============================================================================

  /**
   * Log content view
   */
  static async logView(contentId: string, watchPercentage?: number): Promise<void> {
    const { error } = await supabase.rpc('log_vault_content_access', {
      p_content_id: contentId,
      p_action_type: 'view',
      p_watch_percentage: watchPercentage,
    });

    if (error) throw error;
  }

  /**
   * Log content download
   */
  static async logDownload(contentId: string): Promise<void> {
    const { error } = await supabase.rpc('log_vault_content_access', {
      p_content_id: contentId,
      p_action_type: 'download',
    });

    if (error) throw error;
  }

  /**
   * Log content bookmark
   */
  static async logBookmark(contentId: string): Promise<void> {
    const { error } = await supabase.rpc('log_vault_content_access', {
      p_content_id: contentId,
      p_action_type: 'bookmark',
    });

    if (error) throw error;
  }

  // ============================================================================
  // BOOKMARKS
  // ============================================================================

  /**
   * Add content to bookmarks
   */
  static async addBookmark(contentId: string, notes?: string): Promise<UserVaultBookmark> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_vault_bookmarks')
      .insert({
        user_id: user.id,
        content_id: contentId,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Log bookmark action
    await this.logBookmark(contentId);

    return data;
  }

  /**
   * Remove content from bookmarks
   */
  static async removeBookmark(contentId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_vault_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', contentId);

    if (error) throw error;
  }

  /**
   * Update bookmark notes
   */
  static async updateBookmarkNotes(contentId: string, notes: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_vault_bookmarks')
      .update({ notes })
      .eq('user_id', user.id)
      .eq('content_id', contentId);

    if (error) throw error;
  }

  /**
   * Get user's bookmarks
   */
  static async getUserBookmarks(): Promise<UserVaultBookmark[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from('user_vault_bookmarks')
      .select(
        `
        *,
        content:vault_content(*)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if content is bookmarked
   */
  static async isBookmarked(contentId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('user_vault_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return !!data;
  }

  // ============================================================================
  // USER STATISTICS
  // ============================================================================

  /**
   * Get user's vault statistics
   */
  static async getUserVaultStats(): Promise<UserVaultStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        total_views: 0,
        total_downloads: 0,
        total_bookmarks: 0,
        unique_content_viewed: 0,
        hours_watched: 0,
      };
    }

    const { data, error } = await supabase.rpc('get_user_vault_stats', {
      p_user_id: user.id,
    });

    if (error) throw error;

    return (
      data[0] || {
        total_views: 0,
        total_downloads: 0,
        total_bookmarks: 0,
        unique_content_viewed: 0,
        hours_watched: 0,
      }
    );
  }

  /**
   * Get user's viewing history
   */
  static async getViewingHistory(limit: number = 20): Promise<VaultContent[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Get unique content IDs from access log
    const { data: accessLog, error: logError } = await supabase
      .from('vault_content_access_log')
      .select('content_id')
      .eq('user_id', user.id)
      .eq('action_type', 'view')
      .order('accessed_at', { ascending: false })
      .limit(limit);

    if (logError) throw logError;

    const contentIds = Array.from(new Set(accessLog?.map(log => log.content_id) || []));

    if (contentIds.length === 0) return [];

    // Get content details
    const { data, error } = await supabase.from('vault_content').select('*').in('id', contentIds);

    if (error) throw error;

    return data || [];
  }

  // ============================================================================
  // ADMIN/CONTENT CREATION (For content management)
  // ============================================================================

  /**
   * Create vault content (admin only)
   */
  static async createVaultContent(params: CreateVaultContentParams): Promise<VaultContent> {
    const { data, error } = await supabase.from('vault_content').insert(params).select().single();

    if (error) throw error;

    return data;
  }

  /**
   * Update vault content (admin only)
   */
  static async updateVaultContent(
    id: string,
    updates: Partial<VaultContent>
  ): Promise<VaultContent> {
    const { data, error } = await supabase
      .from('vault_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete vault content (admin only)
   */
  static async deleteVaultContent(id: string): Promise<void> {
    const { error } = await supabase.from('vault_content').delete().eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Format duration for display
   */
  static formatDuration(minutes: number | null): string {
    if (!minutes) return 'N/A';

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  /**
   * Get content type icon
   */
  static getContentTypeIcon(contentType: string): string {
    const icons: Record<string, string> = {
      video: 'video',
      article: 'file-text',
      worksheet: 'file-edit',
      template: 'file-code',
      tool: 'wrench',
      webinar: 'presentation',
      case_study: 'briefcase',
      guide: 'book-open',
    };

    return icons[contentType] || 'file';
  }

  /**
   * Get difficulty level color
   */
  static getDifficultyColor(level: string | null): string {
    const colors: Record<string, string> = {
      beginner: 'green',
      intermediate: 'yellow',
      advanced: 'red',
    };

    return colors[level || ''] || 'gray';
  }
}
