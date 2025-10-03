import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DataService, subscribeToReviewChanges } from '@/services/ReviewsDataService';

import { logger } from '@/utils/logger';
export interface Review {
  id: string;
  user_id: string;
  course_id: number;
  display_name_option: 'full_name' | 'first_name' | 'anonymous';
  review_type: 'written' | 'voice' | 'video';
  written_review: string | null;
  voice_review_url: string | null;
  video_review_url: string | null;
  course_period: string;
  course_mode: 'online' | 'in-person' | 'hybrid';
  rating: number;
  approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    display_name: string;
  };
  courses?: {
    title: string;
  };
}

interface UseReviewsState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export const useReviews = () => {
  const [state, setState] = useState<UseReviewsState>({
    reviews: [],
    loading: true,
    error: null,
    lastFetched: null
  });

  const updateState = useCallback((updates: Partial<UseReviewsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchReviews = useCallback(async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = state.lastFetched ? now - state.lastFetched : Infinity;
    const shouldRefresh = force || timeSinceLastFetch > 30000; // 30 seconds throttle

    if (!shouldRefresh && state.reviews.length > 0) {
      logger.log('⏭️ Skipping reviews fetch - too recent');
      return;
    }

    logger.log('🔄 Fetching reviews...', { force, timeSinceLastFetch });
    updateState({ loading: true, error: null });

    try {
      const reviews = await DataService.getApprovedReviews();
      logger.log(`✅ Fetched ${reviews.length} approved reviews`);
      
      updateState({ 
        reviews: reviews as Review[], 
        loading: false, 
        error: null,
        lastFetched: now
      });
    } catch (err) {
      logger.error('❌ Error fetching reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
    }
  }, [state.lastFetched, state.reviews.length, updateState]);

  const submitReview = useCallback(async (reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'approved' | 'profiles' | 'courses'>) => {
    logger.log('📝 Submitting review...', {
      type: reviewData.review_type,
      course: reviewData.course_id,
      userId: reviewData.user_id,
      rating: reviewData.rating
    });

    try {
      const reviewToSubmit = {
        ...reviewData,
        approved: false, // Reviews need admin approval
        display: true // Add missing display field
      };

      logger.log('🔄 Review data to submit:', reviewToSubmit);

      // Submit the review
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewToSubmit)
        .select(`
          *,
          courses(title)
        `)
        .single();

      if (error) {
        logger.error('❌ Supabase error:', error);
        logger.error('Error details:', { code: error.code, message: error.message, details: error.details });
        throw error;
      }

      logger.log('✅ Review submitted successfully:', data.id);

      // Send email notification to admin
      try {
        // Get user profile for notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', reviewData.user_id)
          .single();

        await supabase.functions.invoke('send-review-notification', {
          body: {
            reviewId: data.id,
            reviewContent: reviewData.written_review || 'Voice/Video review submitted',
            rating: reviewData.rating,
            courseName: data.courses?.title || 'Unknown Course',
            userName: profile?.display_name || profile?.email || 'Anonymous User'
          }
        });
        
        logger.log('📧 Review notification sent to admin');
      } catch (notificationError) {
        logger.error('⚠️ Failed to send notification email:', notificationError);
        // Don't fail the review submission if notification fails
      }

      // Invalidate cache but don't refetch immediately (admin needs to approve first)
      DataService.invalidateReviewsCache();

      return data;
    } catch (err) {
      logger.error('❌ Error submitting review:', err);
      throw err;
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    logger.log('👂 Setting up review subscriptions...');
    
    const unsubscribe = subscribeToReviewChanges(() => {
      logger.log('🔔 Review change detected, refetching...');
      fetchReviews(true); // Force refetch on changes
    });

    return () => {
      logger.log('🔌 Cleaning up review subscriptions');
      unsubscribe();
    };
  }, [fetchReviews]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const refetch = useCallback(() => {
    logger.log('🔄 Manual refetch triggered');
    return fetchReviews(true);
  }, [fetchReviews]);

  return { 
    reviews: state.reviews,
    loading: state.loading,
    error: state.error,
    refetch,
    submitReview,
    lastFetched: state.lastFetched
  };
};