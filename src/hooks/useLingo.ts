/**
 * useLingo Hook
 * Main hook for AIBORGLingo functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { LingoService, LingoGradingService } from '@/services/lingo';
import type { LingoUserProgress, LessonStats, AnswerResult } from '@/types/lingo.types';

const LINGO_QUERY_KEYS = {
  lessons: ['lingo', 'lessons'],
  lesson: (id: string) => ['lingo', 'lesson', id],
  questions: (lessonId: string) => ['lingo', 'questions', lessonId],
  progress: (userId: string) => ['lingo', 'progress', userId],
  leaderboard: (period: string) => ['lingo', 'leaderboard', period],
};

export function useLingo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all lessons
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    error: lessonsError,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: LINGO_QUERY_KEYS.lessons,
    queryFn: LingoService.getLessons,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user progress
  const {
    data: userProgress,
    isLoading: progressLoading,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: user ? LINGO_QUERY_KEYS.progress(user.id) : ['lingo', 'progress', 'anonymous'],
    queryFn: async () => {
      if (user) {
        return LingoService.getUserProgress(user.id);
      }
      // Return anonymous progress from localStorage
      return LingoService.getAnonymousProgress();
    },
    enabled: true,
  });

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (stats: LessonStats) => {
      if (user) {
        return LingoService.completeLesson(user.id, stats);
      }
      // Update anonymous progress
      const currentProgress = LingoService.getAnonymousProgress() || {
        id: 'anonymous',
        user_id: 'anonymous',
        xp_today: 0,
        daily_goal: 50,
        hearts: 5,
        streak: 1,
        total_xp: 0,
        last_session_date: new Date().toISOString().split('T')[0],
        lesson_progress: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated: LingoUserProgress = {
        ...currentProgress,
        total_xp: currentProgress.total_xp + stats.xp_earned,
        xp_today: currentProgress.xp_today + stats.xp_earned,
        lesson_progress: {
          ...currentProgress.lesson_progress,
          [stats.lesson_id]: {
            completed: true,
            completed_at: new Date().toISOString(),
            best_score: stats.accuracy,
            attempts: 1,
            perfect: stats.perfect,
          },
        },
        updated_at: new Date().toISOString(),
      };

      LingoService.saveAnonymousProgress(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lingo', 'progress'] });
    },
  });

  // Lose heart mutation
  const loseHeartMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        return LingoService.loseHeart(user.id);
      }
      // Update anonymous progress
      const progress = LingoService.getAnonymousProgress();
      if (progress) {
        const newHearts = Math.max(0, progress.hearts - 1);
        LingoService.saveAnonymousProgress({ ...progress, hearts: newHearts });
        return newHearts;
      }
      return 4; // Default if no progress
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lingo', 'progress'] });
    },
  });

  // Merge anonymous progress on login
  useEffect(() => {
    if (user) {
      const anonymousProgress = LingoService.getAnonymousProgress();
      if (anonymousProgress && anonymousProgress.total_xp > 0) {
        LingoService.mergeAnonymousProgress(user.id).then(() => {
          refetchProgress();
        });
      }
    }
  }, [user, refetchProgress]);

  // Check if a lesson is completed
  const isLessonComplete = useCallback(
    (lessonId: string): boolean => {
      if (!userProgress) return false;
      return userProgress.lesson_progress?.[lessonId]?.completed || false;
    },
    [userProgress]
  );

  // Get lesson progress
  const getLessonProgress = useCallback(
    (lessonId: string) => {
      if (!userProgress) return null;
      return userProgress.lesson_progress?.[lessonId] || null;
    },
    [userProgress]
  );

  // Get completed lessons count
  const completedLessonsCount = userProgress
    ? Object.values(userProgress.lesson_progress || {}).filter(p => p.completed).length
    : 0;

  // Get XP info
  const xpInfo = {
    total: userProgress?.total_xp || 0,
    today: userProgress?.xp_today || 0,
    dailyGoal: userProgress?.daily_goal || 50,
    streak: userProgress?.streak || 0,
    hearts: userProgress?.hearts ?? 5,
  };

  return {
    // Data
    lessons,
    userProgress,
    xpInfo,
    completedLessonsCount,

    // Loading states
    isLoading: lessonsLoading || progressLoading,
    lessonsLoading,
    progressLoading,

    // Errors
    error: lessonsError,

    // Actions
    refetchLessons,
    refetchProgress,
    completeLesson: completeLessonMutation.mutateAsync,
    loseHeart: loseHeartMutation.mutateAsync,

    // Helpers
    isLessonComplete,
    getLessonProgress,
    isLoggedIn: !!user,
  };
}

/**
 * Hook for a single lesson and its questions
 */
