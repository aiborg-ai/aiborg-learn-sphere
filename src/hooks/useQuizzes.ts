import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAiborgPoints } from './useAiborgPoints';
import { calculateQuizPoints } from '@/config/gamification';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface Quiz {
  id: string;
  course_id: number;
  title: string;
  description?: string;
  instructions?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  time_limit_minutes?: number;
  passing_score_percentage: number;
  max_attempts: number;
  points_reward: number;
  is_published: boolean;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  points_value: number;
  explanation?: string;
  order_index: number;
  created_at: string;
  options?: QuizQuestionOption[];
}

export interface QuizQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
  score_earned: number;
  score_percentage: number;
  passed?: boolean;
  points_awarded: number;
  answers: Record<string, any>;
  attempt_number: number;
  created_at: string;
}

export function useQuizzes(courseId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { awardPoints } = useAiborgPoints();

  // Fetch quizzes for a course
  const {
    data: quizzes,
    isLoading: quizzesLoading,
    error: quizzesError,
  } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Quiz[];
    },
    enabled: !!courseId,
  });

  // Fetch quiz by ID with questions and options
  const useQuizDetail = (quizId?: string) => {
    return useQuery({
      queryKey: ['quiz-detail', quizId],
      queryFn: async () => {
        if (!quizId) return null;

        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;

        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select(`
            *,
            options:quiz_question_options(*)
          `)
          .eq('quiz_id', quizId)
          .order('order_index', { ascending: true });

        if (questionsError) throw questionsError;

        return {
          quiz: quiz as Quiz,
          questions: questions as QuizQuestion[],
        };
      },
      enabled: !!quizId,
    });
  };

  // Fetch user's attempts for a quiz
  const useQuizAttempts = (quizId?: string) => {
    return useQuery({
      queryKey: ['quiz-attempts', quizId, user?.id],
      queryFn: async () => {
        if (!quizId || !user) return [];

        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as QuizAttempt[];
      },
      enabled: !!quizId && !!user,
    });
  };

  // Start a new quiz attempt
  const startQuizMutation = useMutation({
    mutationFn: async ({ quizId }: { quizId: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Check previous attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (attempts?.[0]?.attempt_number || 0) + 1;

      // Get quiz to check max attempts
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('max_attempts')
        .eq('id', quizId)
        .single();

      if (quiz && quiz.max_attempts && attemptNumber > quiz.max_attempts) {
        throw new Error(`Maximum attempts (${quiz.max_attempts}) reached for this quiz`);
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          attempt_number: attemptNumber,
          answers: {},
          score_earned: 0,
          score_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuizAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', data.quiz_id, user?.id] });
      logger.log('Quiz attempt started:', data);
    },
    onError: (error: any) => {
      logger.error('Error starting quiz:', error);
      toast.error(error.message || 'Failed to start quiz');
    },
  });

  // Submit quiz attempt
  const submitQuizMutation = useMutation({
    mutationFn: async ({
      attemptId,
      answers,
      timeSpentSeconds,
    }: {
      attemptId: string;
      answers: Record<string, any>;
      timeSpentSeconds: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get the attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*, quiz:quizzes(*)')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Get quiz questions with correct answers
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          options:quiz_question_options(*)
        `)
        .eq('quiz_id', attempt.quiz_id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      questions.forEach((question: any) => {
        totalPoints += question.points_value;
        const userAnswer = answers[question.id];

        if (question.question_type === 'single_choice' || question.question_type === 'true_false') {
          const correctOption = question.options.find((o: any) => o.is_correct);
          if (userAnswer === correctOption?.id) {
            earnedPoints += question.points_value;
          }
        } else if (question.question_type === 'multiple_choice') {
          const correctOptions = question.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
          const isCorrect = correctOptions.length === userAnswers.length &&
            correctOptions.every((id: string) => userAnswers.includes(id));
          if (isCorrect) {
            earnedPoints += question.points_value;
          }
        }
      });

      const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const quiz = attempt.quiz as any;
      const passed = scorePercentage >= quiz.passing_score_percentage;
      const isPerfectScore = scorePercentage === 100;
      const isFirstAttempt = attempt.attempt_number === 1;

      // Calculate AIBORG points
      const aiborgPoints = passed
        ? calculateQuizPoints(quiz.points_reward, scorePercentage, isPerfectScore, isFirstAttempt)
        : 0;

      // Update attempt
      const { data: updatedAttempt, error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          completed_at: new Date().toISOString(),
          time_spent_seconds: timeSpentSeconds,
          score_earned: earnedPoints,
          score_percentage: scorePercentage,
          passed,
          points_awarded: aiborgPoints,
          answers,
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Award points if passed
      if (passed && aiborgPoints > 0) {
        awardPoints({
          points: aiborgPoints,
          sourceType: 'quiz',
          sourceId: quiz.id,
          description: `Completed quiz: ${quiz.title}`,
          metadata: { score_percentage: scorePercentage, attempt_number: attempt.attempt_number },
        });
      }

      return updatedAttempt as QuizAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', data.quiz_id, user?.id] });

      if (data.passed) {
        toast.success(`✅ Quiz Passed! Score: ${data.score_percentage.toFixed(1)}%`, {
          description: `You earned ${data.points_awarded} AIBORG points!`,
        });
      } else {
        toast.info(`Quiz Completed. Score: ${data.score_percentage.toFixed(1)}%`, {
          description: `You need ${data.quiz?.passing_score_percentage}% to pass.`,
        });
      }

      logger.log('Quiz submitted:', data);
    },
    onError: (error) => {
      logger.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    },
  });

  return {
    // Data
    quizzes,

    // Loading states
    quizzesLoading,
    isStarting: startQuizMutation.isPending,
    isSubmitting: submitQuizMutation.isPending,

    // Errors
    quizzesError,

    // Mutations
    startQuiz: startQuizMutation.mutate,
    submitQuiz: submitQuizMutation.mutate,

    // Hooks for specific quiz
    useQuizDetail,
    useQuizAttempts,
  };
}
