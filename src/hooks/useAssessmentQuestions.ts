/**
 * useAssessmentQuestions Hook
 * CRUD operations for managing assessment questions in admin portal
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

export interface AssessmentQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  cognitive_level?: string;
  irt_difficulty: number;
  audience_filters: string[];
  help_text?: string;
  points_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id?: string;
  question_id?: string;
  option_text: string;
  option_value: string;
  points: number;
  is_correct: boolean;
  order_index: number;
}

export interface CreateQuestionInput {
  category_id: string;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  cognitive_level?: string;
  irt_difficulty: number;
  audience_filters: string[];
  help_text?: string;
  points_value: number;
  options: QuestionOption[];
}

/**
 * Fetch all assessment questions
 */
export function useAssessmentQuestions() {
  return useQuery({
    queryKey: ['assessment-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select(
          `
          *,
          assessment_categories (
            id,
            name
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single question with options
 */
export function useAssessmentQuestion(questionId: string) {
  return useQuery({
    queryKey: ['assessment-question', questionId],
    queryFn: async () => {
      // Fetch question
      const { data: question, error: questionError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (questionError) throw questionError;

      // Fetch options
      const { data: options, error: optionsError } = await supabase
        .from('assessment_question_options')
        .select('*')
        .eq('question_id', questionId)
        .order('order_index', { ascending: true });

      if (optionsError) throw optionsError;

      return { ...question, options };
    },
    enabled: !!questionId,
  });
}

/**
 * Create new question with options
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateQuestionInput) => {
      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('assessment_questions')
        .insert({
          category_id: input.category_id,
          question_text: input.question_text,
          question_type: input.question_type,
          difficulty_level: input.difficulty_level,
          cognitive_level: input.cognitive_level || 'understand',
          irt_difficulty: input.irt_difficulty,
          audience_filters: input.audience_filters,
          help_text: input.help_text,
          points_value: input.points_value,
          is_active: true,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert options
      if (input.options && input.options.length > 0) {
        const optionsToInsert = input.options.map(opt => ({
          question_id: question.id,
          option_text: opt.option_text,
          option_value: opt.option_value,
          points: opt.points,
          is_correct: opt.is_correct,
          order_index: opt.order_index,
        }));

        const { error: optionsError } = await supabase
          .from('assessment_question_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-questions'] });
      toast({
        title: 'Success',
        description: 'Question created successfully',
      });
    },
    onError: error => {
      logger.error('Error creating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to create question',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing question
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      questionId,
      input,
    }: {
      questionId: string;
      input: Partial<CreateQuestionInput>;
    }) => {
      // Update question
      const { data: question, error: questionError } = await supabase
        .from('assessment_questions')
        .update({
          category_id: input.category_id,
          question_text: input.question_text,
          question_type: input.question_type,
          difficulty_level: input.difficulty_level,
          cognitive_level: input.cognitive_level,
          irt_difficulty: input.irt_difficulty,
          audience_filters: input.audience_filters,
          help_text: input.help_text,
          points_value: input.points_value,
        })
        .eq('id', questionId)
        .select()
        .single();

      if (questionError) throw questionError;

      // Update options if provided
      if (input.options) {
        // Delete existing options
        await supabase.from('assessment_question_options').delete().eq('question_id', questionId);

        // Insert new options
        if (input.options.length > 0) {
          const optionsToInsert = input.options.map(opt => ({
            question_id: questionId,
            option_text: opt.option_text,
            option_value: opt.option_value,
            points: opt.points,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          }));

          const { error: optionsError } = await supabase
            .from('assessment_question_options')
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }
      }

      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-questions'] });
      toast({
        title: 'Success',
        description: 'Question updated successfully',
      });
    },
    onError: error => {
      logger.error('Error updating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to update question',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete question
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from('assessment_questions').delete().eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-questions'] });
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
    },
    onError: error => {
      logger.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Link question to assessment tool
 */
export function useLinkQuestionToTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      toolId,
      questionId,
      weight = 1.0,
    }: {
      toolId: string;
      questionId: string;
      weight?: number;
    }) => {
      const { error } = await supabase.from('assessment_question_pools').insert({
        tool_id: toolId,
        question_id: questionId,
        is_active: true,
        weight,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-tools'] });
      toast({
        title: 'Success',
        description: 'Question linked to tool successfully',
      });
    },
    onError: error => {
      logger.error('Error linking question to tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to link question to tool',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Unlink question from assessment tool
 */
export function useUnlinkQuestionFromTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ toolId, questionId }: { toolId: string; questionId: string }) => {
      const { error } = await supabase
        .from('assessment_question_pools')
        .delete()
        .eq('tool_id', toolId)
        .eq('question_id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-tools'] });
      toast({
        title: 'Success',
        description: 'Question unlinked from tool successfully',
      });
    },
    onError: error => {
      logger.error('Error unlinking question from tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlink question from tool',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Fetch assessment categories for dropdown
 */
export function useAssessmentCategories() {
  return useQuery({
    queryKey: ['assessment-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
