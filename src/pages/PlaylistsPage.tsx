import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { usePlaylists } from '@/hooks/usePlaylists';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ListVideo,
  Plus,
  Trash2,
  Edit,
  Copy,
  Globe,
  Lock,
  Loader2,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaylistWithRelations } from '@/types/content-access';
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

export default function PlaylistsPage() {
  const navigate = useNavigate();
  const { playlists, loading, stats, createPlaylist, updatePlaylist, deletePlaylist, clonePlaylist } =
    usePlaylists();

  const [createDialog, setCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistWithRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = async () => {
    try {
      await createPlaylist({
        title,
        description: description || undefined,
        is_public: isPublic,
      });

      setCreateDialog(false);
      resetForm();
    } catch (error) {
      logger.error('Error creating playlist:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlaylist) return;

    try {
      await updatePlaylist(editingPlaylist.id, {
        title,
        description: description || undefined,
        is_public: isPublic,
      });

      setEditingPlaylist(null);
      resetForm();
    } catch (error) {
      logger.error('Error updating playlist:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlaylist(id);
      setDeleteId(null);
    } catch (error) {
      logger.error('Error deleting playlist:', error);
    }
  };

  const handleClone = async (playlistId: string, playlistTitle: string) => {
    try {
      await clonePlaylist(playlistId, `${playlistTitle} (Copy)`);
    } catch (error) {
      logger.error('Error cloning playlist:', error);
    }
  };

  const startEditing = (playlist: PlaylistWithRelations) => {
    setEditingPlaylist(playlist);
    setTitle(playlist.title);
    setDescription(playlist.description || '');
    setIsPublic(playlist.is_public);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            className="btn-outline-ai mb-4"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                <ListVideo className="inline h-8 w-8 mr-2" />
                My Playlists
              </h1>
              <p className="text-white/80">
                Create custom learning playlists from your course materials
              </p>
            </div>

            <div className="flex gap-3">
              {stats && (
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Playlists:</span>
                      <span className="font-bold">{stats.total_playlists}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Items:</span>
                      <span className="font-bold">{stats.total_items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span className="font-bold">{formatDuration(stats.total_duration)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={() => setCreateDialog(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Playlist
              </Button>
            </div>
          </div>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListVideo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't created any playlists yet
              </p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate flex items-center gap-2">
                        {playlist.title}
                        {playlist.is_public ? (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      {playlist.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {playlist.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Items</p>
                      <p className="text-xl font-bold">{playlist.item_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-xl font-bold">
                        {formatDuration(playlist.total_duration)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                      disabled={playlist.item_count === 0}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(playlist)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClone(playlist.id, playlist.title)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(playlist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialog || !!editingPlaylist}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialog(false);
            setEditingPlaylist(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
            </DialogTitle>
            <DialogDescription>
              {editingPlaylist
                ? 'Update your playlist details'
                : 'Create a custom learning playlist from your materials'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Learning Playlist"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this playlist about?"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public" className="cursor-pointer">
                Make this playlist public
              </Label>
            </div>
            {isPublic && (
              <p className="text-xs text-muted-foreground">
                Public playlists can be viewed and cloned by other users
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialog(false);
                setEditingPlaylist(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingPlaylist ? handleUpdate : handleCreate}
              disabled={!title.trim()}
            >
              {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this playlist and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
