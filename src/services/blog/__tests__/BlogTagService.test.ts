import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlogTagService } from '../BlogTagService';
import { supabase } from '@/integrations/supabase/client';
import type { BlogTag } from '@/types/blog';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('BlogTagService', () => {
  const mockTags: BlogTag[] = [
    {
      id: 'tag-1',
      slug: 'javascript',
      name: 'JavaScript',
      post_count: 10,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'tag-2',
      slug: 'typescript',
      name: 'TypeScript',
      post_count: 8,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
    {
      id: 'tag-3',
      slug: 'react',
      name: 'React',
      post_count: 15,
      created_at: '2024-01-03',
      updated_at: '2024-01-03',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTags', () => {
    it('should fetch all tags ordered by post count descending', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTags,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogTagService.getTags();

      expect(mockFrom).toHaveBeenCalledWith('blog_tags');
      expect(result).toEqual(mockTags);
      expect(result).toHaveLength(3);
    });

    it('should order tags by post_count in descending order', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogTagService.getTags();

      expect(mockOrder).toHaveBeenCalledWith('post_count', { ascending: false });
    });

    it('should handle empty tags result', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogTagService.getTags();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database error');

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogTagService.getTags()).rejects.toThrow('Database error');
    });
  });

  describe('getPostTags', () => {
    const postId = 'post-123';
    const mockPostTags = [{ blog_tags: mockTags[0] }, { blog_tags: mockTags[1] }];

    it('should fetch tags for a specific post', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockPostTags,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogTagService.getPostTags(postId);

      expect(mockFrom).toHaveBeenCalledWith('blog_post_tags');
      expect(result).toEqual([mockTags[0], mockTags[1]]);
      expect(result).toHaveLength(2);
    });

    it('should filter by post_id', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: mockPostTags,
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogTagService.getPostTags(postId);

      expect(mockEq).toHaveBeenCalledWith('post_id', postId);
    });

    it('should return empty array when post has no tags', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogTagService.getPostTags(postId);

      expect(result).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogTagService.getPostTags(postId);

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Query failed');

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogTagService.getPostTags(postId)).rejects.toThrow('Query failed');
    });
  });

  describe('updatePostTags', () => {
    const postId = 'post-456';
    const tagIds = ['tag-1', 'tag-2', 'tag-3'];

    it('should delete existing tags and insert new ones', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogTagService.updatePostTags(postId, tagIds);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith([
        { post_id: postId, tag_id: 'tag-1' },
        { post_id: postId, tag_id: 'tag-2' },
        { post_id: postId, tag_id: 'tag-3' },
      ]);
    });

    it('should delete tags filtered by post_id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogTagService.updatePostTags(postId, tagIds);

      expect(mockEq).toHaveBeenCalledWith('post_id', postId);
    });

    it('should handle empty tag list (only delete)', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogTagService.updatePostTags(postId, []);

      expect(mockDelete).toHaveBeenCalled();
      // Insert should not be called for empty array
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should throw error when insert fails', async () => {
      const mockError = new Error('Insert failed');

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogTagService.updatePostTags(postId, tagIds)).rejects.toThrow('Insert failed');
    });

    it('should format tag IDs correctly for batch insert', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const singleTagId = ['tag-99'];
      await BlogTagService.updatePostTags(postId, singleTagId);

      expect(mockInsert).toHaveBeenCalledWith([{ post_id: postId, tag_id: 'tag-99' }]);
    });
  });
});
