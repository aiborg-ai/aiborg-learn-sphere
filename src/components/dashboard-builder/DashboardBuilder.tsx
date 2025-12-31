import { logger } from '@/utils/logger';
/**
 * Dashboard Builder
 *
 * Main orchestrator component for the custom dashboard builder
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Edit3,
  Save,
  Undo2,
  Redo2,
  LayoutGrid,
  Share2,
  Download,
  Upload,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DashboardCanvas } from './DashboardCanvas';
import { WidgetPalette } from './WidgetPalette';
import { WidgetEditor } from './WidgetEditor';
import { ViewManager } from './ViewManager';
import { ShareDialog } from './ShareDialog';
import { OnboardingTour } from './OnboardingTour';
import { useDashboardBuilder } from '@/hooks/useDashboardBuilder';
import { WidgetRegistry } from '@/services/dashboard/WidgetRegistry';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardWidget, WidgetType } from '@/types/dashboard';

type BuilderMode = 'view' | 'edit' | 'preview';

interface DashboardBuilderProps {
  initialViewId?: string;
  className?: string;
}

export function DashboardBuilder({ initialViewId, className }: DashboardBuilderProps) {
  const [mode, setMode] = useState<BuilderMode>('view');
  const [currentViewId, setCurrentViewId] = useState<string | null>(initialViewId || null);
  const [showViewManager, setShowViewManager] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('dashboard-builder-onboarding-complete');
    if (!hasSeenOnboarding && currentViewId) {
      setShowOnboarding(true);
    }
  }, [currentViewId]);

  // Initialize dashboard builder hook
  const {
    config,
    isDirty,
    canUndo,
    canRedo,
    addWidget,
    removeWidget,
    updateWidget,
    moveWidget,
    resizeWidget,
    undo,
    redo,
    save,
    load,
  } = useDashboardBuilder({
    viewId: currentViewId || undefined,
    autoSave: false,
  });

  // Load default view on mount
  const { data: defaultView } = useQuery({
    queryKey: ['default-dashboard-view'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('custom_dashboard_views')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      return data;
    },
    enabled: !currentViewId,
  });

  // Fetch current view data for sharing
  const { data: currentView } = useQuery({
    queryKey: ['dashboard-view', currentViewId],
    queryFn: async () => {
      if (!currentViewId) return null;

      const { data } = await supabase
        .from('custom_dashboard_views')
        .select('*')
        .eq('id', currentViewId)
        .single();

      return data;
    },
    enabled: !!currentViewId,
  });

  // Set default view when loaded
  useEffect(() => {
    if (defaultView && !currentViewId) {
      setCurrentViewId(defaultView.id);
    }
  }, [defaultView, currentViewId]);

  // Load view when currentViewId changes
  useEffect(() => {
    if (currentViewId) {
      load(currentViewId);
    }
  }, [currentViewId, load]);

  const handleModeChange = useCallback(
    (newMode: BuilderMode) => {
      if (mode === 'edit' && isDirty) {
        const confirm = window.confirm(
          'You have unsaved changes. Do you want to save before switching modes?'
        );
        if (confirm) {
          save();
        }
      }
      setMode(newMode);
    },
    [mode, isDirty, save]
  );

  const handleAddWidget = useCallback(
    (type: WidgetType) => {
      const widgetDef = WidgetRegistry.get(type);
      if (!widgetDef) {
        toast.error('Widget type not found');
        return;
      }

      // Find empty spot in grid
      const existingWidgets = config.widgets;
      let positionY = 0;

      if (existingWidgets.length > 0) {
        const maxY = Math.max(...existingWidgets.map(w => w.position.y + w.size.height));
        positionY = maxY;
      }

      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        position: { x: 0, y: positionY },
        size: { ...widgetDef.defaultSize },
        config: { ...widgetDef.defaultConfig },
      };

      addWidget(newWidget);
      toast.success(`${widgetDef.name} added to dashboard`);

      // Switch to edit mode if not already
      if (mode === 'view') {
        setMode('edit');
      }
    },
    [config.widgets, addWidget, mode]
  );

  const handleSave = useCallback(async () => {
    try {
      await save();
      toast.success('Dashboard saved successfully');
    } catch (_error) {
      toast._error('Failed to save dashboard');
      logger.error('Save error:', error);
    }
  }, [save]);

  const handleViewSelect = useCallback((viewId: string) => {
    setCurrentViewId(viewId);
  }, []);

  const handleViewCreate = useCallback((viewId: string) => {
    setCurrentViewId(viewId);
    setShowViewManager(false);
    setMode('edit');
  }, []);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Dashboard configuration exported');
  }, [config]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedConfig = JSON.parse(text);

        // Validate config structure
        if (!importedConfig.widgets || !Array.isArray(importedConfig.widgets)) {
          throw new Error('Invalid configuration format');
        }

        // Load imported config
        config.widgets = importedConfig.widgets;
        config.layout = importedConfig.layout || 'grid';
        config.responsiveSettings = importedConfig.responsiveSettings || config.responsiveSettings;

        toast.success('Dashboard configuration imported');
        setMode('edit');
      } catch (_error) {
        toast._error('Failed to import configuration');
        logger.error('Import error:', error);
      }
    };
    input.click();
  }, [config]);

  const _handleWidgetEdit = useCallback((widget: DashboardWidget) => {
    setSelectedWidget(widget);
    setShowWidgetEditor(true);
  }, []);

  return (
    <div className={cn('flex flex-col h-screen bg-background', className)}>
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dashboard Builder</h1>
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/50">
            <Button
              size="sm"
              variant={mode === 'view' ? 'default' : 'ghost'}
              onClick={() => handleModeChange('view')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              size="sm"
              variant={mode === 'edit' ? 'default' : 'ghost'}
              onClick={() => handleModeChange('edit')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>

          {/* Actions */}
          {mode === 'edit' && (
            <>
              <div className="h-6 w-px bg-border" />

              <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} title="Undo">
                <Undo2 className="h-4 w-4" />
              </Button>

              <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo} title="Redo">
                <Redo2 className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-border" />
            </>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowViewManager(true)}
            title="Manage views"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          <Button size="sm" variant="ghost" onClick={handleExport} title="Export configuration">
            <Download className="h-4 w-4" />
          </Button>

          <Button size="sm" variant="ghost" onClick={handleImport} title="Import configuration">
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowShareDialog(true)}
            disabled={!currentViewId}
            title="Share dashboard"
            className="share-button"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {mode === 'edit' && (
            <>
              <div className="h-6 w-px bg-border" />

              <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Widget palette - only in edit mode */}
        {mode === 'edit' && (
          <aside className="w-80 border-r bg-card widget-palette">
            <WidgetPalette onAddWidget={handleAddWidget} />
          </aside>
        )}

        {/* Canvas */}
        <main className="flex-1 overflow-auto p-6">
          {!currentViewId && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">No Dashboard View Selected</h2>
                <p className="text-muted-foreground mb-4">
                  Create or select a dashboard view to get started
                </p>
                <Button onClick={() => setShowViewManager(true)}>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Manage Views
                </Button>
              </div>
            </div>
          )}

          {currentViewId && (
            <DashboardCanvas
              config={config}
              isEditing={mode === 'edit'}
              onWidgetMove={moveWidget}
              onWidgetResize={resizeWidget}
              onWidgetRemove={removeWidget}
              onWidgetUpdate={updateWidget}
              className="max-w-7xl mx-auto dashboard-canvas"
            />
          )}
        </main>
      </div>

      {/* Dialogs */}
      <ViewManager
        currentViewId={currentViewId}
        isOpen={showViewManager}
        onClose={() => setShowViewManager(false)}
        onViewSelect={handleViewSelect}
        onViewCreate={handleViewCreate}
      />

      <WidgetEditor
        widget={selectedWidget}
        isOpen={showWidgetEditor}
        onClose={() => {
          setShowWidgetEditor(false);
          setSelectedWidget(null);
        }}
        onSave={updateWidget}
      />

      <ShareDialog
        view={currentView || null}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />

      <OnboardingTour
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          localStorage.setItem('dashboard-builder-onboarding-complete', 'true');
          toast.success('Welcome! Start building your custom dashboard.');
        }}
        onSkip={() => {
          setShowOnboarding(false);
          localStorage.setItem('dashboard-builder-onboarding-complete', 'true');
        }}
      />
    </div>
  );
}

export default DashboardBuilder;
