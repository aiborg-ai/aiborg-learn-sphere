import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchService } from '../SearchService';
import { supabase } from '@/integrations/supabase/client';
import { EmbeddingService } from '@/services/ai/EmbeddingService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock EmbeddingService
vi.mock('@/services/ai/EmbeddingService', () => ({
  EmbeddingService: {
    isConfigured: vi.fn(),
    generateEmbedding: vi.fn(),
    findSimilarContent: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('SearchService', () => {
  const mockCourses = [
    {
      id: 'course-1',
      title: 'Introduction to TypeScript',
      description: 'Learn TypeScript basics',
      category: 'Programming',
      difficulty_level: 'beginner',
      tags: ['typescript', 'programming'],
    },
    {
      id: 'course-2',
      title: 'Advanced TypeScript Patterns',
      description: 'Master advanced TypeScript',
      category: 'Programming',
      difficulty_level: 'advanced',
      tags: ['typescript', 'advanced'],
    },
  ];

  const mockLearningPaths = [
    {
      id: 'path-1',
      title: 'Full Stack TypeScript',
      description: 'Complete TypeScript developer path',
      difficulty_level: 'intermediate',
      tags: ['typescript', 'fullstack'],
    },
  ];

  const mockBlogPosts = [
    {
      id: 'blog-1',
      title: 'TypeScript Best Practices',
      excerpt: 'Learn TypeScript best practices',
      meta_description: 'TypeScript tips and tricks',
      author_id: 'author-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      const result = await SearchService.search('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await SearchService.search('   ');
      expect(result).toEqual([]);
    });

    it('should perform keyword search and return results', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockCourses,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('TypeScript');

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('course');
      expect(results[0].title).toContain('TypeScript');
      expect(results[0].matchType).toBe('keyword');
    });

    it('should filter results by minimum relevance', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('TypeScript', { minRelevance: 0.9 });

      // Only exact or very close matches should pass
      expect(results.every(r => r.relevanceScore >= 0.9)).toBe(true);
    });

    it('should limit results based on options', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('TypeScript', { limit: 1 });

      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should filter by content types', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockCourses,
                  error: null,
                }),
              }),
            }),
          };
        }
        // Other tables shouldn't be called
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('TypeScript', {
        contentTypes: ['course'],
      });

      expect(results.every(r => r.type === 'course')).toBe(true);
    });

    it('should perform semantic search when enabled and configured', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmbeddingService.generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue({
        embedding: [0.1, 0.2, 0.3],
      });
      (EmbeddingService.findSimilarContent as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          content_id: 'course-semantic-1',
          title: 'TypeScript Fundamentals',
          description: 'Core TypeScript concepts',
          similarity: 0.95,
          difficulty_level: 'beginner',
          tags: ['typescript'],
        },
      ]);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('TypeScript');

      expect(results.some(r => r.matchType === 'semantic')).toBe(true);
      expect(EmbeddingService.generateEmbedding).toHaveBeenCalledWith('TypeScript');
    });

    it('should create hybrid results when found in both searches', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmbeddingService.generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue({
        embedding: [0.1, 0.2, 0.3],
      });

      // Same course found in both keyword and semantic search
      (EmbeddingService.findSimilarContent as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          content_id: 'course-1',
          title: 'Introduction to TypeScript',
          description: 'Learn TypeScript basics',
          similarity: 0.95,
          difficulty_level: 'beginner',
          tags: ['typescript'],
        },
      ]);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [mockCourses[0]],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('Introduction to TypeScript');

      const hybridResult = results.find(r => r.id === 'course-1');
      expect(hybridResult?.matchType).toBe('hybrid');
    });

    it('should skip semantic search when useSemanticSearch is false', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await SearchService.search('TypeScript', { useSemanticSearch: false });

      expect(EmbeddingService.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(SearchService.search('TypeScript')).rejects.toThrow();
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array for empty query', async () => {
      const suggestions = await SearchService.getSuggestions('');
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for single character query', async () => {
      const suggestions = await SearchService.getSuggestions('T');
      expect(suggestions).toEqual([]);
    });

    it('should return course title suggestions', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockCourses.map(c => ({ title: c.title })),
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const suggestions = await SearchService.getSuggestions('Type');

      expect(suggestions).toHaveLength(2);
      expect(suggestions).toContain('Introduction to TypeScript');
      expect(suggestions).toContain('Advanced TypeScript Patterns');
    });

    it('should limit suggestions to specified count', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ title: mockCourses[0].title }],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const suggestions = await SearchService.getSuggestions('Type', 1);

      expect(suggestions).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const suggestions = await SearchService.getSuggestions('Type');

      expect(suggestions).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const suggestions = await SearchService.getSuggestions('Type');

      expect(suggestions).toEqual([]);
    });
  });

  describe('keyword search for different content types', () => {
    it('should search learning paths', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'learning_paths') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockLearningPaths,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const results = await SearchService.search('TypeScript', {
        contentTypes: ['learning_path'],
      });

      expect(results.some(r => r.type === 'learning_path')).toBe(true);
    });

    it('should search blog posts with published status filter', async () => {
      (EmbeddingService.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockEq = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: mockBlogPosts,
          error: null,
        }),
      });

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'blog_posts') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: mockEq,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await SearchService.search('TypeScript', { contentTypes: ['blog_post'] });

      expect(mockEq).toHaveBeenCalledWith('status', 'published');
    });
  });
});
