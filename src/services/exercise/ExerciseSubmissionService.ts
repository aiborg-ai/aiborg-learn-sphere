/**
 * Exercise Submission Service
 * Handles exercise submissions, grading, and code execution
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  ExerciseSubmission,
  CreateSubmissionInput,
  GradeSubmissionInput,
  SubmitExerciseResult,
  TestResult,
  CodeExecutionResult,
} from './types';

export class ExerciseSubmissionService {
  /**
   * Create or update a draft submission
   */
  static async saveSubmission(input: CreateSubmissionInput): Promise<ExerciseSubmission> {
    try {
      // Check if draft already exists
      const { data: existing } = await supabase
        .from('exercise_submissions')
        .select('id')
        .eq('exercise_id', input.exercise_id)
        .eq('user_id', input.user_id)
        .eq('status', 'draft')
        .single();

      let data: ExerciseSubmission;

      if (existing) {
        // Update existing draft
        const { data: updated, error } = await supabase
          .from('exercise_submissions')
          .update({
            submission_text: input.submission_text,
            code_submission: input.code_submission,
            file_urls: input.file_urls,
            github_repo_url: input.github_repo_url,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        data = updated;
      } else {
        // Create new draft
        const { data: created, error } = await supabase
          .from('exercise_submissions')
          .insert({
            ...input,
            status: 'draft',
            revision_count: 0,
          })
          .select()
          .single();

        if (error) throw error;
        data = created;
      }

      logger.info('Exercise submission saved', { submissionId: data.id });
      return data as ExerciseSubmission;
    } catch {
      logger.error('Failed to save submission', { error, input });
      throw error;
    }
  }

  /**
   * Submit exercise for grading
   */
  static async submitExercise(submissionId: string): Promise<SubmitExerciseResult> {
    try {
      // Get submission and exercise details
      const { data: submission, error: subError } = await supabase
        .from('exercise_submissions')
        .select('*, exercises(*)')
        .eq('id', submissionId)
        .single();

      if (subError) throw subError;

      const exercise = (submission as ExerciseSubmission & { exercises: Exercise }).exercises;

      // Check if auto-grading is possible (coding exercise with test cases)
      let testResults: TestResult[] | undefined;
      let score: number | undefined;
      let autoGraded = false;

      if (exercise.exercise_type === 'coding' && exercise.test_cases) {
        try {
          const codeResults = await this.runCodeTests(
            submission.code_submission || '',
            exercise.test_cases
          );

          testResults = codeResults.test_results;
          score = testResults ? this.calculateTestScore(testResults) : undefined;
          autoGraded = true;
        } catch {
          logger.error('Code execution failed', { error });
          testResults = undefined;
        }
      }

      // Determine status
      const status =
        autoGraded && score !== undefined
          ? score >= 70
            ? 'passed'
            : 'needs_revision'
          : 'submitted';

      // Update submission
      const { data: _updated, error: updateError } = await supabase
        .from('exercise_submissions')
        .update({
          status,
          submitted_at: new Date().toISOString(),
          test_results: testResults,
          score,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Award points if passed
      let pointsEarned = 0;
      if (status === 'passed') {
        pointsEarned = await this.awardPoints(
          submission.user_id,
          submissionId,
          exercise.points_reward
        );
      }

      logger.info('Exercise submitted', { submissionId, status, score, autoGraded });

      return {
        submission_id: submissionId,
        status: status as 'draft' | 'submitted' | 'graded' | 'needs_revision',
        test_results: testResults,
        score,
        points_earned: pointsEarned,
        auto_graded: autoGraded,
      };
    } catch {
      logger.error('Failed to submit exercise', { error, submissionId });
      throw error;
    }
  }

  /**
   * Run code tests (mock implementation - would integrate with code execution service)
   */
  private static async runCodeTests(
    code: string,
    testCases: TestCase[]
  ): Promise<CodeExecutionResult> {
    // This is a mock implementation
    // In production, this would call a code execution service (e.g., Judge0, Piston, or custom sandbox)

    try {
      const testResults: TestResult[] = testCases.map(testCase => ({
        test_name: testCase.name,
        passed: true, // Mock: would actually run code
        expected: testCase.expected_output,
        actual: testCase.expected_output, // Mock: would be actual output
        points_earned: testCase.points,
        execution_time_ms: Math.random() * 1000,
      }));

      return {
        success: true,
        output: 'Tests completed successfully',
        test_results: testResults,
        execution_time_ms: testResults.reduce((sum, t) => sum + (t.execution_time_ms || 0), 0),
      };
    } catch {
      return {
        success: false,
        error: 'Code execution failed',
        execution_time_ms: 0,
      };
    }
  }

  /**
   * Calculate score from test results
   */
  private static calculateTestScore(testResults: TestResult[]): number {
    const totalPoints = testResults.reduce((sum, t) => sum + (t.points_earned || 0), 0);
    const maxPoints = testResults.reduce((sum, t) => sum + (t.points_earned || 0), 0); // Would use max_points from test definition
    return maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
  }

  /**
   * Award points for completed exercise
   */
  private static async awardPoints(
    userId: string,
    submissionId: string,
    basePoints: number
  ): Promise<number> {
    try {
      const { error } = await supabase.from('learning_activity_points').insert({
        user_id: userId,
        activity_type: 'exercise',
        activity_id: submissionId,
        points_earned: basePoints,
        reason: 'Exercise completed successfully',
      });

      if (error) throw error;

      return basePoints;
    } catch {
      logger.error('Failed to award points', { error, userId, submissionId });
      return 0;
    }
  }

  /**
   * Grade a submission manually (for instructors)
   */
  static async gradeSubmission(input: GradeSubmissionInput): Promise<ExerciseSubmission> {
    try {
      const { submission_id, score, feedback, rubric_scores: _rubric_scores, graded_by } = input;

      // Determine status based on score
      const status = score >= 70 ? 'passed' : 'needs_revision';

      const { data, error } = await supabase
        .from('exercise_submissions')
        .update({
          score,
          feedback,
          status,
          graded_by,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submission_id)
        .select()
        .single();

      if (error) throw error;

      // Award points if passed
      if (status === 'passed') {
        const { data: submission } = await supabase
          .from('exercise_submissions')
          .select('user_id, exercises(points_reward)')
          .eq('id', submission_id)
          .single();

        if (submission) {
          await this.awardPoints(
            submission.user_id,
            submission_id,
            (submission as ExerciseSubmission & { exercises: Exercise }).exercises.points_reward
          );
        }
      }

      logger.info('Submission graded', { submissionId: submission_id, score, status });
      return data as ExerciseSubmission;
    } catch {
      logger.error('Failed to grade submission', { error, input });
      throw error;
    }
  }

  /**
   * Request revision
   */
  static async requestRevision(
    submissionId: string,
    feedback: string
  ): Promise<ExerciseSubmission> {
    try {
      const { data, error } = await supabase
        .from('exercise_submissions')
        .update({
          status: 'needs_revision',
          feedback,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      // Increment revision count
      await supabase.rpc('increment_revision_count', { submission_id: submissionId });

      logger.info('Revision requested', { submissionId });
      return data as ExerciseSubmission;
    } catch {
      logger.error('Failed to request revision', { error, submissionId });
      throw error;
    }
  }

  /**
   * Get submission by ID
   */
  static async getSubmission(submissionId: string): Promise<ExerciseSubmission> {
    try {
      const { data, error } = await supabase
        .from('exercise_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      return data as ExerciseSubmission;
    } catch {
      logger.error('Failed to get submission', { error, submissionId });
      throw error;
    }
  }

  /**
   * Get all submissions for an exercise (for instructors)
   */
  static async getExerciseSubmissions(
    exerciseId: string,
    status?: string
  ): Promise<ExerciseSubmission[]> {
    try {
      let query = supabase.from('exercise_submissions').select('*').eq('exercise_id', exerciseId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) throw error;

      return data as ExerciseSubmission[];
    } catch {
      logger.error('Failed to get exercise submissions', { error, exerciseId });
      throw error;
    }
  }

  /**
   * Get user's submissions for an exercise
   */
  static async getUserSubmissions(
    userId: string,
    exerciseId: string
  ): Promise<ExerciseSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as ExerciseSubmission[];
    } catch {
      logger.error('Failed to get user submissions', { error, userId, exerciseId });
      throw error;
    }
  }
}
