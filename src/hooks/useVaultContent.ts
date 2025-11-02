/**
 * useVaultContent Hook
 *
 * React Query hooks for vault content management
 * Handles content retrieval, bookmarks, and access logging
 */

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { VaultContentService } from '@/services/membership/VaultContentService';
import type { VaultContentFilters } from '@/services/membership/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const vaultContentKeys = {
  all: ['vaultContent'] as const,
  lists: () => [...vaultContentKeys.all, 'list'] as const,
  list: (filters?: VaultContentFilters) => [...vaultContentKeys.lists(), filters] as const,
  details: () => [...vaultContentKeys.all, 'detail'] as const,
  detail: (slug: string) => [...vaultContentKeys.details(), slug] as const,
  featured: (limit?: number) => [...vaultContentKeys.all, 'featured', limit] as const,
  recent: (limit?: number) => [...vaultContentKeys.all, 'recent', limit] as const,
  category: (category: string) => [...vaultContentKeys.all, 'category', category] as const,
  categories: () => [...vaultContentKeys.all, 'categories'] as const,
  tags: () => [...vaultContentKeys.all, 'tags'] as const,
  bookmarks: () => [...vaultContentKeys.all, 'bookmarks'] as const,
  isBookmarked: (contentId: string) => [...vaultContentKeys.bookmarks(), contentId] as const,
  stats: () => [...vaultContentKeys.all, 'stats'] as const,
  history: (limit?: number) => [...vaultContentKeys.all, 'history', limit] as const,
};

// ============================================================================
// CONTENT RETRIEVAL
// ============================================================================

/**
 * Get vault content with optional filters
 */
