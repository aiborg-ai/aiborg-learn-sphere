/**
 * useOnboarding Hook
 *
 * Manages progressive onboarding state, tip tracking, and milestone completion.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { UserOnboardingProgress, OnboardingCategory } from '@/types/onboarding';

export function useOnboarding() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserOnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch onboarding progress
  const fetchProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no record exists, create one
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_onboarding_progress')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          setProgress(newData as UserOnboardingProgress);
        } else {
          throw fetchError;
        }
      } else {
        setProgress(data as UserOnboardingProgress);
      }

      setError(null);
    } catch (err) {
      logger.error('Error fetching onboarding progress:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Listen for tip completion events
  useEffect(() => {
    const handleTipCompleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ tipId: string }>;
      if (customEvent.detail?.tipId) {
        markTipCompleted(customEvent.detail.tipId);
      }
    };

    window.addEventListener('onboarding-tip-completed', handleTipCompleted);

    return () => {
      window.removeEventListener('onboarding-tip-completed', handleTipCompleted);
    };
  }, []);

  // Check if a tip has been completed
  const isTipCompleted = useCallback(
    (tipId: string): boolean => {
      if (!progress) return false;
      return progress.completed_tips.includes(tipId);
    },
    [progress]
  );

  // Mark a single tip as completed
  const markTipCompleted = useCallback(
    async (tipId: string) => {
      if (!user?.id || !progress) return;

      // Don't mark if already completed
      if (progress.completed_tips.includes(tipId)) return;

      try {
        const updatedTips = [...progress.completed_tips, tipId];

        const { data, error: updateError } = await supabase
          .from('user_onboarding_progress')
          .update({ completed_tips: updatedTips })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setProgress(data as UserOnboardingProgress);

        logger.info(`Onboarding tip completed: ${tipId}`);
      } catch (err) {
        logger.error('Error marking tip completed:', err);
      }
    },
    [user?.id, progress]
  );

  // Mark multiple tips as completed
  const markMultipleTipsCompleted = useCallback(
    async (tipIds: string[]) => {
      if (!user?.id || !progress) return;

      try {
        const uniqueTips = Array.from(new Set([...progress.completed_tips, ...tipIds]));

        const { data, error: updateError } = await supabase
          .from('user_onboarding_progress')
          .update({ completed_tips: uniqueTips })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setProgress(data as UserOnboardingProgress);

        logger.info(`Onboarding tips completed: ${tipIds.join(', ')}`);
      } catch (err) {
        logger.error('Error marking tips completed:', err);
      }
    },
    [user?.id, progress]
  );

  // Mark a milestone as completed
  const markMilestone = useCallback(
    async (
      milestone: keyof Pick<
        UserOnboardingProgress,
        | 'has_completed_profile'
        | 'has_enrolled_in_course'
        | 'has_attended_event'
        | 'has_completed_assessment'
        | 'has_explored_dashboard'
        | 'has_used_ai_chat'
        | 'has_created_content'
      >
    ) => {
      if (!user?.id || !progress) return;

      // Don't update if already marked
      if (progress[milestone]) return;

      try {
        const { data, error: updateError } = await supabase
          .from('user_onboarding_progress')
          .update({ [milestone]: true })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setProgress(data as UserOnboardingProgress);

        logger.info(`Onboarding milestone completed: ${milestone}`);
      } catch (err) {
        logger.error('Error marking milestone:', err);
      }
    },
    [user?.id, progress]
  );

  // Complete entire onboarding
  const completeOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: updateError } = await supabase
        .from('user_onboarding_progress')
        .update({ onboarding_completed: true, completed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProgress(data as UserOnboardingProgress);

      logger.info('Onboarding completed!');
    } catch (err) {
      logger.error('Error completing onboarding:', err);
    }
  }, [user?.id]);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: updateError } = await supabase
        .from('user_onboarding_progress')
        .update({ onboarding_skipped: true })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProgress(data as UserOnboardingProgress);

      logger.info('Onboarding skipped');
    } catch (err) {
      logger.error('Error skipping onboarding:', err);
    }
  }, [user?.id]);

  // Reset onboarding
  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: updateError } = await supabase
        .from('user_onboarding_progress')
        .update({
          completed_tips: [],
          has_completed_profile: false,
          has_enrolled_in_course: false,
          has_attended_event: false,
          has_completed_assessment: false,
          has_explored_dashboard: false,
          has_used_ai_chat: false,
          has_created_content: false,
          onboarding_completed: false,
          onboarding_skipped: false,
          completed_at: null,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProgress(data as UserOnboardingProgress);

      logger.info('Onboarding reset');
    } catch (err) {
      logger.error('Error resetting onboarding:', err);
    }
  }, [user?.id]);

  // Check if a tip should be shown
  const shouldShowTip = useCallback(
    (tipId: string, category?: OnboardingCategory): boolean => {
      if (!progress) return false;

      // Don't show if onboarding is completed or skipped
      if (progress.onboarding_completed || progress.onboarding_skipped) {
        return false;
      }

      // Don't show if already completed
      if (progress.completed_tips.includes(tipId)) {
        return false;
      }

      // Additional category-based logic can be added here
      // For example, don't show Studio tips if user hasn't explored dashboard yet
      if (category === 'studio' && !progress.has_explored_dashboard) {
        return false;
      }

      return true;
    },
    [progress]
  );

  // Calculate completion percentage
  const getCompletionPercentage = useCallback((): number => {
    if (!progress) return 0;

    const milestones = [
      progress.has_completed_profile,
      progress.has_enrolled_in_course,
      progress.has_attended_event,
      progress.has_completed_assessment,
      progress.has_explored_dashboard,
      progress.has_used_ai_chat,
      progress.has_created_content,
    ];

    const completedCount = milestones.filter(Boolean).length;
    return Math.round((completedCount / milestones.length) * 100);
  }, [progress]);

  return {
    progress,
    loading,
    error,
    isTipCompleted,
    markTipCompleted,
    markMultipleTipsCompleted,
    markMilestone,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    shouldShowTip,
    getCompletionPercentage,
  };
}
