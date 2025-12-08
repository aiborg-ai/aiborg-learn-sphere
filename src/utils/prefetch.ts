/**
 * Data Prefetching Utilities
 *
 * Utilities for prefetching data to improve perceived performance.
 * Uses React Query (TanStack Query) to prefetch and cache data before it's needed.
 *
 * Usage:
 * - Prefetch on hover (e.g., course cards, links)
 * - Prefetch on scroll (e.g., next page of results)
 * - Prefetch on route navigation
 */

import { queryClient } from '@/App';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Prefetch course details
 * Call this when user hovers over a course card
 */
export async function prefetchCourseDetails(courseId: string) {
  await queryClient.prefetchQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Prefetch user profile data
 * Call this before navigating to profile page
 */
export async function prefetchUserProfile(userId: string) {
  await queryClient.prefetchQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Prefetch user enrollments
 * Call this when user is likely to view their enrollments
 */
export async function prefetchUserEnrollments(userId: string) {
  await queryClient.prefetchQuery({
    queryKey: ['enrollments', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          `
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            category,
            level
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Prefetch all courses
 * Call this on app initialization or when user is likely to browse courses
 */
export async function prefetchCourses() {
  await queryClient.prefetchQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Prefetch events
 * Call this when user is likely to view events
 */
export async function prefetchEvents() {
  await queryClient.prefetchQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Prefetch reviews for a course
 * Call this when user hovers over course card or is viewing course details
 */
export async function prefetchCourseReviews(courseId: string) {
  await queryClient.prefetchQuery({
    queryKey: ['reviews', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url
          )
        `
        )
        .eq('course_id', courseId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Prefetch user achievements
 * Call this when user is likely to view their achievements
 */
export async function prefetchUserAchievements(userId: string) {
  await queryClient.prefetchQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(
          `
          *,
          achievements (
            id,
            title,
            description,
            badge_icon,
            badge_color
          )
        `
        )
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Prefetch dashboard data bundle
 * Call this when user is likely to navigate to dashboard
 */
export async function prefetchDashboard(userId: string) {
  await Promise.all([
    prefetchUserEnrollments(userId),
    prefetchUserProfile(userId),
    prefetchUserAchievements(userId),
  ]);
}

/**
 * Utility to create a prefetch handler for hover events
 * Returns a function that can be used as onMouseEnter handler
 */
export function createPrefetchOnHover(prefetchFn: () => Promise<void>) {
  let prefetchTriggered = false;

  return () => {
    if (!prefetchTriggered) {
      prefetchTriggered = true;
      prefetchFn().catch(err => {
        logger.warn('Prefetch failed:', err);
      });
    }
  };
}

/**
 * Utility to create a prefetch handler for hover events with delay
 * Prevents prefetch on quick mouse movements (reduces waste)
 * Returns both onMouseEnter and onMouseLeave handlers
 */
export function createPrefetchOnHoverWithDelay(
  prefetchFn: () => Promise<void>,
  delay: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let prefetchTriggered = false;

  return {
    onMouseEnter: () => {
      if (prefetchTriggered) return;

      timeoutId = setTimeout(() => {
        prefetchTriggered = true;
        prefetchFn().catch(err => {
          logger.warn('Prefetch failed:', err);
        });
      }, delay);
    },
    onMouseLeave: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

/**
 * Utility to create a prefetch handler for scroll events
 * Prefetches when user scrolls to a certain threshold
 */
export function createPrefetchOnScroll(
  prefetchFn: () => Promise<void>,
  threshold: number = 0.8 // Prefetch when 80% through the page
) {
  let prefetchTriggered = false;

  const handleScroll = () => {
    if (prefetchTriggered) return;

    const scrollPercentage =
      (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;

    if (scrollPercentage >= threshold) {
      prefetchTriggered = true;
      prefetchFn().catch(err => {
        logger.warn('Prefetch on scroll failed:', err);
      });

      // Remove listener after triggering
      window.removeEventListener('scroll', handleScroll);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Return cleanup function
  return () => window.removeEventListener('scroll', handleScroll);
}

/**
 * Prefetch data for a specific route
 * Call this before navigating to optimize perceived performance
 */
export async function prefetchRouteData(route: string, params?: Record<string, string>) {
  switch (route) {
    case '/dashboard':
      if (params?.userId) {
        await prefetchDashboard(params.userId);
      }
      break;

    case '/profile':
      if (params?.userId) {
        await Promise.all([
          prefetchUserProfile(params.userId),
          prefetchUserEnrollments(params.userId),
          prefetchUserAchievements(params.userId),
        ]);
      }
      break;

    case '/my-courses':
      if (params?.userId) {
        await prefetchUserEnrollments(params.userId);
      }
      break;

    case '/courses':
      await prefetchCourses();
      break;

    case '/events':
      await prefetchEvents();
      break;

    case '/course/:id':
      if (params?.courseId) {
        await Promise.all([
          prefetchCourseDetails(params.courseId),
          prefetchCourseReviews(params.courseId),
        ]);
      }
      break;

    default:
      // No prefetching for this route
      break;
  }
}
