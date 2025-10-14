import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface AdminResource {
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
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Aggregated data
  allocation_count?: number;
  total_views?: number;
}

export interface ResourceAllocation {
  id: string;
  resource_id: string;
  user_id: string;
  allocated_by: string | null;
  allocated_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  viewed_at: string | null;
  view_count: number;
  last_accessed_at: string | null;

  // Joined data
  user_resources?: AdminResource;
  profiles?: {
    display_name: string | null;
    email: string | null;
  };
}

interface UseResourcesManagementState {
  resources: AdminResource[];
  allocations: ResourceAllocation[];
  loading: boolean;
  error: string | null;
}

export const useResourcesManagement = () => {
  const [state, setState] = useState<UseResourcesManagementState>({
    resources: [],
    allocations: [],
    loading: true,
    error: null,
  });

  const fetchResources = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.log('🔄 Fetching all resources (admin)...');

      const { data, error } = await supabase
        .from('user_resources')
        .select(
          `
          *,
          allocations:user_resource_allocations(count)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to include allocation count
      const processedResources = (data || []).map(resource => ({
        ...resource,
        allocation_count: resource.allocations?.[0]?.count || 0,
        allocations: undefined, // Remove the nested allocations array
      }));

      logger.log(`✅ Fetched ${processedResources.length} resources`);

      setState(prev => ({
        ...prev,
        resources: processedResources,
        loading: false,
      }));
    } catch (err) {
      logger.error('❌ Error fetching resources:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resources';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const fetchAllocations = useCallback(async (resourceId?: string) => {
    try {
      logger.log('🔄 Fetching resource allocations...');

      let query = supabase
        .from('user_resource_allocations')
        .select(
          `
          *,
          user_resources(*),
          profiles:user_id(display_name, email)
        `
        )
        .order('allocated_at', { ascending: false });

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      logger.log(`✅ Fetched ${data?.length || 0} allocations`);

      setState(prev => ({
        ...prev,
        allocations: data || [],
      }));

      return data || [];
    } catch (err) {
      logger.error('❌ Error fetching allocations:', err);
      throw err;
    }
  }, []);

  const createResource = useCallback(
    async (resourceData: {
      title: string;
      description?: string;
      resource_type: 'pdf' | 'video_link' | 'document' | 'presentation';
      file_url?: string;
      video_url?: string;
      thumbnail_url?: string;
      file_size?: number;
      duration?: number;
      tags?: string[];
      category?: string;
    }) => {
      try {
        logger.log('📝 Creating resource...', resourceData);

        const { data, error } = await supabase
          .from('user_resources')
          .insert({
            ...resourceData,
            tags: resourceData.tags || [],
          })
          .select()
          .single();

        if (error) throw error;

        logger.log('✅ Resource created:', data.id);

        // Refresh the resources list
        await fetchResources();

        return data;
      } catch (err) {
        logger.error('❌ Error creating resource:', err);
        throw err;
      }
    },
    [fetchResources]
  );

  const updateResource = useCallback(
    async (
      resourceId: string,
      updates: Partial<Omit<AdminResource, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
    ) => {
      try {
        logger.log('📝 Updating resource...', { resourceId, updates });

        const { data, error } = await supabase
          .from('user_resources')
          .update(updates)
          .eq('id', resourceId)
          .select()
          .single();

        if (error) throw error;

        logger.log('✅ Resource updated');

        // Refresh the resources list
        await fetchResources();

        return data;
      } catch (err) {
        logger.error('❌ Error updating resource:', err);
        throw err;
      }
    },
    [fetchResources]
  );

  const deleteResource = useCallback(
    async (resourceId: string, hardDelete = false) => {
      try {
        logger.log('🗑️ Deleting resource...', { resourceId, hardDelete });

        if (hardDelete) {
          const { error } = await supabase.from('user_resources').delete().eq('id', resourceId);

          if (error) throw error;
        } else {
          // Soft delete
          const { error } = await supabase
            .from('user_resources')
            .update({ is_active: false })
            .eq('id', resourceId);

          if (error) throw error;
        }

        logger.log('✅ Resource deleted');

        // Refresh the resources list
        await fetchResources();
      } catch (err) {
        logger.error('❌ Error deleting resource:', err);
        throw err;
      }
    },
    [fetchResources]
  );

  const allocateResource = useCallback(
    async (
      resourceId: string,
      userIds: string[],
      options?: {
        expires_at?: string;
        notes?: string;
      }
    ) => {
      try {
        logger.log('📌 Allocating resource to users...', {
          resourceId,
          userCount: userIds.length,
        });

        // Create allocations for each user
        const allocations = userIds.map(userId => ({
          resource_id: resourceId,
          user_id: userId,
          expires_at: options?.expires_at || null,
          notes: options?.notes || null,
        }));

        const { data, error } = await supabase
          .from('user_resource_allocations')
          .upsert(allocations, {
            onConflict: 'resource_id,user_id',
            ignoreDuplicates: false,
          })
          .select();

        if (error) throw error;

        logger.log(`✅ Allocated resource to ${data?.length || 0} users`);

        // Refresh allocations
        await fetchAllocations(resourceId);

        return data;
      } catch (err) {
        logger.error('❌ Error allocating resource:', err);
        throw err;
      }
    },
    [fetchAllocations]
  );

  const removeAllocation = useCallback(async (allocationId: string) => {
    try {
      logger.log('🗑️ Removing resource allocation...', { allocationId });

      const { error } = await supabase
        .from('user_resource_allocations')
        .delete()
        .eq('id', allocationId);

      if (error) throw error;

      logger.log('✅ Allocation removed');

      // Update local state
      setState(prev => ({
        ...prev,
        allocations: prev.allocations.filter(a => a.id !== allocationId),
      }));
    } catch (err) {
      logger.error('❌ Error removing allocation:', err);
      throw err;
    }
  }, []);

  const uploadFile = useCallback(async (file: File, _resourceType: string) => {
    try {
      logger.log('📤 Uploading file...', { fileName: file.name, size: file.size });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage.from('user-resources').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      logger.log('✅ File uploaded:', data.path);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('user-resources').getPublicUrl(data.path);

      return {
        file_url: publicUrl,
        file_size: file.size,
        file_path: data.path,
      };
    } catch (err) {
      logger.error('❌ Error uploading file:', err);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Set up real-time subscriptions
  useEffect(() => {
    logger.log('👂 Setting up admin resource subscriptions...');

    const channel = supabase
      .channel('admin-resources')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_resources',
        },
        payload => {
          logger.log('🔔 Resource change detected:', payload.eventType);
          fetchResources();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_resource_allocations',
        },
        payload => {
          logger.log('🔔 Allocation change detected:', payload.eventType);
          fetchAllocations();
        }
      )
      .subscribe(status => {
        logger.log('📡 Admin resource subscription status:', status);
      });

    return () => {
      logger.log('🔌 Cleaning up admin resource subscriptions');
      supabase.removeChannel(channel);
    };
  }, [fetchResources, fetchAllocations]);

  return {
    resources: state.resources,
    allocations: state.allocations,
    loading: state.loading,
    error: state.error,
    fetchResources,
    fetchAllocations,
    createResource,
    updateResource,
    deleteResource,
    allocateResource,
    removeAllocation,
    uploadFile,
  };
};
