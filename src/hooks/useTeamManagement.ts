/**
 * useTeamManagement Hook
 *
 * React Query hooks for team management operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TeamManagementService } from '@/services/team';
import type {
  Organization,
  OrganizationMember,
  TeamInvitation,
  BulkInviteResult,
} from '@/services/team/types';
import { useToast } from '@/components/ui/use-toast';

// Query keys
export const teamKeys = {
  all: ['team'] as const,
  organizations: () => [...teamKeys.all, 'organizations'] as const,
  organization: (id: string) => [...teamKeys.all, 'organization', id] as const,
  members: (orgId: string) => [...teamKeys.all, 'members', orgId] as const,
  member: (orgId: string, userId: string) =>
    [...teamKeys.all, 'member', orgId, userId] as const,
  invitations: (orgId: string) =>
    [...teamKeys.all, 'invitations', orgId] as const,
  invitation: (token: string) =>
    [...teamKeys.all, 'invitation', token] as const,
};

// ============================================================================
// Organization Hooks
// ============================================================================

/**
 * Get all organizations for current user
 */
export function useUserOrganizations() {
  return useQuery({
    queryKey: teamKeys.organizations(),
    queryFn: () => TeamManagementService.getUserOrganizations(),
  });
}

/**
 * Get single organization
 */
export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: teamKeys.organization(organizationId),
    queryFn: () => TeamManagementService.getOrganization(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Update organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      organizationId,
      updates,
    }: {
      organizationId: string;
      updates: Partial<Organization>;
    }) => TeamManagementService.updateOrganization(organizationId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.organizations() });
      queryClient.invalidateQueries({
        queryKey: teamKeys.organization(data.id),
      });
      toast({
        title: 'Organization updated',
        description: 'Organization details have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Member Hooks
// ============================================================================

/**
 * Get all members of an organization
 */
export function useOrganizationMembers(organizationId: string) {
  return useQuery({
    queryKey: teamKeys.members(organizationId),
    queryFn: () => TeamManagementService.getMembers(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Get member details with activity stats
 */
export function useMemberDetails(organizationId: string, userId: string) {
  return useQuery({
    queryKey: teamKeys.member(organizationId, userId),
    queryFn: () => TeamManagementService.getMemberDetails(organizationId, userId),
    enabled: !!organizationId && !!userId,
  });
}

/**
 * Update member role or department
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      updates,
    }: {
      organizationId: string;
      userId: string;
      updates: { role?: string; department?: string };
    }) => TeamManagementService.updateMember(organizationId, userId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: teamKeys.member(variables.organizationId, variables.userId),
      });
      toast({
        title: 'Member updated',
        description: 'Member details have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove member from organization
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
    }: {
      organizationId: string;
      userId: string;
    }) => TeamManagementService.removeMember(organizationId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(variables.organizationId),
      });
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Removal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Search members
 */
export function useSearchMembers(organizationId: string, query: string) {
  return useQuery({
    queryKey: [...teamKeys.members(organizationId), 'search', query],
    queryFn: () => TeamManagementService.searchMembers(organizationId, query),
    enabled: !!organizationId && query.length > 0,
  });
}

// ============================================================================
// Invitation Hooks
// ============================================================================

/**
 * Get all invitations for organization
 */
export function useInvitations(
  organizationId: string,
  status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
) {
  return useQuery({
    queryKey: [...teamKeys.invitations(organizationId), status],
    queryFn: () => TeamManagementService.getInvitations(organizationId, status),
    enabled: !!organizationId,
  });
}

/**
 * Get invitation by token (for acceptance page)
 */
export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: teamKeys.invitation(token),
    queryFn: () => TeamManagementService.getInvitationByToken(token),
    enabled: !!token,
  });
}

/**
 * Send single invitation
 */
export function useInviteMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitation: {
      organizationId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      department?: string;
      customMessage?: string;
    }) => TeamManagementService.inviteMember(invitation),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.invitations(variables.organizationId),
      });
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${variables.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Invitation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Send bulk invitations
 */
export function useBulkInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      organizationId,
      invitations,
    }: {
      organizationId: string;
      invitations: Array<{
        email: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        department?: string;
      }>;
    }) => TeamManagementService.inviteMembersBulk(organizationId, invitations),
    onSuccess: (result: BulkInviteResult, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.invitations(variables.organizationId),
      });
      toast({
        title: 'Bulk invite complete',
        description: `${result.successful.length} invitations sent successfully. ${result.failed.length} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk invite failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Accept invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (token: string) => TeamManagementService.acceptInvitation(token),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: teamKeys.organizations() });
        if (result.organizationId) {
          queryClient.invalidateQueries({
            queryKey: teamKeys.members(result.organizationId),
          });
        }
        toast({
          title: 'Invitation accepted',
          description: 'You have successfully joined the organization.',
        });
      } else {
        toast({
          title: 'Acceptance failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Acceptance failed',
        description: error.message,
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
    mutationFn: (invitationId: string) =>
      TeamManagementService.resendInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast({
        title: 'Invitation resent',
        description: 'Invitation has been resent successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Resend failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Cancel invitation
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitationId: string) =>
      TeamManagementService.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast({
        title: 'Invitation cancelled',
        description: 'Invitation has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancel failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get member count for organization
 */
export function useMemberCount(organizationId: string) {
  return useQuery({
    queryKey: [...teamKeys.members(organizationId), 'count'],
    queryFn: () => TeamManagementService.getMemberCount(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Check if user has manage permission
 */
export function useHasManagePermission(
  userId: string | undefined,
  organizationId: string
) {
  return useQuery({
    queryKey: [
      ...teamKeys.organization(organizationId),
      'permission',
      userId,
    ],
    queryFn: () =>
      TeamManagementService.hasManagePermission(userId!, organizationId),
    enabled: !!userId && !!organizationId,
  });
}
