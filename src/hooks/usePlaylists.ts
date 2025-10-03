import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import type {
  Playlist,
  PlaylistWithRelations,
  PlaylistItem,
  PlaylistItemWithRelations,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  AddToPlaylistInput,
  UpdatePlaylistItemInput,
  PlaylistFilters,
  PlaylistStats,
} from '@/types/content-access';

interface UsePlaylistsOptions {
  filters?: PlaylistFilters;
  autoLoad?: boolean;
}

export const usePlaylists = (options: UsePlaylistsOptions = {}) => {
  const { filters, autoLoad = true } = options;
  const [playlists, setPlaylists] = useState<PlaylistWithRelations[]>([]);
  const [stats, setStats] = useState<PlaylistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch playlists with optional filters
  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('playlists')
        .select(`
          *,
          user:profiles!user_id(user_id, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      } else {
        // By default, show user's own playlists and public playlists
        query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPlaylists((data || []) as PlaylistWithRelations[]);
    } catch (err) {
      logger.error('Error fetching playlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Fetch playlist statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: statsError } = await supabase
        .from('playlists')
        .select('id, item_count, total_duration, is_public')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      if (!data) return;

      const total_playlists = data.length;
      const total_items = data.reduce((sum, p) => sum + (p.item_count || 0), 0);
      const average_items_per_playlist =
        total_playlists > 0 ? Math.round(total_items / total_playlists) : 0;
      const total_duration = data.reduce((sum, p) => sum + (p.total_duration || 0), 0);
      const public_playlists = data.filter((p) => p.is_public).length;

      setStats({
        total_playlists,
        total_items,
        average_items_per_playlist,
        total_duration,
        public_playlists,
      });
    } catch (err) {
      logger.error('Error fetching playlist stats:', err);
    }
  }, [user]);

  // Create a new playlist
  const createPlaylist = useCallback(
    async (input: CreatePlaylistInput) => {
      if (!user) {
        throw new Error('User must be authenticated to create playlists');
      }

      try {
        const { data, error: createError } = await supabase
          .from('playlists')
          .insert({
            user_id: user.id,
            ...input,
            is_public: input.is_public || false,
          })
          .select()
          .single();

        if (createError) throw createError;

        await fetchPlaylists();
        await fetchStats();

        logger.log('Playlist created successfully:', data.id);
        return data as Playlist;
      } catch (err) {
        logger.error('Error creating playlist:', err);
        throw err;
      }
    },
    [user, fetchPlaylists, fetchStats]
  );

  // Update a playlist
  const updatePlaylist = useCallback(
    async (id: string, input: UpdatePlaylistInput) => {
      if (!user) {
        throw new Error('User must be authenticated to update playlists');
      }

      try {
        const { data, error: updateError } = await supabase
          .from('playlists')
          .update(input)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        await fetchPlaylists();

        logger.log('Playlist updated successfully:', id);
        return data as Playlist;
      } catch (err) {
        logger.error('Error updating playlist:', err);
        throw err;
      }
    },
    [user, fetchPlaylists]
  );

  // Delete a playlist
  const deletePlaylist = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete playlists');
      }

      try {
        const { error: deleteError } = await supabase
          .from('playlists')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        await fetchPlaylists();
        await fetchStats();

        logger.log('Playlist deleted successfully:', id);
      } catch (err) {
        logger.error('Error deleting playlist:', err);
        throw err;
      }
    },
    [user, fetchPlaylists, fetchStats]
  );

  // Clone/duplicate a playlist
  const clonePlaylist = useCallback(
    async (playlistId: string, newTitle?: string) => {
      if (!user) {
        throw new Error('User must be authenticated to clone playlists');
      }

      try {
        // Get original playlist
        const { data: original, error: fetchError } = await supabase
          .from('playlists')
          .select('*, items:playlist_items(*)')
          .eq('id', playlistId)
          .single();

        if (fetchError) throw fetchError;

        // Create new playlist
        const { data: newPlaylist, error: createError } = await supabase
          .from('playlists')
          .insert({
            user_id: user.id,
            title: newTitle || `${original.title} (Copy)`,
            description: original.description,
            is_public: false, // Clones are private by default
          })
          .select()
          .single();

        if (createError) throw createError;

        // Copy all items
        if (original.items && original.items.length > 0) {
          const items = original.items.map((item: any) => ({
            playlist_id: newPlaylist.id,
            material_id: item.material_id,
            position: item.position,
            note: item.note,
            start_time: item.start_time,
            end_time: item.end_time,
          }));

          const { error: itemsError } = await supabase.from('playlist_items').insert(items);

          if (itemsError) throw itemsError;
        }

        await fetchPlaylists();
        await fetchStats();

        logger.log('Playlist cloned successfully:', newPlaylist.id);
        return newPlaylist as Playlist;
      } catch (err) {
        logger.error('Error cloning playlist:', err);
        throw err;
      }
    },
    [user, fetchPlaylists, fetchStats]
  );

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchPlaylists();
      fetchStats();
    }
  }, [autoLoad, fetchPlaylists, fetchStats]);

  return {
    playlists,
    stats,
    loading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    clonePlaylist,
    refetch: fetchPlaylists,
    refetchStats: fetchStats,
  };
};

// Hook for managing items within a specific playlist
export const usePlaylistItems = (playlistId: string | null) => {
  const [items, setItems] = useState<PlaylistItemWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch playlist items
  const fetchItems = useCallback(async () => {
    if (!playlistId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('playlist_items')
        .select(`
          *,
          material:course_materials(
            id,
            title,
            description,
            material_type,
            file_url,
            duration,
            file_size
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      setItems((data || []) as PlaylistItemWithRelations[]);
    } catch (err) {
      logger.error('Error fetching playlist items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch playlist items');
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  // Add item to playlist
  const addItem = useCallback(
    async (input: AddToPlaylistInput) => {
      if (!user) {
        throw new Error('User must be authenticated to add items');
      }

      try {
        // Check if material already exists in playlist
        const { data: existing } = await supabase
          .from('playlist_items')
          .select('id')
          .eq('playlist_id', input.playlist_id)
          .eq('material_id', input.material_id)
          .single();

        if (existing) {
          logger.log('Material already in playlist');
          return null;
        }

        // Get the next position if not provided
        let position = input.position;
        if (!position) {
          const { data: lastItem } = await supabase
            .from('playlist_items')
            .select('position')
            .eq('playlist_id', input.playlist_id)
            .order('position', { ascending: false })
            .limit(1)
            .single();

          position = lastItem ? lastItem.position + 1 : 1;
        }

        // Insert item
        const { data, error: insertError } = await supabase
          .from('playlist_items')
          .insert({
            ...input,
            position,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await fetchItems();
        logger.log('Item added to playlist:', data.id);
        return data as PlaylistItem;
      } catch (err) {
        logger.error('Error adding item to playlist:', err);
        throw err;
      }
    },
    [user, fetchItems]
  );

  // Update playlist item
  const updateItem = useCallback(
    async (id: string, input: UpdatePlaylistItemInput) => {
      if (!user) {
        throw new Error('User must be authenticated to update items');
      }

      try {
        const { data, error: updateError } = await supabase
          .from('playlist_items')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        await fetchItems();
        logger.log('Playlist item updated:', id);
        return data as PlaylistItem;
      } catch (err) {
        logger.error('Error updating playlist item:', err);
        throw err;
      }
    },
    [user, fetchItems]
  );

  // Remove item from playlist
  const removeItem = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to remove items');
      }

      try {
        const { error: deleteError } = await supabase
          .from('playlist_items')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        await fetchItems();
        logger.log('Item removed from playlist:', id);
      } catch (err) {
        logger.error('Error removing item from playlist:', err);
        throw err;
      }
    },
    [user, fetchItems]
  );

  // Reorder items
  const reorderItems = useCallback(
    async (reorderedItems: Array<{ id: string; position: number }>) => {
      if (!user) {
        throw new Error('User must be authenticated to reorder items');
      }

      try {
        const updates = reorderedItems.map((item) =>
          supabase
            .from('playlist_items')
            .update({ position: item.position })
            .eq('id', item.id)
        );

        await Promise.all(updates);
        await fetchItems();
        logger.log('Playlist items reordered');
      } catch (err) {
        logger.error('Error reordering playlist items:', err);
        throw err;
      }
    },
    [user, fetchItems]
  );

  // Auto-load items when playlistId changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    refetch: fetchItems,
  };
};
