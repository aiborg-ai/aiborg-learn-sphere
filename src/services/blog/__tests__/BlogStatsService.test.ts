import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlogStatsService } from '../BlogStatsService';
import { supabase } from '@/integrations/supabase/client';
import { BlogPostService } from '../BlogPostService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock BlogPostService
vi.mock('../BlogPostService', () => ({
  BlogPostService: {
    getPosts: vi.fn(),
  },
}));

describe('BlogStatsService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
  };

  const mockAdminProfile = {
    role: 'admin',
    user_id: 'user-123',
  };

  const mockUserProfile = {
    role: 'user',
    user_id: 'user-123',
  };

  const mockTrendingPosts = {
    posts: [
      { id: 'post-1', title: 'Trending Post 1', view_count: 100 },
      { id: 'post-2', title: 'Trending Post 2', view_count: 90 },
    ],
    total: 2,
    page: 1,
    per_page: 5,
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Tech', post_count: 50 },
    { id: 'cat-2', name: 'Education', post_count: 30 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBlogStats', () => {
    it('should return comprehensive stats for admin users', async () => {
      // Mock auth
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock profile check
      const mockProfileQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAdminProfile,
              error: null,
            }),
          }),
        }),
      };

      let blogPostsCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return mockProfileQuery;
        }
        if (table === 'blog_categories') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockCategories,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_posts') {
          blogPostsCallCount++;
          if (blogPostsCallCount === 1) {
            // First call: posts count
            return { select: vi.fn().mockResolvedValue({ count: 100, data: null, error: null }) };
          } else if (blogPostsCallCount === 2) {
            // Second call: views
            return {
              select: vi.fn().mockResolvedValue({
                data: [{ view_count: 50 }, { view_count: 30 }, { view_count: 20 }],
                error: null,
              }),
            };
          } else {
            // Third call: monthly posts with .gte()
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 15, data: null, error: null }),
              }),
            };
          }
        }
        if (table === 'blog_likes') {
          return { select: vi.fn().mockResolvedValue({ count: 250, data: null, error: null }) };
        }
        if (table === 'blog_comments') {
          return { select: vi.fn().mockResolvedValue({ count: 180, data: null, error: null }) };
        }
        if (table === 'blog_shares') {
          return { select: vi.fn().mockResolvedValue({ count: 75, data: null, error: null }) };
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) };
      });

      // Mock BlogPostService
      (BlogPostService.getPosts as ReturnType<typeof vi.fn>).mockResolvedValue(mockTrendingPosts);

      const result = await BlogStatsService.getBlogStats();

      expect(result).toEqual({
        total_posts: 100,
        total_views: 100, // 50 + 30 + 20
        total_likes: 250,
        total_comments: 180,
        total_shares: 75,
        posts_this_month: 15,
        trending_posts: mockTrendingPosts.posts,
        popular_categories: mockCategories,
      });
    });

    it('should throw error for non-admin users', async () => {
      // Mock auth
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock non-admin profile
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogStatsService.getBlogStats()).rejects.toThrow('Unauthorized');
    });

    it('should throw error when no user is logged in', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(BlogStatsService.getBlogStats()).rejects.toThrow('Unauthorized');
    });

    it('should handle zero view counts correctly', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let blogPostsCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAdminProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_categories') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_posts') {
          blogPostsCallCount++;
          if (blogPostsCallCount === 1) {
            return { select: vi.fn().mockResolvedValue({ count: 10, data: null, error: null }) };
          } else if (blogPostsCallCount === 2) {
            return {
              select: vi.fn().mockResolvedValue({
                data: [{ view_count: 0 }, { view_count: null }],
                error: null,
              }),
            };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 8, data: null, error: null }),
              }),
            };
          }
        }
        if (table === 'blog_likes') {
          return { select: vi.fn().mockResolvedValue({ count: 5, data: null, error: null }) };
        }
        if (table === 'blog_comments') {
          return { select: vi.fn().mockResolvedValue({ count: 3, data: null, error: null }) };
        }
        if (table === 'blog_shares') {
          return { select: vi.fn().mockResolvedValue({ count: 2, data: null, error: null }) };
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) };
      });

      (BlogPostService.getPosts as ReturnType<typeof vi.fn>).mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        per_page: 5,
      });

      const result = await BlogStatsService.getBlogStats();

      expect(result.total_views).toBe(0);
    });

    it('should handle null counts gracefully', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let blogPostsCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAdminProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_categories') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_posts') {
          blogPostsCallCount++;
          if (blogPostsCallCount === 1) {
            return { select: vi.fn().mockResolvedValue({ count: null, data: null, error: null }) };
          } else if (blogPostsCallCount === 2) {
            return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: null, data: null, error: null }),
              }),
            };
          }
        }
        if (table === 'blog_likes') {
          return { select: vi.fn().mockResolvedValue({ count: null, data: null, error: null }) };
        }
        if (table === 'blog_comments') {
          return { select: vi.fn().mockResolvedValue({ count: null, data: null, error: null }) };
        }
        if (table === 'blog_shares') {
          return { select: vi.fn().mockResolvedValue({ count: null, data: null, error: null }) };
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) };
      });

      (BlogPostService.getPosts as ReturnType<typeof vi.fn>).mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        per_page: 5,
      });

      const result = await BlogStatsService.getBlogStats();

      expect(result).toEqual({
        total_posts: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        posts_this_month: 0,
        trending_posts: [],
        popular_categories: [],
      });
    });

    it('should call BlogPostService.getPosts with correct parameters', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let blogPostsCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAdminProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_categories') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_posts') {
          blogPostsCallCount++;
          if (blogPostsCallCount === 1) {
            return { select: vi.fn().mockResolvedValue({ count: 50, data: null, error: null }) };
          } else if (blogPostsCallCount === 2) {
            return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 20, data: null, error: null }),
              }),
            };
          }
        }
        if (table === 'blog_likes') {
          return { select: vi.fn().mockResolvedValue({ count: 10, data: null, error: null }) };
        }
        if (table === 'blog_comments') {
          return { select: vi.fn().mockResolvedValue({ count: 5, data: null, error: null }) };
        }
        if (table === 'blog_shares') {
          return { select: vi.fn().mockResolvedValue({ count: 2, data: null, error: null }) };
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) };
      });

      (BlogPostService.getPosts as ReturnType<typeof vi.fn>).mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        per_page: 5,
      });

      await BlogStatsService.getBlogStats();

      expect(BlogPostService.getPosts).toHaveBeenCalledWith({
        sortBy: 'trending',
        limit: 5,
      });
    });

    it('should fetch popular categories limited to top 5', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLimit = vi.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      let blogPostsCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAdminProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'blog_categories') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: mockLimit,
              }),
            }),
          };
        }
        if (table === 'blog_posts') {
          blogPostsCallCount++;
          if (blogPostsCallCount === 1) {
            return { select: vi.fn().mockResolvedValue({ count: 50, data: null, error: null }) };
          } else if (blogPostsCallCount === 2) {
            return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 20, data: null, error: null }),
              }),
            };
          }
        }
        if (table === 'blog_likes') {
          return { select: vi.fn().mockResolvedValue({ count: 10, data: null, error: null }) };
        }
        if (table === 'blog_comments') {
          return { select: vi.fn().mockResolvedValue({ count: 5, data: null, error: null }) };
        }
        if (table === 'blog_shares') {
          return { select: vi.fn().mockResolvedValue({ count: 2, data: null, error: null }) };
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) };
      });

      (BlogPostService.getPosts as ReturnType<typeof vi.fn>).mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        per_page: 5,
      });

      await BlogStatsService.getBlogStats();

      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });
});
