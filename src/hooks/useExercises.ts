import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAiborgPoints } from './useAiborgPoints';
import { calculateExercisePoints } from '@/config/gamification';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface Exercise {
  id: string;
  course_id: number;
  title: string;
  description: string;
  instructions: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time_minutes?: number;
  rubric?: Record<string, unknown>;
  allowed_file_types: string[];
  max_file_size_mb: number;
  points_reward: number;
  auto_grade: boolean;
  test_cases?: Record<string, unknown>;
  is_published: boolean;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSubmission {
  id: string;
  exercise_id: string;
  user_id: string;
  submission_text?: string;
  file_urls?: string[];
  code_content?: string;
  programming_language?: string;
  submitted_at: string;
  status: 'draft' | 'submitted' | 'grading' | 'graded' | 'returned';
  score_earned?: number;
  score_percentage?: number;
  passed?: boolean;
  points_awarded: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  auto_grade_results?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useExercises(courseId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { awardPoints } = useAiborgPoints();

  // Fetch exercises for a course
  const {
    data: exercises,
    isLoading: exercisesLoading,
    error: exercisesError,
  } = useQuery({
    queryKey: ['exercises', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Exercise[];
    },
    enabled: !!courseId,
  });

  // Fetch exercise by ID
  const useExerciseDetail = (exerciseId?: string) => {
    return useQuery({
      queryKey: ['exercise-detail', exerciseId],
      queryFn: async () => {
        if (!exerciseId) return null;

        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', exerciseId)
          .single();

        if (error) throw error;
        return data as Exercise;
      },
      enabled: !!exerciseId,
    });
  };

  // Fetch user's submissions for an exercise
  const useExerciseSubmissions = (exerciseId?: string) => {
    return useQuery({
      queryKey: ['exercise-submissions', exerciseId, user?.id],
      queryFn: async () => {
        if (!exerciseId || !user) return [];

        const { data, error } = await supabase
          .from('exercise_submissions')
          .select('*')
          .eq('exercise_id', exerciseId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ExerciseSubmission[];
      },
      enabled: !!exerciseId && !!user,
    });
  };

  // Create or update submission (draft)
  const saveSubmissionMutation = useMutation({
    mutationFn: async ({
      exerciseId,
      submissionText,
      fileUrls,
      codeContent,
      programmingLanguage,
      submissionId,
    }: {
      exerciseId: string;
      submissionText?: string;
      fileUrls?: string[];
      codeContent?: string;
      programmingLanguage?: string;
      submissionId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const submissionData = {
        exercise_id: exerciseId,
        user_id: user.id,
        submission_text: submissionText,
        file_urls: fileUrls,
        code_content: codeContent,
        programming_language: programmingLanguage,
        status: 'draft' as const,
      };

      if (submissionId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('exercise_submissions')
          .update({
            ...submissionData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', submissionId)
          .select()
          .single();

        if (error) throw error;
        return data as ExerciseSubmission;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('exercise_submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;
        return data as ExerciseSubmission;
      }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exercise-submissions', data.exercise_id, user?.id],
      });
      toast.success('Draft saved successfully');
      logger.log('Exercise draft saved:', data);
    },
    onError: error => {
      logger.error('Error saving exercise draft:', error);
      toast.error('Failed to save draft');
    },
  });

  // Submit exercise
  const submitExerciseMutation = useMutation({
    mutationFn: async ({ submissionId }: { submissionId: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('exercise_submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data as ExerciseSubmission;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exercise-submissions', data.exercise_id, user?.id],
      });
      toast.success('Exercise submitted successfully', {
        description: 'Your instructor will review your submission',
      });
      logger.log('Exercise submitted:', data);
    },
    onError: error => {
      logger.error('Error submitting exercise:', error);
      toast.error('Failed to submit exercise');
    },
  });

  // Grade submission (instructor/admin)
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      scorePercentage,
      feedback,
      passed,
    }: {
      submissionId: string;
      scorePercentage: number;
      feedback: string;
      passed: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get submission and exercise
      const { data: submission, error: submissionError } = await supabase
        .from('exercise_submissions')
        .select('*, exercise:exercises(*)')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      const exercise = submission.exercise as Exercise;
      const isPerfectScore = scorePercentage === 100;

      // Early submission detection: submitted in less than 75% of estimated time
      let isEarlySubmission = false;
      if (exercise.estimated_time_minutes && submission.created_at && submission.submitted_at) {
        const createdTime = new Date(submission.created_at).getTime();
        const submittedTime = new Date(submission.submitted_at).getTime();
        const timeTakenMinutes = (submittedTime - createdTime) / (1000 * 60);
        const estimatedMinutes = exercise.estimated_time_minutes;

        // Consider it "early" if completed in less than 75% of estimated time
        isEarlySubmission = timeTakenMinutes < estimatedMinutes * 0.75;
      }

      // Calculate AIBORG points
      const aiborgPoints = passed
        ? calculateExercisePoints(
            exercise.points_reward,
            scorePercentage,
            isPerfectScore,
            isEarlySubmission
          )
        : 0;

      // Update submission
      const { data, error } = await supabase
        .from('exercise_submissions')
        .update({
          status: 'graded',
          score_percentage: scorePercentage,
          passed,
          points_awarded: aiborgPoints,
          feedback,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      // Award points if passed
      if (passed && aiborgPoints > 0) {
        awardPoints({
          points: aiborgPoints,
          sourceType: 'exercise',
          sourceId: exercise.id,
          description: `Exercise graded: ${exercise.title}`,
          metadata: { score_percentage: scorePercentage },
        });
      }

      return data as ExerciseSubmission;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['exercise-submissions', data.exercise_id] });
      toast.success('Exercise graded successfully');
      logger.log('Exercise graded:', data);
    },
    onError: error => {
      logger.error('Error grading exercise:', error);
      toast.error('Failed to grade exercise');
    },
  });

  return {
    // Data
    exercises,

    // Loading states
    exercisesLoading,
    isSaving: saveSubmissionMutation.isPending,
    isSubmitting: submitExerciseMutation.isPending,
    isGrading: gradeSubmissionMutation.isPending,

    // Errors
    exercisesError,

    // Mutations
    saveSubmission: saveSubmissionMutation.mutate,
    submitExercise: submitExerciseMutation.mutate,
    gradeSubmission: gradeSubmissionMutation.mutate,

    // Hooks for specific exercise
    useExerciseDetail,
    useExerciseSubmissions,
  };
}
