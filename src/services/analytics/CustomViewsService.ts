/**
 * Custom Views Service
 * Manages custom dashboard view configurations for users
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface CustomView {
  id: string;
  userId: string;
  name: string;
  config: ViewConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewConfig {
  dateRange: {
    start: string;
    end: string;
    preset?: string; // e.g., 'last7days', 'last30days', 'last90days', 'custom'
  };
  activeTab: string; // e.g., 'overview', 'revenue', 'users', 'courses', 'chatbot', 'teams'
  visibleMetrics: string[]; // Array of metric IDs that should be visible
  autoRefresh: {
    enabled: boolean;
    interval: number; // In milliseconds (e.g., 60000 for 1 minute)
  };
}

export class CustomViewsService {
  /**
   * Maximum number of views per user (enforced by database trigger)
   */
  private static readonly MAX_VIEWS_PER_USER = 10;

  /**
   * Get all custom views for a user
   * @param userId - User ID to fetch views for
   * @returns Array of custom views (RLS automatically filters by user)
   */
  static async getViews(userId: string): Promise<CustomView[]> {
    try {
      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform database records to CustomView objects
      const views: CustomView[] = (data || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        name: record.view_name,
        config: record.view_config as ViewConfig,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      }));

      logger.info('Fetched custom views', { userId, count: views.length });

      return views;
    } catch (error) {
      logger.error('Error fetching custom views:', error);
      throw new Error(`Failed to fetch custom views: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific custom view by ID
   * @param viewId - View ID to fetch
   * @returns Custom view or null if not found
   */
  static async getView(viewId: string): Promise<CustomView | null> {
    try {
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
        throw error;
      }

      const view: CustomView = {
        id: data.id,
        userId: data.user_id,
        name: data.view_name,
        config: data.view_config as ViewConfig,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      logger.info('Fetched custom view', { viewId, name: view.name });

      return view;
    } catch (error) {
      logger.error('Error fetching custom view:', error);
      throw new Error(`Failed to fetch custom view: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new custom view
   * @param userId - User ID creating the view
   * @param name - Name for the view
   * @param config - View configuration
   * @returns Created custom view
   */
  static async createView(
    userId: string,
    name: string,
    config: ViewConfig
  ): Promise<CustomView> {
    try {
      // Validate name
      if (!name || name.trim().length === 0) {
        throw new Error('View name is required');
      }

      if (name.length > 100) {
        throw new Error('View name must be 100 characters or less');
      }

      // Check for duplicate names
      const existingViews = await this.getViews(userId);
      const duplicate = existingViews.find(
        v => v.name.toLowerCase() === name.toLowerCase()
      );

      if (duplicate) {
        throw new Error(`A view named "${name}" already exists. Please choose a different name.`);
      }

      // Check view limit
      if (existingViews.length >= this.MAX_VIEWS_PER_USER) {
        throw new Error(
          `Maximum of ${this.MAX_VIEWS_PER_USER} views allowed per user. Please delete an existing view before creating a new one.`
        );
      }

      // Validate config
      this.validateViewConfig(config);

      // Insert new view
      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .insert({
          user_id: userId,
          view_name: name.trim(),
          view_config: config,
        })
        .select()
        .single();

      if (error) {
        // Check for trigger-enforced limit
        if (error.message?.includes('maximum of 10 views')) {
          throw new Error(
            `Maximum of ${this.MAX_VIEWS_PER_USER} views allowed. Please delete an existing view first.`
          );
        }
        throw error;
      }

      const view: CustomView = {
        id: data.id,
        userId: data.user_id,
        name: data.view_name,
        config: data.view_config as ViewConfig,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      logger.info('Created custom view', { viewId: view.id, name: view.name, userId });

      return view;
    } catch (error) {
      logger.error('Error creating custom view:', error);
      throw error instanceof Error ? error : new Error('Failed to create custom view');
    }
  }

  /**
   * Update an existing custom view
   * @param viewId - View ID to update
   * @param name - Optional new name
   * @param config - Optional new configuration
   * @returns Updated custom view
   */
  static async updateView(
    viewId: string,
    name?: string,
    config?: ViewConfig
  ): Promise<CustomView> {
    try {
      // Validate at least one field is provided
      if (!name && !config) {
        throw new Error('Either name or config must be provided for update');
      }

      // Build update object
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) {
        if (name.trim().length === 0) {
          throw new Error('View name cannot be empty');
        }
        if (name.length > 100) {
          throw new Error('View name must be 100 characters or less');
        }
        updates.view_name = name.trim();
      }

      if (config !== undefined) {
        this.validateViewConfig(config);
        updates.view_config = config;
      }

      // Update view (RLS ensures user owns the view)
      const { data, error } = await supabase
        .from('custom_dashboard_views')
        .update(updates)
        .eq('id', viewId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('View not found or you do not have permission to update it');
        }
        throw error;
      }

      const view: CustomView = {
        id: data.id,
        userId: data.user_id,
        name: data.view_name,
        config: data.view_config as ViewConfig,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      logger.info('Updated custom view', { viewId, name: view.name });

      return view;
    } catch (error) {
      logger.error('Error updating custom view:', error);
      throw error instanceof Error ? error : new Error('Failed to update custom view');
    }
  }

  /**
   * Delete a custom view
   * @param viewId - View ID to delete
   */
  static async deleteView(viewId: string): Promise<void> {
    try {
      // Delete view (RLS ensures user owns the view)
      const { error } = await supabase
        .from('custom_dashboard_views')
        .delete()
        .eq('id', viewId);

      if (error) {
        throw error;
      }

      logger.info('Deleted custom view', { viewId });
    } catch (error) {
      logger.error('Error deleting custom view:', error);
      throw new Error(`Failed to delete custom view: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate view configuration
   * @param config - View configuration to validate
   */
  private static validateViewConfig(config: ViewConfig): void {
    // Validate date range
    if (!config.dateRange || !config.dateRange.start || !config.dateRange.end) {
      throw new Error('Date range with start and end dates is required');
    }

    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format in date range');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date');
    }

    // Validate active tab
    if (!config.activeTab || config.activeTab.trim().length === 0) {
      throw new Error('Active tab is required');
    }

    // Validate visible metrics
    if (!Array.isArray(config.visibleMetrics)) {
      throw new Error('Visible metrics must be an array');
    }

    // Validate auto-refresh
    if (!config.autoRefresh || typeof config.autoRefresh.enabled !== 'boolean') {
      throw new Error('Auto-refresh configuration is required');
    }

    if (config.autoRefresh.enabled && typeof config.autoRefresh.interval !== 'number') {
      throw new Error('Auto-refresh interval must be a number when enabled');
    }

    if (config.autoRefresh.enabled && config.autoRefresh.interval < 30000) {
      throw new Error('Auto-refresh interval must be at least 30 seconds (30000ms)');
    }

    if (config.autoRefresh.enabled && config.autoRefresh.interval > 3600000) {
      throw new Error('Auto-refresh interval must be at most 1 hour (3600000ms)');
    }
  }

  /**
   * Get default view configuration
   * @returns Default view configuration
   */
  static getDefaultConfig(): ViewConfig {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      dateRange: {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        preset: 'last30days',
      },
      activeTab: 'overview',
      visibleMetrics: [],
      autoRefresh: {
        enabled: false,
        interval: 300000, // 5 minutes
      },
    };
  }
}
