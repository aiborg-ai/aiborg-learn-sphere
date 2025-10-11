import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export type DenialReason = 'not_authenticated' | 'no_profile' | 'not_admin' | 'unknown';

interface AdminAccessState {
  isAdmin: boolean;
  accessDenied: boolean;
  denialReason: DenialReason | '';
  loading: boolean;
}

/**
 * Hook to check if the current user has admin access
 * @returns Admin access state and loading status
 */
export function useAdminAccess(): AdminAccessState {
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState<DenialReason | ''>('');
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      logger.log('[AdminAccess] Waiting for auth to load...');
      return;
    }

    logger.log('[AdminAccess] Auth loaded, checking admin access:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasProfile: !!profile,
      profileRole: profile?.role,
      isAdmin: profile?.role === 'admin',
    });

    // Check if user is admin
    if (!user) {
      logger.warn('[AdminAccess] Access denied - no user authenticated');
      setAccessDenied(true);
      setDenialReason('not_authenticated');
      return;
    }

    if (!profile) {
      logger.warn('[AdminAccess] Access denied - profile not loaded');
      setAccessDenied(true);
      setDenialReason('no_profile');
      return;
    }

    if (profile.role !== 'admin') {
      logger.warn('[AdminAccess] Access denied - not admin role:', {
        currentRole: profile.role,
      });
      setAccessDenied(true);
      setDenialReason('not_admin');
      return;
    }

    logger.log('[AdminAccess] Access granted');
    setAccessDenied(false);
    setDenialReason('');
  }, [user, profile, authLoading]);

  return {
    isAdmin: !accessDenied && !authLoading && profile?.role === 'admin',
    accessDenied,
    denialReason,
    loading: authLoading,
  };
}
