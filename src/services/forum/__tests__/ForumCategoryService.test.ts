/**
 * ForumCategoryService Tests
 * Tests for forum category CRUD operations and analytics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForumCategoryService } from '../ForumCategoryService';
import { supabase } from '@/integrations/supabase/client';
import type { ForumCategory, CategoryStats } from '@/types/forum';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('ForumCategoryService', () => {
  const mockCategory: ForumCategory = {
    id: 'cat-1',
    name: 'General Discussion',
    slug: 'general-discussion',
    description: 'General topics',
    icon: '💬',
    color: '#3b82f6',
    display_order: 0,
    is_active: true,
    requires_auth: false,
    post_count: 150,
    thread_count: 25,
    last_post_at: '2025-12-29T12:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-12-29T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCategories', () => {
    it('should fetch all active categories ordered by display_order', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: 'cat-2', display_order: 1 }];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCategories,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategories();

      expect(result).toEqual(mockCategories);
      expect(mockFrom).toHaveBeenCalledWith('forum_categories');
    });

    it('should return empty array when no categories exist', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategories();

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database connection failed');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.getCategories()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getCategoriesWithStats', () => {
    it('should fetch categories with thread stats and latest thread', async () => {
      const mockCategoryWithStats = {
        ...mockCategory,
        latest_thread: [
          {
            id: 'thread-1',
            title: 'Latest Discussion',
            created_at: '2025-12-29T11:00:00Z',
            user: {
              id: 'user-1',
              email: 'user@example.com',
              full_name: 'John Doe',
            },
          },
        ],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [mockCategoryWithStats],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoriesWithStats();

      expect(result).toBeDefined();
      expect(result[0].latest_thread).toBeDefined();
      expect(result[0].latest_thread?.title).toBe('Latest Discussion');
    });

    it('should handle categories with no threads', async () => {
      const mockCategoryNoThreads = {
        ...mockCategory,
        latest_thread: [],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [mockCategoryNoThreads],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoriesWithStats();

      expect(result[0].latest_thread).toBeUndefined();
    });

    it('should throw error on query failure', async () => {
      const mockError = new Error('Join failed');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: mockError,
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.getCategoriesWithStats()).rejects.toThrow('Join failed');
    });
  });

  describe('getCategoryBySlug', () => {
    it('should fetch category by slug successfully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCategory,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryBySlug('general-discussion');

      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found (PGRST116)', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockError = { code: 'OTHER', message: 'Database error' };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.getCategoryBySlug('general-discussion')).rejects.toThrow();
    });
  });

  describe('getCategoryById', () => {
    it('should fetch category by ID successfully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCategory,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryById('cat-1');

      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      const mockError = { code: 'DB_ERROR', message: 'Connection lost' };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.getCategoryById('cat-1')).rejects.toThrow();
    });
  });

  describe('getCategoryStats', () => {
    it('should calculate complete category statistics', async () => {
      const mockStats: CategoryStats = {
        category: mockCategory,
        thread_count: 25,
        post_count: 150,
        unique_participants: 15,
        avg_replies_per_thread: 6,
        most_active_users: [
          { user_id: 'user-1', email: 'user1@example.com', post_count: 50 },
          { user_id: 'user-2', email: 'user2@example.com', post_count: 30 },
        ],
      };

      // Mock getCategoryById (called first)
      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        callCount++;
        if (table === 'forum_categories' && callCount === 1) {
          // First call: getCategoryById
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCategory,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'forum_threads') {
          if (callCount === 2) {
            // Thread count query
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    count: 25,
                    data: null,
                    error: null,
                  }),
                }),
              }),
            };
          } else if (callCount === 4) {
            // Unique participants
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ user_id: 'user-1' }, { user_id: 'user-2' }, { user_id: 'user-3' }],
                  error: null,
                }),
              }),
            };
          }
        } else if (table === 'forum_posts' && callCount === 3) {
          // Post count query
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 150,
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // Mock RPC for most active users
      const mockRpc = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockStats.most_active_users,
          error: null,
        }),
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await ForumCategoryService.getCategoryStats('cat-1');

      expect(result).toBeDefined();
      expect(result?.thread_count).toBe(25);
      expect(result?.post_count).toBe(150);
      expect(result?.unique_participants).toBe(3);
      expect(result?.most_active_users).toHaveLength(2);
      expect(mockRpc).toHaveBeenCalledWith('get_category_most_active_users', {
        p_category_id: 'cat-1',
        p_limit: 5,
      });
    });

    it('should return null when category not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryStats('non-existent');

      expect(result).toBeNull();
    });

    it('should handle empty stats gracefully', async () => {
      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        callCount++;
        if (table === 'forum_categories') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCategory,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'forum_threads' && callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 0,
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'forum_posts' && callCount === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 0,
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'forum_threads' && callCount === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await ForumCategoryService.getCategoryStats('cat-1');

      expect(result?.avg_replies_per_thread).toBe(0);
      expect(result?.unique_participants).toBe(0);
    });
  });

  describe('getPopularCategories', () => {
    it('should fetch categories ordered by thread count', async () => {
      const popularCategories = [
        { ...mockCategory, thread_count: 100 },
        { ...mockCategory, id: 'cat-2', thread_count: 50 },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: popularCategories,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getPopularCategories(6);

      expect(result).toEqual(popularCategories);
    });

    it('should use default limit of 6', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await ForumCategoryService.getPopularCategories();

      // Verify limit was called (default 6)
      expect(mockFrom).toHaveBeenCalled();
    });

    it('should throw error on query failure', async () => {
      const mockError = new Error('Query failed');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.getPopularCategories()).rejects.toThrow('Query failed');
    });
  });

  describe('createCategory', () => {
    it('should create new category with all fields', async () => {
      const newCategory = {
        name: 'Technical Support',
        slug: 'technical-support',
        description: 'Get help with technical issues',
        icon: '🔧',
        color: '#ef4444',
        display_order: 5,
        requires_auth: true,
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'cat-new', ...newCategory },
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.createCategory(newCategory);

      expect(result.slug).toBe('technical-support');
      expect(result.color).toBe('#ef4444');
    });

    it('should use default values for optional fields', async () => {
      const minimalCategory = {
        name: 'Minimal Category',
        slug: 'minimal',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'cat-min',
                ...minimalCategory,
                color: '#3b82f6',
                display_order: 0,
                requires_auth: false,
              },
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.createCategory(minimalCategory);

      expect(result.color).toBe('#3b82f6'); // Default color
      expect(result.display_order).toBe(0); // Default order
    });

    it('should throw error on creation failure', async () => {
      const mockError = new Error('Duplicate slug');
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(
        ForumCategoryService.createCategory({
          name: 'Test',
          slug: 'duplicate',
        })
      ).rejects.toThrow('Duplicate slug');
    });
  });

  describe('updateCategory', () => {
    it('should update category fields', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
        is_active: false,
      };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockCategory, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.updateCategory('cat-1', updates);

      expect(result.name).toBe('Updated Name');
      expect(result.is_active).toBe(false);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { color: '#00ff00' };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockCategory, color: '#00ff00' },
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.updateCategory('cat-1', partialUpdate);

      expect(result.color).toBe('#00ff00');
      expect(result.name).toBe(mockCategory.name); // Unchanged
    });

    it('should throw error on update failure', async () => {
      const mockError = new Error('Update failed');
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.updateCategory('cat-1', { name: 'Test' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteCategory', () => {
    it('should soft delete category by setting is_active to false', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.deleteCategory('cat-1')).resolves.toBeUndefined();
    });

    it('should throw error on deletion failure', async () => {
      const mockError = new Error('Delete failed');
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.deleteCategory('cat-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('reorderCategories', () => {
    it('should update display_order for all categories', async () => {
      const orderedIds = ['cat-3', 'cat-1', 'cat-2'];

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.reorderCategories(orderedIds)).resolves.toBeUndefined();

      // Should have been called 3 times (once per category)
      expect(mockFrom).toHaveBeenCalledTimes(3);
    });

    it('should assign sequential display_order values', async () => {
      const orderedIds = ['cat-1', 'cat-2'];
      const updateCalls: Array<{ id: string; display_order: number }> = [];

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((data: { display_order: number }) => {
          return {
            eq: vi.fn().mockImplementation((field: string, value: string) => {
              updateCalls.push({ id: value, display_order: data.display_order });
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await ForumCategoryService.reorderCategories(orderedIds);

      expect(updateCalls[0].display_order).toBe(0);
      expect(updateCalls[1].display_order).toBe(1);
    });

    it('should handle empty array gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumCategoryService.reorderCategories([])).resolves.toBeUndefined();
      expect(mockFrom).not.toHaveBeenCalled(); // No updates for empty array
    });
  });

  describe('getCategoryCount', () => {
    it('should return count of active categories', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 42,
            data: null,
            error: null,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryCount();

      expect(result).toBe(42);
    });

    it('should return 0 when no categories exist', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 0,
            data: null,
            error: null,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryCount();

      expect(result).toBe(0);
    });

    it('should return 0 on error instead of throwing', async () => {
      const mockError = new Error('Count failed');
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: null,
            data: null,
            error: mockError,
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumCategoryService.getCategoryCount();

      expect(result).toBe(0); // Should not throw, returns 0
    });
  });
});
