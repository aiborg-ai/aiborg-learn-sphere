/**
 * External Course Service
 * Handles CRUD operations and search for external AI courses
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ExternalCourse,
  ExternalCourseWithProvider,
  MarketplaceFilters,
  MarketplaceSortOption,
  MarketplaceCoursesResponse,
  CourseProvider,
  CourseProviderSlug,
} from '@/types/marketplace';

const DEFAULT_PAGE_SIZE = 20;

export class ExternalCourseService {
  /**
   * Get paginated courses with filters and sorting
   */
  static async getCourses(
    filters: MarketplaceFilters = {},
    sort: MarketplaceSortOption = { field: 'relevance', direction: 'desc' },
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
    userId?: string
  ): Promise<MarketplaceCoursesResponse> {
    const offset = (page - 1) * pageSize;

    // Build the base query
    let query = supabase
      .from('external_courses')
      .select(
        `
        *,
        course_providers!inner (
          id,
          slug,
          name,
          logo_url,
          website_url,
          category,
          country
        )
      `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply sorting
    query = this.applySorting(query, sort, filters.search);

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching courses:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    // Transform to ExternalCourseWithProvider format
    const courses = await this.transformCourses(data || [], userId);

    return {
      courses,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  }

  /**
   * Get a single course by slug
   */
  static async getCourseBySlug(
    slug: string,
    userId?: string
  ): Promise<ExternalCourseWithProvider | null> {
    const { data, error } = await supabase
      .from('external_courses')
      .select(
        `
        *,
        course_providers!inner (
          id,
          slug,
          name,
          logo_url,
          website_url,
          category,
          country
        )
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    const courses = await this.transformCourses([data], userId);
    return courses[0] || null;
  }

  /**
   * Get a single course by ID
   */
  static async getCourseById(
    id: string,
    userId?: string
  ): Promise<ExternalCourseWithProvider | null> {
    const { data, error } = await supabase
      .from('external_courses')
      .select(
        `
        *,
        course_providers!inner (
          id,
          slug,
          name,
          logo_url,
          website_url,
          category,
          country
        )
      `
      )
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    const courses = await this.transformCourses([data], userId);
    return courses[0] || null;
  }

  /**
   * Get featured courses
   */
  static async getFeaturedCourses(
    limit: number = 6,
    userId?: string
  ): Promise<ExternalCourseWithProvider[]> {
    const { data, error } = await supabase
      .from('external_courses')
      .select(
        `
        *,
        course_providers!inner (
          id,
          slug,
          name,
          logo_url,
          website_url,
          category,
          country
        )
      `
      )
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch featured courses: ${error.message}`);
    }

    return this.transformCourses(data || [], userId);
  }

  /**
   * Get all active course providers
   */
  static async getProviders(): Promise<CourseProvider[]> {
    const { data, error } = await supabase
      .from('course_providers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get unique categories from all courses
   */
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('external_courses')
      .select('categories')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Flatten and deduplicate categories
    const allCategories = (data || []).flatMap(course => course.categories || []).filter(Boolean);

    return [...new Set(allCategories)].sort();
  }

  /**
   * Get unique skills from all courses
   */
  static async getSkills(): Promise<string[]> {
    const { data, error } = await supabase
      .from('external_courses')
      .select('skills')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch skills: ${error.message}`);
    }

    const allSkills = (data || []).flatMap(course => course.skills || []).filter(Boolean);

    return [...new Set(allSkills)].sort();
  }

  /**
   * Get unique topics from all courses
   */
  static async getTopics(): Promise<string[]> {
    const { data, error } = await supabase
      .from('external_courses')
      .select('topics')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    const allTopics = (data || []).flatMap(course => course.topics || []).filter(Boolean);

    return [...new Set(allTopics)].sort();
  }

  /**
   * Search courses by text query
   */
  static async searchCourses(
    query: string,
    limit: number = 10
  ): Promise<ExternalCourseWithProvider[]> {
    const { data, error } = await supabase
      .from('external_courses')
      .select(
        `
        *,
        course_providers!inner (
          id,
          slug,
          name,
          logo_url,
          website_url,
          category,
          country
        )
      `
      )
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search courses: ${error.message}`);
    }

    return this.transformCourses(data || []);
  }

  /**
   * Get similar courses based on categories and skills
   */
  static async getSimilarCourses(
    courseId: string,
    limit: number = 4
  ): Promise<ExternalCourseWithProvider[]> {
    // First get the target course
    const course = await this.getCourseById(courseId);
    if (!course) return [];

    // Find courses with overlapping categories or skills
    const { data, error } = await supabase
      .from('external_courses')
      .select(
        `
        *,
        course_providers!inner (
          id,
          slug,
          name,
          logo_url,
          website_url,
          category,
          country
        )
      `
      )
      .eq('is_active', true)
      .neq('id', courseId)
      .or(`categories.cs.{${course.categories.join(',')}},skills.cs.{${course.skills.join(',')}}`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch similar courses: ${error.message}`);
    }

    return this.transformCourses(data || []);
  }

  /**
   * Get course count by provider
   */
  static async getCourseCountByProvider(): Promise<Record<CourseProviderSlug, number>> {
    const { data, error } = await supabase
      .from('external_courses')
      .select('provider_id, course_providers!inner(slug)')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch course counts: ${error.message}`);
    }

    const counts: Record<string, number> = {};
    (data || []).forEach(item => {
      const slug = (item.course_providers as { slug: string }).slug;
      counts[slug] = (counts[slug] || 0) + 1;
    });

    return counts as Record<CourseProviderSlug, number>;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Apply filters to the query
   */
  private static applyFilters(
    query: ReturnType<typeof supabase.from>,
    filters: MarketplaceFilters
  ) {
    let q = query;

    // Text search
    if (filters.search?.trim()) {
      const searchTerm = filters.search.trim();
      q = q.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Provider filter
    if (filters.providers?.length) {
      q = q.in('course_providers.slug', filters.providers);
    }

    // Level filter
    if (filters.levels?.length) {
      q = q.in('level', filters.levels);
    }

    // Mode filter
    if (filters.modes?.length) {
      q = q.in('mode', filters.modes);
    }

    // Price type filter
    if (filters.priceTypes?.length) {
      q = q.in('price_type', filters.priceTypes);
    }

    // Price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min > 0) {
        q = q.gte('price_amount', filters.priceRange.min);
      }
      if (filters.priceRange.max < 9999) {
        q = q.lte('price_amount', filters.priceRange.max);
      }
    }

    // Minimum rating filter
    if (filters.minRating && filters.minRating > 0) {
      q = q.gte('rating', filters.minRating);
    }

    // Categories filter (array contains)
    if (filters.categories?.length) {
      q = q.contains('categories', filters.categories);
    }

    // Skills filter
    if (filters.skills?.length) {
      q = q.overlaps('skills', filters.skills);
    }

    // Topics filter
    if (filters.topics?.length) {
      q = q.overlaps('topics', filters.topics);
    }

    // Certificate only filter
    if (filters.certificateOnly) {
      q = q.eq('certificate_available', true);
    }

    // Language filter
    if (filters.language) {
      q = q.eq('language', filters.language);
    }

    // Featured only filter
    if (filters.featuredOnly) {
      q = q.eq('is_featured', true);
    }

    return q;
  }

  /**
   * Apply sorting to the query
   */
  private static applySorting(
    query: ReturnType<typeof supabase.from>,
    sort: MarketplaceSortOption,
    searchQuery?: string
  ) {
    let q = query;

    switch (sort.field) {
      case 'rating':
        q = q.order('rating', {
          ascending: sort.direction === 'asc',
          nullsFirst: false,
        });
        break;

      case 'price':
        // Free courses first when ascending
        q = q.order('price_type', { ascending: sort.direction === 'asc' }).order('price_amount', {
          ascending: sort.direction === 'asc',
          nullsFirst: sort.direction === 'asc',
        });
        break;

      case 'enrollment_count':
        q = q.order('enrollment_count', {
          ascending: sort.direction === 'asc',
          nullsFirst: false,
        });
        break;

      case 'newest':
        q = q.order('created_at', {
          ascending: sort.direction === 'asc',
        });
        break;

      case 'relevance':
      default:
        // For relevance with search, we rely on text matching
        // Otherwise, sort by featured, rating, and enrollment
        if (!searchQuery?.trim()) {
          q = q
            .order('is_featured', { ascending: false })
            .order('rating', { ascending: false, nullsFirst: false })
            .order('enrollment_count', { ascending: false });
        }
        break;
    }

    // Secondary sort by title for consistency
    q = q.order('title', { ascending: true });

    return q;
  }

  /**
   * Transform database results to ExternalCourseWithProvider format
   */
  private static async transformCourses(
    data: Array<Record<string, unknown>>,
    userId?: string
  ): Promise<ExternalCourseWithProvider[]> {
    // Get user's favorites if logged in
    let favoriteIds: Set<string> = new Set();
    const alertMap: Map<string, string> = new Map();

    if (userId) {
      const [favoritesResult, alertsResult] = await Promise.all([
        supabase.from('user_course_favorites').select('course_id').eq('user_id', userId),
        supabase
          .from('user_price_alerts')
          .select('id, course_id')
          .eq('user_id', userId)
          .eq('is_active', true),
      ]);

      if (favoritesResult.data) {
        favoriteIds = new Set(favoritesResult.data.map(f => f.course_id));
      }

      if (alertsResult.data) {
        alertsResult.data.forEach(a => alertMap.set(a.course_id, a.id));
      }
    }

    return data.map(item => {
      const provider = item.course_providers as Record<string, unknown>;

      return {
        id: item.id as string,
        provider_id: item.provider_id as string,
        external_id: item.external_id as string | null,
        slug: item.slug as string,
        title: item.title as string,
        description: item.description as string | null,
        instructor_name: item.instructor_name as string | null,
        instructor_bio: item.instructor_bio as string | null,
        thumbnail_url: item.thumbnail_url as string | null,
        external_url: item.external_url as string,
        level: item.level as ExternalCourse['level'],
        mode: item.mode as ExternalCourse['mode'],
        language: item.language as string,
        duration_hours: item.duration_hours as number | null,
        duration_text: item.duration_text as string | null,
        price_type: item.price_type as ExternalCourse['price_type'],
        price_amount: item.price_amount as number | null,
        price_currency: item.price_currency as string,
        original_price: item.original_price as number | null,
        rating: item.rating as number | null,
        review_count: item.review_count as number,
        enrollment_count: item.enrollment_count as number,
        certificate_available: item.certificate_available as boolean,
        skills: (item.skills as string[]) || [],
        topics: (item.topics as string[]) || [],
        categories: (item.categories as string[]) || [],
        prerequisites: (item.prerequisites as string[]) || [],
        learning_outcomes: (item.learning_outcomes as string[]) || [],
        lesson_count: item.lesson_count as number | null,
        video_hours: item.video_hours as number | null,
        last_updated: item.last_updated as string | null,
        is_featured: item.is_featured as boolean,
        is_active: item.is_active as boolean,
        sort_order: item.sort_order as number,
        created_at: item.created_at as string,
        updated_at: item.updated_at as string,

        // Provider fields
        provider_name: provider.name as string,
        provider_slug: provider.slug as CourseProviderSlug,
        provider_logo_url: provider.logo_url as string | null,
        provider_category: provider.category as CourseProvider['category'],
        provider_country: provider.country as string | null,

        // User-specific fields
        is_favorite: favoriteIds.has(item.id as string),
        price_alert_id: alertMap.get(item.id as string) || null,
      };
    });
  }
}

export default ExternalCourseService;
