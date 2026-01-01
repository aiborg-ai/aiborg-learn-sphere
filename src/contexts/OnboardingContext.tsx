/**
 * Onboarding Context
 *
 * Provides onboarding state and methods throughout the application.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { logger } from '@/utils/logger';
import type { OnboardingTip, OnboardingContextValue } from '@/types/onboarding';

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const onboarding = useOnboarding();
  const [tips, setTips] = useState<OnboardingTip[]>([]);

  // Fetch onboarding tips
  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_tips')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      setTips(data as OnboardingTip[]);
    } catch (err) {
      logger.error('Error fetching onboarding tips:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTips();
    }
  }, [user]);

  const value: OnboardingContextValue = {
    ...onboarding,
    tips,
    refetchTips: fetchTips,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}
