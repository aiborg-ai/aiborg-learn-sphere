import { logger } from '@/utils/logger';
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
import { sanitizeString, validateUUID, sanitizeHtml } from '@/utils/validation';
import { verifyDashboardOwnership, checkRateLimit } from '@/utils/authorization';
import { AppError, ERROR_CODES, withErrorHandling } from '@/utils/errorHandling';
import { audit } from '@/utils/auditLog';
import { SECURITY_CONFIG } from '@/config/security';

export class TemplateGalleryService {
  /**
   * Get templates from gallery with filters
   */
  static async getTemplates(
    filters: TemplateFilters = {},
    page: number = 1,
    pageSize: number = 12
  ): Promise<TemplateGalleryResponse> {
    return withErrorHandling(async () => {
      // Sanitize search query if provided
      const sanitizedSearch = filters.search
        ? sanitizeString(filters.search, SECURITY_CONFIG.MAX_SEARCH_QUERY_LENGTH)
        : undefined;

      // Limit page size
      const limitedPageSize = Math.min(pageSize, SECURITY_CONFIG.MAX_SEARCH_RESULTS);

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
        // Sanitize tags
        const sanitizedTags = filters.tags.map(tag =>
          sanitizeString(tag, SECURITY_CONFIG.MAX_TEMPLATE_TAG_LENGTH)
        );
        query = query.contains('tags', sanitizedTags);
      }

      if (sanitizedSearch) {
        query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
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
      const offset = (page - 1) * limitedPageSize;
      query = query.range(offset, offset + limitedPageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching templates:', error);
        throw new AppError(
          'Failed to fetch templates',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Transform data to include dashboard config
      const templates: DashboardTemplate[] = (data || []).map(
        (item: {
          creator?: { full_name?: string; avatar_url?: string };
          dashboard_view?: { config?: DashboardConfig };
          [key: string]: unknown;
        }) => ({
          ...item,
          creator_name: item.creator?.full_name,
          creator_avatar: item.creator?.avatar_url,
          dashboard_config: item.dashboard_view?.config,
        })
      );

      const pagination: TemplatePagination = {
        page,
        pageSize: limitedPageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitedPageSize),
      };

      return {
        templates,
        pagination,
        filters,
      };
    });
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
      logger.error('Error fetching template:', error);
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
    userId: string,
    options: {
      name?: string;
      description?: string;
      category: TemplateCategory;
      tags?: string[];
      previewImageUrl?: string;
    }
  ): Promise<DashboardTemplate> {
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(viewId) || !validateUUID(userId)) {
        throw new AppError(
          'Invalid ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'publishTemplate')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Verify ownership
      const ownsView = await verifyDashboardOwnership(viewId, userId);
      if (!ownsView) {
        throw new AppError(
          'You do not have permission to publish this dashboard',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      // Get the dashboard view
      const view = await DashboardConfigService.getView(viewId, userId);
      if (!view) {
        throw new AppError(
          'Dashboard view not found',
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.statusCode
        );
      }

      // Sanitize inputs
      const sanitizedName = sanitizeString(
        options.name || view.name,
        SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH
      );
      const sanitizedDescription = options.description
        ? sanitizeHtml(options.description, SECURITY_CONFIG.MAX_TEMPLATE_DESC_LENGTH)
        : null;

      // Sanitize and validate tags
      const sanitizedTags = (options.tags || [])
        .slice(0, SECURITY_CONFIG.MAX_TEMPLATE_TAGS)
        .map(tag => sanitizeString(tag, SECURITY_CONFIG.MAX_TEMPLATE_TAG_LENGTH))
        .filter(tag => tag.length > 0);

      // Mark view as public
      await DashboardConfigService.updateView(viewId, userId, { isPublic: true });

      // Create template
      const { data, error } = await supabase
        .from('shared_dashboard_templates')
        .insert({
          dashboard_view_id: viewId,
          creator_id: userId,
          name: sanitizedName,
          description: sanitizedDescription,
          category: options.category,
          tags: sanitizedTags,
          preview_image_url: options.previewImageUrl || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error publishing template:', error);
        throw new AppError(
          'Failed to publish template',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.templatePublished(userId, data.id, {
        templateName: sanitizedName,
        category: options.category,
      });

      return data;
    });
  }

  /**
   * Unpublish a template
   */
  static async unpublishTemplate(templateId: string, userId: string): Promise<void> {
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(templateId) || !validateUUID(userId)) {
        throw new AppError(
          'Invalid ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'unpublishTemplate')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Verify template exists and user owns it
      const { data: template } = await supabase
        .from('shared_dashboard_templates')
        .select('creator_id')
        .eq('id', templateId)
        .single();

      if (!template) {
        throw new AppError(
          'Template not found',
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.statusCode
        );
      }

      if (template.creator_id !== userId) {
        throw new AppError(
          'You do not have permission to unpublish this template',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      const { error } = await supabase
        .from('shared_dashboard_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        logger.error('Error unpublishing template:', error);
        throw new AppError(
          'Failed to unpublish template',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.templateUnpublished(userId, templateId);
    });
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
    const updateData: Partial<{
      name: string;
      description: string;
      category: TemplateCategory;
      tags: string[];
      preview_image_url: string;
    }> = {};
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
      logger.error('Error updating template:', error);
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
      return await withErrorHandling(async () => {
        // Validate inputs
        if (!validateUUID(templateId) || !validateUUID(userId)) {
          throw new AppError(
            'Invalid ID format',
            ERROR_CODES.INVALID_INPUT.code,
            ERROR_CODES.INVALID_INPUT.statusCode
          );
        }

        // Check rate limit
        if (!checkRateLimit(userId, 'cloneTemplate')) {
          throw new AppError(
            'Rate limit exceeded',
            ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
            ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
          );
        }

        // Get template
        const template = await this.getTemplate(templateId);
        if (!template) {
          throw new AppError(
            'Template not found',
            ERROR_CODES.NOT_FOUND.code,
            ERROR_CODES.NOT_FOUND.statusCode
          );
        }

        if (!template.dashboard_config) {
          throw new AppError(
            'Template has no configuration',
            ERROR_CODES.INVALID_INPUT.code,
            ERROR_CODES.INVALID_INPUT.statusCode
          );
        }

        // Sanitize new name
        const sanitizedName = sanitizeString(
          newName || `${template.name} (Copy)`,
          SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH
        );

        // Increment clone count
        await this.incrementCloneCount(templateId);

        // Create new view for user
        const view = await DashboardConfigService.createView(
          userId,
          sanitizedName,
          template.dashboard_config,
          {
            layoutType: template.dashboard_view_id ? 'grid' : 'grid',
          }
        );

        // Audit log
        await audit.templateCloned(userId, templateId);

        return {
          viewId: view.id,
          view,
          success: true,
          message: 'Template cloned successfully',
        };
      });
    } catch (error: unknown) {
      return {
        viewId: '',
        view: {} as DashboardView,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clone template',
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
      logger.error('Error incrementing view count:', error);
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
      logger.error('Error incrementing clone count:', error);
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
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(templateId) || !validateUUID(userId)) {
        throw new AppError(
          'Invalid ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new AppError(
          'Rating must be between 1 and 5',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'rateTemplate')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Sanitize review if provided
      const sanitizedReview = review
        ? sanitizeHtml(review, SECURITY_CONFIG.MAX_TEMPLATE_DESC_LENGTH)
        : null;

      const { data, error } = await supabase
        .from('dashboard_template_ratings')
        .upsert(
          {
            template_id: templateId,
            user_id: userId,
            rating,
            review: sanitizedReview,
          },
          {
            onConflict: 'template_id,user_id',
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Error rating template:', error);
        throw new AppError(
          'Failed to rate template',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.templateRated(userId, templateId, rating);

      return data;
    });
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
      logger.error('Error toggling favorite:', error);
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
      logger.error('Error fetching user rating:', error);
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
      logger.error('Error fetching favorites:', error);
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    return (data || []).map(
      (item: {
        template: {
          creator?: { full_name?: string; avatar_url?: string };
          dashboard_view?: { config?: DashboardConfig };
          [key: string]: unknown;
        };
      }) => ({
        ...item.template,
        creator_name: item.template.creator?.full_name,
        creator_avatar: item.template.creator?.avatar_url,
        dashboard_config: item.template.dashboard_view?.config,
        is_favorited: true,
      })
    );
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
      logger.error('Error fetching trending templates:', error);
      throw new Error(`Failed to fetch trending templates: ${error.message}`);
    }

    return (data || []).map(
      (item: {
        creator?: { full_name?: string; avatar_url?: string };
        dashboard_view?: { config?: DashboardConfig };
        [key: string]: unknown;
      }) => ({
        ...item,
        creator_name: item.creator?.full_name,
        creator_avatar: item.creator?.avatar_url,
        dashboard_config: item.dashboard_view?.config,
      })
    );
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
      logger.error('Error fetching featured templates:', error);
      throw new Error(`Failed to fetch featured templates: ${error.message}`);
    }

    return (data || []).map(
      (item: {
        creator?: { full_name?: string; avatar_url?: string };
        dashboard_view?: { config?: DashboardConfig };
        [key: string]: unknown;
      }) => ({
        ...item,
        creator_name: item.creator?.full_name,
        creator_avatar: item.creator?.avatar_url,
        dashboard_config: item.dashboard_view?.config,
      })
    );
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
      logger.error('Error fetching tags:', error);
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
