import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * User profile data structure from the database
 */
export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication hook for managing user authentication state
 *
 * Features:
 * - Sign up / Sign in / Sign out
 * - OAuth authentication (Google, GitHub)
 * - User profile management
 * - Admin role checking
 * - Real-time auth state updates
 *
 * @example
 * ```tsx
 * const { user, profile, signIn, signOut, isAdmin } = useAuth();
 *
 * if (loading) return <Loader />;
 * if (!user) return <SignInPage />;
 *
 * return <DashboardPage user={user} profile={profile} />;
 * ```
 *
 * @returns Authentication state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      logger.log('[useAuth] Fetching profile for user:', userId);
      setProfileError(null); // Clear any previous errors

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('[useAuth] Error fetching profile:', {
          userId,
          error,
          code: error.code,
          message: error.message,
          details: error.details,
        });
        setProfileError(`Failed to fetch profile: ${error.message}`);
        setProfile(null);
        return;
      }

      if (error && error.code === 'PGRST116') {
        logger.warn('[useAuth] Profile not found for user:', userId);
        setProfileError('Profile not found in database');
        setProfile(null);
        return;
      }

      logger.log('[useAuth] Profile fetched successfully:', {
        userId,
        profileId: data?.id,
        role: data?.role,
        email: data?.email,
      });

      setProfileError(null);
      setProfile(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[useAuth] Exception while fetching profile:', {
        userId,
        error,
      });
      setProfileError(`Exception: ${errorMessage}`);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log('[useAuth] Auth state changed:', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch user profile and wait for it to complete before setting loading to false
        await fetchUserProfile(session.user.id);
      } else {
        logger.log('[useAuth] No session, clearing profile');
        setProfile(null);
      }
      setLoading(false);
      logger.log('[useAuth] Loading complete, auth state updated');
    });

    // Check for existing session
    logger.log('[useAuth] Checking for existing session...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      logger.log('[useAuth] Existing session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Wait for profile to load before setting loading to false
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
      logger.log('[useAuth] Initial load complete');
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Use environment variable for redirect URL, fallback to current origin
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUrl = `${appUrl}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUrl = `${appUrl}/auth/callback`;

    // Store the current page to return to after auth
    sessionStorage.setItem('authRedirect', window.location.pathname);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    return { error };
  };

  const signInWithGitHub = async () => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUrl = `${appUrl}/auth/callback`;

    // Store the current page to return to after auth
    sessionStorage.setItem('authRedirect', window.location.pathname);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id);

    if (!error) {
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    profileError,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    updateProfile,
    fetchUserProfile,
    isAdmin: profile?.role === 'admin',
  };
};
