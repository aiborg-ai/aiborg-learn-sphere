import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import type {
  Bookmark,
  BookmarkWithRelations,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  BookmarkFilters,
  BookmarkStats,
} from '@/types/content-access';

interface UseBookmarksOptions {
  filters?: BookmarkFilters;
  autoLoad?: boolean;
}

export const useBookmarks = (options: UseBookmarksOptions = {}) => {
  const { filters, autoLoad = true } = options;
  const [bookmarks, setBookmarks] = useState<BookmarkWithRelations[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch bookmarks with optional filters
  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bookmarks')
        .select(
          `
          *,
          course:courses(id, title, thumbnail),
          material:course_materials(id, title, material_type, file_url),
          assignment:homework_assignments(id, title, due_date)
        `
        )
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.bookmark_type) {
        query = query.eq('bookmark_type', filters.bookmark_type);
      }

      if (filters?.course_id) {
        query = query.eq('course_id', filters.course_id);
      }

      if (filters?.folder) {
        query = query.eq('folder', filters.folder);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
      }

      // Apply ordering last
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBookmarks((data || []) as BookmarkWithRelations[]);
    } catch (err) {
      logger.error('Error fetching bookmarks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Fetch bookmark statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: statsError } = await supabase
        .from('bookmarks')
        .select('bookmark_type, folder, created_at')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      if (!data) return;

      // Calculate stats
      const total_count = data.length;
      const by_type: Record<string, number> = {};
      const by_folder: Record<string, number> = {};
      let recent_count = 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      data.forEach(bookmark => {
        // Count by type
        by_type[bookmark.bookmark_type] = (by_type[bookmark.bookmark_type] || 0) + 1;

        // Count by folder
        const folder = bookmark.folder || 'default';
        by_folder[folder] = (by_folder[folder] || 0) + 1;

        // Count recent
        if (new Date(bookmark.created_at) >= sevenDaysAgo) {
          recent_count++;
        }
      });

      setStats({
        total_count,
        by_type: by_type as Record<BookmarkWithRelations['bookmark_type'], number>,
        by_folder,
        recent_count,
      });
    } catch (err) {
      logger.error('Error fetching bookmark stats:', err);
    }
  }, [user]);

  // Create a new bookmark
  const createBookmark = useCallback(
    async (input: CreateBookmarkInput) => {
      if (!user) {
        throw new Error('User must be authenticated to create bookmarks');
      }

      try {
        const { data, error: createError } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            ...input,
            metadata: input.metadata || {},
            tags: input.tags || [],
            folder: input.folder || 'default',
          })
          .select()
          .single();

        if (createError) throw createError;

        // Refresh bookmarks
        await fetchBookmarks();
        await fetchStats();

        logger.log('Bookmark created successfully:', data.id);
        return data as Bookmark;
      } catch (err) {
        logger.error('Error creating bookmark:', err);
        throw err;
      }
    },
    [user, fetchBookmarks, fetchStats]
  );

  // Update a bookmark
  const updateBookmark = useCallback(
    async (id: string, input: UpdateBookmarkInput) => {
      if (!user) {
        throw new Error('User must be authenticated to update bookmarks');
      }

      try {
        const { data, error: updateError } = await supabase
          .from('bookmarks')
          .update(input)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Refresh bookmarks
        await fetchBookmarks();

        logger.log('Bookmark updated successfully:', id);
        return data as Bookmark;
      } catch (err) {
        logger.error('Error updating bookmark:', err);
        throw err;
      }
    },
    [user, fetchBookmarks]
  );

  // Delete a bookmark
  const deleteBookmark = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete bookmarks');
      }

      try {
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Refresh bookmarks
        await fetchBookmarks();
        await fetchStats();

        logger.log('Bookmark deleted successfully:', id);
      } catch (err) {
        logger.error('Error deleting bookmark:', err);
        throw err;
      }
    },
    [user, fetchBookmarks, fetchStats]
  );

  // Check if content is bookmarked
  const isBookmarked = useCallback(
    (contentId: string, type: Bookmark['bookmark_type']): boolean => {
      return bookmarks.some(b => {
        if (b.bookmark_type !== type) return false;

        switch (type) {
          case 'course':
            return b.course_id?.toString() === contentId;
          case 'material':
          case 'video_timestamp':
          case 'pdf_page':
            return b.material_id === contentId;
          case 'assignment':
            return b.assignment_id === contentId;
          default:
            return false;
        }
      });
    },
    [bookmarks]
  );

  // Get bookmark for specific content
  const getBookmark = useCallback(
    (contentId: string, type: Bookmark['bookmark_type']): BookmarkWithRelations | null => {
      return (
        bookmarks.find(b => {
          if (b.bookmark_type !== type) return false;

          switch (type) {
            case 'course':
              return b.course_id?.toString() === contentId;
            case 'material':
            case 'video_timestamp':
            case 'pdf_page':
              return b.material_id === contentId;
            case 'assignment':
              return b.assignment_id === contentId;
            default:
              return false;
          }
        }) || null
      );
    },
    [bookmarks]
  );

  // Get all folders
  const getFolders = useCallback((): string[] => {
    const folders = new Set<string>();
    bookmarks.forEach(b => folders.add(b.folder || 'default'));
    return Array.from(folders).sort();
  }, [bookmarks]);

  // Get all unique tags
  const getTags = useCallback((): string[] => {
    const tags = new Set<string>();
    bookmarks.forEach(b => b.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [bookmarks]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchBookmarks();
      fetchStats();
    }
  }, [autoLoad, fetchBookmarks, fetchStats]);

  return {
    bookmarks,
    stats,
    loading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    isBookmarked,
    getBookmark,
    getFolders,
    getTags,
    refetch: fetchBookmarks,
    refetchStats: fetchStats,
  };
};
