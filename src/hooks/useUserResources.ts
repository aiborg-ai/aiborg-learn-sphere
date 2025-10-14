import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface UserResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: 'pdf' | 'video_link' | 'document' | 'presentation';
  file_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  file_size: number | null;
  duration: number | null;
  tags: string[];
  category: string | null;
  created_at: string;

  // Allocation info
  allocation_id?: string;
  allocated_at?: string;
  expires_at?: string | null;
  viewed_at?: string | null;
  view_count?: number;
  last_accessed_at?: string | null;
  notes?: string | null;
}

interface UseUserResourcesState {
  resources: UserResource[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export const useUserResources = (userId?: string) => {
  const [state, setState] = useState<UseUserResourcesState>({
    resources: [],
    loading: true,
    error: null,
    totalCount: 0,
  });

  const fetchResources = useCallback(async () => {
    if (!userId) {
      setState({
        resources: [],
        loading: false,
        error: 'No user ID provided',
        totalCount: 0,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.log('🔄 Fetching user resources...', { userId });

      // Fetch resources allocated to the user
      const { data: allocations, error: allocationsError } = await supabase
        .from('user_resource_allocations')
        .select(
          `
          id,
          allocated_at,
          expires_at,
          viewed_at,
          view_count,
          last_accessed_at,
          notes,
          user_resources:resource_id (
            id,
            title,
            description,
            resource_type,
            file_url,
            video_url,
            thumbnail_url,
            file_size,
            duration,
            tags,
            category,
            created_at
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('allocated_at', { ascending: false });

      if (allocationsError) {
        throw allocationsError;
      }

      // Filter out expired resources and flatten the structure
      const now = new Date();
      const activeResources = (allocations || [])
        .filter(alloc => {
          // Check if resource exists
          if (!alloc.user_resources) return false;

          // Check if not expired
          if (alloc.expires_at) {
            const expiresAt = new Date(alloc.expires_at);
            if (expiresAt < now) return false;
          }

          return true;
        })
        .map(alloc => ({
          ...(alloc.user_resources as Record<string, unknown>),
          allocation_id: alloc.id,
          allocated_at: alloc.allocated_at,
          expires_at: alloc.expires_at,
          viewed_at: alloc.viewed_at,
          view_count: alloc.view_count,
          last_accessed_at: alloc.last_accessed_at,
          notes: alloc.notes,
        }));

      logger.log(`✅ Fetched ${activeResources.length} resources`);

      setState({
        resources: activeResources,
        loading: false,
        error: null,
        totalCount: activeResources.length,
      });
    } catch (err) {
      logger.error('❌ Error fetching user resources:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resources';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [userId]);

  const trackResourceView = useCallback(
    async (resourceId: string) => {
      if (!userId) return;

      try {
        logger.log('👁️ Tracking resource view...', { resourceId, userId });

        // Call the database function to track the view
        const { error } = await supabase.rpc('track_resource_view', {
          p_resource_id: resourceId,
          p_user_id: userId,
        });

        if (error) {
          logger.error('❌ Error tracking resource view:', error);
        } else {
          logger.log('✅ Resource view tracked');

          // Update local state to reflect the view
          setState(prev => ({
            ...prev,
            resources: prev.resources.map(r =>
              r.id === resourceId
                ? {
                    ...r,
                    view_count: (r.view_count || 0) + 1,
                    viewed_at: r.viewed_at || new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(),
                  }
                : r
            ),
          }));
        }
      } catch (err) {
        logger.error('❌ Error tracking resource view:', err);
      }
    },
    [userId]
  );

  const refetch = useCallback(() => {
    logger.log('🔄 Manual refetch triggered');
    return fetchResources();
  }, [fetchResources]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    logger.log('👂 Setting up resource subscriptions...');

    const channel = supabase
      .channel(`user-resources-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_resource_allocations',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          logger.log('🔔 Resource allocation change detected:', payload.eventType);
          fetchResources();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_resources',
        },
        payload => {
          logger.log('🔔 Resource change detected:', payload.eventType);
          fetchResources();
        }
      )
      .subscribe(status => {
        logger.log('📡 Resource subscription status:', status);
      });

    return () => {
      logger.log('🔌 Cleaning up resource subscriptions');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchResources]);

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources: state.resources,
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,
    refetch,
    trackResourceView,
  };
};
