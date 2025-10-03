/**
 * Challenge Service
 * Manages competitive challenges, invitations, and rankings
 */

import { supabase } from '@/integrations/supabase/client';
import type { Challenge, ChallengeParticipant } from './types';

export class ChallengeService {
  /**
   * Create a challenge
   */
  static async create(challenge: Partial<Challenge>): Promise<Challenge> {
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        title: challenge.title,
        description: challenge.description,
        challenge_type: challenge.challenge_type,
        assessment_id: challenge.assessment_id,
        start_date: challenge.start_date,
        end_date: challenge.end_date,
        is_public: challenge.is_public ?? true,
        max_participants: challenge.max_participants,
        prize_description: challenge.prize_description,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Invite friend to challenge
   */
  static async invite(
    challengeId: string,
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<void> {
    const { error } = await supabase.from('challenge_invitations').insert({
      challenge_id: challengeId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message,
    });

    if (error) throw error;
  }

  /**
   * Accept challenge invitation
   */
  static async acceptInvitation(invitationId: string): Promise<void> {
    // Update invitation status
    const { data: invitation, error: invError } = await supabase
      .from('challenge_invitations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invitationId)
      .select()
      .single();

    if (invError) throw invError;

    // Add to participants
    const { error: partError } = await supabase.from('challenge_participants').insert({
      challenge_id: invitation.challenge_id,
      user_id: invitation.to_user_id,
      status: 'accepted',
    });

    if (partError) throw partError;
  }

  /**
   * Join public challenge
   */
  static async join(challengeId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('challenge_participants').insert({
      challenge_id: challengeId,
      user_id: userId,
      status: 'in_progress',
    });

    if (error) throw error;
  }

  /**
   * Submit challenge result
   */
  static async submitResult(
    challengeId: string,
    userId: string,
    score: number,
    completionTime?: number
  ): Promise<void> {
    const { error } = await supabase
      .from('challenge_participants')
      .update({
        score,
        completion_time: completionTime,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update rankings
    await this.updateRankings(challengeId);
  }

  /**
   * Update challenge rankings
   */
  private static async updateRankings(challengeId: string): Promise<void> {
    const { data: participants, error: fetchError } = await supabase
      .from('challenge_participants')
      .select('id, score, completion_time')
      .eq('challenge_id', challengeId)
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .order('completion_time', { ascending: true });

    if (fetchError) throw fetchError;

    // Assign ranks
    const updates = participants?.map((p, index) => ({
      id: p.id,
      rank: index + 1,
    }));

    if (updates && updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('challenge_participants')
          .update({ rank: update.rank })
          .eq('id', update.id);
      }
    }
  }

  /**
   * Get challenge leaderboard
   */
  static async getLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select(
        `
        *,
        user:user_id (id, email, user_profiles(username))
      `
      )
      .eq('challenge_id', challengeId)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
