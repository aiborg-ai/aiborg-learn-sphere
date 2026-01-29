/**
 * useMarketplaceCourses Hook
 * Fetches and manages external course marketplace data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { ExternalCourseService } from '@/services/marketplace/ExternalCourseService';
import { MarketplaceFavoritesService } from '@/services/marketplace/FavoritesService';
import { PriceAlertService } from '@/services/marketplace/PriceAlertService';
import { MarketplaceRecommendationService } from '@/services/marketplace/RecommendationService';
import type {
  MarketplaceFilters,
  MarketplaceSortOption,
  ExternalCourseWithProvider,
} from '@/types/marketplace';

// Query keys
const MARKETPLACE_KEYS = {
  all: ['marketplace'] as const,
  courses: (filters: MarketplaceFilters, sort: MarketplaceSortOption, page: number) =>
    [...MARKETPLACE_KEYS.all, 'courses', { filters, sort, page }] as const,
  course: (slug: string) => [...MARKETPLACE_KEYS.all, 'course', slug] as const,
  featured: () => [...MARKETPLACE_KEYS.all, 'featured'] as const,
  categories: () => [...MARKETPLACE_KEYS.all, 'categories'] as const,
  providers: () => [...MARKETPLACE_KEYS.all, 'providers'] as const,
  favorites: (userId: string) => [...MARKETPLACE_KEYS.all, 'favorites', userId] as const,
  alerts: (userId: string) => [...MARKETPLACE_KEYS.all, 'alerts', userId] as const,
  recommendations: (userId: string) =>
    [...MARKETPLACE_KEYS.all, 'recommendations', userId] as const,
};

/**
 * Main hook for fetching marketplace courses
 */
export function useMarketplaceCourses(
  filters: MarketplaceFilters = {},
  sort: MarketplaceSortOption = { field: 'relevance', direction: 'desc' },
  page: number = 1,
  pageSize: number = 20
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: MARKETPLACE_KEYS.courses(filters, sort, page),
    queryFn: () => ExternalCourseService.getCourses(filters, sort, page, pageSize, user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook for fetching a single course by slug
 */
export function useMarketplaceCourse(slug: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: MARKETPLACE_KEYS.course(slug),
    queryFn: () => ExternalCourseService.getCourseBySlug(slug, user?.id),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching featured courses
 */
export function useFeaturedCourses(limit: number = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: MARKETPLACE_KEYS.featured(),
    queryFn: () => ExternalCourseService.getFeaturedCourses(limit, user?.id),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching categories
 */
export function useMarketplaceCategories() {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.categories(),
    queryFn: () => ExternalCourseService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching providers
 */
export function useMarketplaceProviders() {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.providers(),
    queryFn: () => ExternalCourseService.getProviders(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook for managing favorites
 */
export function useMarketplaceFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: MARKETPLACE_KEYS.favorites(user?.id || ''),
    queryFn: () =>
      user?.id ? MarketplaceFavoritesService.getFavoritesWithCourses(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (courseId: string) =>
      MarketplaceFavoritesService.toggleFavorite(user!.id, courseId),
    onSuccess: () => {
      // Invalidate favorites and course queries
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.favorites(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.all });
    },
  });

  return {
    favorites: favoritesQuery.data || [],
    isLoading: favoritesQuery.isLoading,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isToggling: toggleFavoriteMutation.isPending,
  };
}

/**
 * Hook for managing price alerts
 */
export function useMarketplacePriceAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: MARKETPLACE_KEYS.alerts(user?.id || ''),
    queryFn: () =>
      user?.id ? PriceAlertService.getAlertsWithCourses(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const createAlertMutation = useMutation({
    mutationFn: ({
      courseId,
      targetPrice,
      currentPrice,
    }: {
      courseId: string;
      targetPrice: number;
      currentPrice?: number;
    }) => PriceAlertService.createAlert(user!.id, courseId, targetPrice, currentPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.alerts(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.all });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (courseId: string) => PriceAlertService.deleteAlert(user!.id, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.alerts(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.all });
    },
  });

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    createAlert: createAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    isCreating: createAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  };
}

/**
 * Hook for AI-powered recommendations
 */
export function useMarketplaceRecommendations(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: MARKETPLACE_KEYS.recommendations(user?.id || ''),
    queryFn: () =>
      user?.id
        ? MarketplaceRecommendationService.generateRecommendations(user.id, limit)
        : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook for course comparison
 */
export function useCourseComparison(maxCourses: number = 4) {
  const [selectedCourses, setSelectedCourses] = React.useState<ExternalCourseWithProvider[]>([]);

  const addCourse = useCallback(
    (course: ExternalCourseWithProvider) => {
      setSelectedCourses(prev => {
        if (prev.some(c => c.id === course.id)) return prev;
        if (prev.length >= maxCourses) return prev;
        return [...prev, course];
      });
    },
    [maxCourses]
  );

  const removeCourse = useCallback((courseId: string) => {
    setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedCourses([]);
  }, []);

  const isSelected = useCallback(
    (courseId: string) => selectedCourses.some(c => c.id === courseId),
    [selectedCourses]
  );

  const toggleCourse = useCallback(
    (course: ExternalCourseWithProvider) => {
      if (isSelected(course.id)) {
        removeCourse(course.id);
      } else {
        addCourse(course);
      }
    },
    [isSelected, removeCourse, addCourse]
  );

  return {
    selectedCourses,
    addCourse,
    removeCourse,
    clearAll,
    isSelected,
    toggleCourse,
    canAddMore: selectedCourses.length < maxCourses,
    count: selectedCourses.length,
  };
}

// Import React for useState in useCourseComparison
import React from 'react';
