import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PaginationConfig, PaginatedResponse } from '@/lib/database/query-optimizer';
import { createQueryBuilder } from '@/lib/database/query-optimizer';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

/**
 * Configuration options for usePagination hook
 * @interface UsePaginationOptions
 */
export interface UsePaginationOptions<T> {
  /** Table name to query */
  table: string;
  /** Fields to select (default: '*') */
  selectFields?: string;
  /** Initial filters to apply */
  filters?: Record<string, any>;
  /** Initial page size (default: 10) */
  initialPageSize?: number;
  /** Initial order by field (default: 'created_at') */
  initialOrderBy?: string;
  /** Initial order direction (default: 'desc') */
  initialOrderDirection?: 'asc' | 'desc';
  /** Transform function to apply to each item */
  transform?: (item: any) => T;
  /** Enable automatic data fetching on mount */
  autoFetch?: boolean;
}

/**
 * Return type for usePagination hook
 * @interface UsePaginationReturn
 */
export interface UsePaginationReturn<T> {
  /** Current page data */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Current page number */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Total number of items */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Navigate to next page */
  nextPage: () => void;
  /** Navigate to previous page */
  previousPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Update filters */
  setFilters: (filters: Record<string, any>) => void;
  /** Update ordering */
  setOrdering: (field: string, direction: 'asc' | 'desc') => void;
  /** Refresh current page data */
  refresh: () => Promise<void>;
}

/**
 * Hook for paginated data fetching with optimization
 * @template T - Type of data items
 * @param {UsePaginationOptions<T>} options - Pagination configuration
 * @returns {UsePaginationReturn<T>} Pagination controls and data
 * @example
 * const {
 *   data,
 *   loading,
 *   page,
 *   totalPages,
 *   nextPage,
 *   previousPage
 * } = usePagination<BlogPost>({
 *   table: 'blog_posts',
 *   selectFields: 'id, title, slug, published_at',
 *   filters: { status: 'published' },
 *   initialPageSize: 20
 * });
 */
export function usePagination<T = any>(
  options: UsePaginationOptions<T>
): UsePaginationReturn<T> {
  const {
    table,
    selectFields = '*',
    filters: initialFilters = {},
    initialPageSize = 10,
    initialOrderBy = 'created_at',
    initialOrderDirection = 'desc',
    transform,
    autoFetch = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [filters, setFiltersState] = useState(initialFilters);
  const [orderBy, setOrderBy] = useState(initialOrderBy);
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(initialOrderDirection);

  const { toast } = useToast();
  const queryBuilder = createQueryBuilder(supabase);

  /**
   * Fetch paginated data
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const config: PaginationConfig = {
        page,
        pageSize,
        orderBy,
        orderDirection
      };

      const response: PaginatedResponse<any> = await queryBuilder.paginate(
        table,
        config,
        selectFields,
        filters
      );

      // Apply transform if provided
      const transformedData = transform
        ? response.data.map(transform)
        : response.data;

      setData(transformedData);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setHasNextPage(response.hasNextPage);
      setHasPreviousPage(response.hasPreviousPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      logger.error(`Pagination error for ${table}:`, err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, orderBy, orderDirection, filters, table, selectFields, transform]);

  /**
   * Navigation functions
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(p => p + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(p => p - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  /**
   * Update page size and reset to first page
   */
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  /**
   * Update filters and reset to first page
   */
  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltersState(newFilters);
    setPage(1);
  }, []);

  /**
   * Update ordering
   */
  const setOrdering = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field);
    setOrderDirection(direction);
  }, []);

  /**
   * Refresh current page data
   */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    setFilters,
    setOrdering,
    refresh
  };
}

/**
 * Hook for infinite scroll pagination
 * @template T - Type of data items
 * @param {UsePaginationOptions<T>} options - Pagination configuration
 * @returns {object} Infinite scroll controls and data
 */
export function useInfiniteScroll<T = any>(
  options: UsePaginationOptions<T>
) {
  const [allData, setAllData] = useState<T[]>([]);
  const pagination = usePagination<T>(options);

  // Append new data instead of replacing
  useEffect(() => {
    if (pagination.data.length > 0) {
      if (pagination.page === 1) {
        setAllData(pagination.data);
      } else {
        setAllData(prev => [...prev, ...pagination.data]);
      }
    }
  }, [pagination.data, pagination.page]);

  const loadMore = useCallback(() => {
    if (!pagination.loading && pagination.hasNextPage) {
      pagination.nextPage();
    }
  }, [pagination]);

  return {
    data: allData,
    loading: pagination.loading,
    error: pagination.error,
    hasMore: pagination.hasNextPage,
    loadMore,
    refresh: () => {
      setAllData([]);
      pagination.goToPage(1);
      return pagination.refresh();
    }
  };
}