export function useVaultContent(filters?: VaultContentFilters) {
  return useQuery({
    queryKey: vaultContentKeys.list(filters),
    queryFn: () => VaultContentService.getVaultContent(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get vault content by slug
 */
export function useVaultContentBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: vaultContentKeys.detail(slug || ''),
    queryFn: () => VaultContentService.getVaultContentBySlug(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get featured vault content
 */
export function useFeaturedVaultContent(limit: number = 6) {
  return useQuery({
    queryKey: vaultContentKeys.featured(limit),
    queryFn: () => VaultContentService.getFeaturedContent(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Get recent vault content
 */
export function useRecentVaultContent(limit: number = 10) {
  return useQuery({
    queryKey: vaultContentKeys.recent(limit),
    queryFn: () => VaultContentService.getRecentVaultContent(limit),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get vault content by category
 */
export function useVaultContentByCategory(category: string | undefined) {
  return useQuery({
    queryKey: vaultContentKeys.category(category || ''),
    queryFn: () => VaultContentService.getVaultContentByCategory(category!),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get all categories
 */
export function useVaultCategories() {
  return useQuery({
    queryKey: vaultContentKeys.categories(),
    queryFn: () => VaultContentService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get all tags
 */
export function useVaultTags() {
  return useQuery({
    queryKey: vaultContentKeys.tags(),
    queryFn: () => VaultContentService.getTags(),
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// ACCESS LOGGING
// ============================================================================

/**
 * Log content view
 */
export function useLogView() {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentId, watchPercentage }: { contentId: string; watchPercentage?: number }) =>
      VaultContentService.logView(contentId, watchPercentage),
    onSuccess: () => {
      // Invalidate stats after logging
      queryClient.invalidateQueries({ queryKey: vaultContentKeys.stats() });
    },
  });
}

/**
 * Log content download
 */
export function useLogDownload() {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => VaultContentService.logDownload(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultContentKeys.stats() });
    },
  });
}

// ============================================================================
// BOOKMARKS
// ============================================================================

/**
 * Get user's bookmarks
 */
export function useUserBookmarks() {
  return useQuery({
    queryKey: vaultContentKeys.bookmarks(),
    queryFn: () => VaultContentService.getUserBookmarks(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Check if content is bookmarked
 */
export function useIsBookmarked(contentId: string | undefined) {
  return useQuery({
    queryKey: vaultContentKeys.isBookmarked(contentId || ''),
    queryFn: () => VaultContentService.isBookmarked(contentId!),
    enabled: !!contentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Add bookmark
 */
export function useAddBookmark() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ contentId, notes }: { contentId: string; notes?: string }) =>
      VaultContentService.addBookmark(contentId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vaultContentKeys.bookmarks() });
      queryClient.invalidateQueries({
        queryKey: vaultContentKeys.isBookmarked(variables.contentId),
      });
      queryClient.invalidateQueries({ queryKey: vaultContentKeys.stats() });

      toast({
        title: 'Added to Bookmarks',
        description: 'Content has been added to your bookmarks.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bookmark Failed',
        description: error.message || 'Failed to add bookmark',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove bookmark
 */
export function useRemoveBookmark() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (contentId: string) => VaultContentService.removeBookmark(contentId),
    onSuccess: (_, contentId) => {
      queryClient.invalidateQueries({ queryKey: vaultContentKeys.bookmarks() });
      queryClient.invalidateQueries({
        queryKey: vaultContentKeys.isBookmarked(contentId),
      });

      toast({
        title: 'Removed from Bookmarks',
        description: 'Content has been removed from your bookmarks.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Remove Failed',
        description: error.message || 'Failed to remove bookmark',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update bookmark notes
 */
export function useUpdateBookmarkNotes() {
  const _queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ contentId, notes }: { contentId: string; notes: string }) =>
      VaultContentService.updateBookmarkNotes(contentId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultContentKeys.bookmarks() });

      toast({
        title: 'Notes Updated',
        description: 'Bookmark notes have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update notes',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Toggle bookmark (add or remove)
 */
export function useToggleBookmark() {
  const _queryClient = useQueryClient();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  return useMutation({
    mutationFn: async ({
      contentId,
      isCurrentlyBookmarked,
      notes,
    }: {
      contentId: string;
      isCurrentlyBookmarked: boolean;
      notes?: string;
    }) => {
      if (isCurrentlyBookmarked) {
        await removeBookmark.mutateAsync(contentId);
      } else {
        await addBookmark.mutateAsync({ contentId, notes });
      }
    },
  });
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get user's vault statistics
 */
export function useUserVaultStats() {
  return useQuery({
    queryKey: vaultContentKeys.stats(),
    queryFn: () => VaultContentService.getUserVaultStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get viewing history
 */
export function useViewingHistory(limit: number = 20) {
  return useQuery({
    queryKey: vaultContentKeys.history(limit),
    queryFn: () => VaultContentService.getViewingHistory(limit),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Custom hook for vault content with loading states
 */
export function useVaultContentWithFilters(filters?: VaultContentFilters) {
  const { data: content, isLoading, error } = useVaultContent(filters);
  const { data: categories } = useVaultCategories();
  const { data: tags } = useVaultTags();

  return {
    content: content || [],
    categories: categories || [],
    tags: tags || [],
    isLoading,
    error,
    isEmpty: !isLoading && (!content || content.length === 0),
  };
}

/**
 * Custom hook for content detail with related data
 */
export function useVaultContentDetail(slug: string | undefined) {
  const { data: content, isLoading, error } = useVaultContentBySlug(slug);
  const { data: isBookmarked, isLoading: bookmarkLoading } = useIsBookmarked(content?.id);
  const logView = useLogView();

  // Auto-log view when content loads
  React.useEffect(() => {
    if (content?.id && !isLoading) {
      logView.mutate({ contentId: content.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- logView is stable
  }, [content?.id, isLoading]);

  return {
    content,
    isBookmarked: isBookmarked || false,
    isLoading: isLoading || bookmarkLoading,
    error,
  };
}

/**
 * Custom hook for bookmark management
 */
export function useBookmarkManager(contentId: string | undefined) {
  const { data: isBookmarked } = useIsBookmarked(contentId);
  const toggleBookmark = useToggleBookmark();

  const handleToggle = (notes?: string) => {
    if (!contentId) return;

    toggleBookmark.mutate({
      contentId,
      isCurrentlyBookmarked: isBookmarked || false,
      notes,
    });
  };

  return {
    isBookmarked: isBookmarked || false,
    toggle: handleToggle,
    isLoading: toggleBookmark.isPending,
  };
}
