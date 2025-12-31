/**
 * useCustomViews Hook
 * Manages custom dashboard views with CRUD operations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CustomViewsService,
  type CustomView,
  type ViewConfig,
} from '@/services/analytics/CustomViewsService';
import { logger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

/**
 * Query keys for custom views
 */
export const customViewsKeys = {
  all: ['custom-views'] as const,
  list: (userId: string) => [...customViewsKeys.all, 'list', userId] as const,
  detail: (viewId: string) => [...customViewsKeys.all, 'detail', viewId] as const,
};

export interface UseCustomViewsReturn {
  views: CustomView[];
  currentView: CustomView | null;
  isLoading: boolean;
  error: Error | null;
  createView: (name: string, config: ViewConfig) => Promise<CustomView | undefined>;
  updateView: (
    viewId: string,
    name?: string,
    config?: ViewConfig
  ) => Promise<CustomView | undefined>;
  deleteView: (viewId: string) => Promise<void>;
  loadView: (viewId: string) => Promise<void>;
  saveCurrentView: (name: string, config: ViewConfig) => Promise<CustomView | undefined>;
  canCreateMore: boolean;
  viewCount: number;
}

/**
 * Hook for managing custom dashboard views
 *
 * Features:
 * - CRUD operations for custom views
 * - 10 view limit enforcement
 * - Duplicate name validation
 * - Loading and error states
 * - React Query integration with optimistic updates
 *
 * @example
 * ```tsx
 * const { views, createView, loadView, canCreateMore } = useCustomViews(userId);
 *
 * // Check if user can create more views
 * if (!canCreateMore) {
 *   logger.warn('Maximum of 10 views reached');
 * }
 *
 * // Create a new view
 * await createView('My Dashboard', {
 *   dateRange: { start: '2025-01-01', end: '2025-01-31', preset: 'last30days' },
 *   activeTab: 'overview',
 *   visibleMetrics: ['revenue', 'users'],
 *   autoRefresh: { enabled: true, interval: 300000 }
 * });
 *
 * // Load a view
 * await loadView(viewId);
 * ```
 *
 * @param userId - User ID to fetch views for
 * @returns Custom views state and operations
 */
