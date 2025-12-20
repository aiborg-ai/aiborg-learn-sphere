/**
 * Embedding Service
 * Generates vector embeddings using OpenAI API or Ollama for content similarity search
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Embedding provider configuration
type EmbeddingProvider = 'openai' | 'ollama';
const EMBEDDING_PROVIDER: EmbeddingProvider =
  (import.meta.env.VITE_EMBEDDING_PROVIDER as EmbeddingProvider) || 'ollama';

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_MODEL = 'text-embedding-3-small';
const OPENAI_DIMENSIONS = 1536;

// Ollama configuration
const OLLAMA_HOST = import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
const OLLAMA_DIMENSIONS = 768; // nomic-embed-text uses 768 dimensions

// Dynamic configuration based on provider
const EMBEDDING_MODEL = EMBEDDING_PROVIDER === 'openai' ? OPENAI_MODEL : OLLAMA_MODEL;
const _EMBEDDING_DIMENSIONS =
  EMBEDDING_PROVIDER === 'openai' ? OPENAI_DIMENSIONS : OLLAMA_DIMENSIONS;

// Rate limiting
const MAX_REQUESTS_PER_MINUTE = 5000;
const BATCH_SIZE = EMBEDDING_PROVIDER === 'ollama' ? 10 : 100; // Ollama: smaller batches

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface ContentEmbedding {
  id?: string;
  content_id: string;
  content_type: 'course' | 'learning_path' | 'blog_post' | 'assessment';
  embedding: number[];
  title?: string;
  description?: string;
  tags?: string[];
  difficulty_level?: string;
  embedding_text: string;
  model_version: string;
  embedding_quality_score?: number;
}

/**
 * Embedding Service
 * Handles vector embedding generation and storage
 */
export class EmbeddingService {
  private static rateLimitDelay = 60000 / MAX_REQUESTS_PER_MINUTE; // ms between requests

  /**
   * Check if embedding service is configured
   */
  static isConfigured(): boolean {
    if (EMBEDDING_PROVIDER === 'openai') {
      return Boolean(OPENAI_API_KEY);
    }
    // Ollama doesn't require API key, just needs to be running
    return true;
  }

