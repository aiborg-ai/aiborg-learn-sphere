/**
 * Workshop Sessions Hook
 * Manages workshop sessions using the new workshop sessions schema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { WorkshopService } from '@/services/workshop';
import { useWorkshopRealtime } from './useWorkshopRealtime';
import type {
  Workshop,
  WorkshopSession,
  WorkshopParticipant,
  CreateSessionInput,
  JoinSessionInput,
  UpdateStageInput,
} from '@/services/workshop/types';

export function useWorkshopSessions(workshopId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get workshop details
  const {
    data: workshop,
    isLoading: workshopLoading,
    error: workshopError,
  } = useQuery({
    queryKey: ['workshop', workshopId],
    queryFn: () => WorkshopService.getWorkshop(workshopId!),
    enabled: !!workshopId,
  });

  // Get workshop sessions
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ['workshop-sessions', workshopId],
    queryFn: async () => {
      if (!workshopId) return [];

      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .from('workshop_sessions')
        .select('*')
        .eq('workshop_id', workshopId)
        .order('scheduled_start', { ascending: true })
      );

      if (error) throw error;
      return data as WorkshopSession[];
    },
    enabled: !!workshopId,
  });

  // Get user's participation status
  const {
    data: userParticipation,
    isLoading: participationLoading,
  } = useQuery({
    queryKey: ['workshop-participation', workshopId, user?.id],
    queryFn: async () => {
      if (!workshopId || !user) return null;

      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .from('workshop_participants')
        .select('*, workshop_sessions(*)')
        .eq('user_id', user.id)
        .in('session_id', sessions?.map(s => s.id) || [])
        .maybeSingle()
      );

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkshopParticipant | null;
    },
    enabled: !!workshopId && !!user && (sessions?.length ?? 0) > 0,
  });

  // Create a new workshop session
  const createSessionMutation = useMutation({
    mutationFn: (input: CreateSessionInput) => WorkshopService.createSession(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-sessions', data.workshop_id] });
      toast.success('Workshop session created successfully!');
      logger.info('Workshop session created', { sessionId: data.id });
    },
    onError: (error: Error) => {
      logger.error('Failed to create workshop session', { error });
      toast.error(`Failed to create session: ${error.message}`);
    },
  });

  // Join a workshop session
  const joinSessionMutation = useMutation({
    mutationFn: (input: JoinSessionInput) => WorkshopService.joinSession(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-participants', data.session_id] });
      queryClient.invalidateQueries({ queryKey: ['workshop-participation', workshopId, user?.id] });
      toast.success('Successfully joined workshop session!');
      logger.info('Joined workshop session', { sessionId: data.session_id });
    },
    onError: (error: Error) => {
      logger.error('Failed to join workshop session', { error });
      toast.error(`Failed to join: ${error.message}`);
    },
  });

  // Start a workshop session (facilitator only)
  const startSessionMutation = useMutation({
    mutationFn: (sessionId: string) => WorkshopService.startSession(sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-session-detail', data.id] });
      toast.success('Workshop session started!');
      logger.info('Workshop session started', { sessionId: data.id });
    },
    onError: (error: Error) => {
      logger.error('Failed to start workshop session', { error });
      toast.error(`Failed to start: ${error.message}`);
    },
  });

  // Update workshop stage
  const updateStageMutation = useMutation({
    mutationFn: (input: UpdateStageInput) => WorkshopService.updateStage(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-session-detail', data.id] });
      toast.success(`Moved to ${data.current_stage} stage`);
      logger.info('Workshop stage updated', { sessionId: data.id, stage: data.current_stage });
    },
    onError: (error: Error) => {
      logger.error('Failed to update workshop stage', { error });
      toast.error(`Failed to change stage: ${error.message}`);
    },
  });

  // Complete workshop session
  const completeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => WorkshopService.completeSession(sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-session-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['workshop-participants', data.id] });
      toast.success('🎉 Workshop completed! Points have been awarded.', {
        description: 'Thank you for your participation!',
      });
      logger.info('Workshop session completed', { sessionId: data.id });
    },
    onError: (error: Error) => {
      logger.error('Failed to complete workshop session', { error });
      toast.error(`Failed to complete: ${error.message}`);
    },
  });

  return {
    // Data
    workshop,
    sessions,
    userParticipation,

    // Loading states
    workshopLoading,
    sessionsLoading,
    participationLoading,
    isCreatingSession: createSessionMutation.isPending,
    isJoining: joinSessionMutation.isPending,
    isStarting: startSessionMutation.isPending,
    isUpdatingStage: updateStageMutation.isPending,
    isCompleting: completeSessionMutation.isPending,

    // Errors
    workshopError,
    sessionsError,

    // Actions
    createSession: createSessionMutation.mutate,
    joinSession: joinSessionMutation.mutate,
    startSession: startSessionMutation.mutate,
    updateStage: updateStageMutation.mutate,
    completeSession: completeSessionMutation.mutate,
  };
}

/**
 * Hook for a single workshop session detail with real-time WebSocket updates
 * No polling - uses Supabase Realtime for instant updates
 */
export function useWorkshopSessionDetail(sessionId?: string) {
  const { user } = useAuth();

  // Get session details (NO polling - realtime handles updates)
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useQuery({
    queryKey: ['workshop-session-detail', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .from('workshop_sessions')
        .select('*, workshops(*)')
        .eq('id', sessionId)
        .single()
      );

      if (error) throw error;
      return data as WorkshopSession & { workshops: Workshop };
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Data stays fresh via realtime subscriptions
  });

  // Get participants (NO polling - realtime handles updates)
  const {
    data: participants,
    isLoading: participantsLoading,
  } = useQuery({
    queryKey: ['workshop-participants', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .from('workshop_participants')
        .select('*, profiles(*)')
        .eq('session_id', sessionId)
      );

      if (error) throw error;
      return data as (WorkshopParticipant & { profiles: { display_name: string, avatar_url: string | null } })[];
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Data stays fresh via realtime subscriptions
  });

  // Get activities (NO polling - realtime handles updates)
  const {
    data: activities,
    isLoading: activitiesLoading,
  } = useQuery({
    queryKey: ['workshop-activities', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .from('workshop_activities')
        .select('*, profiles(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      );

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Data stays fresh via realtime subscriptions
  });

  // Get stage submissions (NO polling - realtime handles updates)
  const {
    data: stageSubmissions,
    isLoading: submissionsLoading,
  } = useQuery({
    queryKey: ['workshop-stage-submissions', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase
        .from('workshop_stage_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      );

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Data stays fresh via realtime subscriptions
  });

  // Initialize realtime subscriptions (replaces all polling)
  // This will automatically invalidate queries when data changes
  const {
    status: realtimeStatus,
    isConnected: isRealtimeConnected,
    reconnect: reconnectRealtime,
  } = useWorkshopRealtime({
    sessionId: sessionId || '',
    enabled: !!sessionId,
  });

  // Check if current user is facilitator
  const isFacilitator = session?.facilitator_id === user?.id;

  // Check if current user is participant
  const isParticipant = participants?.some(p => p.user_id === user?.id) ?? false;

  return {
    // Data
    session,
    participants,
    activities,
    stageSubmissions,
    isFacilitator,
    isParticipant,

    // Loading states
    sessionLoading,
    participantsLoading,
    activitiesLoading,
    submissionsLoading,

    // Errors
    sessionError,

    // Computed
    participantCount: participants?.length ?? 0,
    activityCount: activities?.length ?? 0,

    // Realtime connection status
    realtimeStatus,
    isRealtimeConnected,
    reconnectRealtime,
  };
}
