/**
 * Query Caching Service for AI Chatbot
 *
 * This service provides intelligent caching for common questions to reduce
 * OpenAI API costs and improve response times.
 *
 * Features:
 * - In-memory LRU cache for hot queries
 * - Database-backed persistent cache
 * - Automatic cache invalidation
 * - Cache hit/miss metrics
 * - Query similarity matching
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Simple hash function for generating cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Normalize query for cache matching
 * - Convert to lowercase
 * - Remove extra spaces
 * - Remove punctuation
 * - Sort words alphabetically
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim()
    .split(' ')
    .sort()
    .join(' ');
}

/**
 * Calculate similarity between two queries using Jaccard similarity
 * Returns value between 0 (no match) and 1 (exact match)
 */
function calculateSimilarity(query1: string, query2: string): number {
  const words1 = new Set(query1.toLowerCase().split(/\s+/));
  const words2 = new Set(query2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * In-memory LRU cache for hot queries
 */
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 100, ttlMs = 3600000) { // Default: 100 items, 1 hour TTL
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  query: string;
  normalized_query: string;
  response: string;
  audience: string;
  query_type: string;
  model_used: string;
  hit_count: number;
  created_at: string;
  expires_at: string;
}

/**
 * Cache result interface
 */
interface CacheResult {
  hit: boolean;
  response?: string;
  model_used?: string;
  cache_key?: string;
  similarity?: number;
  source?: 'memory' | 'database' | 'none';
}

/**
 * Query Cache Service
 */
export class QueryCacheService {
  private memoryCache: LRUCache<string, CacheEntry>;
  private supabase: ReturnType<typeof createClient>;
  private similarityThreshold = 0.85; // Minimum similarity for cache match

  constructor(
    supabaseUrl: string,
    supabaseServiceKey: string,
    memCacheSize = 100,
    memCacheTTL = 3600000 // 1 hour
  ) {
    this.memoryCache = new LRUCache(memCacheSize, memCacheTTL);
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Generate cache key for a query
   */
  private getCacheKey(query: string, audience: string): string {
    const normalized = normalizeQuery(query);
    return `${audience}:${simpleHash(normalized)}`;
  }

  /**
   * Check if query is cacheable
   * Some queries should not be cached (e.g., personalized, time-sensitive)
   */
  private isCacheable(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    // Don't cache queries with personal pronouns
    if (/\b(my|mine|i am|i'm|me)\b/.test(lowerQuery)) {
      return false;
    }

    // Don't cache time-sensitive queries
    if (/\b(today|now|current|latest|this week)\b/.test(lowerQuery)) {
      return false;
    }

    // Don't cache very short or very long queries
    if (query.length < 10 || query.length > 500) {
      return false;
    }

    return true;
  }

  /**
   * Get cached response if available
   */
  async get(
    query: string,
    audience: string
  ): Promise<CacheResult> {
    // Check if cacheable
    if (!this.isCacheable(query)) {
      return { hit: false, source: 'none' };
    }

    const cacheKey = this.getCacheKey(query, audience);
    const normalized = normalizeQuery(query);

    // 1. Check memory cache first (fastest)
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry) {
      console.log(`🎯 Memory cache HIT: ${query.substring(0, 50)}...`);

      // Increment hit count in background
      this.incrementHitCount(cacheKey).catch(console.error);

      return {
        hit: true,
        response: memEntry.response,
        model_used: memEntry.model_used,
        cache_key: cacheKey,
        source: 'memory',
      };
    }

    // 2. Check database cache
    try {
      // First try exact match on normalized query
      const { data: exactMatch, error: exactError } = await this.supabase
        .from('chatbot_query_cache')
        .select('*')
        .eq('normalized_query', normalized)
        .eq('audience', audience)
        .gt('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (exactMatch) {
        console.log(`🎯 Database cache HIT (exact): ${query.substring(0, 50)}...`);

        // Store in memory cache for future hits
        this.memoryCache.set(cacheKey, exactMatch);

        // Increment hit count in background
        this.incrementHitCount(cacheKey).catch(console.error);

        return {
          hit: true,
          response: exactMatch.response,
          model_used: exactMatch.model_used,
          cache_key: cacheKey,
          similarity: 1.0,
          source: 'database',
        };
      }

      // 3. Try fuzzy matching with similarity check
      const { data: similarMatches, error: similarError } = await this.supabase
        .from('chatbot_query_cache')
        .select('*')
        .eq('audience', audience)
        .gt('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .limit(10); // Check top 10 most-used cached queries

      if (similarMatches && similarMatches.length > 0) {
        for (const match of similarMatches) {
          const similarity = calculateSimilarity(normalized, match.normalized_query);

          if (similarity >= this.similarityThreshold) {
            console.log(
              `🎯 Database cache HIT (fuzzy, ${(similarity * 100).toFixed(1)}%): ${query.substring(0, 50)}...`
            );

            // Store in memory cache
            this.memoryCache.set(cacheKey, match);

            // Increment hit count in background
            this.incrementHitCount(match.cache_key).catch(console.error);

            return {
              hit: true,
              response: match.response,
              model_used: match.model_used,
              cache_key: match.cache_key,
              similarity,
              source: 'database',
            };
          }
        }
      }
    } catch (error) {
      console.error('Cache lookup error:', error);
      // Continue without cache on error
    }

    console.log(`❌ Cache MISS: ${query.substring(0, 50)}...`);
    return { hit: false, source: 'none' };
  }

  /**
   * Store query response in cache
   */
  async set(
    query: string,
    response: string,
    audience: string,
    queryType: string,
    modelUsed: string,
    ttlHours = 24
  ): Promise<void> {
    // Check if cacheable
    if (!this.isCacheable(query)) {
      return;
    }

    const cacheKey = this.getCacheKey(query, audience);
    const normalized = normalizeQuery(query);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    const entry: CacheEntry = {
      query,
      normalized_query: normalized,
      response,
      audience,
      query_type: queryType,
      model_used: modelUsed,
      hit_count: 0,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);

    // Store in database cache
    try {
      await this.supabase.from('chatbot_query_cache').upsert({
        cache_key: cacheKey,
        ...entry,
      }, {
        onConflict: 'cache_key',
      });

      console.log(`💾 Cached query: ${query.substring(0, 50)}... (expires in ${ttlHours}h)`);
    } catch (error) {
      console.error('Cache storage error:', error);
      // Non-fatal - memory cache still works
    }
  }

  /**
   * Increment cache hit count
   */
  private async incrementHitCount(cacheKey: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_cache_hit_count', {
        p_cache_key: cacheKey,
      });
    } catch (error) {
      console.error('Failed to increment hit count:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    total_entries: number;
    total_hits: number;
    memory_cache_size: number;
    top_queries: Array<{
      query: string;
      hit_count: number;
      query_type: string;
    }>;
  }> {
    try {
      const { data: stats } = await this.supabase
        .from('chatbot_query_cache')
        .select('query, hit_count, query_type')
        .gt('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .limit(10);

      const total_entries = stats?.length || 0;
      const total_hits = stats?.reduce((sum, s) => sum + s.hit_count, 0) || 0;

      return {
        total_entries,
        total_hits,
        memory_cache_size: this.memoryCache.size(),
        top_queries: stats || [],
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        total_entries: 0,
        total_hits: 0,
        memory_cache_size: this.memoryCache.size(),
        top_queries: [],
      };
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_query_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('cache_key');

      const deleted = data?.length || 0;
      console.log(`🧹 Cleared ${deleted} expired cache entries`);
      return deleted;
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache for specific query or pattern
   */
  async invalidate(pattern?: string): Promise<number> {
    if (!pattern) {
      // Clear all
      this.memoryCache.clear();
      const { data } = await this.supabase
        .from('chatbot_query_cache')
        .delete()
        .select('cache_key');
      return data?.length || 0;
    }

    // Invalidate matching queries
    const { data } = await this.supabase
      .from('chatbot_query_cache')
      .delete()
      .ilike('query', `%${pattern}%`)
      .select('cache_key');

    const deleted = data?.length || 0;
    console.log(`🧹 Invalidated ${deleted} cache entries matching: ${pattern}`);
    return deleted;
  }
}
