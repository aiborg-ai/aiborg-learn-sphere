/**
 * LLM Response Cache Service
 * Handles caching of LLM responses to reduce API costs
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { CacheEntry } from './types';

// Cache table name
const CACHE_TABLE = 'llm_response_cache';

// In-memory cache for hot entries (reduces DB queries)
const memoryCache = new Map<string, { response: string; expiresAt: number }>();
const MEMORY_CACHE_MAX_SIZE = 100;
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a hash for cache key
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate cache key from prompt and model
 */
export function generateCacheKey(
  messages: Array<{ role: string; content: string }>,
  model: string
): string {
  const promptContent = messages.map(m => `${m.role}:${m.content}`).join('|');
  const hash = hashString(promptContent + model);
  return `llm_${model.replace(/\//g, '_')}_${hash}`;
}

/**
 * Response Cache Service
 */
export class ResponseCache {
  /**
   * Get cached response
   */
  static async get(cacheKey: string): Promise<string | null> {
    try {
      // Check memory cache first
      const memEntry = memoryCache.get(cacheKey);
      if (memEntry && memEntry.expiresAt > Date.now()) {
        return memEntry.response;
      }

      // Check database cache
      const { data, error } = await supabase
        .from(CACHE_TABLE)
        .select('response, expires_at, hit_count')
        .eq('cache_key', cacheKey)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        // Expired, delete it
        await this.delete(cacheKey);
        return null;
      }

      // Update hit count (fire and forget)
      supabase
        .from(CACHE_TABLE)
        .update({ hit_count: (data.hit_count || 0) + 1 })
        .eq('cache_key', cacheKey)
        .then(() => {});

      // Store in memory cache
      this.setMemoryCache(cacheKey, data.response);

      return data.response;
    } catch (error) {
      logger.error('Error getting cache entry:', error);
      return null;
    }
  }

  /**
   * Set cached response
   */
  static async set(
    cacheKey: string,
    promptHash: string,
    response: string,
    model: string,
    tokensUsed: number,
    costUsd: number,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

      // Upsert to database
      const { error } = await supabase.from(CACHE_TABLE).upsert(
        {
          cache_key: cacheKey,
          prompt_hash: promptHash,
          response,
          model,
          tokens_used: tokensUsed,
          cost_usd: costUsd,
          expires_at: expiresAt,
          hit_count: 0,
        },
        { onConflict: 'cache_key' }
      );

      if (error) {
        throw error;
      }

      // Store in memory cache
      this.setMemoryCache(cacheKey, response);
    } catch (error) {
      logger.error('Error setting cache entry:', error);
    }
  }

  /**
   * Delete cached response
   */
  static async delete(cacheKey: string): Promise<void> {
    try {
      memoryCache.delete(cacheKey);

      await supabase.from(CACHE_TABLE).delete().eq('cache_key', cacheKey);
    } catch (error) {
      logger.error('Error deleting cache entry:', error);
    }
  }

  /**
   * Clear expired entries
   */
  static async clearExpired(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(CACHE_TABLE)
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('Error clearing expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    totalCostSaved: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from(CACHE_TABLE)
        .select('hit_count, cost_usd, created_at')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalEntries: 0,
          totalHits: 0,
          totalCostSaved: 0,
          oldestEntry: null,
          newestEntry: null,
        };
      }

      const totalHits = data.reduce((sum, e) => sum + (e.hit_count || 0), 0);
      const totalCostSaved = data.reduce(
        (sum, e) => sum + (e.cost_usd || 0) * (e.hit_count || 0),
        0
      );
      const dates = data.map(e => new Date(e.created_at).getTime());

      return {
        totalEntries: data.length,
        totalHits,
        totalCostSaved,
        oldestEntry: new Date(Math.min(...dates)).toISOString(),
        newestEntry: new Date(Math.max(...dates)).toISOString(),
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        totalCostSaved: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Get cached entry by key (full details)
   */
  static async getEntry(cacheKey: string): Promise<CacheEntry | null> {
    try {
      const { data, error } = await supabase
        .from(CACHE_TABLE)
        .select('*')
        .eq('cache_key', cacheKey)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        cacheKey: data.cache_key,
        promptHash: data.prompt_hash,
        response: data.response,
        model: data.model,
        tokensUsed: data.tokens_used,
        costUsd: data.cost_usd,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        hitCount: data.hit_count,
      };
    } catch (error) {
      logger.error('Error getting cache entry:', error);
      return null;
    }
  }

  /**
   * Set memory cache entry
   */
  private static setMemoryCache(cacheKey: string, response: string): void {
    // Evict oldest if at capacity
    if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) {
        memoryCache.delete(firstKey);
      }
    }

    memoryCache.set(cacheKey, {
      response,
      expiresAt: Date.now() + MEMORY_CACHE_TTL,
    });
  }

  /**
   * Clear memory cache
   */
  static clearMemoryCache(): void {
    memoryCache.clear();
  }
}
