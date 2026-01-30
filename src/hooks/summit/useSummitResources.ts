/**
 * Summit Resource Hooks
 * React Query hooks for fetching Summit data
 */

import { useQuery } from '@tanstack/react-query';
import { SummitResourceService } from '@/services/summit';
import type { SummitResourceFilters } from '@/types/summit';

/**
 * Hook to fetch all active themes (The 7 Chakras)
 */
export function useSummitThemes() {
  return useQuery({
    queryKey: ['summit-themes'],
    queryFn: () => SummitResourceService.getThemes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single theme by slug
 */
export function useSummitTheme(slug: string | undefined) {
  return useQuery({
    queryKey: ['summit-theme', slug],
    queryFn: () => (slug ? SummitResourceService.getThemeBySlug(slug) : null),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch resources with filters and pagination
 */
export function useSummitResources(filters: SummitResourceFilters = {}) {
  return useQuery({
    queryKey: ['summit-resources', filters],
    queryFn: () => SummitResourceService.getResources(filters),
  });
}

/**
 * Hook to fetch a single resource by slug
 */
export function useSummitResource(slug: string | undefined) {
  return useQuery({
    queryKey: ['summit-resource', slug],
    queryFn: () => (slug ? SummitResourceService.getResourceBySlug(slug) : null),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch a single resource by ID (for CMS)
 */
export function useSummitResourceById(id: string | undefined) {
  return useQuery({
    queryKey: ['summit-resource-id', id],
    queryFn: () => (id ? SummitResourceService.getResourceById(id) : null),
    enabled: !!id,
  });
}

/**
 * Hook to fetch resources by theme slug
 */
export function useSummitResourcesByTheme(themeSlug: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['summit-resources-theme', themeSlug, limit],
    queryFn: () => (themeSlug ? SummitResourceService.getResourcesByTheme(themeSlug, limit) : []),
    enabled: !!themeSlug,
  });
}

/**
 * Hook to fetch featured resources
 */
export function useFeaturedSummitResources(limit = 6) {
  return useQuery({
    queryKey: ['summit-resources-featured', limit],
    queryFn: () => SummitResourceService.getFeaturedResources(limit),
  });
}

/**
 * Hook to fetch summit statistics
 */
export function useSummitStats() {
  return useQuery({
    queryKey: ['summit-stats'],
    queryFn: () => SummitResourceService.getStats(),
  });
}

/**
 * Hook to fetch all tags
 */
export function useSummitTags() {
  return useQuery({
    queryKey: ['summit-tags'],
    queryFn: () => SummitResourceService.getAllTags(),
  });
}
