/**
 * Knowledgebase Hooks
 * React hooks for fetching knowledgebase data
 */

import { useQuery } from '@tanstack/react-query';
import { KnowledgebaseService } from '@/services/knowledgebase';
import type {
  KnowledgebaseFilters,
  KnowledgebaseTopicType,
  KnowledgebaseEntry,
} from '@/types/knowledgebase';

/**
 * Hook to fetch knowledgebase entries with filters
 */
export function useKnowledgebaseEntries(filters: KnowledgebaseFilters = {}) {
  return useQuery({
    queryKey: ['knowledgebase-entries', filters],
    queryFn: () => KnowledgebaseService.getEntries(filters),
  });
}

/**
 * Hook to fetch a single entry by slug
 */
export function useKnowledgebaseEntry(slug: string | undefined) {
  return useQuery({
    queryKey: ['knowledgebase-entry', slug],
    queryFn: () => (slug ? KnowledgebaseService.getEntryBySlug(slug) : null),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch a single entry by ID (for CMS)
 */
export function useKnowledgebaseEntryById(id: string | undefined) {
  return useQuery({
    queryKey: ['knowledgebase-entry-id', id],
    queryFn: () => (id ? KnowledgebaseService.getEntryById(id) : null),
    enabled: !!id,
  });
}

/**
 * Hook to fetch featured entries
 */
export function useFeaturedKnowledgebaseEntries(limit = 6) {
  return useQuery({
    queryKey: ['knowledgebase-featured', limit],
    queryFn: () => KnowledgebaseService.getFeaturedEntries(limit),
  });
}

/**
 * Hook to fetch entries by topic type
 */
export function useKnowledgebaseByTopic(topicType: KnowledgebaseTopicType, limit = 10) {
  return useQuery({
    queryKey: ['knowledgebase-topic', topicType, limit],
    queryFn: () => KnowledgebaseService.getEntriesByTopic(topicType, limit),
  });
}

/**
 * Hook to fetch related entries
 */
export function useRelatedKnowledgebaseEntries(entry: KnowledgebaseEntry | null, limit = 4) {
  return useQuery({
    queryKey: ['knowledgebase-related', entry?.id, limit],
    queryFn: () => (entry ? KnowledgebaseService.getRelatedEntries(entry, limit) : []),
    enabled: !!entry,
  });
}

/**
 * Hook to fetch knowledgebase statistics
 */
export function useKnowledgebaseStats() {
  return useQuery({
    queryKey: ['knowledgebase-stats'],
    queryFn: () => KnowledgebaseService.getStats(),
  });
}

/**
 * Hook to fetch all tags
 */
export function useKnowledgebaseTags() {
  return useQuery({
    queryKey: ['knowledgebase-tags'],
    queryFn: () => KnowledgebaseService.getAllTags(),
  });
}
