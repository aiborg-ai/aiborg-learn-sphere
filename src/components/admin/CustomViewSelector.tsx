/**
 * CustomViewSelector Component
 * Manages custom dashboard view configurations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useCustomViews, getDefaultViewConfig } from '@/hooks/useCustomViews';
import { useAuth } from '@/hooks/useAuth';
import type { ViewConfig } from '@/services/analytics/CustomViewsService';
import { Save, Trash2, Edit2, Eye, Plus } from 'lucide-react';

export interface CustomViewSelectorProps {
  currentConfig: ViewConfig;
  onViewLoad?: (config: ViewConfig) => void;
  className?: string;
}

/**
 * CustomViewSelector component for managing dashboard views
 *
 * Features:
 * - Dropdown to select saved views
 * - "Save Current View" button with name input dialog
 * - Rename/Delete actions for each view
 * - "Default View" always available
 * - 10 view limit enforcement
 *
 * @example
 * ```tsx
 * <CustomViewSelector
 *   currentConfig={currentDashboardConfig}
 *   onViewLoad={(config) => {
 *     applyViewConfig(config);
 *   }}
 * />
 * ```
 */
export function CustomViewSelector({
  currentConfig,
  onViewLoad,
  className,
}: CustomViewSelectorProps) {
  const { user } = useAuth();
  const userId = user?.id || '';

  const {
    views,
    currentView,
    isLoading,
    createView,
    updateView,
    deleteView,
    loadView,
    canCreateMore,
    viewCount,
  } = useCustomViews(userId);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const [viewName, setViewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle view selection
   */
  const handleViewSelect = async (viewId: string) => {
    if (viewId === 'default') {
      const defaultConfig = getDefaultViewConfig();
      if (onViewLoad) {
        onViewLoad(defaultConfig);
      }
      return;
    }

    await loadView(viewId);
    const view = views.find(v => v.id === viewId);
    if (view && onViewLoad) {
      onViewLoad(view.config);
    }
  };

  /**
   * Handle save current view
   */
  const handleSaveView = async () => {
    if (!viewName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await createView(viewName.trim(), currentConfig);
      setShowSaveDialog(false);
      setViewName('');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle rename view
   */
  const handleRenameView = async () => {
    if (!selectedViewId || !viewName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await updateView(selectedViewId, viewName.trim());
      setShowRenameDialog(false);
      setViewName('');
      setSelectedViewId('');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle delete view
   */
  const handleDeleteView = async () => {
    if (!selectedViewId) {
      return;
    }

    await deleteView(selectedViewId);
    setShowDeleteDialog(false);
    setSelectedViewId('');
  };

  /**
   * Open rename dialog
   */
  const openRenameDialog = (viewId: string, currentName: string) => {
    setSelectedViewId(viewId);
    setViewName(currentName);
    setShowRenameDialog(true);
  };

  /**
   * Open delete dialog
   */
  const openDeleteDialog = (viewId: string) => {
    setSelectedViewId(viewId);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Dashboard Views</CardTitle>
              <CardDescription className="text-xs">
                Save and load custom dashboard configurations
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              {viewCount} / 10 views
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Selector */}
          <div className="space-y-2">
            <Label htmlFor="view-select" className="text-sm">
              Select View
            </Label>
            <Select
              value={currentView?.id || 'default'}
              onValueChange={handleViewSelect}
              disabled={isLoading}
            >
              <SelectTrigger id="view-select" className="w-full">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Default View
                  </div>
                </SelectItem>
                {views.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    {view.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Current View Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={!canCreateMore}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Current View
          </Button>

          {/* Saved Views Management */}
          {views.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Manage Views</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {views.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="text-sm truncate flex-1">{view.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRenameDialog(view.id, view.name)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(view.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!canCreateMore && (
            <p className="text-xs text-muted-foreground text-center">
              Maximum of 10 views reached. Delete a view to create a new one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save View Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Give your custom dashboard configuration a name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                placeholder="e.g., Q1 Revenue Focus"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && viewName.trim()) {
                    handleSaveView();
                  }
                }}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {viewName.length} / 100 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView} disabled={!viewName.trim() || isSaving}>
              {isSaving ? 'Saving...' : 'Save View'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename View Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename View</DialogTitle>
            <DialogDescription>Enter a new name for this view</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-view">View Name</Label>
              <Input
                id="rename-view"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && viewName.trim()) {
                    handleRenameView();
                  }
                }}
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameView} disabled={!viewName.trim() || isSaving}>
              {isSaving ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this view? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteView} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
