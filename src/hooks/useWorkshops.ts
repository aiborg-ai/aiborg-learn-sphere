import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAiborgPoints } from './useAiborgPoints';
import { GAMIFICATION_CONFIG } from '@/config/gamification';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface Workshop {
  id: string;
  course_id: number;
  title: string;
  description: string;
  objectives: string[];
  problem_statement?: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  min_group_size: number;
  max_group_size: number;
  points_reward: number;
  leader_bonus_points: number;
  current_phase: 'setup' | 'problem_statement' | 'solving' | 'reporting' | 'completed';
  phase_start_time?: string;
  is_published: boolean;
  facilitator_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopGroup {
  id: string;
  workshop_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WorkshopParticipant {
  id: string;
  workshop_id: string;
  user_id: string;
  group_id?: string;
  role: 'participant' | 'leader' | 'facilitator';
  joined_at: string;
  completed: boolean;
  points_earned: number;
  feedback_given?: string;
}

export interface WorkshopSubmission {
  id: string;
  workshop_id: string;
  group_id: string;
  phase: 'problem_statement' | 'solving' | 'reporting';
  content: string;
  attachments?: string[];
  submitted_by?: string;
  submitted_at: string;
  reviewed: boolean;
  reviewer_feedback?: string;
}

export interface WorkshopMessage {
  id: string;
  workshop_id: string;
  group_id?: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  created_at: string;
}

export function useWorkshops(courseId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { awardPoints } = useAiborgPoints();

  // Fetch workshops for a course
  const {
    data: workshops,
    isLoading: workshopsLoading,
    error: workshopsError,
  } = useQuery({
    queryKey: ['workshops', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as Workshop[];
    },
    enabled: !!courseId,
  });

  // Fetch workshop detail with participants
  const useWorkshopDetail = (workshopId?: string) => {
    return useQuery({
      queryKey: ['workshop-detail', workshopId],
      queryFn: async () => {
        if (!workshopId) return null;

        const { data: workshop, error: workshopError } = await supabase
          .from('workshops')
          .select('*')
          .eq('id', workshopId)
          .single();

        if (workshopError) throw workshopError;

        const { data: participants, error: participantsError } = await supabase
          .from('workshop_participants')
          .select('*')
          .eq('workshop_id', workshopId);

        if (participantsError) throw participantsError;

        const { data: groups, error: groupsError } = await supabase
          .from('workshop_groups')
          .select('*')
          .eq('workshop_id', workshopId);

        if (groupsError) throw groupsError;

        return {
          workshop: workshop as Workshop,
          participants: participants as WorkshopParticipant[],
          groups: groups as WorkshopGroup[],
        };
      },
      enabled: !!workshopId,
    });
  };

  // Join workshop
  const joinWorkshopMutation = useMutation({
    mutationFn: async ({ workshopId }: { workshopId: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if already joined
      const { data: existing } = await supabase
        .from('workshop_participants')
        .select('id')
        .eq('workshop_id', workshopId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        throw new Error('Already joined this workshop');
      }

      // Check max participants
      const { data: workshop } = await supabase
        .from('workshops')
        .select('max_participants')
        .eq('id', workshopId)
        .single();

      const { count } = await supabase
        .from('workshop_participants')
        .select('*', { count: 'exact', head: true })
        .eq('workshop_id', workshopId);

      if (workshop && count && count >= workshop.max_participants) {
        throw new Error('Workshop is full');
      }

      const { data, error } = await supabase
        .from('workshop_participants')
        .insert({
          workshop_id: workshopId,
          user_id: user.id,
          role: 'participant',
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkshopParticipant;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['workshop-detail', data.workshop_id] });
      queryClient.invalidateQueries({ queryKey: ['my-workshops', user?.id] });
      toast.success('Successfully joined workshop!');
      logger.log('Joined workshop:', data);
    },
    onError: (error: unknown) => {
      logger.error('Error joining workshop:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join workshop';
      toast.error(errorMessage);
    },
  });

  // Complete workshop and award points
  const completeWorkshopMutation = useMutation({
    mutationFn: async ({
      workshopId,
      participantId,
      isLeader,
    }: {
      workshopId: string;
      participantId: string;
      isLeader: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get workshop
      const { data: workshop } = await supabase
        .from('workshops')
        .select('*')
        .eq('id', workshopId)
        .single();

      if (!workshop) throw new Error('Workshop not found');

      // Calculate points
      const basePoints = workshop.points_reward;
      const leaderBonus = isLeader ? workshop.leader_bonus_points : 0;
      const totalPoints =
        basePoints + leaderBonus + GAMIFICATION_CONFIG.POINTS.WORKSHOP_COMPLETION_BONUS;

      // Update participant
      const { data, error } = await supabase
        .from('workshop_participants')
        .update({
          completed: true,
          points_earned: totalPoints,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;

      // Award AIBORG points
      awardPoints({
        points: totalPoints,
        sourceType: 'workshop',
        sourceId: workshopId,
        description: `Completed workshop: ${workshop.title}`,
        metadata: { is_leader: isLeader },
      });

      return data as WorkshopParticipant;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['workshop-detail', data.workshop_id] });
      toast.success('🎉 Workshop completed!', {
        description: `You earned ${data.points_earned} AIBORG points!`,
      });
      logger.log('Workshop completed:', data);
    },
    onError: error => {
      logger.error('Error completing workshop:', error);
      toast.error('Failed to complete workshop');
    },
  });

  // Submit workshop phase work
  const submitPhaseMutation = useMutation({
    mutationFn: async ({
      workshopId,
      groupId,
      phase,
      content,
      attachments,
    }: {
      workshopId: string;
      groupId: string;
      phase: 'problem_statement' | 'solving' | 'reporting';
      content: string;
      attachments?: string[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workshop_submissions')
        .upsert({
          workshop_id: workshopId,
          group_id: groupId,
          phase,
          content,
          attachments,
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkshopSubmission;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['workshop-submissions', data.workshop_id, data.group_id],
      });
      toast.success(`${data.phase} phase submitted successfully`);
      logger.log('Phase submitted:', data);
    },
    onError: error => {
      logger.error('Error submitting phase:', error);
      toast.error('Failed to submit phase work');
    },
  });

  // Send message to group
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      workshopId,
      groupId,
      message,
      messageType = 'text',
      fileUrl,
    }: {
      workshopId: string;
      groupId?: string;
      message: string;
      messageType?: 'text' | 'file' | 'system';
      fileUrl?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workshop_messages')
        .insert({
          workshop_id: workshopId,
          group_id: groupId,
          user_id: user.id,
          message,
          message_type: messageType,
          file_url: fileUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkshopMessage;
    },
    onError: error => {
      logger.error('Error sending message:', error);
      toast.error('Failed to send message');
    },
  });

  // Subscribe to workshop messages
  const useWorkshopMessages = (workshopId?: string, groupId?: string) => {
    return useQuery({
      queryKey: ['workshop-messages', workshopId, groupId],
      queryFn: async () => {
        if (!workshopId) return [];

        let query = supabase.from('workshop_messages').select('*').eq('workshop_id', workshopId);

        if (groupId) {
          query = query.eq('group_id', groupId);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;
        return data as WorkshopMessage[];
      },
      enabled: !!workshopId,
      refetchInterval: 5000, // Poll every 5 seconds
    });
  };

  return {
    // Data
    workshops,

    // Loading states
    workshopsLoading,
    isJoining: joinWorkshopMutation.isPending,
    isCompleting: completeWorkshopMutation.isPending,
    isSubmitting: submitPhaseMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,

    // Errors
    workshopsError,

    // Mutations
    joinWorkshop: joinWorkshopMutation.mutate,
    completeWorkshop: completeWorkshopMutation.mutate,
    submitPhase: submitPhaseMutation.mutate,
    sendMessage: sendMessageMutation.mutate,

    // Hooks for specific workshop
    useWorkshopDetail,
    useWorkshopMessages,
  };
}
