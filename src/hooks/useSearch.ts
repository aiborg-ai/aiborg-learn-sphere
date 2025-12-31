import { logger } from '@/utils/logger';
/**
 * useSearch Hook
 * React hook for search functionality with caching and state management
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  SearchService,
  type SearchOptions,
  type ContentType,
} from '@/services/search/SearchService';
import { useDebounce } from '@/hooks/useDebounce';

export interface UseSearchOptions extends SearchOptions {
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * useSearch hook
 * Provides search functionality with debouncing, caching, and state management
 */
export function useSearch(initialQuery: string = '', options: UseSearchOptions = {}) {
  const { debounceMs = 300, enabled = true, ...searchOptions } = options;

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, debounceMs);

  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['search', debouncedQuery, searchOptions],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return [];
      }
      return await SearchService.search(debouncedQuery, searchOptions);
    },
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    results: results || [],
    isLoading,
    error,
    refetch,
    clear,
    hasQuery: query.length > 0,
    hasResults: (results?.length || 0) > 0,
  };
}

/**
 * useSearchSuggestions hook
 * Provides search suggestions/autocomplete
 */
export function useSearchSuggestions(query: string, limit: number = 5) {
  const debouncedQuery = useDebounce(query, 200);

  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery, limit],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }
      return await SearchService.getSuggestions(debouncedQuery, limit);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * useSearchHistory hook
 * Manages local search history
 */
export function useSearchHistory(maxItems: number = 10) {
  const STORAGE_KEY = 'aiborg_search_history';

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback(
    (query: string) => {
      if (!query || query.trim().length === 0) return;

      setHistory(prev => {
        // Remove duplicates and add to front
        const filtered = prev.filter(item => item !== query);
        const updated = [query, ...filtered].slice(0, maxItems);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (_error) {
          logger._error('Failed to save search history:', _error);
        }

        return updated;
      });
    },
    [maxItems]
  );

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item !== query);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_error) {
        logger._error('Failed to update search history:', _error);
      }

      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      logger._error('Failed to clear search history:', _error);
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

/**
 * useSearchFilters hook
 * Manages search filter state
 */
export function useSearchFilters() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([
    'course',
    'learning_path',
    'blog_post',
    'assignment',
    'material',
  ]);
  const [minRelevance, setMinRelevance] = useState(0.3);

  const toggleContentType = useCallback((type: ContentType) => {
    setContentTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow removing all types
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  }, []);

  const resetFilters = useCallback(() => {
    setContentTypes(['course', 'learning_path', 'blog_post', 'assignment', 'material']);
    setMinRelevance(0.3);
  }, []);

  const hasFilters = contentTypes.length < 5 || minRelevance !== 0.3;

  return {
    contentTypes,
    minRelevance,
    setContentTypes,
    setMinRelevance,
    toggleContentType,
    resetFilters,
    hasFilters,
  };
}
