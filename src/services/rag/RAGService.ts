/**
 * RAG (Retrieval Augmented Generation) Service
 * Client-side interface for the RAG-powered AI tutor
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RAGSource {
  type: string;
  title: string;
  similarity: number;
}

export interface RAGChatResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  rag_enabled: boolean;
  sources_used: number;
  sources: RAGSource[];
  performance: {
    search_ms: number;
    total_ms: number;
  };
}

export interface RAGChatOptions {
  messages: ChatMessage[];
  audience?: 'primary' | 'secondary' | 'professional' | 'business';
  enable_rag?: boolean;
}

export class RAGService {
  /**
   * Send a chat message with RAG enhancement
   */
  static async chat(options: RAGChatOptions): Promise<RAGChatResponse> {
    const { data, error } = await supabase.functions.invoke('ai-chat-rag', {
      body: {
        messages: options.messages,
        audience: options.audience || 'professional',
        enable_rag: options.enable_rag !== false, // Default to true
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to get AI response');
    }

    return data as RAGChatResponse;
  }

  /**
   * Generate embeddings for content (admin only)
   * This indexes all content for semantic search
   */
  static async generateEmbeddings(options?: {
    content_type?: string;
    content_id?: string;
    force_refresh?: boolean;
  }) {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: options || {},
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate embeddings');
    }

    return data;
  }

  /**
   * Get RAG analytics (admin only)
   */
  static async getAnalytics(options?: { start_date?: string; end_date?: string; limit?: number }) {
    let query = supabase
      .from('rag_query_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date);
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || 'Failed to fetch analytics');
    }

    return data;
  }

  /**
   * Submit feedback on a RAG response
   */
  static async submitFeedback(analyticsId: string, helpful: boolean, feedback?: string) {
    const { error } = await supabase
      .from('rag_query_analytics')
      .update({
        was_helpful: helpful,
        user_feedback: feedback || null,
      })
      .eq('id', analyticsId);

    if (error) {
      throw new Error(error.message || 'Failed to submit feedback');
    }
  }

  /**
   * Get embedding statistics
   */
  static async getEmbeddingStats() {
    const { data, error } = await supabase.from('content_embeddings').select('content_type');

    if (error) {
      throw new Error(error.message || 'Failed to fetch embedding stats');
    }

    // Count by content type
    const stats = data.reduce(
      (acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: data.length,
      by_type: stats,
    };
  }

  /**
   * Test semantic search (for debugging)
   */
  static async testSearch(
    query: string,
    options?: {
      content_type?: string;
      threshold?: number;
      limit?: number;
    }
  ) {
    // First, get embedding for query
    const embeddingResponse = await supabase.functions.invoke('generate-embeddings', {
      body: {
        text: query, // Single text query
      },
    });

    if (embeddingResponse.error) {
      throw new Error('Failed to generate query embedding');
    }

    const { data: searchResults, error: searchError } = await supabase.rpc(
      'search_content_by_similarity',
      {
        query_embedding: embeddingResponse.data.embedding,
        match_threshold: options?.threshold || 0.7,
        match_count: options?.limit || 5,
        filter_content_type: options?.content_type || null,
      }
    );

    if (searchError) {
      throw new Error(searchError.message || 'Semantic search failed');
    }

    return searchResults;
  }
}
