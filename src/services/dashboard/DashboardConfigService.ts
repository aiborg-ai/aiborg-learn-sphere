import { logger } from '@/utils/logger';
/**
 * Dashboard Configuration Service
 *
 * Handles CRUD operations for dashboard configurations, views, and layouts.
 * Extends the existing CustomViewsService with dashboard-specific functionality.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DashboardView,
  DashboardConfig,
  DashboardWidget,
  LayoutType,
  ThemeConfig,
} from '@/types/dashboard';
import { sanitizeString, validateUUID } from '@/utils/validation';
import { validateDashboardConfig } from './validation';
import { verifyDashboardOwnership, checkRateLimit } from '@/utils/authorization';
import { AppError, ERROR_CODES, withErrorHandling } from '@/utils/errorHandling';
import { audit } from '@/utils/auditLog';
import { SECURITY_CONFIG } from '@/config/security';

export class DashboardConfigService {
  /**
   * Get all dashboard views for a user
   */
  static async getUserViews(userId: string): Promise<DashboardView[]> {
    return withErrorHandling(async () => {
      // Validate UUID
      if (!validateUUID(userId)) {
        throw new AppError(
          'Invalid user ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'getUserViews')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching dashboard views:', error);
        throw new AppError(
          'Failed to fetch dashboard views',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      return data || [];
    });
  }

  /**
   * Get a specific dashboard view by ID
   */
  static async getView(viewId: string, userId?: string): Promise<DashboardView | null> {
    return withErrorHandling(async () => {
      // Validate UUID
      if (!validateUUID(viewId)) {
        throw new AppError(
          'Invalid view ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .select('*')
        .eq('id', viewId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error('Error fetching dashboard view:', error);
        throw new AppError(
          'Failed to fetch dashboard view',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Verify ownership if userId provided
      if (userId && data.user_id !== userId) {
        throw new AppError(
          'You do not have permission to access this dashboard',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      return data;
    });
  }

  /**
   * Get the user's default dashboard view
   */
  static async getDefaultView(userId: string): Promise<DashboardView | null> {
    const { data, error } = await supabase
      .from('custom_dashboard_views')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No default view found
        return null;
      }
      logger.error('Error fetching default view:', error);
      throw new Error(`Failed to fetch default view: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new dashboard view
   */
  static async createView(
    userId: string,
    name: string,
    config: DashboardConfig,
    options?: {
      isDefault?: boolean;
      isPublic?: boolean;
      layoutType?: LayoutType;
      themeConfig?: ThemeConfig;
    }
  ): Promise<DashboardView> {
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(userId)) {
        throw new AppError(
          'Invalid user ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'createView')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Sanitize name
      const sanitizedName = sanitizeString(name, SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH);
      if (!sanitizedName) {
        throw new AppError(
          'Dashboard name is required',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Validate dashboard config
      const validation = validateDashboardConfig(config);
      if (!validation.isValid) {
        throw new AppError(
          `Invalid dashboard configuration: ${validation.errors.join(', ')}`,
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Validate max views per user
      const existingViews = await this.getUserViews(userId);
      if (existingViews.length >= SECURITY_CONFIG.MAX_DASHBOARD_VIEWS_PER_USER) {
        throw new AppError(
          `Maximum number of dashboard views (${SECURITY_CONFIG.MAX_DASHBOARD_VIEWS_PER_USER}) reached`,
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      // If setting as default, unset other defaults first
      if (options?.isDefault) {
        await this.unsetAllDefaults(userId);
      }

      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .insert({
          user_id: userId,
          name: sanitizedName,
          config: validation.sanitizedConfig || config,
          is_default: options?.isDefault || false,
          is_public: options?.isPublic || false,
          layout_type: options?.layoutType || 'grid',
          theme_config: options?.themeConfig || {},
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating dashboard view:', error);
        throw new AppError(
          'Failed to create dashboard view',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.dashboardCreated(userId, data.id);

      return data;
    });
  }

  /**
   * Update an existing dashboard view
   */
  static async updateView(
    viewId: string,
    userId: string,
    updates: {
      name?: string;
      config?: DashboardConfig;
      isDefault?: boolean;
      isPublic?: boolean;
      layoutType?: LayoutType;
      themeConfig?: ThemeConfig;
    }
  ): Promise<DashboardView> {
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
      if (!checkRateLimit(userId, 'updateView')) {
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
          'You do not have permission to update this dashboard',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      const updateData: any = {};

      // Sanitize name if provided
      if (updates.name !== undefined) {
        const sanitizedName = sanitizeString(
          updates.name,
          SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH
        );
        if (!sanitizedName) {
          throw new AppError(
            'Dashboard name cannot be empty',
            ERROR_CODES.INVALID_INPUT.code,
            ERROR_CODES.INVALID_INPUT.statusCode
          );
        }
        updateData.name = sanitizedName;
      }

      // Validate config if provided
      if (updates.config !== undefined) {
        const validation = validateDashboardConfig(updates.config);
        if (!validation.isValid) {
          throw new AppError(
            `Invalid dashboard configuration: ${validation.errors.join(', ')}`,
            ERROR_CODES.INVALID_INPUT.code,
            ERROR_CODES.INVALID_INPUT.statusCode
          );
        }
        updateData.config = validation.sanitizedConfig || updates.config;
      }

      // If setting as default, unset other defaults first
      if (updates.isDefault) {
        await this.unsetAllDefaults(userId);
        updateData.is_default = true;
      }

      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.layoutType !== undefined) updateData.layout_type = updates.layoutType;
      if (updates.themeConfig !== undefined) updateData.theme_config = updates.themeConfig;

      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .update(updateData)
        .eq('id', viewId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating dashboard view:', error);
        throw new AppError(
          'Failed to update dashboard view',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.dashboardUpdated(userId, viewId, updateData);

      return data;
    });
  }

  /**
   * Delete a dashboard view
   */
  static async deleteView(viewId: string, userId: string): Promise<void> {
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
      if (!checkRateLimit(userId, 'deleteView')) {
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
          'You do not have permission to delete this dashboard',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      const { error } = await supabase.from('custom_dashboard_views').delete().eq('id', viewId);

      if (error) {
        logger.error('Error deleting dashboard view:', error);
        throw new AppError(
          'Failed to delete dashboard view',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.dashboardDeleted(userId, viewId);
    });
  }

  /**
   * Duplicate a dashboard view
   */
  static async duplicateView(viewId: string, newName?: string): Promise<DashboardView> {
    const originalView = await this.getView(viewId);
    if (!originalView) {
      throw new Error('Dashboard view not found');
    }

    const name = newName || `${originalView.name} (Copy)`;

    return this.createView(originalView.user_id, name, originalView.config, {
      layoutType: originalView.layout_type,
      themeConfig: originalView.theme_config,
      isDefault: false, // Copies are never default
      isPublic: false, // Copies are private by default
    });
  }

  /**
   * Set a view as the default
   */
  static async setAsDefault(viewId: string): Promise<DashboardView> {
    return this.updateView(viewId, { isDefault: true });
  }

  /**
   * Unset all default views for a user
   */
  private static async unsetAllDefaults(userId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_dashboard_views')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) {
      logger.error('Error unsetting default views:', error);
      throw new Error(`Failed to unset default views: ${error.message}`);
    }
  }

  /**
   * Add a widget to a view
   */
  static async addWidget(viewId: string, widget: DashboardWidget): Promise<DashboardView> {
    const view = await this.getView(viewId);
    if (!view) {
      throw new Error('Dashboard view not found');
    }

    const config = view.config as DashboardConfig;
    const updatedConfig: DashboardConfig = {
      ...config,
      widgets: [...(config.widgets || []), widget],
    };

    return this.updateView(viewId, { config: updatedConfig });
  }

  /**
   * Remove a widget from a view
   */
  static async removeWidget(viewId: string, widgetId: string): Promise<DashboardView> {
    const view = await this.getView(viewId);
    if (!view) {
      throw new Error('Dashboard view not found');
    }

    const config = view.config as DashboardConfig;
    const updatedConfig: DashboardConfig = {
      ...config,
      widgets: (config.widgets || []).filter(w => w.id !== widgetId),
    };

    return this.updateView(viewId, { config: updatedConfig });
  }

  /**
   * Update a widget in a view
   */
  static async updateWidget(
    viewId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<DashboardView> {
    const view = await this.getView(viewId);
    if (!view) {
      throw new Error('Dashboard view not found');
    }

    const config = view.config as DashboardConfig;
    const updatedConfig: DashboardConfig = {
      ...config,
      widgets: (config.widgets || []).map(w => (w.id === widgetId ? { ...w, ...updates } : w)),
    };

    return this.updateView(viewId, { config: updatedConfig });
  }

  /**
   * Reorder widgets in a view
   */
  static async reorderWidgets(viewId: string, widgets: DashboardWidget[]): Promise<DashboardView> {
    const view = await this.getView(viewId);
    if (!view) {
      throw new Error('Dashboard view not found');
    }

    const config = view.config as DashboardConfig;
    const updatedConfig: DashboardConfig = {
      ...config,
      widgets,
    };

    return this.updateView(viewId, { config: updatedConfig });
  }

  /**
   * Get public dashboard views (for gallery)
   */
  static async getPublicViews(options?: {
    limit?: number;
    offset?: number;
  }): Promise<DashboardView[]> {
    let query = supabase
      .from('custom_dashboard_views')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching public views:', error);
      throw new Error(`Failed to fetch public views: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Validate dashboard configuration
   */
  static validateConfig(config: DashboardConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if widgets exist
    if (!config.widgets) {
      errors.push('Widgets array is required');
    }

    // Validate each widget
    if (config.widgets) {
      config.widgets.forEach((widget, index) => {
        if (!widget.id) {
          errors.push(`Widget at index ${index} is missing an ID`);
        }
        if (!widget.type) {
          errors.push(`Widget at index ${index} is missing a type`);
        }
        if (!widget.position) {
          errors.push(`Widget at index ${index} is missing position`);
        }
        if (!widget.size) {
          errors.push(`Widget at index ${index} is missing size`);
        }

        // Validate size constraints
        if (widget.size) {
          if (widget.size.width < 1 || widget.size.width > 12) {
            errors.push(`Widget ${widget.id} has invalid width (must be 1-12)`);
          }
          if (widget.size.height < 1 || widget.size.height > 8) {
            errors.push(`Widget ${widget.id} has invalid height (must be 1-8)`);
          }
        }

        // Validate position
        if (widget.position) {
          if (widget.position.col < 0 || widget.position.col >= 12) {
            errors.push(`Widget ${widget.id} has invalid column position`);
          }
          if (widget.position.row < 0) {
            errors.push(`Widget ${widget.id} has invalid row position`);
          }
        }
      });

      // Check for overlaps
      const overlaps = this.detectOverlaps(config.widgets);
      if (overlaps.length > 0) {
        errors.push(`Detected ${overlaps.length} widget overlaps`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect overlapping widgets
   */
  private static detectOverlaps(widgets: DashboardWidget[]): string[] {
    const overlaps: string[] = [];

    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        const w1 = widgets[i];
        const w2 = widgets[j];

        const w1Right = w1.position.col + w1.size.width;
        const w1Bottom = w1.position.row + w1.size.height;
        const w2Right = w2.position.col + w2.size.width;
        const w2Bottom = w2.position.row + w2.size.height;

        const overlapsHorizontally = w1.position.col < w2Right && w1Right > w2.position.col;
        const overlapsVertically = w1.position.row < w2Bottom && w1Bottom > w2.position.row;

        if (overlapsHorizontally && overlapsVertically) {
          overlaps.push(`Widgets ${w1.id} and ${w2.id} overlap`);
        }
      }
    }

    return overlaps;
  }

  /**
   * Get suggested position for a new widget
   */
  static getSuggestedPosition(
    widgets: DashboardWidget[],
    widgetSize: { width: number; height: number }
  ): { row: number; col: number } | null {
    const gridCols = 12;
    let row = 0;
    let maxRow = 0;

    // Find the maximum row used
    widgets.forEach(w => {
      const bottom = w.position.row + w.size.height;
      if (bottom > maxRow) maxRow = bottom;
    });

    // Try to find a position row by row
    for (row = 0; row <= maxRow + 1; row++) {
      for (let col = 0; col <= gridCols - widgetSize.width; col++) {
        const testPosition = { row, col };
        const _testWidget: DashboardWidget = {
          id: 'test',
          type: 'stats',
          position: testPosition,
          size: widgetSize,
          config: {},
        };

        // Check if this position would overlap with existing widgets
        let hasOverlap = false;
        for (const existing of widgets) {
          const testRight = testPosition.col + widgetSize.width;
          const testBottom = testPosition.row + widgetSize.height;
          const existingRight = existing.position.col + existing.size.width;
          const existingBottom = existing.position.row + existing.size.height;

          const overlapsHorizontally =
            testPosition.col < existingRight && testRight > existing.position.col;
          const overlapsVertically =
            testPosition.row < existingBottom && testBottom > existing.position.row;

          if (overlapsHorizontally && overlapsVertically) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) {
          return testPosition;
        }
      }
    }

    return null;
  }
}

export default DashboardConfigService;