  /**
   * Generate embedding using Ollama
   */
  private static async generateOllamaEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${error || response.statusText}`);
      }

      const data = await response.json();

      return {
        embedding: data.embedding,
        tokens: Math.ceil(text.length / 4), // Rough estimate: 1 token ≈ 4 chars
      };
    } catch (error) {
      logger.error('Failed to generate Ollama embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private static async generateOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          input: text,
          dimensions: OPENAI_DIMENSIONS,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        embedding: data.data[0].embedding,
        tokens: data.usage.total_tokens,
      };
    } catch (error) {
      logger.error('Failed to generate OpenAI embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for a single text (using configured provider)
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    logger.info(`Generating embedding using ${EMBEDDING_PROVIDER} (${EMBEDDING_MODEL})`);

    if (EMBEDDING_PROVIDER === 'ollama') {
      return this.generateOllamaEmbedding(text);
    } else {
      return this.generateOpenAIEmbedding(text);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  static async generateBatchEmbeddings(texts: string[]): Promise<Map<number, EmbeddingResult>> {
    const results = new Map<number, EmbeddingResult>();

    if (EMBEDDING_PROVIDER === 'ollama') {
      // Ollama: Process one at a time (no native batch support)
      logger.info(`Processing ${texts.length} texts with Ollama (one at a time)`);

      for (let i = 0; i < texts.length; i++) {
        try {
          logger.info(`Processing item ${i + 1}/${texts.length}`);
          const result = await this.generateOllamaEmbedding(texts[i]);
          results.set(i, result);

          // Small delay to avoid overwhelming Ollama
          if (i < texts.length - 1) {
            await this.sleep(100); // 100ms delay
          }
        } catch (error) {
          logger.error(`Error processing item ${i}:`, error);
        }
      }
    } else {
      // OpenAI: Process in batches
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const batches = this.chunkArray(texts, BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`);

        try {
          const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: OPENAI_MODEL,
              input: batch,
              dimensions: OPENAI_DIMENSIONS,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            logger.error(`Batch ${batchIndex} failed:`, error);
            continue;
          }

          const data = await response.json();

          // Map results back to original indices
          data.data.forEach((item: { embedding: number[] }, i: number) => {
            const originalIndex = batchIndex * BATCH_SIZE + i;
            results.set(originalIndex, {
              embedding: item.embedding,
              tokens: data.usage.total_tokens / batch.length, // Average tokens per item
            });
          });

          // Rate limiting delay between batches
          if (batchIndex < batches.length - 1) {
            await this.sleep(this.rateLimitDelay * BATCH_SIZE);
          }
        } catch (error) {
          logger.error(`Error processing batch ${batchIndex}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Generate embedding text from content metadata
   */
  static generateEmbeddingText(content: {
    title: string;
    description?: string;
    tags?: string[];
    category?: string;
  }): string {
    const parts: string[] = [content.title];

    if (content.description) {
      parts.push(content.description);
    }

    if (content.category) {
      parts.push(`Category: ${content.category}`);
    }

    if (content.tags && content.tags.length > 0) {
      parts.push(`Tags: ${content.tags.join(', ')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Save content embedding to database
   */
  static async saveContentEmbedding(embedding: ContentEmbedding): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('content_embeddings')
        .upsert(
          {
            content_id: embedding.content_id,
            content_type: embedding.content_type,
            embedding: `[${embedding.embedding.join(',')}]`, // Convert to PostgreSQL array format
            title: embedding.title,
            description: embedding.description,
            tags: embedding.tags,
            difficulty_level: embedding.difficulty_level,
            embedding_text: embedding.embedding_text,
            model_version: embedding.model_version || EMBEDDING_MODEL,
            embedding_quality_score: embedding.embedding_quality_score,
          },
          { onConflict: 'content_id,content_type' }
        )
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      logger.error('Failed to save content embedding:', error);
      throw error;
    }
  }

  /**
   * Get content embedding from database
   */
  static async getContentEmbedding(
    contentId: string,
    contentType: string
  ): Promise<ContentEmbedding | null> {
    try {
      const { data, error } = await supabase
        .from('content_embeddings')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as ContentEmbedding;
    } catch (error) {
      logger.error('Failed to get content embedding:', error);
      return null;
    }
  }

  /**
   * Update embeddings for all courses
   */
  static async updateCourseEmbeddings(): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const stats = { total: 0, success: 0, failed: 0 };

    try {
      // Fetch all courses
      const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, description, category, keywords, level');

      if (error) throw error;

      stats.total = courses?.length || 0;

      if (!courses || courses.length === 0) {
        logger.info('No courses found to process');
        return stats;
      }

      // Generate embedding texts
      const embeddingTexts = courses.map(
        (course: {
          title: string;
          description?: string | null;
          keywords?: string[] | null;
          category?: string | null;
        }) =>
          this.generateEmbeddingText({
            title: course.title,
            description: course.description || undefined,
            tags: course.keywords || undefined,
            category: course.category || undefined,
          })
      );

      // Generate embeddings in batch
      const embeddings = await this.generateBatchEmbeddings(embeddingTexts);

      // Save each embedding
      for (let i = 0; i < courses.length; i++) {
        const embeddingResult = embeddings.get(i);
        if (!embeddingResult) {
          stats.failed++;
          continue;
        }

        try {
          const course = courses[i] as {
            id: string;
            title: string;
            description: string | null;
            keywords?: string[] | null;
            level?: string | null;
          };
          await this.saveContentEmbedding({
            content_id: course.id,
            content_type: 'course',
            embedding: embeddingResult.embedding,
            title: course.title,
            description: course.description,
            tags: course.keywords || [],
            difficulty_level: course.level || undefined,
            embedding_text: embeddingTexts[i],
            model_version: EMBEDDING_MODEL,
          });
          stats.success++;
        } catch (error) {
          logger.error(`Failed to save embedding for course ${courses[i].id}:`, error);
          stats.failed++;
        }
      }

      logger.info('Course embeddings update complete:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to update course embeddings:', error);
      throw error;
    }
  }

  /**
   * Update embeddings for all learning paths
   */
  static async updateLearningPathEmbeddings(): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const stats = { total: 0, success: 0, failed: 0 };

    try {
      const { data: paths, error } = await supabase
        .from('learning_paths')
        .select('id, title, description, tags');

      if (error) throw error;

      stats.total = paths?.length || 0;

      if (!paths || paths.length === 0) {
        return stats;
      }

      const embeddingTexts = paths.map(_path =>
        this.generateEmbeddingText({
          title: _path.title,
          description: _path.description || undefined,
          tags: _path.tags || undefined,
        })
      );

      const embeddings = await this.generateBatchEmbeddings(embeddingTexts);

      for (let i = 0; i < paths.length; i++) {
        const embeddingResult = embeddings.get(i);
        if (!embeddingResult) {
          stats.failed++;
          continue;
        }

        try {
          await this.saveContentEmbedding({
            content_id: paths[i].id,
            content_type: 'learning_path',
            embedding: embeddingResult.embedding,
            title: paths[i].title,
            description: paths[i].description,
            tags: paths[i].tags || [],
            embedding_text: embeddingTexts[i],
            model_version: EMBEDDING_MODEL,
          });
          stats.success++;
        } catch (error) {
          logger.error(`Failed to save embedding for learning path ${paths[i].id}:`, error);
          stats.failed++;
        }
      }

      logger.info('Learning path embeddings update complete:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to update learning path embeddings:', error);
      throw error;
    }
  }

  /**
   * Update embeddings for all blog posts
   */
  static async updateBlogPostEmbeddings(): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const stats = { total: 0, success: 0, failed: 0 };

    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, excerpt, tags');

      if (error) throw error;

      stats.total = posts?.length || 0;

      if (!posts || posts.length === 0) {
        logger.info('No blog posts found to process');
        return stats;
      }

      const embeddingTexts = posts.map(
        (post: {
          title: string;
          excerpt?: string | null;
          content?: string | null;
          tags?: string[] | null;
          category?: string | null;
        }) =>
          this.generateEmbeddingText({
            title: post.title,
            description: post.excerpt || post.content?.substring(0, 500),
            tags: post.tags || undefined,
            category: post.category || undefined,
          })
      );

      const embeddings = await this.generateBatchEmbeddings(embeddingTexts);

      for (let i = 0; i < posts.length; i++) {
        const embeddingResult = embeddings.get(i);
        if (!embeddingResult) {
          stats.failed++;
          continue;
        }

        try {
          await this.saveContentEmbedding({
            content_id: posts[i].id,
            content_type: 'blog_post',
            embedding: embeddingResult.embedding,
            title: posts[i].title,
            description: posts[i].excerpt,
            tags: posts[i].tags || [],
            embedding_text: embeddingTexts[i],
            model_version: EMBEDDING_MODEL,
          });
          stats.success++;
        } catch (error) {
          logger.error(`Failed to save embedding for blog post ${posts[i].id}:`, error);
          stats.failed++;
        }
      }

      logger.info('Blog post embeddings update complete:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to update blog post embeddings:', error);
      throw error;
    }
  }

  /**
   * Update embeddings for all content types
   */
  static async updateAllEmbeddings(): Promise<{
    courses: { total: number; success: number; failed: number };
    learningPaths: { total: number; success: number; failed: number };
    blogPosts: { total: number; success: number; failed: number };
    totalTokens: number;
    estimatedCost: number;
  }> {
    logger.info('Starting batch embedding generation for all content...');

    const courses = await this.updateCourseEmbeddings();

    // Skip learning paths if table doesn't exist
    let learningPaths = { total: 0, success: 0, failed: 0 };
    try {
      learningPaths = await this.updateLearningPathEmbeddings();
    } catch (error) {
      logger.info(
        'Skipping learning paths:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    const blogPosts = await this.updateBlogPostEmbeddings();

    const totalItems = courses.success + learningPaths.success + blogPosts.success;
    const totalTokens = totalItems * 50; // Rough estimate: 50 tokens per item
    const estimatedCost = (totalTokens / 1000) * 0.00002; // $0.00002 per 1K tokens

    const summary = {
      courses,
      learningPaths,
      blogPosts,
      totalTokens,
      estimatedCost,
    };

    logger.info('Batch embedding generation complete:', summary);
    return summary;
  }

  /**
   * Find similar content using vector similarity
   */
  static async findSimilarContent(
    embedding: number[],
    contentType?: string,
    limit: number = 10,
    minSimilarity: number = 0.5
  ): Promise<Array<{ content_id: string; similarity: number; content_type: string }>> {
    try {
      const { data, error } = await supabase.rpc('find_similar_content', {
        query_embedding: `[${embedding.join(',')}]`,
        content_type_filter: contentType || null,
        limit_count: limit,
        min_similarity: minSimilarity,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to find similar content:', error);
      return [];
    }
  }

  // Helper methods

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
