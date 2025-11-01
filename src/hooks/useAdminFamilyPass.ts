/**
 * useAdminFamilyPass Hook
 *
 * Provides admin functionality for managing Family Pass grants
 * Features:
 * - Fetch all grants with user details
 * - Grant/revoke Family Pass access
 * - Bulk operations (activate/deactivate multiple users)
 * - Update grant dates
 * - Extend grants
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

export interface FamilyPassGrant {
  id: string;
  user_id: string;
  granted_by: string;
  revoked_by: string | null;
  status: 'active' | 'inactive';
  start_date: string;
  end_date: string;
  granted_at: string;
  revoked_at: string | null;
  notes: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  // Joined user data
  user_email?: string;
  user_display_name?: string;
  granted_by_email?: string;
  granted_by_name?: string;
}

interface GrantFamilyPassParams {
  userId: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  autoRenew?: boolean;
}

interface RevokeFamilyPassParams {
  grantId: string;
  reason?: string;
}

interface BulkGrantParams {
  userIds: string[];
  startDate: Date;
  endDate: Date;
  notes?: string;
}

interface UpdateDatesParams {
  grantId: string;
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// HOOK
// ============================================================================

export const useAdminFamilyPass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ============================================================================
  // FETCH ALL GRANTS
  // ============================================================================

  const {
    data: grants,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-family-pass-grants'],
    queryFn: async () => {
      // Fetch grants with joined user data
      const { data, error } = await supabase
        .from('admin_family_pass_grants')
        .select(
          `
          *,
          user:user_id (
            email
          ),
          user_profile:profiles!admin_family_pass_grants_user_id_fkey (
            display_name
          ),
          granted_by_user:granted_by (
            email
          ),
          granted_by_profile:profiles!admin_family_pass_grants_granted_by_fkey (
            display_name
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching admin family pass grants:', error);
        throw error;
      }

      // Transform data to flatten joined fields
      const transformedData: FamilyPassGrant[] = (data || []).map(
        (grant: Record<string, unknown>) => ({
          id: grant.id,
          user_id: grant.user_id,
          granted_by: grant.granted_by,
          revoked_by: grant.revoked_by,
          status: grant.status,
          start_date: grant.start_date,
          end_date: grant.end_date,
          granted_at: grant.granted_at,
          revoked_at: grant.revoked_at,
          notes: grant.notes,
          auto_renew: grant.auto_renew,
          created_at: grant.created_at,
          updated_at: grant.updated_at,
          user_email: grant.user?.email || 'Unknown',
          user_display_name: grant.user_profile?.display_name || 'Unknown User',
          granted_by_email: grant.granted_by_user?.email || 'System',
          granted_by_name: grant.granted_by_profile?.display_name || 'System',
        })
      );

      return transformedData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ============================================================================
  // GRANT FAMILY PASS
  // ============================================================================

  const grantMutation = useMutation({
    mutationFn: async (params: GrantFamilyPassParams) => {
      const { data, error } = await supabase.rpc('grant_admin_family_pass', {
        p_user_id: params.userId,
        p_start_date: params.startDate.toISOString(),
        p_end_date: params.endDate.toISOString(),
        p_notes: params.notes || null,
        p_auto_renew: params.autoRenew || false,
      });

      if (error) {
        logger.error('Error granting family pass:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-family-pass-grants'] });
      toast({
        title: 'Success',
        description: 'Family Pass granted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant Family Pass',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // REVOKE FAMILY PASS
  // ============================================================================

  const revokeMutation = useMutation({
    mutationFn: async (params: RevokeFamilyPassParams) => {
      const { error } = await supabase.rpc('revoke_admin_family_pass', {
        p_grant_id: params.grantId,
        p_reason: params.reason || null,
      });

      if (error) {
        logger.error('Error revoking family pass:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-family-pass-grants'] });
      toast({
        title: 'Success',
        description: 'Family Pass revoked successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke Family Pass',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // BULK GRANT
  // ============================================================================

  const bulkGrantMutation = useMutation({
    mutationFn: async (params: BulkGrantParams) => {
      const promises = params.userIds.map(userId =>
        supabase.rpc('grant_admin_family_pass', {
          p_user_id: userId,
          p_start_date: params.startDate.toISOString(),
          p_end_date: params.endDate.toISOString(),
          p_notes: params.notes || null,
          p_auto_renew: false,
        })
      );

      const results = await Promise.allSettled(promises);

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        logger.error('Some bulk grants failed:', failures);
        throw new Error(`${failures.length} out of ${params.userIds.length} grants failed`);
      }

      return results;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['admin-family-pass-grants'] });
      toast({
        title: 'Success',
        description: `Family Pass granted to ${params.userIds.length} user(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Partial Failure',
        description: error.message || 'Some grants failed',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // BULK REVOKE
  // ============================================================================

  const bulkRevokeMutation = useMutation({
    mutationFn: async (grantIds: string[]) => {
      const promises = grantIds.map(grantId =>
        supabase.rpc('revoke_admin_family_pass', {
          p_grant_id: grantId,
          p_reason: 'Bulk revocation',
        })
      );

      const results = await Promise.allSettled(promises);

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        logger.error('Some bulk revocations failed:', failures);
        throw new Error(`${failures.length} out of ${grantIds.length} revocations failed`);
      }

      return results;
    },
    onSuccess: (_, grantIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-family-pass-grants'] });
      toast({
        title: 'Success',
        description: `Family Pass revoked for ${grantIds.length} user(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Partial Failure',
        description: error.message || 'Some revocations failed',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // UPDATE DATES
  // ============================================================================

  const updateDatesMutation = useMutation({
    mutationFn: async (params: UpdateDatesParams) => {
      const { error } = await supabase.rpc('update_admin_family_pass_dates', {
        p_grant_id: params.grantId,
        p_start_date: params.startDate.toISOString(),
        p_end_date: params.endDate.toISOString(),
      });

      if (error) {
        logger.error('Error updating family pass dates:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-family-pass-grants'] });
      toast({
        title: 'Success',
        description: 'Family Pass dates updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update dates',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // EXTEND GRANT (Helper function)
  // ============================================================================

  const extendGrant = async (grantId: string, months: number = 1) => {
    const grant = grants?.find(g => g.id === grantId);
    if (!grant) {
      toast({
        title: 'Error',
        description: 'Grant not found',
        variant: 'destructive',
      });
      return;
    }

    const currentEndDate = new Date(grant.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    return updateDatesMutation.mutateAsync({
      grantId,
      startDate: new Date(grant.start_date),
      endDate: newEndDate,
    });
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    grants: grants || [],
    isLoading,
    error,

    // Actions
    grantFamilyPass: grantMutation.mutateAsync,
    revokeFamilyPass: revokeMutation.mutateAsync,
    bulkGrant: bulkGrantMutation.mutateAsync,
    bulkRevoke: bulkRevokeMutation.mutateAsync,
    updateDates: updateDatesMutation.mutateAsync,
    extendGrant,

    // Loading states
    isGranting: grantMutation.isPending,
    isRevoking: revokeMutation.isPending,
    isBulkGranting: bulkGrantMutation.isPending,
    isBulkRevoking: bulkRevokeMutation.isPending,
    isUpdatingDates: updateDatesMutation.isPending,

    // Refetch
    refetch,
  };
};
