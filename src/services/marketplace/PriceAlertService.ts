/**
 * Price Alert Service
 * Handles user price alerts for external courses
 */

import { supabase } from '@/integrations/supabase/client';
import type { UserPriceAlert, ExternalCourseWithProvider } from '@/types/marketplace';

export class PriceAlertService {
  /**
   * Get all active alerts for a user
   */
  static async getAlerts(userId: string): Promise<UserPriceAlert[]> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch price alerts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get alerts with full course data
   */
  static async getAlertsWithCourses(
    userId: string
  ): Promise<Array<UserPriceAlert & { course: ExternalCourseWithProvider }>> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .select(
        `
        *,
        external_courses (
          *,
          course_providers (
            id,
            slug,
            name,
            logo_url,
            website_url,
            category,
            country
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch alerts with courses: ${error.message}`);
    }

    return (data || []).map(item => {
      const course = item.external_courses as Record<string, unknown>;
      const provider = (course?.course_providers || {}) as Record<string, unknown>;

      return {
        id: item.id,
        user_id: item.user_id,
        course_id: item.course_id,
        target_price: item.target_price,
        original_price_at_creation: item.original_price_at_creation,
        is_active: item.is_active,
        triggered_at: item.triggered_at,
        notification_sent: item.notification_sent,
        created_at: item.created_at,
        updated_at: item.updated_at,
        course: {
          id: course.id as string,
          provider_id: course.provider_id as string,
          external_id: course.external_id as string | null,
          slug: course.slug as string,
          title: course.title as string,
          description: course.description as string | null,
          instructor_name: course.instructor_name as string | null,
          instructor_bio: course.instructor_bio as string | null,
          thumbnail_url: course.thumbnail_url as string | null,
          external_url: course.external_url as string,
          level: course.level,
          mode: course.mode,
          language: course.language as string,
          duration_hours: course.duration_hours as number | null,
          duration_text: course.duration_text as string | null,
          price_type: course.price_type,
          price_amount: course.price_amount as number | null,
          price_currency: course.price_currency as string,
          original_price: course.original_price as number | null,
          rating: course.rating as number | null,
          review_count: course.review_count as number,
          enrollment_count: course.enrollment_count as number,
          certificate_available: course.certificate_available as boolean,
          skills: (course.skills as string[]) || [],
          topics: (course.topics as string[]) || [],
          categories: (course.categories as string[]) || [],
          prerequisites: (course.prerequisites as string[]) || [],
          learning_outcomes: (course.learning_outcomes as string[]) || [],
          lesson_count: course.lesson_count as number | null,
          video_hours: course.video_hours as number | null,
          last_updated: course.last_updated as string | null,
          is_featured: course.is_featured as boolean,
          is_active: course.is_active as boolean,
          sort_order: course.sort_order as number,
          created_at: course.created_at as string,
          updated_at: course.updated_at as string,
          provider_name: provider.name as string,
          provider_slug: provider.slug,
          provider_logo_url: provider.logo_url as string | null,
          provider_category: provider.category,
          provider_country: provider.country as string | null,
        } as ExternalCourseWithProvider,
      };
    });
  }

  /**
   * Create a price alert
   */
  static async createAlert(
    userId: string,
    courseId: string,
    targetPrice: number,
    currentPrice?: number
  ): Promise<UserPriceAlert> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .insert({
        user_id: userId,
        course_id: courseId,
        target_price: targetPrice,
        original_price_at_creation: currentPrice || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Already exists - update instead
        return this.updateAlert(userId, courseId, targetPrice);
      }
      throw new Error(`Failed to create price alert: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a price alert's target price
   */
  static async updateAlert(
    userId: string,
    courseId: string,
    targetPrice: number
  ): Promise<UserPriceAlert> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .update({
        target_price: targetPrice,
        is_active: true,
        triggered_at: null,
        notification_sent: false,
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update price alert: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a price alert
   */
  static async deleteAlert(userId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('user_price_alerts')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to delete price alert: ${error.message}`);
    }
  }

  /**
   * Delete alert by ID
   */
  static async deleteAlertById(alertId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_price_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete price alert: ${error.message}`);
    }
  }

  /**
   * Toggle alert active status
   */
  static async toggleAlertActive(alertId: string, userId: string): Promise<UserPriceAlert> {
    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('user_price_alerts')
      .select('is_active')
      .eq('id', alertId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch alert: ${fetchError.message}`);
    }

    // Toggle
    const { data, error } = await supabase
      .from('user_price_alerts')
      .update({ is_active: !current.is_active })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle alert: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if user has an alert for a course
   */
  static async hasAlert(userId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check alert: ${error.message}`);
    }

    return data !== null;
  }

  /**
   * Get alert for a specific course
   */
  static async getAlertForCourse(userId: string, courseId: string): Promise<UserPriceAlert | null> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch alert: ${error.message}`);
    }

    return data;
  }

  /**
   * Get active alert count for user
   */
  static async getActiveAlertCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get alert count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get triggered (but not notified) alerts
   * Used by background job to send notifications
   */
  static async getTriggeredUnnotifiedAlerts(): Promise<UserPriceAlert[]> {
    const { data, error } = await supabase
      .from('user_price_alerts')
      .select('*')
      .eq('is_active', true)
      .not('triggered_at', 'is', null)
      .eq('notification_sent', false);

    if (error) {
      throw new Error(`Failed to fetch triggered alerts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark alert as notified
   */
  static async markAsNotified(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('user_price_alerts')
      .update({ notification_sent: true })
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to mark alert as notified: ${error.message}`);
    }
  }

  /**
   * Check all active alerts against current prices
   * Used by background job
   */
  static async checkAndTriggerAlerts(): Promise<number> {
    // Get all active alerts with course prices
    const { data: alerts, error } = await supabase
      .from('user_price_alerts')
      .select(
        `
        *,
        external_courses (
          price_amount
        )
      `
      )
      .eq('is_active', true)
      .is('triggered_at', null);

    if (error) {
      throw new Error(`Failed to fetch alerts for checking: ${error.message}`);
    }

    let triggeredCount = 0;

    for (const alert of alerts || []) {
      const course = alert.external_courses as { price_amount: number | null };
      const currentPrice = course?.price_amount || 0;

      if (currentPrice <= alert.target_price) {
        // Trigger the alert
        await supabase
          .from('user_price_alerts')
          .update({ triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        triggeredCount++;
      }
    }

    return triggeredCount;
  }
}

export default PriceAlertService;
