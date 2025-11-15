/**
 * Template Gallery Service
 *
 * Handles template publishing, browsing, rating, and cloning functionality.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DashboardTemplate,
  TemplateRating,
  TemplateFilters,
  TemplatePagination,
  TemplateGalleryResponse,
  TemplateCategory,
  CloneTemplateResult,
} from '@/types/dashboard';
import { DashboardConfigService } from './DashboardConfigService';

export class TemplateGalleryService {
  /**
   * Get templates from gallery with filters
   */
  static async getTemplates(
    filters: TemplateFilters = {},
    page: number = 1,
    pageSize: number = 12
  ): Promise<TemplateGalleryResponse> {
    let query = supabase
      .from('shared_dashboard_templates')
      .select(
        `
        *,
        dashboard_view:custom_dashboard_views!inner(*),
        creator:profiles!creator_id(full_name, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('is_approved', true);

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.minRating) {
      query = query.gte('average_rating', filters.minRating);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('clone_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'featured':
        query = query.order('is_featured', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    // Transform data to include dashboard config
    const templates: DashboardTemplate[] = (data || []).map((item: any) => ({
      ...item,
      creator_name: item.creator?.full_name,
      creator_avatar: item.creator?.avatar_url,
      dashboard_config: item.dashboard_view?.config,
    }));

    const pagination: TemplatePagination = {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    };

    return {
      templates,
      pagination,
      filters,
    };
  }

  /**
   * Get a single template by ID
   */
  static async getTemplate(templateId: string): Promise<DashboardTemplate | null> {
    const { data, error } = await supabase
      .from('shared_dashboard_templates')
      .select(
        `
        *,
        dashboard_view:custom_dashboard_views!inner(*),
        creator:profiles!creator_id(full_name, avatar_url)
      `
      )
      .eq('id', templateId)
      .eq('is_approved', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching template:', error);
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    return {
      ...data,
      creator_name: data.creator?.full_name,
      creator_avatar: data.creator?.avatar_url,
      dashboard_config: data.dashboard_view?.config,
    };
  }

  /**
   * Publish a dashboard view as a template
   */
  static async publishTemplate(
    viewId: string,
    options: {
      name?: string;
      description?: string;
      category: TemplateCategory;
      tags?: string[];
      previewImageUrl?: string;
    }
  ): Promise<DashboardTemplate> {
    // Get the dashboard view
    const view = await DashboardConfigService.getView(viewId);
    if (!view) {
      throw new Error('Dashboard view not found');
    }

    // Mark view as public
    await DashboardConfigService.updateView(viewId, { isPublic: true });

    // Create template
    const { data, error } = await supabase
      .from('shared_dashboard_templates')
      .insert({
        dashboard_view_id: viewId,
        creator_id: view.user_id,
        name: options.name || view.name,
        description: options.description || null,
        category: options.category,
        tags: options.tags || [],
        preview_image_url: options.previewImageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error publishing template:', error);
      throw new Error(`Failed to publish template: ${error.message}`);
    }

    return data;
  }

  /**
   * Unpublish a template
   */
  static async unpublishTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('shared_dashboard_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error unpublishing template:', error);
      throw new Error(`Failed to unpublish template: ${error.message}`);
    }
  }

  /**
   * Update template metadata
   */
  static async updateTemplate(
    templateId: string,
    updates: {
      name?: string;
      description?: string;
      category?: TemplateCategory;
      tags?: string[];
      previewImageUrl?: string;
    }
  ): Promise<DashboardTemplate> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.previewImageUrl !== undefined)
      updateData.preview_image_url = updates.previewImageUrl;

    const { data, error } = await supabase
      .from('shared_dashboard_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data;
  }

  /**
   * Clone a template to user's dashboard views
   */
  static async cloneTemplate(
    templateId: string,
    userId: string,
    newName?: string
  ): Promise<CloneTemplateResult> {
    try {
      // Get template
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.dashboard_config) {
        throw new Error('Template has no configuration');
      }

      // Increment clone count
      await this.incrementCloneCount(templateId);

      // Create new view for user
      const view = await DashboardConfigService.createView(
        userId,
        newName || `${template.name} (Copy)`,
        template.dashboard_config,
        {
          layoutType: template.dashboard_view_id ? 'grid' : 'grid',
        }
      );

      return {
        viewId: view.id,
        view,
        success: true,
        message: 'Template cloned successfully',
      };
    } catch (error: any) {
      return {
        viewId: '',
        view: {} as any,
        success: false,
        message: error.message || 'Failed to clone template',
      };
    }
  }

  /**
   * Increment template view count
   */
  static async incrementViewCount(templateId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_template_view_count', {
      template_uuid: templateId,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Increment template clone count
   */
  static async incrementCloneCount(templateId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_template_clone_count', {
      template_uuid: templateId,
    });

    if (error) {
      console.error('Error incrementing clone count:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Rate a template
   */
  static async rateTemplate(
    templateId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<TemplateRating> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data, error } = await supabase
      .from('dashboard_template_ratings')
      .upsert(
        {
          template_id: templateId,
          user_id: userId,
          rating,
          review: review || null,
        },
        {
          onConflict: 'template_id,user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error rating template:', error);
      throw new Error(`Failed to rate template: ${error.message}`);
    }

    return data;
  }

  /**
   * Toggle template favorite
   */
  static async toggleFavorite(
    templateId: string,
    userId: string,
    isFavorite: boolean
  ): Promise<TemplateRating> {
    const { data, error } = await supabase
      .from('dashboard_template_ratings')
      .upsert(
        {
          template_id: templateId,
          user_id: userId,
          is_favorite: isFavorite,
          rating: 5, // Default rating if not rated yet
        },
        {
          onConflict: 'template_id,user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error toggling favorite:', error);
      throw new Error(`Failed to toggle favorite: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's rating for a template
   */
  static async getUserRating(templateId: string, userId: string): Promise<TemplateRating | null> {
    const { data, error } = await supabase
      .from('dashboard_template_ratings')
      .select('*')
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user rating:', error);
      throw new Error(`Failed to fetch user rating: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's favorite templates
   */
  static async getUserFavorites(userId: string): Promise<DashboardTemplate[]> {
    const { data, error } = await supabase
      .from('dashboard_template_ratings')
      .select(
        `
        template:shared_dashboard_templates!inner(
          *,
          dashboard_view:custom_dashboard_views!inner(*),
          creator:profiles!creator_id(full_name, avatar_url)
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_favorite', true);

    if (error) {
      console.error('Error fetching favorites:', error);
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item.template,
      creator_name: item.template.creator?.full_name,
      creator_avatar: item.template.creator?.avatar_url,
      dashboard_config: item.template.dashboard_view?.config,
      is_favorited: true,
    }));
  }

  /**
   * Get trending templates (most cloned recently)
   */
  static async getTrendingTemplates(limit: number = 6): Promise<DashboardTemplate[]> {
    const { data, error } = await supabase
      .from('shared_dashboard_templates')
      .select(
        `
        *,
        dashboard_view:custom_dashboard_views!inner(*),
        creator:profiles!creator_id(full_name, avatar_url)
      `
      )
      .eq('is_approved', true)
      .order('clone_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending templates:', error);
      throw new Error(`Failed to fetch trending templates: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      creator_name: item.creator?.full_name,
      creator_avatar: item.creator?.avatar_url,
      dashboard_config: item.dashboard_view?.config,
    }));
  }

  /**
   * Get featured templates
   */
  static async getFeaturedTemplates(limit: number = 6): Promise<DashboardTemplate[]> {
    const { data, error } = await supabase
      .from('shared_dashboard_templates')
      .select(
        `
        *,
        dashboard_view:custom_dashboard_views!inner(*),
        creator:profiles!creator_id(full_name, avatar_url)
      `
      )
      .eq('is_approved', true)
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured templates:', error);
      throw new Error(`Failed to fetch featured templates: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      creator_name: item.creator?.full_name,
      creator_avatar: item.creator?.avatar_url,
      dashboard_config: item.dashboard_view?.config,
    }));
  }

  /**
   * Get all available template categories
   */
  static getCategories(): TemplateCategory[] {
    return ['student', 'instructor', 'professional', 'analytics', 'productivity', 'general'];
  }

  /**
   * Get popular tags
   */
  static async getPopularTags(limit: number = 20): Promise<string[]> {
    const { data, error } = await supabase
      .from('shared_dashboard_templates')
      .select('tags')
      .eq('is_approved', true);

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    // Flatten and count tags
    const tagCounts = new Map<string, number>();
    data.forEach(item => {
      (item.tags || []).forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort by count and return top tags
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}

export default TemplateGalleryService;
