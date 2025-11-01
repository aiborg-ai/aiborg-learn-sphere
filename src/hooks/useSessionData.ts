import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { SessionWithCounts, SessionStatus } from '@/types/session';

interface UseSessionDataOptions {
  status?: SessionStatus | SessionStatus[];
  isPublished?: boolean;
  includeFullSessions?: boolean;
  upcomingOnly?: boolean;
}

export const useSessionData = (options: UseSessionDataOptions = {}) => {
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status, isPublished = true, includeFullSessions = true, upcomingOnly = true } = options;

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('free_sessions')
        .select('*')
        .eq('is_published', isPublished)
        .order('session_date', { ascending: true });

      // Filter by status
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      // Filter upcoming sessions only
      if (upcomingOnly) {
        const now = new Date().toISOString();
        query = query.gte('session_date', now);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Transform to SessionWithCounts and optionally filter full sessions
      const transformedData: SessionWithCounts[] = (data || [])
        .map(session => ({
          ...session,
          available_spots: session.capacity - session.registered_count,
          has_waitlist: session.waitlist_count > 0,
        }))
        .filter(session => includeFullSessions || !session.is_full);

      setSessions(transformedData);
    } catch (err) {
      logger.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [status, isPublished, includeFullSessions, upcomingOnly]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
};

export const useSession = (sessionId: string | null) => {
  const [session, setSession] = useState<SessionWithCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('free_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const sessionWithCounts: SessionWithCounts = {
          ...data,
          available_spots: data.capacity - data.registered_count,
          has_waitlist: data.waitlist_count > 0,
        };
        setSession(sessionWithCounts);
      }
    } catch (err) {
      logger.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    refetch: fetchSession,
  };
};

// Hook to check if a user is already registered for a session
export const useUserSessionRegistration = (sessionId: string | null, userEmail: string | null) => {
  const [registration, setRegistration] = useState<Record<string, unknown> | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkRegistration = useCallback(async () => {
    if (!sessionId || !userEmail) {
      setRegistration(null);
      setIsRegistered(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('session_registrations')
        .select('*, session_waitlist(*)')
        .eq('session_id', sessionId)
        .eq('email', userEmail)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setRegistration(data);
      setIsRegistered(!!data && data.status !== 'cancelled' && data.status !== 'expired');
    } catch (err) {
      logger.error('Error checking registration:', err);
      setError(err instanceof Error ? err.message : 'Failed to check registration');
    } finally {
      setLoading(false);
    }
  }, [sessionId, userEmail]);

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  return {
    registration,
    isRegistered,
    loading,
    error,
    refetch: checkRegistration,
  };
};
