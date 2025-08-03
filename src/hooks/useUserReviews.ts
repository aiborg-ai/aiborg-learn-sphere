import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Review } from '@/hooks/useReviews';

export const useUserReviews = () => {
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserReviews = useCallback(async () => {
    if (!user) {
      setUserReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user reviews without joins first
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('User reviews query error:', reviewsError);
        throw reviewsError;
      }

      // Enrich with course data
      const enrichedReviews = [];
      for (const review of reviewsData || []) {
        let courseData = null;
        try {
          const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', review.course_id)
            .maybeSingle();
          courseData = course;
        } catch (error) {
          console.warn('Failed to fetch course data for user review:', review.id, error);
        }

        enrichedReviews.push({
          ...review,
          courses: courseData,
          profiles: null // User's own profile not needed for display
        });
      }

      setUserReviews(enrichedReviews as unknown as Review[]);
    } catch (err) {
      console.error('Error fetching user reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user reviews');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  return { 
    userReviews, 
    loading, 
    error, 
    refetch: fetchUserReviews 
  };
};