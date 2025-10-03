import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import type {
  WatchLater,
  WatchLaterWithRelations,
  AddToWatchLaterInput,
} from '@/types/content-access';

interface UseWatchLaterOptions {
  autoLoad?: boolean;
}

export const useWatchLater = (options: UseWatchLaterOptions = {}) => {
  const { autoLoad = true } = options;
  const [queue, setQueue] = useState<WatchLaterWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch watch later queue
  const fetchQueue = useCallback(async () => {
    if (!user) {
      setQueue([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('watch_later')
        .select(`
          *,
          material:course_materials(
            id,
            title,
            description,
            material_type,
            file_url,
            duration
          ),
          course:courses(id, title)
        `)
        .eq('user_id', user.id)
        .order('queue_position', { ascending: true });

      if (fetchError) throw fetchError;

      setQueue((data || []) as WatchLaterWithRelations[]);
    } catch (err) {
      logger.error('Error fetching watch later queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watch later queue');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add to watch later queue
  const addToQueue = useCallback(
    async (input: AddToWatchLaterInput) => {
      if (!user) {
        throw new Error('User must be authenticated to add to watch later');
      }

      try {
        // Check if already in queue
        const { data: existing } = await supabase
          .from('watch_later')
          .select('id')
          .eq('user_id', user.id)
          .eq('material_id', input.material_id)
          .single();

        if (existing) {
          logger.log('Material already in watch later queue');
          return null;
        }

        // Get the next position (append to end)
        const { data: lastItem } = await supabase
          .from('watch_later')
          .select('queue_position')
          .eq('user_id', user.id)
          .order('queue_position', { ascending: false })
          .limit(1)
          .single();

        const nextPosition = lastItem ? lastItem.queue_position + 1 : 1;

        // Insert into queue
        const { data, error: insertError } = await supabase
          .from('watch_later')
          .insert({
            user_id: user.id,
            material_id: input.material_id,
            course_id: input.course_id || null,
            note: input.note || null,
            queue_position: nextPosition,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await fetchQueue();
        logger.log('Added to watch later queue:', data.id);
        return data as WatchLater;
      } catch (err) {
        logger.error('Error adding to watch later:', err);
        throw err;
      }
    },
    [user, fetchQueue]
  );

  // Remove from queue
  const removeFromQueue = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to remove from watch later');
      }

      try {
        const { error: deleteError } = await supabase
          .from('watch_later')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        await fetchQueue();
        logger.log('Removed from watch later queue:', id);
      } catch (err) {
        logger.error('Error removing from watch later:', err);
        throw err;
      }
    },
    [user, fetchQueue]
  );

  // Reorder queue
  const reorderQueue = useCallback(
    async (items: Array<{ id: string; position: number }>) => {
      if (!user) {
        throw new Error('User must be authenticated to reorder queue');
      }

      try {
        // Update positions for all items
        const updates = items.map((item) =>
          supabase
            .from('watch_later')
            .update({ queue_position: item.position })
            .eq('id', item.id)
            .eq('user_id', user.id)
        );

        await Promise.all(updates);

        await fetchQueue();
        logger.log('Queue reordered successfully');
      } catch (err) {
        logger.error('Error reordering queue:', err);
        throw err;
      }
    },
    [user, fetchQueue]
  );

  // Move item up in queue
  const moveUp = useCallback(
    async (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item || item.queue_position === 1) return;

      const prevItem = queue.find((q) => q.queue_position === item.queue_position - 1);
      if (!prevItem) return;

      await reorderQueue([
        { id: item.id, position: prevItem.queue_position },
        { id: prevItem.id, position: item.queue_position },
      ]);
    },
    [queue, reorderQueue]
  );

  // Move item down in queue
  const moveDown = useCallback(
    async (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item || item.queue_position === queue.length) return;

      const nextItem = queue.find((q) => q.queue_position === item.queue_position + 1);
      if (!nextItem) return;

      await reorderQueue([
        { id: item.id, position: nextItem.queue_position },
        { id: nextItem.id, position: item.queue_position },
      ]);
    },
    [queue, reorderQueue]
  );

  // Move to top of queue
  const moveToTop = useCallback(
    async (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item || item.queue_position === 1) return;

      const updates = queue
        .filter((q) => q.queue_position < item.queue_position)
        .map((q) => ({
          id: q.id,
          position: q.queue_position + 1,
        }))
        .concat({ id: item.id, position: 1 });

      await reorderQueue(updates);
    },
    [queue, reorderQueue]
  );

  // Clear entire queue
  const clearQueue = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated to clear queue');
    }

    try {
      const { error: deleteError } = await supabase
        .from('watch_later')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchQueue();
      logger.log('Watch later queue cleared');
    } catch (err) {
      logger.error('Error clearing queue:', err);
      throw err;
    }
  }, [user, fetchQueue]);

  // Check if material is in queue
  const isInQueue = useCallback(
    (materialId: string): boolean => {
      return queue.some((q) => q.material_id === materialId);
    },
    [queue]
  );

  // Get queue item for material
  const getQueueItem = useCallback(
    (materialId: string): WatchLaterWithRelations | null => {
      return queue.find((q) => q.material_id === materialId) || null;
    },
    [queue]
  );

  // Get next item in queue
  const getNextItem = useCallback((): WatchLaterWithRelations | null => {
    return queue.length > 0 ? queue[0] : null;
  }, [queue]);

  // Update note for queue item
  const updateNote = useCallback(
    async (id: string, note: string) => {
      if (!user) {
        throw new Error('User must be authenticated to update queue item');
      }

      try {
        const { error: updateError } = await supabase
          .from('watch_later')
          .update({ note })
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        await fetchQueue();
        logger.log('Queue item note updated:', id);
      } catch (err) {
        logger.error('Error updating queue item note:', err);
        throw err;
      }
    },
    [user, fetchQueue]
  );

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchQueue();
    }
  }, [autoLoad, fetchQueue]);

  return {
    queue,
    loading,
    error,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    moveUp,
    moveDown,
    moveToTop,
    clearQueue,
    isInQueue,
    getQueueItem,
    getNextItem,
    updateNote,
    refetch: fetchQueue,
  };
};
