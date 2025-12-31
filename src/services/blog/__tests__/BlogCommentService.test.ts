/**
 * BlogCommentService Tests
 * Tests blog comment CRUD and hierarchical structure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BlogCommentService } from '../BlogCommentService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('BlogCommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // getPostComments() Tests
  // ========================================

  describe('getPostComments', () => {
    it('should get flat comments for a post', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Great post!',
          parent_id: null,
          is_approved: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'comment-2',
          post_id: 'post-1',
          user_id: 'user-2',
          content: 'Thanks for sharing',
          parent_id: null,
          is_approved: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockComments,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostComments('post-1');

      expect(mockFrom).toHaveBeenCalledWith('blog_comments');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'comment-1',
        content: 'Great post!',
        user_name: 'User',
        user_avatar: null,
        replies: [],
      });
    });

    it('should build hierarchical tree structure for nested comments', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Parent comment',
          parent_id: null,
          is_approved: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'comment-2',
          post_id: 'post-1',
          user_id: 'user-2',
          content: 'Reply to comment 1',
          parent_id: 'comment-1',
          is_approved: true,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'comment-3',
          post_id: 'post-1',
          user_id: 'user-3',
          content: 'Another reply to comment 1',
          parent_id: 'comment-1',
          is_approved: true,
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockComments,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostComments('post-1');

      // Should have 1 root comment
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment-1');

      // Root comment should have 2 replies
      expect(result[0].replies).toHaveLength(2);
      expect(result[0].replies[0].id).toBe('comment-2');
      expect(result[0].replies[1].id).toBe('comment-3');
    });

    it('should handle multiple nested levels', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Level 1',
          parent_id: null,
          is_approved: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'comment-2',
          post_id: 'post-1',
          user_id: 'user-2',
          content: 'Level 2',
          parent_id: 'comment-1',
          is_approved: true,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'comment-3',
          post_id: 'post-1',
          user_id: 'user-3',
          content: 'Level 3',
          parent_id: 'comment-2',
          is_approved: true,
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockComments,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostComments('post-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment-1');
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].id).toBe('comment-2');
      expect(result[0].replies[0].replies).toHaveLength(1);
      expect(result[0].replies[0].replies[0].id).toBe('comment-3');
    });

    it('should return empty array when no comments exist', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostComments('post-1');

      expect(result).toEqual([]);
    });

    it('should handle orphaned comments gracefully', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Root comment',
          parent_id: null,
          is_approved: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'comment-2',
          post_id: 'post-1',
          user_id: 'user-2',
          content: 'Orphaned comment with non-existent parent',
          parent_id: 'comment-999',
          is_approved: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockComments,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostComments('post-1');

      // Should only return the root comment, orphaned comment is ignored
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment-1');
    });

    it('should throw error on database failure', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogCommentService.getPostComments('post-1')).rejects.toThrow();
    });
  });

  // ========================================
  // createComment() Tests
  // ========================================

  describe('createComment', () => {
    it('should create a root comment successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'testuser@example.com',
      };

      const mockComment = {
        id: 'comment-new',
        post_id: 'post-1',
        user_id: 'user-123',
        content: 'New comment',
        parent_id: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockComment,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.createComment('post-1', 'New comment');

      expect(mockFrom).toHaveBeenCalledWith('blog_comments');
      expect(result).toMatchObject({
        id: 'comment-new',
        content: 'New comment',
        user_name: 'testuser',
        user_avatar: null,
      });
    });

    it('should create a reply comment with parent_id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'testuser@example.com',
      };

      const mockComment = {
        id: 'comment-reply',
        post_id: 'post-1',
        user_id: 'user-123',
        content: 'Reply content',
        parent_id: 'comment-1',
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockComment,
            error: null,
          }),
        }),
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.createComment('post-1', 'Reply content', 'comment-1');

      expect(mockInsert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-123',
        content: 'Reply content',
        parent_id: 'comment-1',
      });

      expect(result.parent_id).toBe('comment-1');
    });

    it('should handle user without email', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
      };

      const mockComment = {
        id: 'comment-new',
        post_id: 'post-1',
        user_id: 'user-123',
        content: 'Comment',
        parent_id: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockComment,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.createComment('post-1', 'Comment');

      expect(result.user_name).toBe('User');
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(BlogCommentService.createComment('post-1', 'Comment')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error on database insert failure', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogCommentService.createComment('post-1', 'Comment')).rejects.toThrow();
    });
  });

  // ========================================
  // updateComment() Tests
  // ========================================

  describe('updateComment', () => {
    it('should update comment content and mark as edited', async () => {
      const mockUpdatedComment = {
        id: 'comment-1',
        content: 'Updated content',
        is_edited: true,
        edited_at: '2024-01-02T00:00:00Z',
      };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedComment,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.updateComment('comment-1', 'Updated content');

      expect(result).toMatchObject({
        id: 'comment-1',
        content: 'Updated content',
        is_edited: true,
      });
    });

    it('should throw error on database update failure', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogCommentService.updateComment('comment-1', 'Updated')).rejects.toThrow();
    });
  });

  // ========================================
  // deleteComment() Tests
  // ========================================

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogCommentService.deleteComment('comment-1')).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith('blog_comments');
    });

    it('should throw error on database delete failure', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Delete failed' },
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogCommentService.deleteComment('comment-1')).rejects.toThrow();
    });
  });

  // ========================================
  // getPostCommentCount() Tests
  // ========================================

  describe('getPostCommentCount', () => {
    it('should return comment count for a post', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 25,
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostCommentCount('post-1');

      expect(result).toBe(25);
    });

    it('should return 0 when post has no comments', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 0,
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostCommentCount('post-1');

      expect(result).toBe(0);
    });

    it('should return 0 when count is null', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: null,
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCommentService.getPostCommentCount('post-1');

      expect(result).toBe(0);
    });

    it('should throw error on database failure', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: null,
              data: null,
              error: { message: 'Count failed' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogCommentService.getPostCommentCount('post-1')).rejects.toThrow();
    });
  });
});
