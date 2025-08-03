import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  user_id: string;
  course_id: number;
  display_name_option: 'show_name' | 'anonymous';
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

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching reviews...');
      
      // First try a simple query without joins to see if it works
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      console.log('Reviews query result:', { data, error });

      if (error) {
        console.error('Reviews query error:', error);
        throw error;
      }

      console.log('Setting reviews data:', data);
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReview = async (reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'approved' | 'profiles' | 'courses'>) => {
    try {
      // Submit review with approved: false for admin review
      const reviewToSubmit = {
        ...reviewData,
        approved: false // Reviews need admin approval
      };

      // Using any to bypass TypeScript errors temporarily until types are updated
      const { data, error } = await (supabase as any)
        .from('reviews')
        .insert(reviewToSubmit)
        .select(`
          *,
          courses(title)
        `)
        .single();

      if (error) {
        throw error;
      }

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
      } catch (notificationError) {
        console.error('Failed to send notification email:', notificationError);
        // Don't fail the review submission if notification fails
      }

      return data;
    } catch (err) {
      console.error('Error submitting review:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return { 
    reviews, 
    loading, 
    error, 
    refetch: fetchReviews,
    submitReview
  };
};