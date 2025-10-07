import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBookmarks } from '../useBookmarks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { createMockUser } from '@/tests/mockFactories';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useBookmarks', () => {
  const mockUser = createMockUser();

  const createMockBookmark = (overrides = {}) => ({
    id: 'bookmark-1',
    user_id: mockUser.id,
    bookmark_type: 'course' as const,
    course_id: 1,
    material_id: null,
    assignment_id: null,
    metadata: {},
    title: 'My Course Bookmark',
    note: null,
    tags: [],
    folder: 'default',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  });

  const mockBookmarks = [
    createMockBookmark({
      id: 'bookmark-1',
      bookmark_type: 'course',
      course_id: 1,
      title: 'AI Fundamentals',
      folder: 'tech',
      tags: ['ai', 'beginner'],
    }),
    createMockBookmark({
      id: 'bookmark-2',
      bookmark_type: 'material',
      material_id: 'material-1',
      course_id: null,
      title: 'Week 1 Video',
      folder: 'videos',
      tags: ['video'],
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching bookmarks', () => {
    it('should fetch user bookmarks on mount', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useBookmarks());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.bookmarks).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch bookmarks when autoLoad is false', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      renderHook(() => useBookmarks({ autoLoad: false }));

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array when user is not logged in', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        loading: false,
      });

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.bookmarks).toEqual([]);
    });

    it('should apply bookmark_type filter', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockBookmarks[0]],
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      renderHook(() =>
        useBookmarks({
          filters: { bookmark_type: 'course' },
        })
      );

      await waitFor(() => {
        expect(mockQuery.eq).toHaveBeenCalledWith('bookmark_type', 'course');
      });
    });

    it('should apply search filter', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      renderHook(() =>
        useBookmarks({
          filters: { search: 'fundamentals' },
        })
      );

      await waitFor(() => {
        expect(mockQuery.or).toHaveBeenCalledWith(
          'title.ilike.%fundamentals%,note.ilike.%fundamentals%'
        );
      });
    });
  });

  describe('creating bookmarks', () => {
    it('should create a new bookmark', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const newBookmark = createMockBookmark({ id: 'bookmark-3' });

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newBookmark,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockSelectQuery) // Initial fetch
        .mockReturnValueOnce(mockSelectQuery) // Stats fetch
        .mockReturnValueOnce(mockInsertQuery) // Create
        .mockReturnValueOnce(mockSelectQuery) // Refetch after create
        .mockReturnValueOnce(mockSelectQuery); // Stats refetch

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const bookmark = await result.current.createBookmark({
        bookmark_type: 'course',
        course_id: 1,
        title: 'Test Bookmark',
      });

      expect(bookmark).toEqual(newBookmark);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        bookmark_type: 'course',
        course_id: 1,
        title: 'Test Bookmark',
        metadata: {},
        tags: [],
        folder: 'default',
      });
    });

    it('should throw error when user is not authenticated', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        loading: false,
      });

      const { result } = renderHook(() => useBookmarks());

      await expect(
        result.current.createBookmark({
          bookmark_type: 'course',
          course_id: 1,
          title: 'Test',
        })
      ).rejects.toThrow('User must be authenticated to create bookmarks');
    });
  });

  describe('updating bookmarks', () => {
    it('should update an existing bookmark', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const updatedBookmark = { ...mockBookmarks[0], title: 'Updated Title' };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedBookmark,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockSelectQuery) // Initial fetch
        .mockReturnValueOnce(mockSelectQuery) // Stats fetch
        .mockReturnValueOnce(mockUpdateQuery) // Update
        .mockReturnValueOnce(mockSelectQuery); // Refetch

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const bookmark = await result.current.updateBookmark('bookmark-1', {
        title: 'Updated Title',
      });

      expect(bookmark.title).toBe('Updated Title');
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({ title: 'Updated Title' });
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', 'bookmark-1');
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
  });

  describe('deleting bookmarks', () => {
    it('should delete a bookmark', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockSelectQuery) // Initial fetch
        .mockReturnValueOnce(mockSelectQuery) // Stats fetch
        .mockReturnValueOnce(mockDeleteQuery) // Delete
        .mockReturnValueOnce(mockSelectQuery) // Refetch
        .mockReturnValueOnce(mockSelectQuery); // Stats refetch

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deleteBookmark('bookmark-1');

      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', 'bookmark-1');
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when content is bookmarked', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isBookmarked('1', 'course')).toBe(true);
      expect(result.current.isBookmarked('material-1', 'material')).toBe(true);
    });

    it('should return false when content is not bookmarked', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isBookmarked('999', 'course')).toBe(false);
    });
  });

  describe('bookmark statistics', () => {
    it('should calculate bookmark stats correctly', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const statsData = [
        { bookmark_type: 'course', folder: 'tech', created_at: new Date().toISOString() },
        { bookmark_type: 'course', folder: 'tech', created_at: new Date().toISOString() },
        { bookmark_type: 'material', folder: 'videos', created_at: '2020-01-01' },
      ];

      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockStatsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: statsData,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockFetchQuery)
        .mockReturnValueOnce(mockStatsQuery);

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull();
      });

      expect(result.current.stats?.total_count).toBe(3);
      expect(result.current.stats?.by_type.course).toBe(2);
      expect(result.current.stats?.by_type.material).toBe(1);
      expect(result.current.stats?.by_folder.tech).toBe(2);
      expect(result.current.stats?.by_folder.videos).toBe(1);
      expect(result.current.stats?.recent_count).toBe(2); // Two created today
    });
  });

  describe('utility functions', () => {
    it('should get all unique folders', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const folders = result.current.getFolders();
      expect(folders).toEqual(['tech', 'videos']);
    });

    it('should get all unique tags', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useBookmarks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tags = result.current.getTags();
      expect(tags).toEqual(['ai', 'beginner', 'video']);
    });
  });
});
