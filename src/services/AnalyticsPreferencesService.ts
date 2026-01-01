/**
 * Analytics Preferences Service
 * Manages user preferences for analytics real-time and auto-refresh settings
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AnalyticsPreferences, AnalyticsPreferencesUpdate } from '@/types';

export class AnalyticsPreferencesService {
  /**
   * Get analytics preferences for a user
   * Creates default preferences if they don't exist
   */
  static async getPreferences(userId: string): Promise<AnalyticsPreferences> {
    try {
      logger.info('Fetching analytics preferences', { userId });

      const { data, error } = await supabase
        .from('analytics_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences exist, create defaults
        if (error.code === 'PGRST116') {
          logger.info('No preferences found, creating defaults', { userId });
          return await this.createDefaultPreferences(userId);
        }
        throw error;
      }

      return data;
    } catch (_error) {
      logger.error('Error fetching analytics preferences:', _error);
      throw error;
    }
  }

  /**
   * Update analytics preferences for a user
   */
  static async updatePreferences(
    userId: string,
    updates: AnalyticsPreferencesUpdate
  ): Promise<AnalyticsPreferences> {
    try {
      logger.info('Updating analytics preferences', { userId, updates });

      // Validate refresh interval if provided
      if (updates.auto_refresh_interval !== undefined) {
        if (updates.auto_refresh_interval < 120000 || updates.auto_refresh_interval > 300000) {
          throw new Error(
            'auto_refresh_interval must be between 120000 and 300000 milliseconds (2-5 minutes)'
          );
        }
      }

      const { data, error } = await supabase
        .from('analytics_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        // If preferences don't exist, create them with the updates
        if (error.code === 'PGRST116') {
          logger.info('Creating preferences with updates', { userId });
          return await this.createDefaultPreferences(userId, updates);
        }
        throw error;
      }

      logger.info('Analytics preferences updated successfully', { userId });
      return data;
    } catch (_error) {
      logger.error('Error updating analytics preferences:', _error);
      throw error;
    }
  }

  /**
   * Create default preferences for a user
   */
  static async createDefaultPreferences(
    userId: string,
    overrides: AnalyticsPreferencesUpdate = {}
  ): Promise<AnalyticsPreferences> {
    try {
      logger.info('Creating default analytics preferences', { userId });

      const defaults: Omit<AnalyticsPreferences, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        real_time_enabled: true,
        auto_refresh_interval: 180000, // 3 minutes
        chatbot_analytics_refresh: true,
        learner_analytics_refresh: true,
        manager_dashboard_refresh: true,
        show_refresh_indicator: true,
        show_real_time_notifications: false,
        ...overrides,
      };

      const { data, error } = await supabase
        .from('analytics_preferences')
        .insert(defaults)
        .select()
        .single();

      if (error) throw error;

      logger.info('Default analytics preferences created', { userId });
      return data;
    } catch (_error) {
      logger.error('Error creating default analytics preferences:', _error);
      throw error;
    }
  }

  /**
   * Get default preferences object (not saved to DB)
   */
  static getDefaultPreferencesObject(): Omit<
    AnalyticsPreferences,
    'id' | 'user_id' | 'created_at' | 'updated_at'
  > {
    return {
      real_time_enabled: true,
      auto_refresh_interval: 180000, // 3 minutes
      chatbot_analytics_refresh: true,
      learner_analytics_refresh: true,
      manager_dashboard_refresh: true,
      show_refresh_indicator: true,
      show_real_time_notifications: false,
    };
  }

  /**
   * Reset preferences to defaults
   */
  static async resetToDefaults(userId: string): Promise<AnalyticsPreferences> {
    try {
      logger.info('Resetting analytics preferences to defaults', { userId });

      const defaults = this.getDefaultPreferencesObject();

      const { data, error } = await supabase
        .from('analytics_preferences')
        .update(defaults)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Analytics preferences reset to defaults', { userId });
      return data;
    } catch (_error) {
      logger.error('Error resetting analytics preferences:', _error);
      throw error;
    }
  }

  /**
   * Delete preferences for a user (will revert to defaults on next fetch)
   */
  static async deletePreferences(userId: string): Promise<void> {
    try {
      logger.info('Deleting analytics preferences', { userId });

      const { error } = await supabase.from('analytics_preferences').delete().eq('user_id', userId);

      if (error) throw error;

      logger.info('Analytics preferences deleted', { userId });
    } catch (_error) {
      logger.error('Error deleting analytics preferences:', _error);
      throw error;
    }
  }

  /**
   * Get refresh interval label for display
   */
  static getRefreshIntervalLabel(milliseconds: number): string {
    const minutes = milliseconds / 60000;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Get available refresh interval options
   */
  static getRefreshIntervalOptions(): Array<{ value: number; label: string }> {
    return [
      { value: 120000, label: '2 minutes' },
      { value: 180000, label: '3 minutes' },
      { value: 240000, label: '4 minutes' },
      { value: 300000, label: '5 minutes' },
    ];
  }

  /**
   * Validate preferences object
   */
  static validatePreferences(preferences: AnalyticsPreferencesUpdate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (preferences.auto_refresh_interval !== undefined) {
      if (
        typeof preferences.auto_refresh_interval !== 'number' ||
        preferences.auto_refresh_interval < 120000 ||
        preferences.auto_refresh_interval > 300000
      ) {
        errors.push('Refresh interval must be between 2 and 5 minutes (120000-300000ms)');
      }
    }

    // Validate booleans
    const booleanFields: Array<keyof AnalyticsPreferencesUpdate> = [
      'real_time_enabled',
      'chatbot_analytics_refresh',
      'learner_analytics_refresh',
      'manager_dashboard_refresh',
      'show_refresh_indicator',
      'show_real_time_notifications',
    ];

    for (const field of booleanFields) {
      if (preferences[field] !== undefined && typeof preferences[field] !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if preferences allow refresh for a specific page
   */
  static shouldRefreshPage(
    preferences: AnalyticsPreferences,
    page: 'chatbot' | 'learner' | 'manager'
  ): boolean {
    if (!preferences.real_time_enabled) return false;

    switch (page) {
      case 'chatbot':
        return preferences.chatbot_analytics_refresh;
      case 'learner':
        return preferences.learner_analytics_refresh;
      case 'manager':
        return preferences.manager_dashboard_refresh;
      default:
        return false;
    }
  }
}
