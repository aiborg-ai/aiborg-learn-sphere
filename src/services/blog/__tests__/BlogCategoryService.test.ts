import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlogCategoryService } from '../BlogCategoryService';
import { supabase } from '@/integrations/supabase/client';
import type { BlogCategory } from '@/types/blog';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('BlogCategoryService', () => {
  const mockCategories: BlogCategory[] = [
    {
      id: 'cat-1',
      slug: 'technology',
      name: 'Technology',
      description: 'Tech articles',
      sort_order: 1,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'cat-2',
      slug: 'education',
      name: 'Education',
      description: 'Educational content',
      sort_order: 2,
      is_active: true,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCategories', () => {
    it('should fetch all active categories ordered by sort_order', async () => {
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

      const result = await BlogCategoryService.getCategories();

      expect(mockFrom).toHaveBeenCalledWith('blog_categories');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Technology');
    });

    it('should only fetch active categories', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockCategories,
          error: null,
        }),
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogCategoryService.getCategories();

      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle empty result', async () => {
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

      const result = await BlogCategoryService.getCategories();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when database query fails', async () => {
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

      await expect(BlogCategoryService.getCategories()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should order categories by sort_order ascending', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogCategoryService.getCategories();

      expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
    });
  });

  describe('createCategory', () => {
    it('should create a new category and return it', async () => {
      const newCategory: Partial<BlogCategory> = {
        slug: 'science',
        name: 'Science',
        description: 'Scientific articles',
        sort_order: 3,
        is_active: true,
      };

      const createdCategory: BlogCategory = {
        id: 'cat-3',
        ...(newCategory as BlogCategory),
        created_at: '2024-01-03',
        updated_at: '2024-01-03',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdCategory,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCategoryService.createCategory(newCategory);

      expect(mockFrom).toHaveBeenCalledWith('blog_categories');
      expect(result).toEqual(createdCategory);
      expect(result.id).toBe('cat-3');
      expect(result.name).toBe('Science');
    });

    it('should handle partial category data', async () => {
      const partialCategory: Partial<BlogCategory> = {
        slug: 'minimal',
        name: 'Minimal Category',
      };

      const createdCategory: BlogCategory = {
        id: 'cat-4',
        slug: 'minimal',
        name: 'Minimal Category',
        description: null as any,
        sort_order: 0,
        is_active: true,
        created_at: '2024-01-04',
        updated_at: '2024-01-04',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdCategory,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await BlogCategoryService.createCategory(partialCategory);

      expect(result).toBeDefined();
      expect(result.slug).toBe('minimal');
    });

    it('should throw error when insert fails', async () => {
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

      const newCategory: Partial<BlogCategory> = {
        slug: 'duplicate',
        name: 'Duplicate',
      };

      await expect(BlogCategoryService.createCategory(newCategory)).rejects.toThrow(
        'Duplicate slug'
      );
    });

    it('should call insert with provided category data', async () => {
      const newCategory: Partial<BlogCategory> = {
        slug: 'test-category',
        name: 'Test Category',
        description: 'Test description',
        sort_order: 5,
        is_active: false,
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'cat-5', ...newCategory },
            error: null,
          }),
        }),
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await BlogCategoryService.createCategory(newCategory);

      expect(mockInsert).toHaveBeenCalledWith(newCategory);
    });
  });
});
