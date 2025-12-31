import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VaultContentService } from '../VaultContentService';
import type {
  VaultContent,
  VaultContentFilters,
  UserVaultBookmark,
  CreateVaultContentParams,
} from '../types';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('VaultContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContent: VaultContent = {
    id: 'content-1',
    title: 'Test Content',
    slug: 'test-content',
    description: 'Test description',
    content_type: 'video',
    category: 'Technology',
    tags: ['ai', 'ml'],
    difficulty_level: 'intermediate',
    duration_minutes: 60,
    is_published: true,
    featured_order: null,
    file_url: 'https://example.com/video.mp4',
    thumbnail_url: 'https://example.com/thumb.jpg',
    author_id: 'author-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // ============================================================================
  // CONTENT RETRIEVAL
  // ============================================================================

  describe('getVaultContent', () => {
    it('should return all published content without filters', async () => {
      const mockQuery = Promise.resolve({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContent();

      expect(result).toEqual([mockContent]);
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should filter by content type', async () => {
      const filters: VaultContentFilters = { content_type: 'video' };

      const mockQuery = Promise.resolve({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEqContentType = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockEqPublished = vi.fn().mockReturnValue({
        eq: mockEqContentType,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEqPublished,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContent(filters);

      expect(result).toEqual([mockContent]);
    });

    it('should filter by category', async () => {
      const filters: VaultContentFilters = { category: 'Technology' };

      const mockQuery = Promise.resolve({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEqCategory = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockEqPublished = vi.fn().mockReturnValue({
        eq: mockEqCategory,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEqPublished,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContent(filters);

      expect(result).toEqual([mockContent]);
    });

    it('should filter featured content', async () => {
      const filters: VaultContentFilters = { featured_only: true };

      const mockQuery = Promise.resolve({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockNot = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockEq = vi.fn().mockReturnValue({
        not: mockNot,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContent(filters);

      expect(result).toEqual([mockContent]);
    });

    it('should apply search filter', async () => {
      const filters: VaultContentFilters = { search: 'test' };

      const mockQuery = Promise.resolve({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockOr = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockEq = vi.fn().mockReturnValue({
        or: mockOr,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContent(filters);

      expect(result).toEqual([mockContent]);
    });

    it('should return empty array if no data', async () => {
      const mockQuery = Promise.resolve({
        data: null,
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContent();

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');
      const mockQuery = Promise.resolve({
        data: null,
        error: mockError,
      });

      const mockOrder = vi.fn().mockReturnValue(mockQuery);
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(VaultContentService.getVaultContent()).rejects.toThrow('Query failed');
    });
  });

  describe('getVaultContentBySlug', () => {
    it('should return content by slug', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockContent,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContentBySlug('test-content');

      expect(result).toEqual(mockContent);
    });

    it('should return null if not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getVaultContentBySlug('invalid-slug');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockError = new Error('Database error');
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(VaultContentService.getVaultContentBySlug('test')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getFeaturedContent', () => {
    it('should return featured content with default limit', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockNot = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getFeaturedContent();

      expect(result).toEqual([mockContent]);
      expect(mockLimit).toHaveBeenCalledWith(6);
    });

    it('should return featured content with custom limit', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockNot = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getFeaturedContent(10);

      expect(result).toEqual([mockContent]);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockNot = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(VaultContentService.getFeaturedContent()).rejects.toThrow('Query failed');
    });
  });

  describe('getRecentVaultContent', () => {
    it('should return recent content with default limit', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getRecentVaultContent();

      expect(result).toEqual([mockContent]);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should return recent content with custom limit', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockContent],
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getRecentVaultContent(20);

      expect(result).toEqual([mockContent]);
      expect(mockLimit).toHaveBeenCalledWith(20);
    });
  });

  describe('getCategories', () => {
    it('should return unique sorted categories', async () => {
      const mockData = [
        { category: 'Technology' },
        { category: 'Business' },
        { category: 'Technology' },
        { category: 'Arts' },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getCategories();

      expect(result).toEqual(['Arts', 'Business', 'Technology']);
    });

    it('should return empty array if no data', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getCategories();

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(VaultContentService.getCategories()).rejects.toThrow('Query failed');
    });
  });

  describe('getTags', () => {
    it('should return unique sorted tags', async () => {
      const mockData = [
        { tags: ['ai', 'ml'] },
        { tags: ['python', 'ai'] },
        { tags: ['javascript', 'react'] },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getTags();

      expect(result).toEqual(['ai', 'javascript', 'ml', 'python', 'react']);
    });

    it('should handle null tags', async () => {
      const mockData = [{ tags: ['ai'] }, { tags: null }, { tags: ['ml'] }];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getTags();

      expect(result).toEqual(['ai', 'ml']);
    });
  });

  // ============================================================================
  // ACCESS LOGGING
  // ============================================================================

  describe('logView', () => {
    it('should log view with watch percentage', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(VaultContentService.logView('content-1', 75)).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('log_vault_content_access', {
        p_content_id: 'content-1',
        p_action_type: 'view',
        p_watch_percentage: 75,
      });
    });

    it('should log view without watch percentage', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(VaultContentService.logView('content-1')).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('log_vault_content_access', {
        p_content_id: 'content-1',
        p_action_type: 'view',
        p_watch_percentage: undefined,
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(VaultContentService.logView('content-1')).rejects.toThrow('RPC failed');
    });
  });

  describe('logDownload', () => {
    it('should log download action', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(VaultContentService.logDownload('content-1')).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('log_vault_content_access', {
        p_content_id: 'content-1',
        p_action_type: 'download',
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(VaultContentService.logDownload('content-1')).rejects.toThrow('RPC failed');
    });
  });

  describe('logBookmark', () => {
    it('should log bookmark action', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(VaultContentService.logBookmark('content-1')).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('log_vault_content_access', {
        p_content_id: 'content-1',
        p_action_type: 'bookmark',
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(VaultContentService.logBookmark('content-1')).rejects.toThrow('RPC failed');
    });
  });

  // ============================================================================
  // BOOKMARKS
  // ============================================================================

  describe('addBookmark', () => {
    const mockBookmark: UserVaultBookmark = {
      id: 'bookmark-1',
      user_id: 'user-1',
      content_id: 'content-1',
      notes: 'Test notes',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should add bookmark with notes', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockBookmark,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await VaultContentService.addBookmark('content-1', 'Test notes');

      expect(result).toEqual(mockBookmark);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        content_id: 'content-1',
        notes: 'Test notes',
      });
      expect(supabase.rpc).toHaveBeenCalledWith('log_vault_content_access', {
        p_content_id: 'content-1',
        p_action_type: 'bookmark',
      });
    });

    it('should add bookmark without notes', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockBookmark, notes: undefined },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await VaultContentService.addBookmark('content-1');

      expect(result).toBeDefined();
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        content_id: 'content-1',
        notes: undefined,
      });
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(VaultContentService.addBookmark('content-1')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error if insert fails', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = new Error('Insert failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      await expect(VaultContentService.addBookmark('content-1')).rejects.toThrow('Insert failed');
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(VaultContentService.removeBookmark('content-1')).resolves.toBeUndefined();

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(VaultContentService.removeBookmark('content-1')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error if delete fails', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = new Error('Delete failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEq2 = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(VaultContentService.removeBookmark('content-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('updateBookmarkNotes', () => {
    it('should update bookmark notes successfully', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        VaultContentService.updateBookmarkNotes('content-1', 'Updated notes')
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({ notes: 'Updated notes' });
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(VaultContentService.updateBookmarkNotes('content-1', 'Notes')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error if update fails', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = new Error('Update failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEq2 = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(VaultContentService.updateBookmarkNotes('content-1', 'Notes')).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('getUserBookmarks', () => {
    it('should return user bookmarks', async () => {
      const mockUser = { id: 'user-1' };
      const mockBookmarks: UserVaultBookmark[] = [
        {
          id: 'bookmark-1',
          user_id: 'user-1',
          content_id: 'content-1',
          notes: 'Test notes',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockBookmarks,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.getUserBookmarks();

      expect(result).toEqual(mockBookmarks);
    });

    it('should return empty array if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await VaultContentService.getUserBookmarks();

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = new Error('Query failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(VaultContentService.getUserBookmarks()).rejects.toThrow('Query failed');
    });
  });

  describe('isBookmarked', () => {
    it('should return true if content is bookmarked', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'bookmark-1' },
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.isBookmarked('content-1');

      expect(result).toBe(true);
    });

    it('should return false if content is not bookmarked', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await VaultContentService.isBookmarked('content-1');

      expect(result).toBe(false);
    });

    it('should return false if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await VaultContentService.isBookmarked('content-1');

      expect(result).toBe(false);
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = new Error('Database error');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(VaultContentService.isBookmarked('content-1')).rejects.toThrow('Database error');
    });
  });

  // ============================================================================
  // USER STATISTICS
  // ============================================================================

  describe('getUserVaultStats', () => {
    it('should return user vault statistics', async () => {
      const mockUser = { id: 'user-1' };
      const mockStats = {
        total_views: 10,
        total_downloads: 5,
        total_bookmarks: 3,
        unique_content_viewed: 8,
        hours_watched: 12.5,
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockStats],
        error: null,
      });

      const result = await VaultContentService.getUserVaultStats();

      expect(result).toEqual(mockStats);
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_vault_stats', {
        p_user_id: 'user-1',
      });
    });

    it('should return default stats if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await VaultContentService.getUserVaultStats();

      expect(result).toEqual({
        total_views: 0,
        total_downloads: 0,
        total_bookmarks: 0,
        unique_content_viewed: 0,
        hours_watched: 0,
      });
    });

    it('should return default stats if no data', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await VaultContentService.getUserVaultStats();

      expect(result).toEqual({
        total_views: 0,
        total_downloads: 0,
        total_bookmarks: 0,
        unique_content_viewed: 0,
        hours_watched: 0,
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockUser = { id: 'user-1' };
      const mockError = new Error('RPC failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(VaultContentService.getUserVaultStats()).rejects.toThrow('RPC failed');
    });
  });

  describe('getViewingHistory', () => {
    it('should return viewing history', async () => {
      const mockUser = { id: 'user-1' };
      const mockAccessLog = [{ content_id: 'content-1' }, { content_id: 'content-2' }];

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - get access log
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: mockAccessLog,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else {
          // Second call - get content details
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [mockContent],
                error: null,
              }),
            }),
          };
        }
      });

      const result = await VaultContentService.getViewingHistory(20);

      expect(result).toEqual([mockContent]);
    });

    it('should return empty array if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await VaultContentService.getViewingHistory();

      expect(result).toEqual([]);
    });

    it('should return empty array if no access log', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await VaultContentService.getViewingHistory();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // ADMIN/CONTENT CREATION
  // ============================================================================

  describe('createVaultContent', () => {
    it('should create vault content successfully', async () => {
      const mockParams: CreateVaultContentParams = {
        title: 'New Content',
        slug: 'new-content',
        description: 'Description',
        content_type: 'video',
        category: 'Technology',
        file_url: 'https://example.com/video.mp4',
        author_id: 'author-1',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockContent,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const result = await VaultContentService.createVaultContent(mockParams);

      expect(result).toEqual(mockContent);
      expect(mockInsert).toHaveBeenCalledWith(mockParams);
    });

    it('should throw error if insert fails', async () => {
      const mockParams: CreateVaultContentParams = {
        title: 'New Content',
        slug: 'new-content',
        description: 'Description',
        content_type: 'video',
        category: 'Technology',
        file_url: 'https://example.com/video.mp4',
        author_id: 'author-1',
      };

      const mockError = new Error('Insert failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      await expect(VaultContentService.createVaultContent(mockParams)).rejects.toThrow(
        'Insert failed'
      );
    });
  });

  describe('updateVaultContent', () => {
    it('should update vault content successfully', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockContent,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await VaultContentService.updateVaultContent('content-1', {
        title: 'Updated Title',
      });

      expect(result).toEqual(mockContent);
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Updated Title' });
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Update failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        VaultContentService.updateVaultContent('content-1', { title: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteVaultContent', () => {
    it('should delete vault content successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(VaultContentService.deleteVaultContent('content-1')).resolves.toBeUndefined();

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error if delete fails', async () => {
      const mockError = new Error('Delete failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        delete: mockDelete,
      });

      await expect(VaultContentService.deleteVaultContent('content-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  // ============================================================================
  // UTILITIES
  // ============================================================================

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(VaultContentService.formatDuration(30)).toBe('30 min');
      expect(VaultContentService.formatDuration(45)).toBe('45 min');
    });

    it('should format hours and minutes', () => {
      expect(VaultContentService.formatDuration(90)).toBe('1h 30min');
      expect(VaultContentService.formatDuration(150)).toBe('2h 30min');
    });

    it('should format hours only', () => {
      expect(VaultContentService.formatDuration(60)).toBe('1h');
      expect(VaultContentService.formatDuration(120)).toBe('2h');
    });

    it('should return N/A for null', () => {
      expect(VaultContentService.formatDuration(null)).toBe('N/A');
    });
  });

  describe('getContentTypeIcon', () => {
    it('should return correct icons for all content types', () => {
      expect(VaultContentService.getContentTypeIcon('video')).toBe('video');
      expect(VaultContentService.getContentTypeIcon('article')).toBe('file-text');
      expect(VaultContentService.getContentTypeIcon('worksheet')).toBe('file-edit');
      expect(VaultContentService.getContentTypeIcon('template')).toBe('file-code');
      expect(VaultContentService.getContentTypeIcon('tool')).toBe('wrench');
      expect(VaultContentService.getContentTypeIcon('webinar')).toBe('presentation');
      expect(VaultContentService.getContentTypeIcon('case_study')).toBe('briefcase');
      expect(VaultContentService.getContentTypeIcon('guide')).toBe('book-open');
      expect(VaultContentService.getContentTypeIcon('unknown')).toBe('file');
    });
  });

  describe('getDifficultyColor', () => {
    it('should return correct colors for all difficulty levels', () => {
      expect(VaultContentService.getDifficultyColor('beginner')).toBe('green');
      expect(VaultContentService.getDifficultyColor('intermediate')).toBe('yellow');
      expect(VaultContentService.getDifficultyColor('advanced')).toBe('red');
      expect(VaultContentService.getDifficultyColor(null)).toBe('gray');
      expect(VaultContentService.getDifficultyColor('unknown')).toBe('gray');
    });
  });
});
