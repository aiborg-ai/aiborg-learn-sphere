/**
 * SearchService
 * Hybrid search combining keyword matching and AI semantic search
 */

import { supabase } from '@/integrations/supabase/client';
import { EmbeddingService } from '@/services/ai/EmbeddingService';
import { logger } from '@/utils/logger';

export type ContentType = 'course' | 'learning_path' | 'blog_post' | 'assignment' | 'material';

export interface SearchResult {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  relevanceScore: number;
  matchType: 'keyword' | 'semantic' | 'hybrid';
  metadata?: {
    category?: string;
    difficulty?: string;
    tags?: string[];
    author?: string;
    url?: string;
  };
}

export interface SearchOptions {
  limit?: number;
  contentTypes?: ContentType[];
  minRelevance?: number;
  useSemanticSearch?: boolean;
}

/**
 * SearchService class
 * Provides hybrid search capabilities across all content types
 */
export class SearchService {
  /**
   * Perform hybrid search (keyword + semantic)
   */
  static async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      limit = 20,
      contentTypes = ['course', 'learning_path', 'blog_post', 'assignment', 'material'],
      minRelevance = 0.3,
      useSemanticSearch = true,
    } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // Run keyword and semantic searches in parallel
      const [keywordResults, semanticResults] = await Promise.all([
        this.keywordSearch(query, contentTypes, limit),
        useSemanticSearch && EmbeddingService.isConfigured()
          ? this.semanticSearch(query, contentTypes, limit)
          : Promise.resolve([]),
      ]);

      // Merge and rank results
      const mergedResults = this.mergeResults(keywordResults, semanticResults);

      // Filter by minimum relevance
      const filteredResults = mergedResults.filter(r => r.relevanceScore >= minRelevance);

      // Return top N results
      return filteredResults.slice(0, limit);
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Keyword-based search across all content types
   */
  private static async keywordSearch(
    query: string,
    contentTypes: ContentType[],
    limit: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchTerm = `%${query}%`;

    // Search courses
    if (contentTypes.includes('course')) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, description, category, difficulty_level, tags')
          .or(
            `title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`
          )
          .limit(limit);

        if (!error && data) {
          results.push(
            ...data.map(course => ({
              id: course.id,
              type: 'course' as ContentType,
              title: course.title,
              description: course.description || '',
              relevanceScore: this.calculateKeywordRelevance(
                query,
                course.title,
                course.description
              ),
              matchType: 'keyword' as const,
              metadata: {
                category: course.category,
                difficulty: course.difficulty_level,
                tags: course.tags || [],
              },
            }))
          );
        }
      } catch (error) {
        logger.error('Course keyword search failed:', error);
      }
    }

    // Search learning paths
    if (contentTypes.includes('learning_path')) {
      try {
        const { data, error } = await supabase
          .from('learning_paths')
          .select('id, title, description, difficulty_level, tags')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(limit);

        if (!error && data) {
          results.push(
            ...data.map(path => ({
              id: path.id,
              type: 'learning_path' as ContentType,
              title: path.title,
              description: path.description || '',
              relevanceScore: this.calculateKeywordRelevance(query, path.title, path.description),
              matchType: 'keyword' as const,
              metadata: {
                difficulty: path.difficulty_level,
                tags: path.tags || [],
              },
            }))
          );
        }
      } catch (error) {
        logger.error('Learning path keyword search failed:', error);
      }
    }

    // Search blog posts
    if (contentTypes.includes('blog_post')) {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, excerpt, meta_description, author_id')
          .or(
            `title.ilike.${searchTerm},excerpt.ilike.${searchTerm},meta_description.ilike.${searchTerm}`
          )
          .eq('status', 'published')
          .limit(limit);

        if (!error && data) {
          results.push(
            ...data.map(post => ({
              id: post.id,
              type: 'blog_post' as ContentType,
              title: post.title,
              description: post.excerpt || post.meta_description || '',
              relevanceScore: this.calculateKeywordRelevance(
                query,
                post.title,
                post.excerpt || post.meta_description
              ),
              matchType: 'keyword' as const,
              metadata: {
                author: post.author_id,
                url: `/blog/${post.id}`,
              },
            }))
          );
        }
      } catch (error) {
        logger.error('Blog post keyword search failed:', error);
      }
    }

    // Search assignments
    if (contentTypes.includes('assignment')) {
      try {
        const { data, error } = await supabase
          .from('homework_assignments')
          .select('id, title, description, course_id')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(limit);

        if (!error && data) {
          results.push(
            ...data.map(assignment => ({
              id: assignment.id,
              type: 'assignment' as ContentType,
              title: assignment.title,
              description: assignment.description || '',
              relevanceScore: this.calculateKeywordRelevance(
                query,
                assignment.title,
                assignment.description
              ),
              matchType: 'keyword' as const,
              metadata: {
                url: `/courses/${assignment.course_id}`,
              },
            }))
          );
        }
      } catch (error) {
        logger.error('Assignment keyword search failed:', error);
      }
    }

    // Search course materials
    if (contentTypes.includes('material')) {
      try {
        const { data, error } = await supabase
          .from('course_materials')
          .select('id, title, type, content_url, course_id')
          .ilike('title', searchTerm)
          .limit(limit);

        if (!error && data) {
          results.push(
            ...data.map(material => ({
              id: material.id,
              type: 'material' as ContentType,
              title: material.title,
              description: `${material.type} material`,
              relevanceScore: this.calculateKeywordRelevance(query, material.title, ''),
              matchType: 'keyword' as const,
              metadata: {
                category: material.type,
                url: `/courses/${material.course_id}`,
              },
            }))
          );
        }
      } catch (error) {
        logger.error('Material keyword search failed:', error);
      }
    }

    return results;
  }

  /**
   * Semantic search using AI embeddings
   */
  private static async semanticSearch(
    query: string,
    contentTypes: ContentType[],
    limit: number
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for search query
      const { embedding } = await EmbeddingService.generateEmbedding(query);

      // Map our content types to database content types
      const dbContentTypes = contentTypes
        .filter(type => ['course', 'learning_path', 'blog_post'].includes(type))
        .map(type => type);

      if (dbContentTypes.length === 0) {
        return [];
      }

      const results: SearchResult[] = [];

      // Search each content type
      for (const contentType of dbContentTypes) {
        try {
          const similarContent = await EmbeddingService.findSimilarContent(
            embedding,
            contentType,
            limit,
            0.5 // minimum similarity threshold
          );

          results.push(
            ...similarContent.map(
              (item: {
                content_id: string;
                title?: string;
                description?: string;
                similarity?: number;
                difficulty_level?: string;
                tags?: string[];
              }) => ({
                id: item.content_id,
                type: contentType as ContentType,
                title: item.title || '',
                description: item.description || '',
                relevanceScore: item.similarity || 0,
                matchType: 'semantic' as const,
                metadata: {
                  difficulty: item.difficulty_level,
                  tags: item.tags || [],
                },
              })
            )
          );
        } catch (error) {
          logger.error(`Semantic search failed for ${contentType}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error('Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Calculate keyword relevance score
   */
  private static calculateKeywordRelevance(
    query: string,
    title: string,
    description?: string | null
  ): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const descLower = (description || '').toLowerCase();

    // Exact title match = 1.0
    if (titleLower === queryLower) return 1.0;

    // Title starts with query = 0.9
    if (titleLower.startsWith(queryLower)) return 0.9;

    // Title contains query = 0.8
    if (titleLower.includes(queryLower)) return 0.8;

    // Description contains query = 0.6
    if (descLower.includes(queryLower)) return 0.6;

    // Partial word match = 0.4
    const queryWords = queryLower.split(/\s+/);
    const titleWords = titleLower.split(/\s+/);
    const matchingWords = queryWords.filter(word => titleWords.some(tw => tw.includes(word)));

    if (matchingWords.length > 0) {
      return 0.4 * (matchingWords.length / queryWords.length);
    }

    return 0.3; // Default low relevance
  }

  /**
   * Merge keyword and semantic results with intelligent ranking
   */
  private static mergeResults(
    keywordResults: SearchResult[],
    semanticResults: SearchResult[]
  ): SearchResult[] {
    const resultMap = new Map<string, SearchResult>();

    // Add keyword results
    keywordResults.forEach(result => {
      const key = `${result.type}-${result.id}`;
      resultMap.set(key, result);
    });

    // Merge semantic results
    semanticResults.forEach(result => {
      const key = `${result.type}-${result.id}`;
      const existing = resultMap.get(key);

      if (existing) {
        // Hybrid: found in both keyword and semantic
        resultMap.set(key, {
          ...existing,
          relevanceScore: Math.max(
            existing.relevanceScore * 0.6 + result.relevanceScore * 0.4,
            Math.max(existing.relevanceScore, result.relevanceScore)
          ),
          matchType: 'hybrid',
        });
      } else {
        // Only in semantic results
        resultMap.set(key, result);
      }
    });

    // Convert to array and sort by relevance
    return Array.from(resultMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get search suggestions based on query
   */
  static async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const searchTerm = `${query}%`;

      // Get suggestions from course titles
      const { data, error } = await supabase
        .from('courses')
        .select('title')
        .ilike('title', searchTerm)
        .limit(limit);

      if (error || !data) return [];

      return data.map(item => item.title);
    } catch (error) {
      logger.error('Failed to get suggestions:', error);
      return [];
    }
  }
}
