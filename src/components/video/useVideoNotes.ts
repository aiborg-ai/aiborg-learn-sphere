import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import type { Note } from './types';

interface User {
  id: string;
  email?: string;
}

export function useVideoNotes(user: User | null, contentId: string, courseId?: number) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadNotes = useCallback(async () => {
    if (!user || !contentId) return;

    try {
      const { data } = await supabase
        .from('shared_content')
        .select('*')
        .eq('owner_id', user.id)
        .eq('content_type', 'note')
        .eq('content_data->>video_id', contentId)
        .order('content_data->>timestamp', { ascending: true });

      if (data) {
        setNotes(
          data.map(d => ({
            id: d.id,
            timestamp: d.content_data.timestamp,
            text: d.content_data.text,
            createdAt: d.created_at,
          }))
        );
      }
    } catch (error) {
      logger.error('Error loading notes:', error);
    }
  }, [user, contentId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addNote = useCallback(
    async (currentTime: number) => {
      if (!user || !contentId || !newNoteText.trim()) return;

      try {
        const { data, error } = await supabase
          .from('shared_content')
          .insert({
            owner_id: user.id,
            content_type: 'note',
            title: `Note at ${formatTime(currentTime)}`,
            description: newNoteText,
            content_data: {
              video_id: contentId,
              timestamp: currentTime,
              text: newNoteText,
            },
            visibility: 'private',
            course_id: courseId,
          })
          .select()
          .single();

        if (error) throw error;

        const newNote: Note = {
          id: data.id,
          timestamp: currentTime,
          text: newNoteText,
          createdAt: data.created_at,
        };

        setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
        setNewNoteText('');

        toast({
          title: 'Note Added',
          description: 'Your note has been saved',
        });
      } catch (error) {
        logger.error('Error adding note:', error);
        toast({
          title: 'Error',
          description: 'Failed to save note',
          variant: 'destructive',
        });
      }
    },
    [user, contentId, courseId, newNoteText, toast]
  );

  const updateNote = useCallback(
    async (noteId: string, newText: string) => {
      try {
        await supabase
          .from('shared_content')
          .update({
            description: newText,
            content_data: {
              video_id: contentId,
              timestamp: notes.find(n => n.id === noteId)?.timestamp,
              text: newText,
            },
          })
          .eq('id', noteId);

        setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, text: newText } : n)));

        setEditingNoteId(null);

        toast({
          title: 'Note Updated',
          description: 'Your note has been updated',
        });
      } catch (error) {
        logger.error('Error updating note:', error);
        toast({
          title: 'Error',
          description: 'Failed to update note',
          variant: 'destructive',
        });
      }
    },
    [contentId, notes, toast]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        await supabase.from('shared_content').delete().eq('id', noteId);

        setNotes(prev => prev.filter(n => n.id !== noteId));

        toast({
          title: 'Note Deleted',
          description: 'Your note has been removed',
        });
      } catch (error) {
        logger.error('Error deleting note:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete note',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    newNoteText,
    editingNoteId,
    setNewNoteText,
    setEditingNoteId,
    addNote,
    updateNote,
    deleteNote,
  };
}
