/**
 * Custom React Query hooks for Exercise management
 * Provides data fetching, mutations, and state management for exercises
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExerciseService } from '@/services/exercise/ExerciseService';
import { ExerciseSubmissionService } from '@/services/exercise/ExerciseSubmissionService';
import type {
  CreateExerciseInput,
  UpdateExerciseInput,
  CreateSubmissionInput,
  GradeSubmissionInput,
} from '@/services/exercise/types';

// ============================================================================
// EXERCISE QUERIES
// ============================================================================

/**
 * Fetch all exercises for a course
 */
export const useExercisesByCourse = (courseId: number, publishedOnly = true) => {
  return useQuery({
    queryKey: ['exercises', 'course', courseId, publishedOnly],
    queryFn: () => ExerciseService.getExercisesByCourse(courseId, publishedOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch single exercise by ID
 */
export const useExercise = (exerciseId: string) => {
  return useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: () => ExerciseService.getExercise(exerciseId),
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch exercises with user's submission status
 */
export const useExercisesWithSubmissions = (courseId: number, userId: string) => {
  return useQuery({
    queryKey: ['exercises', 'course', courseId, 'user', userId],
    queryFn: () => ExerciseService.getExercisesWithSubmissions(courseId, userId),
    enabled: !!courseId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch user's exercise progress
 */
export const useExerciseProgress = (userId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ['exercise', exerciseId, 'progress', userId],
    queryFn: () => ExerciseService.getExerciseProgress(userId, exerciseId),
    enabled: !!userId && !!exerciseId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Fetch exercise statistics (for instructors)
 */
export const useExerciseStatistics = (exerciseId: string) => {
  return useQuery({
    queryKey: ['exercise', exerciseId, 'statistics'],
    queryFn: () => ExerciseService.getExerciseStatistics(exerciseId),
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// SUBMISSION QUERIES
// ============================================================================

/**
 * Fetch user's submission for an exercise
 */
export const useUserSubmission = (exerciseId: string, userId: string) => {
  return useQuery({
    queryKey: ['exercise', exerciseId, 'submission', userId],
    queryFn: () => ExerciseSubmissionService.getSubmission(exerciseId, userId),
    enabled: !!exerciseId && !!userId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Fetch all submissions for an exercise (instructor view)
 */
export const useExerciseSubmissions = (exerciseId: string) => {
  return useQuery({
    queryKey: ['exercise', exerciseId, 'submissions'],
    queryFn: () => ExerciseSubmissionService.getSubmissionsByExercise(exerciseId),
    enabled: !!exerciseId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Fetch student's performance across all exercises
 */
export const useStudentExercisePerformance = (userId: string, exerciseId: string) => {
  return useQuery({
    queryKey: ['exercise', exerciseId, 'performance', userId],
    queryFn: () => ExerciseSubmissionService.getStudentPerformance(userId, exerciseId),
    enabled: !!userId && !!exerciseId,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// EXERCISE MUTATIONS
// ============================================================================

/**
 * Create a new exercise
 */
export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateExerciseInput; userId: string }) =>
      ExerciseService.createExercise(input, userId),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['exercises', 'course', data.course_id] });
    },
  });
};

/**
 * Update an exercise
 */
export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateExerciseInput) => ExerciseService.updateExercise(input),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['exercise', data.id] });
      queryClient.invalidateQueries({ queryKey: ['exercises', 'course', data.course_id] });
    },
  });
};

/**
 * Delete an exercise
 */
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseId: string) => ExerciseService.deleteExercise(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
};

/**
 * Toggle exercise publish status
 */
export const useToggleExercisePublish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, isPublished }: { exerciseId: string; isPublished: boolean }) =>
      ExerciseService.togglePublish(exerciseId, isPublished),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['exercise', data.id] });
      queryClient.invalidateQueries({ queryKey: ['exercises', 'course', data.course_id] });
    },
  });
};

// ============================================================================
// SUBMISSION MUTATIONS
// ============================================================================

/**
 * Save or update a draft submission
 */
export const useSaveSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubmissionInput) => ExerciseSubmissionService.saveSubmission(input),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'submission', data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'progress', data.user_id],
      });
    },
  });
};

/**
 * Submit exercise for grading
 */
export const useSubmitExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) => ExerciseSubmissionService.submitExercise(submissionId),
    onSuccess: _result => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['exercise', 'submission'] });
      queryClient.invalidateQueries({ queryKey: ['exercise', 'progress'] });
    },
  });
};

/**
 * Grade a submission (instructor)
 */
export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GradeSubmissionInput) => ExerciseSubmissionService.gradeSubmission(input),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'submission', data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'submissions'],
      });
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'statistics'],
      });
    },
  });
};

/**
 * Request revision on a submission
 */
export const useRequestRevision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, feedback }: { submissionId: string; feedback: string }) =>
      ExerciseSubmissionService.requestRevision(submissionId, feedback),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'submission', data.user_id],
      });
    },
  });
};

/**
 * Mark submission as complete
 */
export const useCompleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) => ExerciseSubmissionService.markAsComplete(submissionId),
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'submission', data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['exercise', data.exercise_id, 'progress', data.user_id],
      });
    },
  });
};

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Check if user has completed an exercise
 */
export const useIsExerciseCompleted = (exerciseId: string, userId: string) => {
  const { data: progress } = useExerciseProgress(userId, exerciseId);
  return progress?.completed || false;
};

/**
 * Get best submission score
 */
export const useBestSubmissionScore = (exerciseId: string, userId: string) => {
  const { data: progress } = useExerciseProgress(userId, exerciseId);
  return progress?.best_score;
};

/**
 * Check if exercise allows more submissions
 */
export const useCanSubmit = (exerciseId: string, userId: string) => {
  const { data: submission } = useUserSubmission(exerciseId, userId);
  return !submission || submission.status === 'draft' || submission.status === 'needs_revision';
};
