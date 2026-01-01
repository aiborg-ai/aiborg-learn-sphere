/**
 * Forum Vote Service
 * Handles Reddit-style upvote/downvote system
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { VoteType, VotableType, ForumVote } from '@/types/forum';

export class ForumVoteService {
  /**
   * Vote on a thread or post
   */
  static async vote(
    votableType: VotableType,
    votableId: string,
    voteType: VoteType
  ): Promise<ForumVote> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is banned
      const { data: isBanned } = await supabase
        .from('forum_bans')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (isBanned) {
        throw new Error('You are banned from voting');
      }

      // Check existing vote
      const { data: existingVote } = await supabase
        .from('forum_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('votable_type', votableType)
        .eq('votable_id', votableId)
        .maybeSingle();

      if (existingVote) {
        // If same vote type, remove vote (toggle off)
        if (existingVote.vote_type === voteType) {
          await this.removeVote(votableType, votableId);
          throw new Error('Vote removed'); // This will be caught and handled
        }

        // Different vote type, update
        const { data, error } = await supabase
          .from('forum_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id)
          .select()
          .single();

        if (error) throw error;

        logger.log('Vote updated:', votableType, votableId, voteType);
        return data;
      }

      // Create new vote
      const { data, error } = await supabase
        .from('forum_votes')
        .insert({
          user_id: user.id,
          votable_type: votableType,
          votable_id: votableId,
          vote_type: voteType,
        })
        .select()
        .single();

      if (error) throw error;

      logger.log('Vote created:', votableType, votableId, voteType);

      // Award points to content author
      if (voteType === 'upvote') {
        await this.awardKarmaPoints(votableType, votableId, 2);
      }

      return data;
    } catch (_error) {
      logger.error('Error voting:', _error);
      throw _error;
    }
  }

  /**
   * Upvote
   */
  static async upvote(votableType: VotableType, votableId: string): Promise<ForumVote> {
    return this.vote(votableType, votableId, 'upvote');
  }

  /**
   * Downvote
   */
  static async downvote(votableType: VotableType, votableId: string): Promise<ForumVote> {
    return this.vote(votableType, votableId, 'downvote');
  }

  /**
   * Remove vote
   */
  static async removeVote(votableType: VotableType, votableId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('votable_type', votableType)
        .eq('votable_id', votableId);

      if (error) throw error;

      logger.log('Vote removed:', votableType, votableId);
    } catch (_error) {
      logger.error('Error removing vote:', _error);
      throw _error;
    }
  }

  /**
   * Get user's vote on an item
   */
  static async getUserVote(votableType: VotableType, votableId: string): Promise<VoteType | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('forum_votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('votable_type', votableType)
        .eq('votable_id', votableId)
        .maybeSingle();

      if (error) throw error;
      return data?.vote_type || null;
    } catch (_error) {
      logger.error('Error getting user vote:', _error);
      return null;
    }
  }

  /**
   * Get vote counts for an item
   */
  static async getVoteCounts(
    votableType: VotableType,
    votableId: string
  ): Promise<{ upvotes: number; downvotes: number; score: number }> {
    try {
      const { count: upvotes } = await supabase
        .from('forum_votes')
        .select('*', { count: 'exact', head: true })
        .eq('votable_type', votableType)
        .eq('votable_id', votableId)
        .eq('vote_type', 'upvote');

      const { count: downvotes } = await supabase
        .from('forum_votes')
        .select('*', { count: 'exact', head: true })
        .eq('votable_type', votableType)
        .eq('votable_id', votableId)
        .eq('vote_type', 'downvote');

      const score = (upvotes || 0) - (downvotes || 0);

      return {
        upvotes: upvotes || 0,
        downvotes: downvotes || 0,
        score,
      };
    } catch (_error) {
      logger.error('Error getting vote counts:', _error);
      return { upvotes: 0, downvotes: 0, score: 0 };
    }
  }

  /**
   * Calculate Reddit-style "hot" score
   * Based on: https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9
   */
  static calculateHotScore(upvotes: number, downvotes: number, createdAt: string): number {
    const score = upvotes - downvotes;
    const order = Math.log10(Math.max(Math.abs(score), 1));
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0;

    // Epoch seconds (based on Reddit's 2005-12-08 epoch)
    const epochSeconds = new Date(createdAt).getTime() / 1000 - 1134028003;

    // Combine score and time
    return Number((sign * order + epochSeconds / 45000).toFixed(7));
  }

  /**
   * Calculate "controversial" score (high votes but close ratio)
   */
  static calculateControversialScore(upvotes: number, downvotes: number): number {
    if (upvotes === 0 && downvotes === 0) return 0;

    const total = upvotes + downvotes;
    const balance = upvotes > downvotes ? downvotes / upvotes : upvotes / downvotes;

    // Controversial = high total votes * balanced ratio
    return total * balance;
  }

  /**
   * Award karma points to content author
   */
  private static async awardKarmaPoints(
    votableType: VotableType,
    votableId: string,
    amount: number
  ): Promise<void> {
    try {
      let userId: string | null = null;

      if (votableType === 'thread') {
        const { data } = await supabase
          .from('forum_threads')
          .select('user_id')
          .eq('id', votableId)
          .single();
        userId = data?.user_id || null;
      } else if (votableType === 'post') {
        const { data } = await supabase
          .from('forum_posts')
          .select('user_id')
          .eq('id', votableId)
          .single();
        userId = data?.user_id || null;
      }

      if (userId) {
        await supabase.rpc('award_forum_points', {
          p_user_id: userId,
          p_action_type: 'upvote_received',
          p_amount: amount,
        });
      }
    } catch (_error) {
      // Silent fail - karma points are not critical
      logger.log('Error awarding karma:', _error);
    }
  }

  /**
   * Get top voted threads
   */
  static async getTopVotedThreads(categoryId?: string, limit: number = 10): Promise<string[]> {
    try {
      let query = supabase
        .from('forum_threads')
        .select('id')
        .eq('is_deleted', false)
        .order('upvote_count', { ascending: false })
        .limit(limit);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(t => t.id);
    } catch (_error) {
      logger.error('Error getting top voted threads:', _error);
      return [];
    }
  }

  /**
   * Get user's voting stats
   */
  static async getUserVotingStats(userId: string): Promise<{
    votes_given: number;
    upvotes_given: number;
    downvotes_given: number;
    upvotes_received: number;
    downvotes_received: number;
    karma: number;
  }> {
    try {
      // Votes given
      const { count: votesGiven } = await supabase
        .from('forum_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: upvotesGiven } = await supabase
        .from('forum_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('vote_type', 'upvote');

      const { count: downvotesGiven } = await supabase
        .from('forum_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('vote_type', 'downvote');

      // Votes received on threads
      const { data: threads } = await supabase
        .from('forum_threads')
        .select('upvote_count, downvote_count')
        .eq('user_id', userId);

      const threadUpvotes = threads?.reduce((sum, t) => sum + t.upvote_count, 0) || 0;
      const threadDownvotes = threads?.reduce((sum, t) => sum + t.downvote_count, 0) || 0;

      // Votes received on posts
      const { data: posts } = await supabase
        .from('forum_posts')
        .select('upvote_count, downvote_count')
        .eq('user_id', userId);

      const postUpvotes = posts?.reduce((sum, p) => sum + p.upvote_count, 0) || 0;
      const postDownvotes = posts?.reduce((sum, p) => sum + p.downvote_count, 0) || 0;

      const upvotesReceived = threadUpvotes + postUpvotes;
      const downvotesReceived = threadDownvotes + postDownvotes;
      const karma = upvotesReceived - downvotesReceived;

      return {
        votes_given: votesGiven || 0,
        upvotes_given: upvotesGiven || 0,
        downvotes_given: downvotesGiven || 0,
        upvotes_received: upvotesReceived,
        downvotes_received: downvotesReceived,
        karma,
      };
    } catch (_error) {
      logger.error('Error getting voting stats:', _error);
      return {
        votes_given: 0,
        upvotes_given: 0,
        downvotes_given: 0,
        upvotes_received: 0,
        downvotes_received: 0,
        karma: 0,
      };
    }
  }
}
