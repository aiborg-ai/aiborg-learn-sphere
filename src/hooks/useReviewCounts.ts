import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { logger } from '@/utils/logger';
interface ReviewCount {
  course_id: number;
  count: number;
}

export const useReviewCounts = () => {
  const [reviewCounts, setReviewCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('course_id')
          .eq('approved', true);

        if (error) throw error;

        // Count reviews per course
        const counts: Record<number, number> = {};
        data?.forEach(review => {
          if (review.course_id) {
            counts[review.course_id] = (counts[review.course_id] || 0) + 1;
          }
        });

        setReviewCounts(counts);
      } catch (error) {
        logger.error('Error fetching review counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewCounts();
  }, []);

  const getReviewCount = (courseId: number) => reviewCounts[courseId] || 0;

  return { reviewCounts, getReviewCount, loading };
};