import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

/**
 * Database query optimization utilities
 * @module query-optimizer
 */

/**
 * Pagination configuration
 * @interface PaginationConfig
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated response structure
 * @template T - Type of data items
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Query builder with optimization features
 * @class OptimizedQueryBuilder
 */
export class OptimizedQueryBuilder {
  private client: SupabaseClient;
  private queries: Map<string, any> = new Map();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Execute a paginated query
   * @template T - Expected data type
   * @param {string} table - Table name
   * @param {PaginationConfig} config - Pagination configuration
   * @param {string} [selectFields='*'] - Fields to select
   * @param {object} [filters={}] - Query filters
   * @returns {Promise<PaginatedResponse<T>>} Paginated response
   * @example
   * const result = await queryBuilder.paginate<BlogPost>(
   *   'blog_posts',
   *   { page: 1, pageSize: 10, orderBy: 'created_at', orderDirection: 'desc' },
   *   'id, title, slug, published_at',
   *   { status: 'published' }
   * );
   */
  async paginate<T>(
    table: string,
    config: PaginationConfig,
    selectFields: string = '*',
    filters: Record<string, any> = {}
  ): Promise<PaginatedResponse<T>> {
    const { page, pageSize, orderBy = 'created_at', orderDirection = 'desc' } = config;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // Build the query
      let query = this.client.from(table).select(selectFields, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      // Apply pagination and ordering
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw error;
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: data || [],
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      logger.error('Pagination query failed:', error);
      throw error;
    }
  }

  /**
   * Batch fetch related data to avoid N+1 queries
   * @template T - Main entity type
   * @template R - Related entity type
   * @param {T[]} entities - Array of main entities
   * @param {string} foreignKey - Foreign key field name
   * @param {string} relatedTable - Related table name
   * @param {string} relatedKey - Key in related table
   * @returns {Promise<Map<string, R[]>>} Map of entity IDs to related data
   * @example
   * const posts = await getPosts();
   * const comments = await queryBuilder.batchFetchRelated(
   *   posts,
   *   'id',
   *   'blog_comments',
   *   'post_id'
   * );
   */
  async batchFetchRelated<T extends Record<string, any>, R>(
    entities: T[],
    foreignKey: keyof T,
    relatedTable: string,
    relatedKey: string
  ): Promise<Map<string, R[]>> {
    if (entities.length === 0) {
      return new Map();
    }

    const ids = entities.map(e => e[foreignKey]).filter(Boolean);

    if (ids.length === 0) {
      return new Map();
    }

    try {
      const { data, error } = await this.client
        .from(relatedTable)
        .select('*')
        .in(relatedKey, ids);

      if (error) {
        throw error;
      }

      // Group related data by foreign key
      const relatedMap = new Map<string, R[]>();

      (data || []).forEach((item: any) => {
        const key = item[relatedKey];
        if (!relatedMap.has(key)) {
          relatedMap.set(key, []);
        }
        relatedMap.get(key)!.push(item);
      });

      return relatedMap;
    } catch (error) {
      logger.error('Batch fetch failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple queries in parallel
   * @param {Array<() => Promise<any>>} queries - Array of query functions
   * @returns {Promise<any[]>} Array of query results
   * @example
   * const [users, posts, comments] = await queryBuilder.parallel([
   *   () => supabase.from('users').select(),
   *   () => supabase.from('posts').select(),
   *   () => supabase.from('comments').select()
   * ]);
   */
  async parallel<T extends readonly unknown[]>(
    queries: { [K in keyof T]: () => Promise<T[K]> }
  ): Promise<T> {
    try {
      const results = await Promise.all(queries.map(q => q()));
      return results as T;
    } catch (error) {
      logger.error('Parallel query execution failed:', error);
      throw error;
    }
  }

  /**
   * Cache query results with TTL
   * @template T - Result type
   * @param {string} key - Cache key
   * @param {Function} queryFn - Query function
   * @param {number} [ttl=300000] - Time to live in milliseconds (default: 5 minutes)
   * @returns {Promise<T>} Cached or fresh data
   */
  async cached<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cached = this.queries.get(key);

    if (cached && cached.timestamp + ttl > Date.now()) {
      logger.log(`Cache hit for key: ${key}`);
      return cached.data;
    }

    logger.log(`Cache miss for key: ${key}`);
    const data = await queryFn();

    this.queries.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    this.cleanupCache(ttl);

    return data;
  }

  /**
   * Clean up expired cache entries
   * @private
   * @param {number} ttl - Time to live
   */
  private cleanupCache(ttl: number) {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.queries.forEach((value, key) => {
      if (value.timestamp + ttl < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.queries.delete(key));
  }

  /**
   * Create optimized indexes suggestion based on query patterns
   * @param {string} table - Table name
   * @param {string[]} frequentFilters - Frequently filtered columns
   * @param {string[]} frequentSorts - Frequently sorted columns
   * @returns {string[]} SQL statements for creating indexes
   */
  suggestIndexes(
    table: string,
    frequentFilters: string[],
    frequentSorts: string[]
  ): string[] {
    const indexes: string[] = [];

    // Single column indexes for filters
    frequentFilters.forEach(column => {
      indexes.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column});`);
    });

    // Single column indexes for sorts
    frequentSorts.forEach(column => {
      if (!frequentFilters.includes(column)) {
        indexes.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column});`);
      }
    });

    // Composite indexes for common filter + sort combinations
    if (frequentFilters.length > 0 && frequentSorts.length > 0) {
      const primaryFilter = frequentFilters[0];
      const primarySort = frequentSorts[0];
      if (primaryFilter !== primarySort) {
        indexes.push(
          `CREATE INDEX IF NOT EXISTS idx_${table}_${primaryFilter}_${primarySort} ON ${table}(${primaryFilter}, ${primarySort});`
        );
      }
    }

    return indexes;
  }
}

/**
 * Create an optimized query builder instance
 * @param {SupabaseClient} client - Supabase client
 * @returns {OptimizedQueryBuilder} Query builder instance
 */
export function createQueryBuilder(client: SupabaseClient): OptimizedQueryBuilder {
  return new OptimizedQueryBuilder(client);
}