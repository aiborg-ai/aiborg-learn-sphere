/**
 * useQuiz Hook
 * Custom React hooks for quiz data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuizService, QuizAttemptService } from '@/services/quiz';
import type { StartQuizInput, SubmitQuizAnswerInput } from '@/services/quiz/types';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

/**
 * Fetch quiz banks for a course
 */
export function useQuizzesByCourse(courseId: number, publishedOnly = true) {
  return useQuery({
    queryKey: ['quizzes', courseId, publishedOnly],
    queryFn: () => QuizService.getQuizBanksByCourse(courseId, publishedOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single quiz with questions and options
 */
export function useQuiz(quizBankId: string | undefined, includeOptions = true) {
  return useQuery({
    queryKey: ['quiz', quizBankId, includeOptions],
    queryFn: () => QuizService.getQuizBank(quizBankId!, includeOptions),
    enabled: !!quizBankId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch student's progress on a quiz
 */
export function useQuizProgress(userId: string | undefined, quizBankId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-progress', userId, quizBankId],
    queryFn: () => QuizService.getStudentProgress(userId!, quizBankId!),
    enabled: !!userId && !!quizBankId,
  });
}

/**
 * Fetch quiz statistics (for instructors)
 */
export function useQuizStatistics(quizBankId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-statistics', quizBankId],
    queryFn: () => QuizService.getQuizStatistics(quizBankId!),
    enabled: !!quizBankId,
  });
}

/**
 * Start a new quiz attempt
 */
export function useStartQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: StartQuizInput) => QuizAttemptService.startQuiz(input),
    onSuccess: (data, variables) => {
      logger.info('Quiz started', { attemptId: data.id });

      // Invalidate progress queries
      queryClient.invalidateQueries({
        queryKey: ['quiz-progress', variables.user_id, variables.quiz_bank_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['quiz-attempts', variables.user_id, variables.quiz_bank_id],
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to start quiz', { error });
      toast({
        title: 'Error',
        description: error.message || 'Failed to start quiz. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Submit an answer to a quiz question
 */
export function useSubmitQuizAnswer() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: SubmitQuizAnswerInput) => QuizAttemptService.submitAnswer(input),
    onError: (error: Error) => {
      logger.error('Failed to submit answer', { error });
      toast({
        title: 'Error',
        description: 'Failed to save your answer. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Complete a quiz and get results
 */
export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (attemptId: string) => QuizAttemptService.completeQuiz(attemptId),
    onSuccess: data => {
      logger.info('Quiz completed', { attemptId: data.attempt_id, passed: data.passed });

      toast({
        title: data.passed ? '🎉 Quiz Passed!' : 'Quiz Completed',
        description: `Score: ${data.score}/${data.total_points} (${data.percentage}%) - ${data.points_awarded} points earned`,
        variant: data.passed ? 'default' : 'destructive',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
    },
    onError: (error: Error) => {
      logger.error('Failed to complete quiz', { error });
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Fetch a quiz attempt with details
 */
export function useQuizAttempt(attemptId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: () => QuizAttemptService.getAttempt(attemptId!),
    enabled: !!attemptId,
  });
}

/**
 * Fetch all attempts for a user on a quiz
 */
export function useQuizAttempts(userId: string | undefined, quizBankId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-attempts', userId, quizBankId],
    queryFn: () => QuizAttemptService.getUserAttempts(userId!, quizBankId!),
    enabled: !!userId && !!quizBankId,
  });
}

/**
 * Fetch comprehensive student performance
 */
export function useStudentQuizPerformance(
  userId: string | undefined,
  quizBankId: string | undefined
) {
  return useQuery({
    queryKey: ['student-performance', userId, quizBankId],
    queryFn: () => QuizAttemptService.getStudentPerformance(userId!, quizBankId!),
    enabled: !!userId && !!quizBankId,
  });
}

/**
 * Abandon a quiz
 */
export function useAbandonQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (attemptId: string) => QuizAttemptService.abandonQuiz(attemptId),
    onSuccess: () => {
      toast({
        title: 'Quiz Abandoned',
        description: 'You can start a new attempt later.',
      });

      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
  });
}

/**
 * Create a new quiz bank (for instructors)
 */
export function useCreateQuizBank() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ input, userId }: { input: Record<string, unknown>; userId: string }) =>
      QuizService.createQuizBank(input, userId),
    onSuccess: data => {
      toast({
        title: 'Success',
        description: 'Quiz bank created successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['quizzes', data.course_id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create quiz bank',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update quiz bank (for instructors)
 */
export function useUpdateQuizBank() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: Record<string, unknown>) => QuizService.updateQuizBank(input),
    onSuccess: data => {
      toast({
        title: 'Success',
        description: 'Quiz updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['quiz', data.id] });
      queryClient.invalidateQueries({ queryKey: ['quizzes', data.course_id] });
    },
    onError: (_error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to update quiz',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete quiz bank (for instructors)
 */
export function useDeleteQuizBank() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (quizBankId: string) => QuizService.deleteQuizBank(quizBankId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Quiz deleted successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (_error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete quiz',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Toggle quiz publish status
 */
export function useToggleQuizPublish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ quizBankId, isPublished }: { quizBankId: string; isPublished: boolean }) =>
      QuizService.togglePublish(quizBankId, isPublished),
    onSuccess: data => {
      toast({
        title: 'Success',
        description: `Quiz ${data.is_published ? 'published' : 'unpublished'} successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['quiz', data.id] });
      queryClient.invalidateQueries({ queryKey: ['quizzes', data.course_id] });
    },
  });
}