export function useLingoLesson(lessonId: string) {
  // Fetch lesson
  const {
    data: lesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useQuery({
    queryKey: LINGO_QUERY_KEYS.lesson(lessonId),
    queryFn: () => LingoService.getLessonByLessonId(lessonId),
    enabled: !!lessonId,
  });

  // Fetch questions
  const {
    data: questions = [],
    isLoading: questionsLoading,
    error: questionsError,
  } = useQuery({
    queryKey: lesson ? LINGO_QUERY_KEYS.questions(lesson.id) : ['lingo', 'questions', 'none'],
    queryFn: () => (lesson ? LingoService.getQuestions(lesson.id) : []),
    enabled: !!lesson?.id,
  });

  return {
    lesson,
    questions,
    isLoading: lessonLoading || questionsLoading,
    error: lessonError || questionsError,
  };
}

/**
 * Hook for lesson player state management
 */
export function useLingoLessonPlayer(lessonId: string) {
  const { lesson, questions, isLoading, error } = useLingoLesson(lessonId);
  const { xpInfo, completeLesson, loseHeart } = useLingo();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerResult>>({});
  const [heartsRemaining, setHeartsRemaining] = useState(xpInfo.hearts);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when lesson changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setHeartsRemaining(xpInfo.hearts);
    setIsComplete(false);
  }, [lessonId, xpInfo.hearts]);

  // Current question
  const currentQuestion = questions[currentQuestionIndex] || null;

  // Grade answer
  const gradeAnswer = useCallback(
    (questionId: string, userAnswer: unknown): AnswerResult => {
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return { correct: false, score: 0, feedback: 'Question not found' };
      }

      const result = LingoGradingService.gradeQuestion(question, userAnswer);
      return result;
    },
    [questions]
  );

  // Submit answer
  const submitAnswer = useCallback(
    async (questionId: string, userAnswer: unknown) => {
      const result = gradeAnswer(questionId, userAnswer);

      // Store answer
      setAnswers(prev => ({ ...prev, [questionId]: result }));

      // Lose heart if wrong
      if (!result.correct) {
        const newHearts = await loseHeart();
        setHeartsRemaining(typeof newHearts === 'number' ? newHearts : heartsRemaining - 1);
      }

      return result;
    },
    [gradeAnswer, loseHeart, heartsRemaining]
  );

  // Go to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  // Complete the lesson
  const finishLesson = useCallback(async (): Promise<LessonStats | null> => {
    if (!lesson) return null;

    const correctAnswers = Object.values(answers).filter(a => a.correct).length;
    const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
    const perfect = correctAnswers === questions.length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const stats: LessonStats = {
      lesson_id: lesson.id,
      skill: lesson.skill,
      questions_total: questions.length,
      questions_correct: correctAnswers,
      accuracy: Math.round(accuracy),
      xp_earned: perfect ? Math.round(lesson.xp_reward * 1.2) : lesson.xp_reward,
      hearts_lost: xpInfo.hearts - heartsRemaining,
      time_spent_seconds: timeSpent,
      perfect,
    };

    await completeLesson(stats);
    setIsComplete(true);

    return stats;
  }, [lesson, answers, questions, startTime, xpInfo.hearts, heartsRemaining, completeLesson]);

  // Progress percentage
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Can proceed to next (has answered current)
  const hasAnsweredCurrent = currentQuestion ? !!answers[currentQuestion.id] : false;

  // Is last question
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return {
    // State
    lesson,
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    heartsRemaining,
    startTime,
    isComplete,
    progress,
    hasAnsweredCurrent,
    isLastQuestion,

    // Loading
    isLoading,
    error,

    // Actions
    submitAnswer,
    nextQuestion,
    finishLesson,
    gradeAnswer,
  };
}

/**
 * Hook for Lingo leaderboard
 */
export function useLingoLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'all_time') {
  const { user } = useAuth();

  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: LINGO_QUERY_KEYS.leaderboard(period),
    queryFn: () => LingoService.getLeaderboard(period),
    staleTime: 60 * 1000, // 1 minute
  });

  // Find user's position
  const userPosition = user ? entries.findIndex(e => e.user_id === user.id) + 1 : null;

  return {
    entries,
    userPosition,
    isLoading,
    error,
    refetch,
  };
}
