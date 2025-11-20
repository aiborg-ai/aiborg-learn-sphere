import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Save, X, FileText } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface PDFAnnotation {
  id: string;
  page: number;
  text: string;
  highlight?: string;
  position: { x: number; y: number };
  created_at: string;
}

interface PDFAnnotationsProps {
  contentId: string;
  annotations: PDFAnnotation[];
  currentPage: number;
  onAnnotationClick: (page: number) => void;
  onAnnotationsChange: () => void;
}

export function PDFAnnotations({
  contentId,
  annotations,
  currentPage,
  onAnnotationClick,
  onAnnotationsChange,
}: PDFAnnotationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [noteText, setNoteText] = useState('');
  const [highlightText, setHighlightText] = useState('');

  const handleAddAnnotation = async () => {
    if (!user || !noteText.trim()) return;

    try {
      const { error } = await supabase.from('shared_content').insert({
        owner_id: user.id,
        content_type: 'pdf_annotation',
        title: `Note on page ${currentPage}`,
        description: noteText,
        content_data: {
          pdf_id: contentId,
          page: currentPage,
          text: noteText,
          highlight: highlightText || null,
          position: { x: 0, y: 0 }, // Future: capture actual position
        },
        visibility: 'private',
      });

      if (error) throw error;

      toast({
        title: 'Annotation Added',
        description: 'Your note has been saved',
      });

      // Reset form
      setNoteText('');
      setHighlightText('');
      setIsAdding(false);

      // Refresh annotations
      onAnnotationsChange();
    } catch (err) {
      logger.error('Error adding annotation:', err);
      toast({
        title: 'Error',
        description: 'Failed to add annotation',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAnnotation = async (id: string) => {
    if (!user || !noteText.trim()) return;

    try {
      const annotation = annotations.find(a => a.id === id);
      if (!annotation) return;

      const { error } = await supabase
        .from('shared_content')
        .update({
          description: noteText,
          content_data: {
            ...annotation,
            text: noteText,
            highlight: highlightText || null,
          },
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Annotation Updated',
        description: 'Your note has been updated',
      });

      // Reset form
      setNoteText('');
      setHighlightText('');
      setEditingId(null);

      // Refresh annotations
      onAnnotationsChange();
    } catch (err) {
      logger.error('Error updating annotation:', err);
      toast({
        title: 'Error',
        description: 'Failed to update annotation',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('shared_content').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Annotation Deleted',
        description: 'Your note has been removed',
      });

      setDeleteId(null);
      onAnnotationsChange();
    } catch (err) {
      logger.error('Error deleting annotation:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete annotation',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (annotation: PDFAnnotation) => {
    setEditingId(annotation.id);
    setNoteText(annotation.text);
    setHighlightText(annotation.highlight || '');
    setIsAdding(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNoteText('');
    setHighlightText('');
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setNoteText('');
    setHighlightText('');
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNoteText('');
    setHighlightText('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add Note Button */}
      <div className="p-3 border-b">
        {!isAdding && !editingId && (
          <Button onClick={startAdding} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Note on Page {currentPage}
          </Button>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isAdding ? `New Note (Page ${currentPage})` : 'Edit Note'}
              </span>
              <Button variant="ghost" size="sm" onClick={isAdding ? cancelAdding : cancelEditing}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Highlighted text (optional)"
                value={highlightText}
                onChange={e => setHighlightText(e.target.value)}
                className="text-sm"
              />

              <Textarea
                placeholder="Your note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="text-sm min-h-[100px]"
              />

              <Button
                onClick={isAdding ? handleAddAnnotation : () => handleUpdateAnnotation(editingId!)}
                className="w-full"
                size="sm"
                disabled={!noteText.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isAdding ? 'Add Note' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Annotations List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {annotations.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No annotations yet. Add notes to remember important parts!
              </p>
            </div>
          )}

          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className={`border rounded-lg p-3 transition-colors ${
                annotation.page === currentPage
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={() => onAnnotationClick(annotation.page)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Page {annotation.page}
                </button>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => startEditing(annotation)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => setDeleteId(annotation.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Highlighted Text */}
              {annotation.highlight && (
                <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs italic">
                  "{annotation.highlight}"
                </div>
              )}

              {/* Note Text */}
              <p className="text-sm text-muted-foreground mb-2">{annotation.text}</p>

              {/* Date */}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">{formatDate(annotation.created_at)}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Annotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this annotation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteAnnotation(deleteId)}
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