export function useCustomViews(userId: string): UseCustomViewsReturn {
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<CustomView | null>(null);

  /**
   * Fetch all views for user
   */
  const {
    data: views = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: customViewsKeys.list(userId),
    queryFn: () => CustomViewsService.getViews(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Create view mutation
   */
  const createMutation = useMutation({
    mutationFn: ({ name, config }: { name: string; config: ViewConfig }) =>
      CustomViewsService.createView(userId, name, config),
    onSuccess: newView => {
      // Update cache with new view
      queryClient.setQueryData<CustomView[]>(customViewsKeys.list(userId), (old = []) => [
        ...old,
        newView,
      ]);

      toast({
        title: 'View Created',
        description: `"${newView.name}" has been saved successfully.`,
      });

      logger.info('Custom view created', { viewId: newView.id, name: newView.name });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Create View',
        description: error.message,
      });

      logger.error('Failed to create custom view:', error);
    },
  });

  /**
   * Update view mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({
      viewId,
      name,
      config,
    }: {
      viewId: string;
      name?: string;
      config?: ViewConfig;
    }) => CustomViewsService.updateView(viewId, name, config),
    onSuccess: updatedView => {
      // Update cache with modified view
      queryClient.setQueryData<CustomView[]>(customViewsKeys.list(userId), (old = []) =>
        old.map(view => (view.id === updatedView.id ? updatedView : view))
      );

      // Update current view if it's the one being edited
      if (currentView?.id === updatedView.id) {
        setCurrentView(updatedView);
      }

      toast({
        title: 'View Updated',
        description: `"${updatedView.name}" has been updated successfully.`,
      });

      logger.info('Custom view updated', { viewId: updatedView.id, name: updatedView.name });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Update View',
        description: error.message,
      });

      logger.error('Failed to update custom view:', error);
    },
  });

  /**
   * Delete view mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (viewId: string) => CustomViewsService.deleteView(viewId),
    onSuccess: (_, viewId) => {
      // Remove from cache
      queryClient.setQueryData<CustomView[]>(customViewsKeys.list(userId), (old = []) =>
        old.filter(view => view.id !== viewId)
      );

      // Clear current view if it's the one being deleted
      if (currentView?.id === viewId) {
        setCurrentView(null);
      }

      toast({
        title: 'View Deleted',
        description: 'Custom view has been removed.',
      });

      logger.info('Custom view deleted', { viewId });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Delete View',
        description: error.message,
      });

      logger.error('Failed to delete custom view:', error);
    },
  });

  /**
   * Create a new view
   */
  const createView = useCallback(
    async (name: string, config: ViewConfig): Promise<CustomView | undefined> => {
      try {
        // Check view limit
        if (views.length >= 10) {
          toast({
            variant: 'destructive',
            title: 'View Limit Reached',
            description: 'Maximum of 10 views allowed. Please delete an existing view first.',
          });
          return undefined;
        }

        // Check for duplicate names
        const duplicate = views.find(v => v.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
          toast({
            variant: 'destructive',
            title: 'Duplicate Name',
            description: `A view named "${name}" already exists. Please choose a different name.`,
          });
          return undefined;
        }

        return await createMutation.mutateAsync({ name, config });
      } catch (_error) {
        logger._error('Error in createView:', _error);
        return undefined;
      }
    },
    [views, createMutation]
  );

  /**
   * Update an existing view
   */
  const updateView = useCallback(
    async (viewId: string, name?: string, config?: ViewConfig): Promise<CustomView | undefined> => {
      try {
        // Check for duplicate names if name is being changed
        if (name) {
          const duplicate = views.find(
            v => v.id !== viewId && v.name.toLowerCase() === name.toLowerCase()
          );
          if (duplicate) {
            toast({
              variant: 'destructive',
              title: 'Duplicate Name',
              description: `A view named "${name}" already exists. Please choose a different name.`,
            });
            return undefined;
          }
        }

        return await updateMutation.mutateAsync({ viewId, name, config });
      } catch (_error) {
        logger._error('Error in updateView:', _error);
        return undefined;
      }
    },
    [views, updateMutation]
  );

  /**
   * Delete a view
   */
  const deleteView = useCallback(
    async (viewId: string): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(viewId);
      } catch (_error) {
        logger._error('Error in deleteView:', _error);
      }
    },
    [deleteMutation]
  );

  /**
   * Load a view and set it as current
   */
  const loadView = useCallback(async (viewId: string): Promise<void> => {
    try {
      const view = await CustomViewsService.getView(viewId);
      if (view) {
        setCurrentView(view);
        logger.info('Custom view loaded', { viewId, name: view.name });
      } else {
        toast({
          variant: 'destructive',
          title: 'View Not Found',
          description: 'The requested view could not be found.',
        });
      }
    } catch (_error) {
      logger._error('Error loading view:', _error);
      toast({
        variant: 'destructive',
        title: 'Failed to Load View',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, []);

  /**
   * Save current dashboard state as a new view or update existing view
   */
  const saveCurrentView = useCallback(
    async (name: string, config: ViewConfig): Promise<CustomView | undefined> => {
      // Check if a view with this name exists
      const existingView = views.find(v => v.name.toLowerCase() === name.toLowerCase());

      if (existingView) {
        // Update existing view
        return await updateView(existingView.id, undefined, config);
      } else {
        // Create new view
        return await createView(name, config);
      }
    },
    [views, createView, updateView]
  );

  const canCreateMore = views.length < 10;
  const viewCount = views.length;

  return {
    views,
    currentView,
    isLoading,
    error: error as Error | null,
    createView,
    updateView,
    deleteView,
    loadView,
    saveCurrentView,
    canCreateMore,
    viewCount,
  };
}

/**
 * Get default view configuration
 */
export function getDefaultViewConfig(): ViewConfig {
  return CustomViewsService.getDefaultConfig();
}
