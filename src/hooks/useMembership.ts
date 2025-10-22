/**
 * useMembership Hook
 *
 * React Query hooks for membership management
 * Handles plans, subscriptions, and subscription actions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { MembershipService } from '@/services/membership';
import type { CreateSubscriptionParams } from '@/services/membership/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const membershipKeys = {
  all: ['membership'] as const,
  plans: () => [...membershipKeys.all, 'plans'] as const,
  activePlans: () => [...membershipKeys.plans(), 'active'] as const,
  featuredPlans: () => [...membershipKeys.plans(), 'featured'] as const,
  planBySlug: (slug: string) => [...membershipKeys.plans(), 'slug', slug] as const,
  subscriptions: () => [...membershipKeys.all, 'subscriptions'] as const,
  activeSubscription: () => [...membershipKeys.subscriptions(), 'active'] as const,
  userSubscriptions: () => [...membershipKeys.subscriptions(), 'user'] as const,
  hasAccess: () => [...membershipKeys.all, 'access'] as const,
  savings: (members: number, courses: number, months: number) =>
    [...membershipKeys.all, 'savings', members, courses, months] as const,
  dashboard: () => [...membershipKeys.all, 'dashboard'] as const,
  eventStats: () => [...membershipKeys.all, 'eventStats'] as const,
  upcomingEvents: () => [...membershipKeys.all, 'upcomingEvents'] as const,
};

// ============================================================================
// PLANS
// ============================================================================

/**
 * Get all active membership plans
 */
export function useActivePlans() {
  return useQuery({
    queryKey: membershipKeys.activePlans(),
    queryFn: () => MembershipService.getActivePlans(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get featured membership plans
 */
export function useFeaturedPlans() {
  return useQuery({
    queryKey: membershipKeys.featuredPlans(),
    queryFn: () => MembershipService.getFeaturedPlans(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Get plan by slug
 */
export function usePlanBySlug(slug: string, enabled: boolean = true) {
  return useQuery({
    queryKey: membershipKeys.planBySlug(slug),
    queryFn: () => MembershipService.getPlanBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Get active subscription for current user
 */
export function useActiveSubscription() {
  return useQuery({
    queryKey: membershipKeys.activeSubscription(),
    queryFn: () => MembershipService.getActiveSubscription(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get all subscriptions for current user
 */
export function useUserSubscriptions() {
  return useQuery({
    queryKey: membershipKeys.userSubscriptions(),
    queryFn: () => MembershipService.getUserSubscriptions(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Check if user has active membership
 */
export function useHasActiveMembership() {
  return useQuery({
    queryKey: membershipKeys.hasAccess(),
    queryFn: () => MembershipService.hasActiveMembership(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Calculate savings for family pass
 */
export function useCalculateSavings(
  numMembers: number = 4,
  coursesPerMember: number = 1,
  months: number = 12
) {
  return useQuery({
    queryKey: membershipKeys.savings(numMembers, coursesPerMember, months),
    queryFn: () => MembershipService.calculateSavings(numMembers, coursesPerMember, months),
    staleTime: 60 * 60 * 1000, // 1 hour (savings formula doesn't change often)
  });
}

/**
 * Get comprehensive dashboard data
 */
export function useMembershipDashboard() {
  return useQuery({
    queryKey: membershipKeys.dashboard(),
    queryFn: () => MembershipService.getDashboardData(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// SUBSCRIPTION ACTIONS
// ============================================================================

/**
 * Create subscription checkout session
 */
export function useCreateSubscription() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: CreateSubscriptionParams) => MembershipService.createSubscription(params),
    onSuccess: data => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Subscription Error',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Cancel subscription at period end
 */
export function useCancelSubscription() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      reason,
      feedback,
    }: {
      subscriptionId: string;
      reason?: string;
      feedback?: string;
    }) => MembershipService.cancelSubscription(subscriptionId, reason, feedback),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: membershipKeys.hasAccess() });

      toast({
        title: 'Subscription Scheduled for Cancellation',
        description: `Your subscription will end on ${new Date(
          data.periodEnd!
        ).toLocaleDateString()}. You'll keep access until then.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Cancel subscription immediately
 */
export function useCancelSubscriptionImmediately() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      reason,
      feedback,
    }: {
      subscriptionId: string;
      reason?: string;
      feedback?: string;
    }) => MembershipService.cancelSubscriptionImmediately(subscriptionId, reason, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: membershipKeys.hasAccess() });

      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription has been canceled immediately.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Pause subscription
 */
export function usePauseSubscription() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ subscriptionId, months }: { subscriptionId: string; months?: number }) =>
      MembershipService.pauseSubscription(subscriptionId, months),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.subscriptions() });

      toast({
        title: 'Subscription Paused',
        description: `Your subscription is paused until ${new Date(
          data.resumeAt!
        ).toLocaleDateString()}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Pause Failed',
        description: error.message || 'Failed to pause subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Resume subscription
 */
export function useResumeSubscription() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subscriptionId: string) => MembershipService.resumeSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: membershipKeys.hasAccess() });

      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been reactivated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Resume Failed',
        description: error.message || 'Failed to resume subscription',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get Stripe Customer Portal URL
 */
export function useCustomerPortal() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ subscriptionId, returnUrl }: { subscriptionId: string; returnUrl?: string }) =>
      MembershipService.getCustomerPortalUrl(subscriptionId, returnUrl),
    onSuccess: portalUrl => {
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Portal Error',
        description: error.message || 'Failed to open customer portal',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Get member event statistics
 */
export function useMemberEventStats() {
  return useQuery({
    queryKey: membershipKeys.eventStats(),
    queryFn: () => MembershipService.getMemberEventStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get upcoming events
 */
export function useUpcomingEvents() {
  return useQuery({
    queryKey: membershipKeys.upcomingEvents(),
    queryFn: () => MembershipService.getUpcomingEvents(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Register for event
 */
export function useRegisterForEvent() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (eventId: string) => MembershipService.registerForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.upcomingEvents() });
      queryClient.invalidateQueries({ queryKey: membershipKeys.eventStats() });

      toast({
        title: 'Registration Successful',
        description: 'You have been registered for the event.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register for event',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Submit event feedback
 */
export function useSubmitEventFeedback() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      eventId,
      rating,
      comment,
    }: {
      eventId: string;
      rating: number;
      comment?: string;
    }) => MembershipService.submitEventFeedback(eventId, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.upcomingEvents() });

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit feedback',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Custom hook to check subscription status
 */
export function useSubscriptionStatus() {
  const { data: subscription, isLoading } = useActiveSubscription();

  return {
    subscription,
    isLoading,
    isActive: subscription?.status === 'active',
    isTrialing: subscription?.status === 'trialing',
    isPastDue: subscription?.status === 'past_due',
    isCanceled: subscription?.status === 'canceled',
    willCancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
    daysUntilPeriodEnd: subscription ? MembershipService.getDaysUntilPeriodEnd(subscription) : null,
  };
}
