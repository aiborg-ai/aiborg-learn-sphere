import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

export interface ClassroomQuestion {
  id: string;
  session_id: string;
  user_id: string;
  question_text: string;
  question_context?: string;
  answer_text?: string;
  answered_by?: string;
  answered_at?: string;
  upvotes: number;
  is_resolved: boolean;
  is_pinned: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
    email?: string;
  };
  answerer_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  user_has_upvoted?: boolean;
}

interface UseClassroomQuestionsOptions {
  sessionId: string | null;
  autoSubscribe?: boolean;
}

/**
 * Hook for managing real-time classroom Q&A
 *
 * Features:
 * - Ask questions
 * - Answer questions (instructors)
 * - Upvote questions
 * - Pin important questions
 * - Real-time updates
 * - Sort by priority, upvotes, and time
 *
 * @example
 * ```tsx
 * const { questions, askQuestion, answerQuestion, upvoteQuestion } = useClassroomQuestions({
 *   sessionId: session.id,
 *   autoSubscribe: true
 * });
 * ```
 */
export const useClassroomQuestions = ({
  sessionId,
  autoSubscribe = true,
}: UseClassroomQuestionsOptions) => {
  const [questions, setQuestions] = useState<ClassroomQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  /**
   * Check if current user is instructor
   */
  const checkInstructorRole = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const instructor = profile?.role === 'instructor' || profile?.role === 'admin';
      setIsInstructor(instructor);
      return instructor;
    } catch (err) {
      logger.error('Failed to check instructor role', { error: err });
      return false;
    }
  }, []);

  /**
   * Fetch questions with user profiles and upvote status
   */
  const fetchQuestions = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch questions with user profiles
      const { data: questionsData, error: fetchError } = await supabase
        .from('classroom_questions')
        .select(
          `
          *,
          user_profile:profiles!classroom_questions_user_id_fkey (
            display_name,
            avatar_url,
            email
          ),
          answerer_profile:profiles!classroom_questions_answered_by_fkey (
            display_name,
            avatar_url
          )
        `
        )
        .eq('session_id', sessionId)
        .order('is_pinned', { ascending: false })
        .order('priority', { ascending: false })
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Check which questions current user has upvoted
      const { data: upvotesData } = await supabase
        .from('question_upvotes')
        .select('question_id')
        .eq('user_id', user.id);

      const upvotedIds = new Set(upvotesData?.map(u => u.question_id) || []);

      const enrichedQuestions = (questionsData || []).map(q => ({
        ...q,
        user_has_upvoted: upvotedIds.has(q.id),
      }));

      setQuestions(enrichedQuestions);
    } catch (err) {
      logger.error('Failed to fetch questions', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Ask a new question
   */
  const askQuestion = useCallback(
    async (questionText: string, context?: string): Promise<ClassroomQuestion | null> => {
      if (!sessionId) {
        toast({
          title: 'Error',
          description: 'No active session',
          variant: 'destructive',
        });
        return null;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error: insertError } = await supabase
          .from('classroom_questions')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            question_text: questionText,
            question_context: context,
          })
          .select(
            `
          *,
          user_profile:profiles!classroom_questions_user_id_fkey (
            display_name,
            avatar_url,
            email
          )
        `
          )
          .single();

        if (insertError) throw insertError;

        toast({
          title: 'Question submitted',
          description: 'Your question has been sent to the instructor',
        });

        logger.info('Question asked', { questionId: data.id });
        return data as ClassroomQuestion;
      } catch (err) {
        logger.error('Failed to ask question', { error: err });
        toast({
          title: 'Error',
          description: 'Failed to submit question',
          variant: 'destructive',
        });
        return null;
      }
    },
    [sessionId, toast]
  );

  /**
   * Answer a question (instructor only)
   */
  const answerQuestion = useCallback(
    async (questionId: string, answerText: string): Promise<boolean> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error: updateError } = await supabase
          .from('classroom_questions')
          .update({
            answer_text: answerText,
            answered_by: user.id,
            answered_at: new Date().toISOString(),
            is_resolved: true,
          })
          .eq('id', questionId);

        if (updateError) throw updateError;

        toast({
          title: 'Answer posted',
          description: 'Your answer has been shared with the class',
        });

        logger.info('Question answered', { questionId });
        return true;
      } catch (err) {
        logger.error('Failed to answer question', { error: err });
        toast({
          title: 'Error',
          description: 'Failed to post answer',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  /**
   * Upvote a question
   */
  const upvoteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Check if already upvoted
        const { data: existing } = await supabase
          .from('question_upvotes')
          .select('id')
          .eq('question_id', questionId)
          .eq('user_id', user.id)
          .single();

        if (existing) {
          // Remove upvote
          const { error: deleteError } = await supabase
            .from('question_upvotes')
            .delete()
            .eq('id', existing.id);

          if (deleteError) throw deleteError;
        } else {
          // Add upvote
          const { error: insertError } = await supabase.from('question_upvotes').insert({
            question_id: questionId,
            user_id: user.id,
          });

          if (insertError) throw insertError;
        }

        return true;
      } catch (err) {
        logger.error('Failed to upvote question', { error: err });
        toast({
          title: 'Error',
          description: 'Failed to upvote question',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  /**
   * Pin/unpin a question (instructor only)
   */
  const pinQuestion = useCallback(
    async (questionId: string, pinned: boolean): Promise<boolean> => {
      if (!isInstructor) {
        toast({
          title: 'Permission denied',
          description: 'Only instructors can pin questions',
          variant: 'destructive',
        });
        return false;
      }

      try {
        const { error: updateError } = await supabase
          .from('classroom_questions')
          .update({ is_pinned: pinned })
          .eq('id', questionId);

        if (updateError) throw updateError;

        toast({
          title: pinned ? 'Question pinned' : 'Question unpinned',
          description: pinned ? 'This question is now highlighted' : 'Pin removed',
        });

        return true;
      } catch (err) {
        logger.error('Failed to pin question', { error: err });
        toast({
          title: 'Error',
          description: 'Failed to update question',
          variant: 'destructive',
        });
        return false;
      }
    },
    [isInstructor, toast]
  );

  /**
   * Mark question as resolved (instructor only)
   */
  const resolveQuestion = useCallback(
    async (questionId: string, resolved: boolean): Promise<boolean> => {
      if (!isInstructor) return false;

      try {
        const { error: updateError } = await supabase
          .from('classroom_questions')
          .update({ is_resolved: resolved })
          .eq('id', questionId);

        if (updateError) throw updateError;
        return true;
      } catch (err) {
        logger.error('Failed to resolve question', { error: err });
        return false;
      }
    },
    [isInstructor]
  );

  /**
   * Subscribe to real-time question updates
   */
  const subscribeToQuestions = useCallback(() => {
    if (!sessionId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`questions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classroom_questions',
          filter: `session_id=eq.${sessionId}`,
        },
        payload => {
          logger.debug('Question change detected', { payload });
          fetchQuestions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_upvotes',
        },
        payload => {
          logger.debug('Upvote change detected', { payload });
          fetchQuestions();
        }
      )
      .subscribe(status => {
        logger.info('Questions realtime subscription status', { status });
      });

    channelRef.current = channel;
  }, [sessionId, fetchQuestions]);

  /**
   * Initialize
   */
  useEffect(() => {
    checkInstructorRole();
  }, [checkInstructorRole]);

  useEffect(() => {
    if (sessionId) {
      fetchQuestions();

      if (autoSubscribe) {
        subscribeToQuestions();
      }
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, autoSubscribe, fetchQuestions, subscribeToQuestions]);

  return {
    questions,
    loading,
    error,
    isInstructor,
    askQuestion,
    answerQuestion,
    upvoteQuestion,
    pinQuestion,
    resolveQuestion,
    refetch: fetchQuestions,
    unresolvedCount: questions.filter(q => !q.is_resolved).length,
    pinnedQuestions: questions.filter(q => q.is_pinned),
  };
};
