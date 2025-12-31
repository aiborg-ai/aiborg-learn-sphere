/**
 * Workshop Service
 * Handles workshop and session management
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  Workshop,
  WorkshopSession,
  WorkshopParticipant,
  CreateWorkshopInput,
  CreateSessionInput,
  JoinSessionInput,
  UpdateStageInput,
  WorkshopStatistics,
} from './types';

export class WorkshopService {
  /**
   * Create a new workshop
   */
  static async createWorkshop(input: CreateWorkshopInput, userId: string): Promise<Workshop> {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .insert({
          ...input,
          created_by: userId,
          difficulty_level: input.difficulty_level || 'intermediate',
          duration_minutes: input.duration_minutes || 120,
          min_participants: input.min_participants || 2,
          max_participants: input.max_participants || 6,
          points_reward: input.points_reward || 50,
          setup_duration_minutes: input.setup_duration_minutes || 15,
          problem_duration_minutes: input.problem_duration_minutes || 30,
          solving_duration_minutes: input.solving_duration_minutes || 60,
          reporting_duration_minutes: input.reporting_duration_minutes || 15,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Workshop created', { workshopId: data.id, courseId: input.course_id });
      return data as Workshop;
    } catch (_error) {
      logger._error('Failed to create workshop', { _error, input });
      throw error;
    }
  }

  /**
   * Get workshop by ID
   */
  static async getWorkshop(workshopId: string): Promise<Workshop> {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('id', workshopId)
        .single();

      if (error) throw error;

      return data as Workshop;
    } catch (_error) {
      logger._error('Failed to get workshop', { _error, workshopId });
      throw error;
    }
  }

  /**
   * Get workshops by course
   */
  static async getWorkshopsByCourse(courseId: number, publishedOnly = false): Promise<Workshop[]> {
    try {
      let query = supabase.from('workshops').select('*').eq('course_id', courseId);

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data as Workshop[];
    } catch (_error) {
      logger._error('Failed to get workshops by course', { _error, courseId });
      throw error;
    }
  }

  /**
   * Create a workshop session
   */
  static async createSession(input: CreateSessionInput): Promise<WorkshopSession> {
    try {
      const { data, error } = await supabase
        .from('workshop_sessions')
        .insert({
          ...input,
          current_stage: 'setup',
          status: 'scheduled',
          max_participants: input.max_participants || 6,
          is_open_enrollment: input.is_open_enrollment ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Workshop session created', {
        sessionId: data.id,
        workshopId: input.workshop_id,
      });
      return data as WorkshopSession;
    } catch (_error) {
      logger._error('Failed to create session', { _error, input });
      throw error;
    }
  }

  /**
   * Start a workshop session
   */
  static async startSession(sessionId: string): Promise<WorkshopSession> {
    try {
      const { data, error } = await supabase
        .from('workshop_sessions')
        .update({
          status: 'in_progress',
          actual_start: new Date().toISOString(),
          current_stage: 'setup',
          stage_started_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Workshop session started', { sessionId });
      return data as WorkshopSession;
    } catch (_error) {
      logger._error('Failed to start session', { _error, sessionId });
      throw error;
    }
  }

  /**
   * Update workshop stage
   */
  static async updateStage(input: UpdateStageInput): Promise<WorkshopSession> {
    try {
      const { data, error } = await supabase
        .from('workshop_sessions')
        .update({
          current_stage: input.new_stage,
          stage_started_at: new Date().toISOString(),
        })
        .eq('id', input.session_id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Workshop stage updated', {
        sessionId: input.session_id,
        stage: input.new_stage,
      });
      return data as WorkshopSession;
    } catch (_error) {
      logger._error('Failed to update stage', { _error, input });
      throw error;
    }
  }

  /**
   * Complete workshop session
   */
  static async completeSession(sessionId: string): Promise<WorkshopSession> {
    try {
      const { data, error } = await supabase
        .from('workshop_sessions')
        .update({
          status: 'completed',
          actual_end: new Date().toISOString(),
          current_stage: 'completed',
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Award points to participants
      await this.awardParticipantPoints(sessionId);

      logger.info('Workshop session completed', { sessionId });
      return data as WorkshopSession;
    } catch (_error) {
      logger._error('Failed to complete session', { _error, sessionId });
      throw error;
    }
  }

  /**
   * Award points to workshop participants
   */
  private static async awardParticipantPoints(sessionId: string): Promise<void> {
    try {
      // Get session and workshop details
      const { data: session } = await supabase
        .from('workshop_sessions')
        .select('workshop_id, workshops(points_reward)')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      const basePoints = (session as WorkshopSession & { workshops: { points_reward: number } })
        .workshops.points_reward;

      // Get participants who attended
      const { data: participants } = await supabase
        .from('workshop_participants')
        .select('user_id, contribution_score')
        .eq('session_id', sessionId)
        .eq('attendance_status', 'attended');

      if (!participants) return;

      // Award points to each participant
      for (const participant of participants) {
        const multiplier = participant.contribution_score
          ? 1 + participant.contribution_score / 100
          : 1;
        const points = Math.round(basePoints * multiplier);

        await supabase.from('learning_activity_points').insert({
          user_id: participant.user_id,
          activity_type: 'workshop',
          activity_id: sessionId,
          points_earned: points,
          bonus_multiplier: multiplier,
          reason: 'Workshop participation',
        });

        // Update participant record
        await supabase
          .from('workshop_participants')
          .update({ points_earned: points })
          .eq('session_id', sessionId)
          .eq('user_id', participant.user_id);
      }
    } catch (_error) {
      logger._error('Failed to award participant points', { _error, sessionId });
    }
  }

  /**
   * Join a workshop session
   */
  static async joinSession(input: JoinSessionInput): Promise<WorkshopParticipant> {
    try {
      // Check if already joined
      const { data: existing } = await supabase
        .from('workshop_participants')
        .select('id')
        .eq('session_id', input.session_id)
        .eq('user_id', input.user_id)
        .single();

      if (existing) {
        throw new Error('Already joined this session');
      }

      // Check participant limit
      const { count } = await supabase
        .from('workshop_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', input.session_id);

      const { data: session } = await supabase
        .from('workshop_sessions')
        .select('max_participants')
        .eq('id', input.session_id)
        .single();

      if (count && session && count >= session.max_participants) {
        throw new Error('Workshop session is full');
      }

      const { data, error } = await supabase
        .from('workshop_participants')
        .insert({
          ...input,
          role: input.role || 'participant',
          attendance_status: 'registered',
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Joined workshop session', {
        sessionId: input.session_id,
        userId: input.user_id,
      });
      return data as WorkshopParticipant;
    } catch (_error) {
      logger._error('Failed to join session', { _error, input });
      throw error;
    }
  }

  /**
   * Get workshop statistics
   */
  static async getWorkshopStatistics(workshopId: string): Promise<WorkshopStatistics> {
    try {
      const { data: sessions, error } = await supabase
        .from('workshop_sessions')
        .select('id, status')
        .eq('workshop_id', workshopId);

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        return {
          workshop_id: workshopId,
          total_sessions: 0,
          total_participants: 0,
          completed_sessions: 0,
          average_participants: 0,
        };
      }

      const completedSessions = sessions.filter(s => s.status === 'completed').length;

      // Get participant stats
      const sessionIds = sessions.map(s => s.id);
      const { data: participants } = await supabase
        .from('workshop_participants')
        .select('session_id, contribution_score')
        .in('session_id', sessionIds);

      const totalParticipants = participants?.length || 0;
      const averageParticipants = totalParticipants / sessions.length;

      const contributionScores =
        participants?.filter(p => p.contribution_score).map(p => p.contribution_score!) || [];
      const averageContributionScore =
        contributionScores.length > 0
          ? contributionScores.reduce((sum, score) => sum + score, 0) / contributionScores.length
          : undefined;

      return {
        workshop_id: workshopId,
        total_sessions: sessions.length,
        total_participants: totalParticipants,
        completed_sessions: completedSessions,
        average_participants: Math.round(averageParticipants * 10) / 10,
        average_contribution_score: averageContributionScore
          ? Math.round(averageContributionScore * 10) / 10
          : undefined,
      };
    } catch (_error) {
      logger._error('Failed to get workshop statistics', { _error, workshopId });
      throw error;
    }
  }
}
