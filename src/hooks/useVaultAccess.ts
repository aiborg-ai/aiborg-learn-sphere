/**
 * useVaultAccess Hook
 *
 * Access control for vault content
 * Only users with active memberships can access vault content
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useHasActiveMembership, useActiveSubscription } from './useMembership';
import { useToast } from './use-toast';

interface UseVaultAccessReturn {
  /**
   * Whether user has vault access
   */
  hasVaultAccess: boolean;

  /**
   * Whether access check is loading
   */
  isLoading: boolean;

  /**
   * The active subscription (if any)
   */
  subscription: any;

  /**
   * Redirect to membership page if no access
   */
  redirectToMembership: () => void;
}

/**
 * Check if user has access to vault content
 *
 * Vault access requires:
 * - Active membership subscription (trialing or active)
 * - Subscription plan includes vault access
 *
 * @param enforceAccess - Whether to automatically redirect if no access
 * @returns Vault access status and utilities
 *
 * @example
 * ```tsx
 * // In a vault page component
 * const { hasVaultAccess, isLoading } = useVaultAccess(true);
 *
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * // If enforceAccess=true, user will be redirected automatically
 * // Otherwise, manually check and show upgrade prompt
 * if (!hasVaultAccess) {
 *   return <UpgradeToMembershipPrompt />;
 * }
 *
 * return <VaultContent />;
 * ```
 */
export function useVaultAccess(
  enforceAccess: boolean = false
): UseVaultAccessReturn {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: hasActiveMembership, isLoading: membershipLoading } =
    useHasActiveMembership();
  const { data: subscription, isLoading: subscriptionLoading } =
    useActiveSubscription();

  const isLoading = membershipLoading || subscriptionLoading;

  // Check if subscription includes vault access
  const hasVaultAccess =
    hasActiveMembership &&
    subscription?.plan?.includes_vault_access === true;

  const redirectToMembership = () => {
    navigate('/family-membership?source=vault_access');
    toast({
      title: 'Membership Required',
      description: 'Vault content is exclusively for Family Pass members.',
      variant: 'destructive',
    });
  };

  // Enforce access if requested
  useEffect(() => {
    if (enforceAccess && !isLoading && !hasVaultAccess) {
      redirectToMembership();
    }
  }, [enforceAccess, isLoading, hasVaultAccess]);

  return {
    hasVaultAccess: hasVaultAccess || false,
    isLoading,
    subscription,
    redirectToMembership,
  };
}

/**
 * Check if user has event access
 *
 * @param enforceAccess - Whether to automatically redirect if no access
 * @returns Event access status
 */
export function useEventAccess(enforceAccess: boolean = false) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: hasActiveMembership, isLoading: membershipLoading } =
    useHasActiveMembership();
  const { data: subscription, isLoading: subscriptionLoading } =
    useActiveSubscription();

  const isLoading = membershipLoading || subscriptionLoading;

  // Check if subscription includes event access
  const hasEventAccess =
    hasActiveMembership &&
    subscription?.plan?.includes_event_access === true;

  const redirectToMembership = () => {
    navigate('/family-membership?source=event_access');
    toast({
      title: 'Membership Required',
      description: 'Priority event access is exclusively for Family Pass members.',
      variant: 'destructive',
    });
  };

  // Enforce access if requested
  useEffect(() => {
    if (enforceAccess && !isLoading && !hasEventAccess) {
      redirectToMembership();
    }
  }, [enforceAccess, isLoading, hasEventAccess]);

  return {
    hasEventAccess: hasEventAccess || false,
    isLoading,
    subscription,
    redirectToMembership,
  };
}

/**
 * Get membership upsell message based on attempted access
 *
 * @param source - What feature the user tried to access
 * @returns Upsell message for membership prompt
 */
export function getMembershipUpsellMessage(source: string): {
  title: string;
  description: string;
  benefits: string[];
} {
  const messages: Record<
    string,
    { title: string; description: string; benefits: string[] }
  > = {
    vault_access: {
      title: 'Unlock the Vault',
      description:
        'Get instant access to 200+ premium resources with the Family Pass.',
      benefits: [
        'Exclusive video tutorials',
        'Downloadable templates & worksheets',
        'Member-only webinars',
        'AI tools and scripts',
        'Plus all courses & events',
      ],
    },
    event_access: {
      title: 'Priority Event Access',
      description:
        'Never miss an event with Family Pass priority registration.',
      benefits: [
        'Free access to monthly seminars',
        'Priority registration (48hrs early)',
        '50% discount on premium conferences',
        'Member-only networking events',
        'Plus all courses & vault content',
      ],
    },
    course_access: {
      title: 'Unlimited Course Access',
      description:
        'Learn without limits with unlimited access to 50+ AI courses.',
      benefits: [
        'All courses for your entire family',
        'Primary to professional levels',
        'Certificate programs included',
        'Plus vault content & events',
        'Just £20/month for up to 6 people',
      ],
    },
    default: {
      title: 'Join the Family Pass',
      description:
        'Unlock unlimited learning for your entire family with one subscription.',
      benefits: [
        '50+ AI courses (all levels)',
        '200+ exclusive vault resources',
        'Priority event access',
        'Up to 6 family members',
        'Just £20/month',
      ],
    },
  };

  return messages[source] || messages.default;
}
