/**
 * Demo Mode Context
 * Provides password-free demo access for stakeholder demonstrations
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface DemoUser {
  id: string;
  email: string;
  role: 'learner' | 'admin';
  displayName: string;
  description: string;
  features: string[];
  landingPage: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  isLoading: boolean;
  error: string | null;
  startDemo: (userType: 'learner' | 'admin') => Promise<void>;
  exitDemo: () => Promise<void>;
}

// Demo credentials - these users should be seeded in the database
const DEMO_USERS: Record<string, DemoUser & { password: string }> = {
  learner: {
    id: 'demo-learner',
    email: 'demo-learner@aiborg.ai',
    password: 'demo123!secure',
    role: 'learner',
    displayName: 'Demo Learner',
    description: 'Experience the platform as a student exploring AI courses',
    features: [
      'Browse all courses and workshops',
      'Take AI readiness assessments',
      'Access knowledgebase and summit resources',
      'View personalized recommendations',
    ],
    landingPage: '/dashboard',
  },
  admin: {
    id: 'demo-admin',
    email: 'demo-admin@aiborg.ai',
    password: 'demo123!secure',
    role: 'admin',
    displayName: 'Demo Admin',
    description: 'Explore full admin capabilities and CMS features',
    features: [
      'Full admin dashboard access',
      'Content management (CMS)',
      'User and enrollment management',
      'Analytics and reporting',
    ],
    landingPage: '/admin',
  },
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing demo mode on mount
  useEffect(() => {
    const checkDemoMode = () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const demoParam = urlParams.get('demo');
      const storedDemoMode = localStorage.getItem('aiborg_demo_mode');
      const storedDemoUser = localStorage.getItem('aiborg_demo_user');

      if (demoParam === 'true' || storedDemoMode === 'true') {
        setIsDemoMode(true);
        if (storedDemoUser) {
          try {
            setDemoUser(JSON.parse(storedDemoUser));
          } catch {
            // Invalid stored user, clear it
            localStorage.removeItem('aiborg_demo_user');
          }
        }
      }
    };

    checkDemoMode();
  }, []);

  const startDemo = useCallback(async (userType: 'learner' | 'admin') => {
    setIsLoading(true);
    setError(null);

    const demoCredentials = DEMO_USERS[userType];
    if (!demoCredentials) {
      setError('Invalid demo user type');
      setIsLoading(false);
      return;
    }

    try {
      // Sign out any existing session first
      await supabase.auth.signOut();

      // Attempt to sign in with demo credentials
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: demoCredentials.email,
        password: demoCredentials.password,
      });

      if (authError) {
        logger.error('[Demo] Auth error:', authError);
        setError('Demo account not available. Please contact support.');
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Failed to authenticate demo user');
        setIsLoading(false);
        return;
      }

      // Set demo mode
      const user: DemoUser = {
        id: data.user.id,
        email: demoCredentials.email,
        role: demoCredentials.role,
        displayName: demoCredentials.displayName,
        description: demoCredentials.description,
        features: demoCredentials.features,
        landingPage: demoCredentials.landingPage,
      };

      localStorage.setItem('aiborg_demo_mode', 'true');
      localStorage.setItem('aiborg_demo_user', JSON.stringify(user));

      setIsDemoMode(true);
      setDemoUser(user);
      setIsLoading(false);

      logger.info('[Demo] Demo mode started for:', userType);

      // Navigate to landing page
      window.location.href = `${user.landingPage}?demo=true`;
    } catch (err) {
      logger.error('[Demo] Error starting demo:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  }, []);

  const exitDemo = useCallback(async () => {
    setIsLoading(true);

    try {
      await supabase.auth.signOut();

      localStorage.removeItem('aiborg_demo_mode');
      localStorage.removeItem('aiborg_demo_user');

      setIsDemoMode(false);
      setDemoUser(null);
      setIsLoading(false);

      logger.info('[Demo] Demo mode exited');

      // Redirect to home
      window.location.href = '/';
    } catch (err) {
      logger.error('[Demo] Error exiting demo:', err);
      setIsLoading(false);
    }
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoUser,
        isLoading,
        error,
        startDemo,
        exitDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

// Helper to check demo mode without context (for non-React code)
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  const demoParam = urlParams.get('demo');
  const storedDemoMode = localStorage.getItem('aiborg_demo_mode');
  const pathname = window.location.pathname;

  return demoParam === 'true' || storedDemoMode === 'true' || pathname === '/demo';
}

// Export demo user configs for the demo page
export const DEMO_USER_CONFIGS = DEMO_USERS;
