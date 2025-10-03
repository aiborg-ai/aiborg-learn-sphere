import { supabase } from '@/integrations/supabase/client';

import { logger } from '@/utils/logger';
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

class ReviewsCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  
  set(key: string, data: unknown, ttl = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  invalidate(pattern?: string) {
    if (pattern) {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const reviewsCache = new ReviewsCache();

export class DataService {
  static async getApprovedReviews() {
    const cacheKey = 'approved-reviews';
    const cached = reviewsCache.get(cacheKey);
    
    if (cached) {
      logger.log('📦 Retrieved reviews from cache');
      return cached;
    }
    
    logger.log('🔄 Fetching reviews from database...');
    
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      logger.error('❌ Reviews query error:', reviewsError);
      throw reviewsError;
    }

    // Enrich with course and profile data
    const enrichedReviews = await Promise.allSettled(
      (reviewsData || []).map(async (review) => {
        const [courseResult, profileResult] = await Promise.allSettled([
          supabase
            .from('courses')
            .select('title')
            .eq('id', review.course_id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', review.user_id)
            .maybeSingle()
        ]);

        return {
          ...review,
          courses: courseResult.status === 'fulfilled' ? courseResult.value.data : null,
          profiles: profileResult.status === 'fulfilled' ? profileResult.value.data : null
        };
      })
    );

    const reviews = enrichedReviews
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<unknown>).value);

    reviewsCache.set(cacheKey, reviews);
    logger.log('✅ Reviews cached successfully');
    
    return reviews;
  }
  
  static async getUserReviews(userId: string) {
    const cacheKey = `user-reviews-${userId}`;
    const cached = reviewsCache.get(cacheKey);
    
    if (cached) {
      logger.log('📦 Retrieved user reviews from cache');
      return cached;
    }
    
    logger.log('🔄 Fetching user reviews from database...');
    
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      logger.error('❌ User reviews query error:', reviewsError);
      throw reviewsError;
    }

    // Enrich with course data
    const enrichedReviews = await Promise.allSettled(
      (reviewsData || []).map(async (review) => {
        const { data: course } = await supabase
          .from('courses')
          .select('title')
          .eq('id', review.course_id)
          .maybeSingle();

        return {
          ...review,
          courses: course,
          profiles: null // User's own profile not needed
        };
      })
    );

    const reviews = enrichedReviews
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<unknown>).value);

    reviewsCache.set(cacheKey, reviews, 2 * 60 * 1000); // 2 minutes for user data
    
    return reviews;
  }
  
  static invalidateReviewsCache() {
    reviewsCache.invalidate('reviews');
    logger.log('🗑️ Reviews cache invalidated');
  }
}

export const subscribeToReviewChanges = (callback: () => void) => {
  logger.log('👂 Setting up real-time review subscriptions...');
  
  const subscription = supabase
    .channel('reviews-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews'
      },
      (payload) => {
        logger.log('🔔 Review change detected:', payload.eventType, payload.new);
        DataService.invalidateReviewsCache();
        callback();
      }
    )
    .subscribe((status) => {
      logger.log('📡 Review subscription status:', status);
    });

  return () => {
    logger.log('🔌 Unsubscribing from review changes');
    supabase.removeChannel(subscription);
  };
};