/**
 * useFamilyMembers Hook
 *
 * React Query hooks for family member management
 * Handles adding, removing, and managing family members
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { FamilyMembersService } from '@/services/membership/FamilyMembersService';
import type { FamilyMember, AddFamilyMemberParams } from '@/services/membership/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const familyMembersKeys = {
  all: ['familyMembers'] as const,
  subscription: (subscriptionId: string) =>
    [...familyMembersKeys.all, 'subscription', subscriptionId] as const,
  member: (memberId: string) => [...familyMembersKeys.all, 'member', memberId] as const,
  invitation: (token: string) => [...familyMembersKeys.all, 'invitation', token] as const,
  stats: (subscriptionId: string) => [...familyMembersKeys.all, 'stats', subscriptionId] as const,
  mostActive: (subscriptionId: string) =>
    [...familyMembersKeys.all, 'mostActive', subscriptionId] as const,
};

// ============================================================================
// FAMILY MEMBERS
// ============================================================================

/**
 * Get family members for a subscription
 */
export function useSubscriptionFamilyMembers(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: familyMembersKeys.subscription(subscriptionId || ''),
    queryFn: () => FamilyMembersService.getSubscriptionFamilyMembers(subscriptionId!),
    enabled: !!subscriptionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get family member by ID
 */
export function useFamilyMember(memberId: string | undefined) {
  return useQuery({
    queryKey: familyMembersKeys.member(memberId || ''),
    queryFn: () => FamilyMembersService.getFamilyMember(memberId!),
    enabled: !!memberId,
  });
}

/**
 * Get family statistics summary
 */
export function useFamilyStatsSummary(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: familyMembersKeys.stats(subscriptionId || ''),
    queryFn: () => FamilyMembersService.getFamilyStatsSummary(subscriptionId!),
    enabled: !!subscriptionId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get most active family member
 */
export function useMostActiveMember(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: familyMembersKeys.mostActive(subscriptionId || ''),
    queryFn: () => FamilyMembersService.getMostActiveMember(subscriptionId!),
    enabled: !!subscriptionId,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add family member
 */
export function useAddFamilyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: AddFamilyMemberParams) => FamilyMembersService.addFamilyMember(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: familyMembersKeys.subscription(variables.subscription_id),
      });
      queryClient.invalidateQueries({
        queryKey: familyMembersKeys.stats(variables.subscription_id),
      });

      toast({
        title: 'Family Member Added',
        description: `Invitation sent to ${variables.member_email}`,
      });
    },
    onError: (error: Error) => {
      let description = error.message || 'Failed to add family member';

      // Handle specific errors
      if (description.includes('limit reached')) {
        description = 'You have reached the maximum number of family members for your plan.';
      }

      toast({
        title: 'Failed to Add Member',
        description,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove family member
 */
export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberId: string) => FamilyMembersService.removeFamilyMember(memberId),

    onSuccess: (_, _memberId) => {
      // Invalidate all subscription queries as we don't know which subscription this member belongs to
      queryClient.invalidateQueries({ queryKey: familyMembersKeys.all });

      toast({
        title: 'Family Member Removed',
        description: 'Family member has been removed from your subscription.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Remove Member',
        description: error.message || 'Failed to remove family member',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update family member
 */
export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, updates }: { memberId: string; updates: Partial<FamilyMember> }) =>
      FamilyMembersService.updateFamilyMember(memberId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: familyMembersKeys.member(variables.memberId),
      });
      queryClient.invalidateQueries({ queryKey: familyMembersKeys.all });

      toast({
        title: 'Member Updated',
        description: 'Family member details have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update family member',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Get invitation by token
 */
export function useInvitationByToken(token: string | undefined) {
  return useQuery({
    queryKey: familyMembersKeys.invitation(token || ''),
    queryFn: () => FamilyMembersService.getInvitationByToken(token!),
    enabled: !!token,
    staleTime: 0, // Always fetch fresh data for invitations
  });
}

/**
 * Accept family invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitationToken: string) => FamilyMembersService.acceptInvitation(invitationToken),
    onSuccess: () => {
      // Invalidate all membership queries since user now has family access
      queryClient.invalidateQueries({ queryKey: ['membership'] });
      queryClient.invalidateQueries({ queryKey: familyMembersKeys.all });

      toast({
        title: 'Welcome to the Family!',
        description: 'You have successfully joined the family subscription.',
      });
    },
    onError: (error: Error) => {
      let description = error.message || 'Failed to accept invitation';

      if (description.includes('expired')) {
        description = 'This invitation has expired. Please ask for a new invitation.';
      } else if (description.includes('email')) {
        description = 'The invitation email does not match your account email.';
      }

      toast({
        title: 'Invitation Error',
        description,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Resend invitation
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberId: string) => FamilyMembersService.resendInvitation(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({
        queryKey: familyMembersKeys.member(memberId),
      });

      toast({
        title: 'Invitation Resent',
        description: 'A new invitation email has been sent.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Resend',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Cancel pending invitation
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberId: string) => FamilyMembersService.cancelInvitation(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMembersKeys.all });

      toast({
        title: 'Invitation Canceled',
        description: 'The pending invitation has been canceled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Sync family member statistics
 */
export function useSyncMemberStats() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberUserId: string) => FamilyMembersService.syncMemberStats(memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyMembersKeys.all });

      toast({
        title: 'Statistics Updated',
        description: 'Family member statistics have been synced.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync statistics',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Custom hook for family member summary
 */
export function useFamilyMemberSummary(subscriptionId: string | undefined) {
  const { data: members, isLoading: membersLoading } = useSubscriptionFamilyMembers(subscriptionId);
  const { data: stats, isLoading: statsLoading } = useFamilyStatsSummary(subscriptionId);

  return {
    members: members || [],
    stats,
    isLoading: membersLoading || statsLoading,
    memberCount: members?.length || 0,
    activeCount: members?.filter(m => m.status === 'active').length || 0,
    pendingCount:
      members?.filter(m => ['pending_invitation', 'invitation_sent'].includes(m.status)).length ||
      0,
  };
}

/**
 * Check if can add more members
 */
export function useCanAddMembers(subscriptionId: string | undefined, maxMembers: number) {
  const { data: members } = useSubscriptionFamilyMembers(subscriptionId);

  const currentCount =
    members?.filter(m => ['pending_invitation', 'invitation_sent', 'active'].includes(m.status))
      .length || 0;

  return {
    canAdd: currentCount < maxMembers,
    currentCount,
    maxMembers,
    slotsRemaining: maxMembers - currentCount,
  };
}
