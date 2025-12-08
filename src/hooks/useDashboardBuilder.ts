/**
 * Dashboard Builder Hook
 *
 * Main hook for managing dashboard builder state and operations.
 * Combines configuration, widgets, drag-drop, and history management.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DashboardConfigService } from '@/services/dashboard/DashboardConfigService';
import type {
  DashboardConfig,
  DashboardWidget,
  BuilderMode,
  WidgetPosition,
  WidgetSize,
} from '@/types/dashboard';

interface UseDashboardBuilderOptions {
  userId: string;
  initialViewId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number; // milliseconds
}

export function useDashboardBuilder(options: UseDashboardBuilderOptions) {
  const { userId, initialViewId, autoSave = false, autoSaveDelay = 2000 } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================================================
  // State Management
  // ============================================================================

  const [mode, setMode] = useState<BuilderMode>('view');
  const [currentViewId, setCurrentViewId] = useState<string | null>(initialViewId || null);
  const [config, setConfig] = useState<DashboardConfig>({
    widgets: [],
    layout: 'grid',
    responsiveSettings: {
      mobile: { columns: 1 },
      tablet: { columns: 6 },
      desktop: { columns: 12 },
    },
  });
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<{
    past: DashboardConfig[];
    future: DashboardConfig[];
  }>({
    past: [],
    future: [],
  });

  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Query Keys
  // ============================================================================

  const queryKeys = {
    views: ['dashboard-views', userId] as const,
    view: (id: string) => ['dashboard-view', id] as const,
    defaultView: ['dashboard-default-view', userId] as const,
  };

  // ============================================================================
  // Queries
  // ============================================================================

  // Get all views
  const {
    data: views = [],
    isLoading: isLoadingViews,
    error: _viewsError,
  } = useQuery({
    queryKey: queryKeys.views,
    queryFn: () => DashboardConfigService.getUserViews(userId),
  });

  // Get current view
  const {
    data: currentView,
    isLoading: isLoadingView,
    error: _viewError,
  } = useQuery({
    queryKey: currentViewId ? queryKeys.view(currentViewId) : ['dashboard-view-null'],
    queryFn: () => (currentViewId ? DashboardConfigService.getView(currentViewId) : null),
    enabled: !!currentViewId,
  });

  // Get default view
  const { data: defaultView } = useQuery({
    queryKey: queryKeys.defaultView,
    queryFn: () => DashboardConfigService.getDefaultView(userId),
  });

  // ============================================================================
  // Mutations
  // ============================================================================

  // Create view
  const createViewMutation = useMutation({
    mutationFn: (data: { name: string; config: DashboardConfig }) =>
      DashboardConfigService.createView(userId, data.name, data.config),
    onSuccess: view => {
      queryClient.invalidateQueries({ queryKey: queryKeys.views });
      setCurrentViewId(view.id);
      setIsDirty(false);
      toast({ title: 'View created', description: `"${view.name}" has been created.` });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create view',
        variant: 'destructive',
      });
    },
  });

  // Update view
  const updateViewMutation = useMutation({
    mutationFn: (data: { viewId: string; updates: any }) =>
      DashboardConfigService.updateView(data.viewId, data.updates),
    onSuccess: view => {
      queryClient.invalidateQueries({ queryKey: queryKeys.views });
      queryClient.invalidateQueries({ queryKey: queryKeys.view(view.id) });
      setIsDirty(false);
      toast({ title: 'Saved', description: 'Your changes have been saved.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save view',
        variant: 'destructive',
      });
    },
  });

  // Delete view
  const deleteViewMutation = useMutation({
    mutationFn: (viewId: string) => DashboardConfigService.deleteView(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.views });
      setCurrentViewId(null);
      toast({ title: 'Deleted', description: 'View has been deleted.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete view',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // Effects
  // ============================================================================

  // Load config when current view changes
  useEffect(() => {
    if (currentView) {
      setConfig(currentView.config as DashboardConfig);
      setIsDirty(false);
      setHistory({ past: [], future: [] });
    }
  }, [currentView]);

  // Load default view if no view is selected
  useEffect(() => {
    if (!currentViewId && defaultView) {
      setCurrentViewId(defaultView.id);
    }
  }, [currentViewId, defaultView]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty || !currentViewId || mode !== 'edit') {
      return;
    }

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      handleSave();
    }, autoSaveDelay);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoSave, isDirty, config, currentViewId, mode]);

  // ============================================================================
  // Widget Operations
  // ============================================================================

  const addWidget = useCallback((widget: DashboardWidget) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        widgets: [...prev.widgets, widget],
      };

      // Add to history
      setHistory(h => ({
        past: [...h.past, prev],
        future: [],
      }));

      setIsDirty(true);
      return newConfig;
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        widgets: prev.widgets.filter(w => w.id !== widgetId),
      };

      setHistory(h => ({
        past: [...h.past, prev],
        future: [],
      }));

      setIsDirty(true);
      setSelectedWidgetId(null);
      return newConfig;
    });
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        widgets: prev.widgets.map(w => (w.id === widgetId ? { ...w, ...updates } : w)),
      };

      setHistory(h => ({
        past: [...h.past, prev],
        future: [],
      }));

      setIsDirty(true);
      return newConfig;
    });
  }, []);

  const moveWidget = useCallback(
    (widgetId: string, position: WidgetPosition) => {
      updateWidget(widgetId, { position });
    },
    [updateWidget]
  );

  const resizeWidget = useCallback(
    (widgetId: string, size: WidgetSize) => {
      updateWidget(widgetId, { size });
    },
    [updateWidget]
  );

  // ============================================================================
  // History Operations (Undo/Redo)
  // ============================================================================

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, h.past.length - 1);

      setConfig(previous);
      setIsDirty(true);

      return {
        past: newPast,
        future: [config, ...h.future],
      };
    });
  }, [config]);

  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;

      const next = h.future[0];
      const newFuture = h.future.slice(1);

      setConfig(next);
      setIsDirty(true);

      return {
        past: [...h.past, config],
        future: newFuture,
      };
    });
  }, [config]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // ============================================================================
  // View Operations
  // ============================================================================

  const handleSave = useCallback(async () => {
    if (!currentViewId) {
      toast({
        title: 'No view selected',
        description: 'Please create a view first',
        variant: 'destructive',
      });
      return;
    }

    updateViewMutation.mutate({
      viewId: currentViewId,
      updates: { config },
    });
  }, [currentViewId, config, updateViewMutation]);

  const handleSaveAs = useCallback(
    async (name: string) => {
      createViewMutation.mutate({ name, config });
    },
    [config, createViewMutation]
  );

  const handleLoadView = useCallback((viewId: string) => {
    setCurrentViewId(viewId);
  }, []);

  const handleDeleteView = useCallback(
    (viewId: string) => {
      deleteViewMutation.mutate(viewId);
    },
    [deleteViewMutation]
  );

  const handleSetDefault = useCallback(
    async (viewId: string) => {
      try {
        await DashboardConfigService.setAsDefault(viewId);
        queryClient.invalidateQueries({ queryKey: queryKeys.views });
        queryClient.invalidateQueries({ queryKey: queryKeys.defaultView });
        toast({ title: 'Success', description: 'Default view updated' });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to set default view',
          variant: 'destructive',
        });
      }
    },
    [queryClient, toast]
  );

  // ============================================================================
  // Mode Operations
  // ============================================================================

  const enterEditMode = useCallback(() => {
    setMode('edit');
  }, []);

  const enterViewMode = useCallback(() => {
    setMode('view');
    setSelectedWidgetId(null);
  }, []);

  const enterPreviewMode = useCallback(() => {
    setMode('preview');
    setSelectedWidgetId(null);
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    mode,
    currentView,
    currentViewId,
    views,
    config,
    selectedWidgetId,
    isDragging,
    isResizing,
    isDirty,

    // Loading states
    isLoading: isLoadingViews || isLoadingView,
    isSaving: updateViewMutation.isPending || createViewMutation.isPending,
    isDeleting: deleteViewMutation.isPending,

    // History
    canUndo,
    canRedo,
    undo,
    redo,

    // Widget operations
    addWidget,
    removeWidget,
    updateWidget,
    moveWidget,
    resizeWidget,
    selectWidget: setSelectedWidgetId,

    // View operations
    loadView: handleLoadView,
    save: handleSave,
    saveAs: handleSaveAs,
    deleteView: handleDeleteView,
    setAsDefault: handleSetDefault,

    // Mode operations
    enterEditMode,
    enterViewMode,
    enterPreviewMode,

    // Drag/Resize state
    setIsDragging,
    setIsResizing,

    // Config operations
    setConfig: (newConfig: DashboardConfig) => {
      setConfig(prev => {
        setHistory(h => ({
          past: [...h.past, prev],
          future: [],
        }));
        setIsDirty(true);
        return newConfig;
      });
    },
  };
}
