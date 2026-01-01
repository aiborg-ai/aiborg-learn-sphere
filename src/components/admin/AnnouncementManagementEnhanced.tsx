import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Edit, Plus, Trash2, AlertCircle } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
  is_active: boolean;
  created_by: string;
  audience?: string;
  created_at: string;
  updated_at: string;
}

interface AnnouncementManagementProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  userId: string;
  onRefresh: () => void;
}

export function AnnouncementManagementEnhanced({
  announcements,
  setAnnouncements,
  userId,
  onRefresh,
}: AnnouncementManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<{
    title: string;
    content: string;
    priority: number;
    audience: string;
    is_active: boolean;
  }>({
    defaultValues: {
      title: '',
      content: '',
      priority: 1,
      audience: 'all',
      is_active: true,
    },
  });

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    reset({
      title: '',
      content: '',
      priority: 1,
      audience: 'all',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    reset({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      audience: announcement.audience || 'all',
      is_active: announcement.is_active,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      if (editingAnnouncement?.id) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            title: data.title,
            content: data.content,
            priority: data.priority,
            audience: data.audience,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Announcement updated successfully',
        });
      } else {
        // Create new announcement
        const { error } = await supabase.from('announcements').insert({
          title: data.title,
          content: data.content,
          priority: data.priority,
          audience: data.audience,
          is_active: data.is_active,
          created_by: userId,
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Announcement created successfully',
        });
      }

      onRefresh();
      setIsDialogOpen(false);
      reset();
    } catch (_error) {
      logger.error('Error saving announcement:', _error);
      toast({
        title: 'Error',
        description: editingAnnouncement
          ? 'Failed to update announcement'
          : 'Failed to create announcement',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', deletingAnnouncement.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });

      onRefresh();
      setIsDeleteDialogOpen(false);
      setDeletingAnnouncement(null);
    } catch (_error) {
      logger.error('Error deleting announcement:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnnouncementStatus = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id);

      if (error) throw error;

      setAnnouncements(
        announcements.map(a => (a.id === announcement.id ? { ...a, is_active: !a.is_active } : a))
      );

      toast({
        title: 'Success',
        description: 'Announcement status updated',
      });
    } catch (_error) {
      logger.error('Error toggling announcement status:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement status',
        variant: 'destructive',
      });
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return <Badge className="bg-red-100 text-red-800">High</Badge>;
    if (priority === 2) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low</Badge>;
  };

  const getAudienceBadge = (audience?: string) => {
    const audienceMap: Record<string, string> = {
      all: 'Everyone',
      students: 'Students',
      instructors: 'Instructors',
      admin: 'Admins',
    };
    return <Badge variant="outline">{audienceMap[audience || 'all']}</Badge>;
  };

  // Sort announcements by priority (highest first), then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
              <CardDescription>Create and manage system-wide announcements</CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No announcements yet. Create your first announcement to notify users.
              </div>
            ) : (
              sortedAnnouncements.map(announcement => (
                <div
                  key={announcement.id}
                  className={`border rounded-lg p-4 ${
                    !announcement.is_active ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        {getPriorityBadge(announcement.priority)}
                        {getAudienceBadge(announcement.audience)}
                        {!announcement.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                      <p className="text-sm text-muted-foreground">
                        Created on {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={() => toggleAnnouncementStatus(announcement)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteDialog(announcement)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Important System Update"
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...register('content', { required: 'Content is required' })}
                placeholder="We'll be performing system maintenance..."
                rows={6}
              />
              {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  {...register('priority', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <select
                  id="audience"
                  {...register('audience')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Everyone</option>
                  <option value="students">Students Only</option>
                  <option value="instructors">Instructors Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                {...register('is_active')}
                defaultChecked={watch('is_active')}
              />
              <Label htmlFor="is_active">Active (announcement will be visible immediately)</Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Priority Guidelines:</p>
                <ul className="mt-1 space-y-1">
                  <li>
                    • <strong>High:</strong> Critical updates, emergencies
                  </li>
                  <li>
                    • <strong>Medium:</strong> Important notices, deadlines
                  </li>
                  <li>
                    • <strong>Low:</strong> General information, tips
                  </li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAnnouncement?.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
