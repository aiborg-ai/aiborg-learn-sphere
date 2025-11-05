import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { VaultClaim, ClaimFormData, VaultSubscriptionStatus } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Hook for vault claim submission (user-facing)
 */
export const useVaultClaim = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Submit a new vault claim
  const submitClaim = useMutation({
    mutationFn: async (formData: ClaimFormData) => {
      const { data, error } = await supabase.functions.invoke('submit-vault-claim', {
        body: {
          userName: formData.userName,
          userEmail: formData.userEmail,
          vaultEmail: formData.vaultEmail,
          vaultSubscriptionEndDate: formData.vaultSubscriptionEndDate.toISOString(),
          familyMembers: formData.familyMembers,
          metadata: {
            declarationAccepted: formData.declarationAccepted,
            termsAccepted: formData.termsAccepted,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit claim');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to submit claim');
      }

      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['vault-claims'] });
      toast({
        title: 'Claim Submitted Successfully! 🎉',
        description: `Your claim ID: ${data.claimId}. You'll receive an email confirmation shortly.`,
        duration: 6000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Submit Claim',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    submitClaim,
    isSubmitting: submitClaim.isPending,
  };
};

/**
 * Hook to fetch user's vault claims
 */
export const useUserVaultClaims = (userEmail?: string) => {
  return useQuery({
    queryKey: ['vault-claims', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];

      const { data, error } = await supabase
        .from('vault_subscription_claims')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data as VaultClaim[]) || [];
    },
    enabled: !!userEmail,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch a specific claim by ID
 */
export const useVaultClaimById = (claimId?: string) => {
  return useQuery({
    queryKey: ['vault-claim', claimId],
    queryFn: async () => {
      if (!claimId) return null;

      const { data, error } = await supabase
        .from('vault_subscription_claims')
        .select('*')
        .eq('id', claimId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as VaultClaim;
    },
    enabled: !!claimId,
  });
};

/**
 * Hook to check vault subscription status
 */
export const useVaultSubscriptionStatus = (email?: string) => {
  return useQuery({
    queryKey: ['vault-subscription-status', email],
    queryFn: async () => {
      if (!email) return null;

      const { data, error } = await supabase.rpc('check_vault_subscription_status', {
        p_email: email,
      });

      if (error) {
        logger.error('Error checking vault subscription status:', error);
        return null;
      }

      return data as VaultSubscriptionStatus | null;
    },
    enabled: !!email,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to check if user has a duplicate claim
 */
export const useCheckDuplicateClaim = (userEmail?: string) => {
  return useQuery({
    queryKey: ['duplicate-claim-check', userEmail],
    queryFn: async () => {
      if (!userEmail) {
        return { hasDuplicate: false, existingClaim: null };
      }

      const { data, error } = await supabase
        .from('vault_subscription_claims')
        .select('*')
        .eq('user_email', userEmail)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (error) {
        logger.error('Error checking duplicate claim:', error);
        return { hasDuplicate: false, existingClaim: null };
      }

      return {
        hasDuplicate: !!data,
        existingClaim: data as VaultClaim | null,
      };
    },
    enabled: !!userEmail,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get the latest claim status for a user
 */
export const useLatestClaimStatus = (userEmail?: string) => {
  return useQuery({
    queryKey: ['latest-claim-status', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;

      const { data, error } = await supabase
        .from('vault_subscription_claims')
        .select('id, status, created_at, reviewed_at')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching latest claim status:', error);
        return null;
      }

      return data;
    },
    enabled: !!userEmail,
    staleTime: 30000, // 30 seconds
  });
};
