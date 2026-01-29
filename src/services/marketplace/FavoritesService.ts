/**
 * Marketplace Favorites Service
 * Handles user course favorites (bookmarks)
 */

import { supabase } from '@/integrations/supabase/client';
import type { UserCourseFavorite, ExternalCourseWithProvider } from '@/types/marketplace';

export class MarketplaceFavoritesService {
  /**
   * Get all favorites for a user
   */
  static async getFavorites(userId: string): Promise<UserCourseFavorite[]> {
    const { data, error } = await supabase
      .from('user_course_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get favorites with full course data
   */
  static async getFavoritesWithCourses(
    userId: string
  ): Promise<Array<UserCourseFavorite & { course: ExternalCourseWithProvider }>> {
    const { data, error } = await supabase
      .from('user_course_favorites')
      .select(
        `
        *,
        external_courses (
          *,
          course_providers (
            id,
            slug,
            name,
            logo_url,
            website_url,
            category,
            country
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch favorites with courses: ${error.message}`);
    }

    // Transform the data
    return (data || []).map(item => {
      const course = item.external_courses as Record<string, unknown>;
      const provider = (course?.course_providers || {}) as Record<string, unknown>;

      return {
        id: item.id,
        user_id: item.user_id,
        course_id: item.course_id,
        notes: item.notes,
        created_at: item.created_at,
        course: {
          id: course.id as string,
          provider_id: course.provider_id as string,
          external_id: course.external_id as string | null,
          slug: course.slug as string,
          title: course.title as string,
          description: course.description as string | null,
          instructor_name: course.instructor_name as string | null,
          instructor_bio: course.instructor_bio as string | null,
          thumbnail_url: course.thumbnail_url as string | null,
          external_url: course.external_url as string,
          level: course.level,
          mode: course.mode,
          language: course.language as string,
          duration_hours: course.duration_hours as number | null,
          duration_text: course.duration_text as string | null,
          price_type: course.price_type,
          price_amount: course.price_amount as number | null,
          price_currency: course.price_currency as string,
          original_price: course.original_price as number | null,
          rating: course.rating as number | null,
          review_count: course.review_count as number,
          enrollment_count: course.enrollment_count as number,
          certificate_available: course.certificate_available as boolean,
          skills: (course.skills as string[]) || [],
          topics: (course.topics as string[]) || [],
          categories: (course.categories as string[]) || [],
          prerequisites: (course.prerequisites as string[]) || [],
          learning_outcomes: (course.learning_outcomes as string[]) || [],
          lesson_count: course.lesson_count as number | null,
          video_hours: course.video_hours as number | null,
          last_updated: course.last_updated as string | null,
          is_featured: course.is_featured as boolean,
          is_active: course.is_active as boolean,
          sort_order: course.sort_order as number,
          created_at: course.created_at as string,
          updated_at: course.updated_at as string,
          provider_name: provider.name as string,
          provider_slug: provider.slug,
          provider_logo_url: provider.logo_url as string | null,
          provider_category: provider.category,
          provider_country: provider.country as string | null,
          is_favorite: true,
        } as ExternalCourseWithProvider,
      };
    });
  }

  /**
   * Add a course to favorites
   */
  static async addFavorite(
    userId: string,
    courseId: string,
    notes?: string
  ): Promise<UserCourseFavorite> {
    const { data, error } = await supabase
      .from('user_course_favorites')
      .insert({
        user_id: userId,
        course_id: courseId,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Already exists, return existing
        const existing = await this.getFavoriteByUserAndCourse(userId, courseId);
        if (existing) return existing;
      }
      throw new Error(`Failed to add favorite: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove a course from favorites
   */
  static async removeFavorite(userId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('user_course_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to remove favorite: ${error.message}`);
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(
    userId: string,
    courseId: string
  ): Promise<{ isFavorite: boolean; favorite?: UserCourseFavorite }> {
    const existing = await this.getFavoriteByUserAndCourse(userId, courseId);

    if (existing) {
      await this.removeFavorite(userId, courseId);
      return { isFavorite: false };
    } else {
      const favorite = await this.addFavorite(userId, courseId);
      return { isFavorite: true, favorite };
    }
  }

  /**
   * Check if a course is favorited
   */
  static async isFavorite(userId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_course_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check favorite status: ${error.message}`);
    }

    return data !== null;
  }

  /**
   * Get favorite IDs for a user
   */
  static async getFavoriteIds(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('user_course_favorites')
      .select('course_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch favorite IDs: ${error.message}`);
    }

    return new Set((data || []).map(f => f.course_id));
  }

  /**
   * Update notes on a favorite
   */
  static async updateNotes(userId: string, courseId: string, notes: string | null): Promise<void> {
    const { error } = await supabase
      .from('user_course_favorites')
      .update({ notes })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to update favorite notes: ${error.message}`);
    }
  }

  /**
   * Get favorite count for a user
   */
  static async getFavoriteCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_course_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get favorite count: ${error.message}`);
    }

    return count || 0;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get a specific favorite by user and course
   */
  private static async getFavoriteByUserAndCourse(
    userId: string,
    courseId: string
  ): Promise<UserCourseFavorite | null> {
    const { data, error } = await supabase
      .from('user_course_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch favorite: ${error.message}`);
    }

    return data;
  }
}

export default MarketplaceFavoritesService;
