import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { VaultClaim, VaultClaimWithReviewer, ClaimStats, ProcessClaimRequest } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Hook for admin vault claims management
 */
export const useVaultClaimsAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all claims (with optional status filter)
  const useAllClaims = (status?: VaultClaim['status']) => {
    return useQuery({
      queryKey: ['admin-vault-claims', status],
      queryFn: async () => {
        let query = supabase
          .from('vault_subscription_claims')
          .select('*')
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        return (data as VaultClaim[]) || [];
      },
      staleTime: 30000, // 30 seconds
    });
  };

  // Fetch claims with reviewer info
  const useClaimsWithReviewers = (status?: VaultClaim['status']) => {
    return useQuery({
      queryKey: ['admin-vault-claims-with-reviewers', status],
      queryFn: async () => {
        let query = supabase
          .from('vault_subscription_claims')
          .select(
            `
            *,
            reviewer:reviewed_by (
              id,
              email,
              full_name
            )
          `
          )
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        return (data as VaultClaimWithReviewer[]) || [];
      },
      staleTime: 30000,
    });
  };

  // Get pending claims count (for badge)
  const usePendingCount = () => {
    return useQuery({
      queryKey: ['vault-claims-pending-count'],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_pending_claims_count');

        if (error) {
          logger.error('Error fetching pending count:', error);
          return 0;
        }

        return (data as number) || 0;
      },
      staleTime: 10000, // 10 seconds
      refetchInterval: 30000, // Refetch every 30 seconds
    });
  };

  // Get claim statistics
  const useClaimStats = () => {
    return useQuery({
      queryKey: ['vault-claims-stats'],
      queryFn: async () => {
        const { data, error } = await supabase.from('vault_subscription_claims').select('status');

        if (error) {
          throw new Error(error.message);
        }

        const stats: ClaimStats = {
          total: data.length,
          pending: data.filter(c => c.status === 'pending').length,
          approved: data.filter(c => c.status === 'approved').length,
          rejected: data.filter(c => c.status === 'rejected').length,
          expired: data.filter(c => c.status === 'expired').length,
        };

        return stats;
      },
      staleTime: 60000, // 1 minute
    });
  };

  // Approve a claim
  const approveClaim = useMutation({
    mutationFn: async (request: ProcessClaimRequest) => {
      const { data, error } = await supabase.functions.invoke('process-vault-claim', {
        body: {
          claimId: request.claimId,
          action: 'approve',
          adminNotes: request.adminNotes,
          grantEndDate: request.grantEndDate,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to approve claim');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to approve claim');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vault-claims'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-stats'] });
      toast({
        title: 'Claim Approved Successfully ✅',
        description: 'Family Pass has been granted and user has been notified.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Approve Claim',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject a claim
  const rejectClaim = useMutation({
    mutationFn: async (request: ProcessClaimRequest) => {
      if (!request.rejectionReason) {
        throw new Error('Rejection reason is required');
      }

      const { data, error } = await supabase.functions.invoke('process-vault-claim', {
        body: {
          claimId: request.claimId,
          action: 'reject',
          rejectionReason: request.rejectionReason,
          adminNotes: request.adminNotes,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to reject claim');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to reject claim');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vault-claims'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-stats'] });
      toast({
        title: 'Claim Rejected',
        description: 'User has been notified of the rejection.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Reject Claim',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk approve claims
  const bulkApproveClaims = useMutation({
    mutationFn: async (claimIds: string[]) => {
      const results = await Promise.allSettled(
        claimIds.map(claimId =>
          supabase.functions.invoke('process-vault-claim', {
            body: {
              claimId,
              action: 'approve',
              adminNotes: 'Bulk approved',
            },
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: claimIds.length };
    },
    onSuccess: results => {
      queryClient.invalidateQueries({ queryKey: ['admin-vault-claims'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-stats'] });
      toast({
        title: 'Bulk Approval Complete',
        description: `Approved ${results.successful} of ${results.total} claims. ${results.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk reject claims
  const bulkRejectClaims = useMutation({
    mutationFn: async (params: { claimIds: string[]; rejectionReason: string }) => {
      const results = await Promise.allSettled(
        params.claimIds.map(claimId =>
          supabase.functions.invoke('process-vault-claim', {
            body: {
              claimId,
              action: 'reject',
              rejectionReason: params.rejectionReason,
              adminNotes: 'Bulk rejected',
            },
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: params.claimIds.length };
    },
    onSuccess: results => {
      queryClient.invalidateQueries({ queryKey: ['admin-vault-claims'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['vault-claims-stats'] });
      toast({
        title: 'Bulk Rejection Complete',
        description: `Rejected ${results.successful} of ${results.total} claims. ${results.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    useAllClaims,
    useClaimsWithReviewers,
    usePendingCount,
    useClaimStats,
    approveClaim,
    rejectClaim,
    bulkApproveClaims,
    bulkRejectClaims,
    isApproving: approveClaim.isPending,
    isRejecting: rejectClaim.isPending,
    isBulkApproving: bulkApproveClaims.isPending,
    isBulkRejecting: bulkRejectClaims.isPending,
  };
};
