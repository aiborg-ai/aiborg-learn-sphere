import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      logger.error('Error fetching profile:', error);
    }
  };

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
          display_name: displayName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
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

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    updateProfile,
    fetchUserProfile,
    isAdmin: profile?.role === 'admin'
  };
};