import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useWatchLater } from '@/hooks/useWatchLater';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Clock,
  Trash2,
  Play,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  Edit,
  Save,
  X,
  Loader2,
  Video,
  FileText,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { WatchLaterWithRelations } from '@/types/content-access';
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

export default function WatchLaterPage() {
  const navigate = useNavigate();
  const { queue, loading, removeFromQueue, moveUp, moveDown, moveToTop, clearQueue, updateNote } =
    useWatchLater();

  const [clearDialog, setClearDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const handlePlayNext = () => {
    if (queue.length > 0) {
      const firstItem = queue[0];
      if (firstItem.course_id) {
        navigate(`/course/${firstItem.course_id}?material=${firstItem.material_id}`);
      }
    }
  };

  const handlePlayItem = (item: WatchLaterWithRelations) => {
    if (item.course_id) {
      navigate(`/course/${item.course_id}?material=${item.material_id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeFromQueue(id);
      setDeleteId(null);
    } catch {
      logger.error('Error removing from queue:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearQueue();
      setClearDialog(false);
    } catch {
      logger.error('Error clearing queue:', error);
    }
  };

  const startEditing = (item: WatchLaterWithRelations) => {
    setEditingId(item.id);
    setEditNote(item.note || '');
  };

  const saveNote = async (id: string) => {
    try {
      await updateNote(id, editNote);
      setEditingId(null);
      setEditNote('');
    } catch {
      logger.error('Error updating note:', error);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNote('');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
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
                <Clock className="inline h-8 w-8 mr-2" />
                Watch Later Queue
              </h1>
              <p className="text-white/80">Your queue of materials to watch in order</p>
            </div>

            {queue.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handlePlayNext}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Play Next
                </Button>
                <Button variant="destructive" size="lg" onClick={() => setClearDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Queue
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Queue Stats */}
        {queue.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Queue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Items in Queue</p>
                  <p className="text-2xl font-bold">{queue.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                  <p className="text-2xl font-bold">
                    {formatDuration(
                      queue.reduce((sum, item) => sum + (item.material?.duration || 0), 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Up Next</p>
                  <p className="text-xl font-medium truncate">
                    {queue[0]?.material?.title || 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        <Card>
          <CardHeader>
            <CardTitle>Queue ({queue.length} items)</CardTitle>
            <CardDescription>
              Items will play in order. Drag to reorder or use the controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Your watch later queue is empty</p>
                <Button onClick={() => navigate('/dashboard')}>Browse Materials</Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {queue.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        'group border rounded-lg p-4 transition-colors',
                        index === 0 && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Position */}
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={index === 0 ? 'default' : 'secondary'}
                            className="w-8 h-8 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => moveToTop(item.id)}
                                  title="Move to top"
                                >
                                  <ChevronsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => moveUp(item.id)}
                                  title="Move up"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {index < queue.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => moveDown(item.id)}
                                title="Move down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            {item.material?.material_type === 'recording' ? (
                              // eslint-disable-next-line jsx-a11y/media-has-caption
                              <Video className="h-5 w-5 text-blue-500 mt-0.5" />
                            ) : (
                              <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {item.material?.title || 'Unknown Material'}
                              </h3>
                              {item.material?.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {item.material.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.material?.material_type || 'unknown'}
                                </Badge>
                                {item.material?.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDuration(item.material.duration)}
                                  </span>
                                )}
                                {item.course?.title && (
                                  <span className="text-xs text-muted-foreground">
                                    {item.course.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Note */}
                          {editingId === item.id ? (
                            <div className="space-y-2 mt-3">
                              <Textarea
                                value={editNote}
                                onChange={e => setEditNote(e.target.value)}
                                placeholder="Add a note..."
                                rows={2}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveNote(item.id)}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : item.note ? (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <p className="text-muted-foreground">{item.note}</p>
                            </div>
                          ) : null}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {!editingId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(item)}
                              title="Add/edit note"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="default" size="sm" onClick={() => handlePlayItem(item)}>
                            <Play className="h-4 w-4 mr-1" />
                            Play
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Single Item Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this item from your watch later queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={clearDialog} onOpenChange={setClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Entire Queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all items from your watch later queue. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
