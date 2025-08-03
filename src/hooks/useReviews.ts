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
  is_approved: boolean;
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
      // Using any to bypass TypeScript errors temporarily until types are updated
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select(`
          *,
          profiles(display_name),
          courses(title)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReview = async (reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'is_approved' | 'profiles' | 'courses'>) => {
    try {
      // Using any to bypass TypeScript errors temporarily until types are updated
      const { data, error } = await (supabase as any)
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        throw error;
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