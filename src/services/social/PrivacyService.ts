/**
 * Privacy Service
 * Manages user privacy settings for social features
 */

import { supabase } from '@/integrations/supabase/client';
import type { PrivacySettings } from './types';

export class PrivacyService {
  /**
   * Get user privacy settings
   */
  static async get(userId: string): Promise<PrivacySettings> {
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return defaults if not found
      return {
        show_on_leaderboards: true,
        show_profile_publicly: true,
        allow_study_group_invites: true,
        allow_challenge_invites: true,
        show_achievements_publicly: true,
        show_courses_publicly: true,
        show_real_name: false,
      };
    }

    return data;
  }

  /**
   * Update privacy settings
   */
  static async update(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    const { error } = await supabase
      .from('user_privacy_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  }
}
