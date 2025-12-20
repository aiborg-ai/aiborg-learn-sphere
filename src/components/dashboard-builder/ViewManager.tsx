/**
 * View Manager
 *
 * Dialog for managing dashboard views (create, rename, delete, switch)
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus, Trash2, Edit2, Check, X, Star, Copy } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DashboardConfigService } from '@/services/dashboard/DashboardConfigService';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardView } from '@/types/dashboard';

interface ViewManagerProps {
  currentViewId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onViewSelect: (viewId: string) => void;
  onViewCreate: (name: string) => void;
}

export function ViewManager({
  currentViewId,
  isOpen,
  onClose,
  onViewSelect,
  onViewCreate,
}: ViewManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);

  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Handle focus for create input
  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  // Handle focus for edit input
  useEffect(() => {
    if (editingViewId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingViewId]);

  // Fetch all views for current user
  const { data: views, isLoading } = useQuery({
    queryKey: ['dashboard-views'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      return await DashboardConfigService.listViews(user.id);
    },
    enabled: isOpen,
  });

  // Create view mutation
  const createViewMutation = useMutation({
    mutationFn: async (name: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      return await DashboardConfigService.createView(user.id, name, {
        widgets: [],
        layout: 'grid',
        responsiveSettings: {
          mobile: { columns: 1 },
          tablet: { columns: 6 },
          desktop: { columns: 12 },
        },
      });
    },
    onSuccess: newView => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-views'] });
      toast.success('View created successfully');
      setIsCreating(false);
      setNewViewName('');
      onViewCreate(newView.id);
    },
    onError: () => {
      toast.error('Failed to create view');
    },
  });

  // Rename view mutation
  const renameViewMutation = useMutation({
    mutationFn: async ({ viewId, name }: { viewId: string; name: string }) => {
      const { error } = await supabase
        .from('custom_dashboard_views')
        .update({ name })
        .eq('id', viewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-views'] });
      toast.success('View renamed successfully');
      setEditingViewId(null);
      setEditingName('');
    },
    onError: () => {
      toast.error('Failed to rename view');
    },
  });

  // Delete view mutation
  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: string) => {
      await DashboardConfigService.deleteView(viewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-views'] });
      toast.success('View deleted successfully');
      setDeletingViewId(null);

      // If deleted view was current, select first available view
      if (deletingViewId === currentViewId && views && views.length > 1) {
        const nextView = views.find(v => v.id !== deletingViewId);
        if (nextView) {
          onViewSelect(nextView.id);
        }
      }
    },
    onError: () => {
      toast.error('Failed to delete view');
    },
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (viewId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Clear all defaults first
      await supabase
        .from('custom_dashboard_views')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('custom_dashboard_views')
        .update({ is_default: true })
        .eq('id', viewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-views'] });
      toast.success('Default view updated');
    },
    onError: () => {
      toast.error('Failed to set default view');
    },
  });

  // Duplicate view mutation
  const duplicateViewMutation = useMutation({
    mutationFn: async (viewId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const view = views?.find(v => v.id === viewId);
      if (!view) throw new Error('View not found');

      return await DashboardConfigService.createView(user.id, `${view.name} (Copy)`, view.config);
    },
    onSuccess: newView => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-views'] });
      toast.success('View duplicated successfully');
      onViewSelect(newView.id);
    },
    onError: () => {
      toast.error('Failed to duplicate view');
    },
  });

  const handleCreateView = () => {
    if (!newViewName.trim()) {
      toast.error('Please enter a view name');
      return;
    }
    createViewMutation.mutate(newViewName.trim());
  };

  const handleRenameView = (viewId: string) => {
    if (!editingName.trim()) {
      toast.error('Please enter a view name');
      return;
    }
    renameViewMutation.mutate({ viewId, name: editingName.trim() });
  };

  const handleDeleteView = () => {
    if (!deletingViewId) return;
    deleteViewMutation.mutate(deletingViewId);
  };

  const startEditing = (view: DashboardView) => {
    setEditingViewId(view.id);
    setEditingName(view.name);
  };

  const cancelEditing = () => {
    setEditingViewId(null);
    setEditingName('');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Manage Dashboard Views
            </DialogTitle>
            <DialogDescription>
              Create, organize, and switch between different dashboard layouts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new view */}
            <div className="flex gap-2">
              {isCreating ? (
                <>
                  <Input
                    ref={createInputRef}
                    placeholder="Enter view name..."
                    value={newViewName}
                    onChange={e => setNewViewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateView();
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewViewName('');
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleCreateView}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                      setNewViewName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsCreating(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New View
                </Button>
              )}
            </div>

            {/* Views list */}
            <ScrollArea className="h-[400px] border rounded-lg">
              {isLoading && (
                <div className="p-8 text-center text-muted-foreground">Loading views...</div>
              )}

              {!isLoading && views && views.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No dashboard views yet</p>
                  <p className="text-xs mt-1">Create your first view to get started</p>
                </div>
              )}

              {!isLoading && views && views.length > 0 && (
                <div className="p-2 space-y-2">
                  {views.map(view => (
                    <div
                      key={view.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        currentViewId === view.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      )}
                    >
                      {editingViewId === view.id ? (
                        <>
                          <Input
                            ref={editInputRef}
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameView(view.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRenameView(view.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="flex-1 min-w-0 cursor-pointer bg-transparent border-0 p-0 text-left"
                            onClick={() => {
                              onViewSelect(view.id);
                              onClose();
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{view.name}</p>
                              {view.is_default && (
                                <Badge variant="secondary" className="shrink-0">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                              {currentViewId === view.id && (
                                <Badge variant="default" className="shrink-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {view.config.widgets.length} widgets •{' '}
                              {new Date(view.updated_at).toLocaleDateString()}
                            </p>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {!view.is_default && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setDefaultMutation.mutate(view.id)}
                                title="Set as default"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => duplicateViewMutation.mutate(view.id)}
                              title="Duplicate view"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEditing(view)}
                              title="Rename view"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingViewId(view.id)}
                              title="Delete view"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingViewId} onOpenChange={() => setDeletingViewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dashboard View?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this dashboard view and all
              its widgets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteView}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ViewManager;
