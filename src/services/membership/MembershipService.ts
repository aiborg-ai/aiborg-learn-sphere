/**
 * Membership Service
 *
 * Handles core membership operations including:
 * - Subscription management
 * - Plan retrieval
 * - Access checking
 * - Stripe integration
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  MembershipPlan,
  MembershipSubscription,
  SubscriptionWithPlan,
  CreateSubscriptionParams,
  SubscriptionSavings,
  ManageSubscriptionParams,
  SubscriptionActionResult,
  MembershipDashboardData,
  MembershipBenefitsUsage,
} from './types';

export class MembershipService {
  // ============================================================================
  // PLANS
  // ============================================================================

  /**
   * Get all active membership plans
   */
  static async getActivePlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get plan by slug
   */
  static async getPlanBySlug(slug: string): Promise<MembershipPlan | null> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Get featured plans
   */
  static async getFeaturedPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  /**
   * Get active subscription for current user
   */
  static async getActiveSubscription(): Promise<SubscriptionWithPlan | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('membership_subscriptions')
      .select(
        `
        *,
        plan:membership_plans(*)
      `
      )
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Get all subscriptions for current user (including canceled)
   */
  static async getUserSubscriptions(): Promise<SubscriptionWithPlan[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from('membership_subscriptions')
      .select(
        `
        *,
        plan:membership_plans(*)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if user has active membership
   * Checks both Stripe subscriptions AND admin-granted Family Pass
   * Hybrid logic: Admin can grant, but Stripe cancellations can revoke
   */
  static async hasActiveMembership(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // First check Stripe subscription
    const { data: stripeData, error: stripeError } = await supabase.rpc('check_membership_access', {
      p_user_id: user.id,
    });

    if (stripeError) {
      logger.error('Error checking Stripe membership access:', stripeError);
    }

    // If Stripe subscription is active, grant access
    if (stripeData === true) {
      return true;
    }

    // Check admin-granted Family Pass
    const { data: adminData, error: adminError } = await supabase.rpc(
      'check_admin_family_pass_access',
      {
        p_user_id: user.id,
      }
    );

    if (adminError) {
      logger.error('Error checking admin Family Pass access:', adminError);
      return false;
    }

    return adminData === true;
  }

  /**
   * Calculate savings for family pass
   */
  static async calculateSavings(
    numMembers: number = 4,
    coursesPerMember: number = 1,
    months: number = 12
  ): Promise<SubscriptionSavings> {
    const { data, error } = await supabase.rpc('calculate_family_savings', {
      p_num_members: numMembers,
      p_courses_per_member: coursesPerMember,
      p_months: months,
    });

    if (error) throw error;

    return data[0];
  }

  // ============================================================================
  // STRIPE INTEGRATION
  // ============================================================================

  /**
   * Create subscription checkout session
   */
  static async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<{ sessionId: string; url: string }> {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: params,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Manage subscription (cancel, pause, resume)
   */
  static async manageSubscription(
    params: ManageSubscriptionParams
  ): Promise<SubscriptionActionResult> {
    const { data, error } = await supabase.functions.invoke('manage-subscription', {
      body: params,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(
    subscriptionId: string,
    reason?: string,
    feedback?: string
  ): Promise<SubscriptionActionResult> {
    return this.manageSubscription({
      action: 'cancel',
      subscriptionId,
      cancelImmediately: false,
      cancellationReason: reason,
      cancellationFeedback: feedback,
    });
  }

  /**
   * Cancel subscription immediately
   */
  static async cancelSubscriptionImmediately(
    subscriptionId: string,
    reason?: string,
    feedback?: string
  ): Promise<SubscriptionActionResult> {
    return this.manageSubscription({
      action: 'cancel',
      subscriptionId,
      cancelImmediately: true,
      cancellationReason: reason,
      cancellationFeedback: feedback,
    });
  }

  /**
   * Pause subscription
   */
  static async pauseSubscription(
    subscriptionId: string,
    months: number = 1
  ): Promise<SubscriptionActionResult> {
    return this.manageSubscription({
      action: 'pause',
      subscriptionId,
      pauseMonths: months,
    });
  }

  /**
   * Resume subscription
   */
  static async resumeSubscription(subscriptionId: string): Promise<SubscriptionActionResult> {
    return this.manageSubscription({
      action: 'resume',
      subscriptionId,
    });
  }

  /**
   * Get Stripe Customer Portal URL
   */
  static async getCustomerPortalUrl(subscriptionId: string, returnUrl?: string): Promise<string> {
    const result = await this.manageSubscription({
      action: 'get_portal',
      subscriptionId,
      returnUrl,
    });

    return result.portalUrl || '';
  }

  // ============================================================================
  // DASHBOARD DATA
  // ============================================================================

  /**
   * Get comprehensive dashboard data
   */
  static async getDashboardData(): Promise<MembershipDashboardData> {
    const subscription = await this.getActiveSubscription();

    if (!subscription) {
      return {
        subscription: null,
        familyMembers: [],
        familyMemberCount: 0,
        maxFamilyMembers: 0,
        canAddMembers: false,
        vaultStats: {
          total_views: 0,
          total_downloads: 0,
          total_bookmarks: 0,
          unique_content_viewed: 0,
          hours_watched: 0,
        },
        eventStats: {
          total_invitations: 0,
          total_registered: 0,
          total_attended: 0,
          total_missed: 0,
          attendance_rate: 0,
          upcoming_events: 0,
        },
        upcomingEvents: [],
        recentVaultContent: [],
        recommendations: [],
      };
    }

    // Import other services dynamically to avoid circular dependencies
    const { FamilyMembersService } = await import('./FamilyMembersService');
    const { VaultContentService } = await import('./VaultContentService');

    // Fetch all data in parallel
    const [familyMembers, vaultStats, eventStats, upcomingEvents, recentContent] =
      await Promise.all([
        FamilyMembersService.getSubscriptionFamilyMembers(subscription.id),
        VaultContentService.getUserVaultStats(),
        this.getMemberEventStats(),
        this.getUpcomingEvents(),
        VaultContentService.getRecentVaultContent(5),
      ]);

    const maxFamilyMembers = subscription.plan.max_family_members || 0;
    const familyMemberCount = familyMembers.length;
    const canAddMembers = familyMemberCount < maxFamilyMembers;

    return {
      subscription,
      familyMembers,
      familyMemberCount,
      maxFamilyMembers,
      canAddMembers,
      vaultStats,
      eventStats,
      upcomingEvents,
      recentVaultContent: recentContent,
      recommendations: [], // TODO: Implement recommendations
    };
  }

  /**
   * Get membership benefits usage
   */
  static async getMembershipBenefitsUsage(): Promise<MembershipBenefitsUsage> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // TODO: Implement actual calculations
    return {
      courses_accessed: 0,
      vault_items_viewed: 0,
      events_attended: 0,
      family_members_active: 0,
      total_value_received: 0,
      monthly_savings: 0,
    };
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  /**
   * Get member event statistics
   */
  static async getMemberEventStats() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        total_invitations: 0,
        total_registered: 0,
        total_attended: 0,
        total_missed: 0,
        attendance_rate: 0,
        upcoming_events: 0,
      };
    }

    const { data, error } = await supabase.rpc('get_member_event_stats', {
      p_user_id: user.id,
    });

    if (error) throw error;

    return data[0];
  }

  /**
   * Get upcoming events for member
   */
  static async getUpcomingEvents() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from('event_invitations')
      .select('*')
      .eq('user_id', user.id)
      .in('attendance_status', ['invited', 'registered', 'confirmed'])
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  /**
   * Register for event
   */
  static async registerForEvent(eventId: string): Promise<string> {
    const { data, error } = await supabase.rpc('register_for_member_event', {
      p_event_id: eventId,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Submit event feedback
   */
  static async submitEventFeedback(
    eventId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('submit_event_feedback', {
      p_event_id: eventId,
      p_rating: rating,
      p_comment: comment,
    });

    if (error) throw error;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Check if subscription is in trial
   */
  static isTrialing(subscription: MembershipSubscription): boolean {
    if (subscription.status !== 'trialing') return false;
    if (!subscription.trial_end) return false;

    return new Date(subscription.trial_end) > new Date();
  }

  /**
   * Check if subscription will cancel at period end
   */
  static willCancelAtPeriodEnd(subscription: MembershipSubscription): boolean {
    return subscription.cancel_at_period_end === true;
  }

  /**
   * Get days until subscription ends
   */
  static getDaysUntilPeriodEnd(subscription: MembershipSubscription): number | null {
    if (!subscription.current_period_end) return null;

    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Format price for display
   */
  static formatPrice(plan: MembershipPlan): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: plan.currency,
      minimumFractionDigits: 2,
    });

    const priceStr = formatter.format(plan.price);
    return `${priceStr}/${plan.billing_interval}`;
  }
}
