import { useState, useEffect, useCallback } from 'react';
import { DataService } from '@/services/ReviewsDataService';
import { useAuth } from '@/hooks/useAuth';
import type { Review } from '@/hooks/useReviews';

interface UseUserReviewsState {
  userReviews: Review[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export const useUserReviews = () => {
  const [state, setState] = useState<UseUserReviewsState>({
    userReviews: [],
    loading: true,
    error: null,
    lastFetched: null
  });
  
  const { user } = useAuth();

  const updateState = useCallback((updates: Partial<UseUserReviewsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchUserReviews = useCallback(async (force = false) => {
    if (!user) {
      console.log('👤 No user logged in, clearing user reviews');
      updateState({ userReviews: [], loading: false, error: null });
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = state.lastFetched ? now - state.lastFetched : Infinity;
    const shouldRefresh = force || timeSinceLastFetch > 15000; // 15 seconds throttle for user data

    if (!shouldRefresh && state.userReviews.length > 0) {
      console.log('⏭️ Skipping user reviews fetch - too recent');
      return;
    }

    console.log('🔄 Fetching user reviews...', { userId: user.id, force });
    updateState({ loading: true, error: null });

    try {
      const reviews = await DataService.getUserReviews(user.id);
      console.log(`✅ Fetched ${reviews.length} user reviews`);
      
      updateState({ 
        userReviews: reviews as Review[], 
        loading: false, 
        error: null,
        lastFetched: now
      });
    } catch (err) {
      console.error('❌ Error fetching user reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user reviews';
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
    }
  }, [user, state.lastFetched, state.userReviews.length, updateState]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const refetch = useCallback(() => {
    console.log('🔄 Manual user reviews refetch triggered');
    return fetchUserReviews(true);
  }, [fetchUserReviews]);

  return { 
    userReviews: state.userReviews, 
    loading: state.loading, 
    error: state.error, 
    refetch,
    lastFetched: state.lastFetched
  };
};