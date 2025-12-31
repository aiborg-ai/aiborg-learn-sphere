import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import type { AssessmentQuestion, RecommendedQuestion, ProfilingData } from '../types';

interface UseAssessmentQuestionsProps {
  profilingData: ProfilingData | null;
  selectedAudience: string;
  user: User | null;
  showProfiling: boolean;
  onAssessmentInitialized?: (assessmentId: string) => void;
}

interface UseAssessmentQuestionsReturn {
  questions: AssessmentQuestion[];
  loading: boolean;
  hasFetchedQuestions: boolean;
  fetchQuestions: () => Promise<void>;
}

const QUESTION_LIMIT = 10;
const FALLBACK_LIMIT = 20;

export const useAssessmentQuestions = ({
  profilingData,
  selectedAudience,
  user,
  showProfiling,
  onAssessmentInitialized,
}: UseAssessmentQuestionsProps): UseAssessmentQuestionsReturn => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetchedQuestions, setHasFetchedQuestions] = useState(false);
  const { toast } = useToast();

  const initializeAssessment = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_ai_assessments')
        .insert({
          user_id: user.id,
          audience_type: selectedAudience === 'All' ? null : selectedAudience,
          profiling_data: profilingData || {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data && onAssessmentInitialized) {
        onAssessmentInitialized(data.id);
      }
    } catch (_error) {
      logger._error('Error initializing assessment:', _error);
    }
  };

  const fetchQuestionsBasic = async () => {
    const { data: questionsData, error: questionsError } = await supabase
      .from('assessment_questions')
      .select(
        `
        *,
        assessment_question_options (
          id,
          option_text,
          option_value,
          points,
          description,
          tool_recommendations,
          is_correct,
          order_index
        ),
        assessment_categories (
          name,
          icon
        )
      `
      )
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    const mappedQuestions: AssessmentQuestion[] = (questionsData || []).map(q => ({
      id: q.id,
      category_id: q.category_id,
      question_text: q.question_text,
      question_type: q.question_type,
      help_text: q.help_text,
      order_index: q.order_index,
      points_value: q.points_value,
      difficulty_level: q.difficulty_level,
      recommended_experience_level: q.recommended_experience_level,
      options: q.assessment_question_options?.sort((a, b) => a.order_index - b.order_index),
      category: q.assessment_categories,
    }));

    setQuestions(mappedQuestions.slice(0, FALLBACK_LIMIT));

    if (user) {
      await initializeAssessment();
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      // Use the recommendation function to get personalized questions
      const { data: recommendedQuestions, error: recommendationError } = await supabase.rpc(
        'get_recommended_questions',
        {
          p_audience_type: profilingData?.audience_type || selectedAudience || 'professional',
          p_experience_level: profilingData?.experience_level || 'basic',
          p_goals: profilingData?.goals || [],
          p_limit: QUESTION_LIMIT,
        }
      );

      if (recommendationError) {
        logger.error('Recommendation function error:', recommendationError);
        throw recommendationError;
      }

      if (!recommendedQuestions || recommendedQuestions.length === 0) {
        logger.warn('No recommended questions returned, falling back to all questions');
        // Fallback to fetching all questions if recommendation fails
        await fetchQuestionsBasic();
        return;
      }

      // Extract question IDs from recommendations
      const questionIds = recommendedQuestions.map((q: RecommendedQuestion) => q.question_id);

      // Fetch full question details with options
      const { data: questionsData, error: detailsError } = await supabase
        .from('assessment_questions')
        .select(
          `
          *,
          assessment_question_options (
            id,
            option_text,
            option_value,
            points,
            description,
            tool_recommendations,
            is_correct,
            order_index
          ),
          assessment_categories (
            name,
            icon
          )
        `
        )
        .in('id', questionIds)
        .eq('is_active', true);

      if (detailsError) throw detailsError;

      // Map and sort questions by the recommendation order
      const mappedQuestions: AssessmentQuestion[] = (questionsData || [])
        .map(q => ({
          id: q.id,
          category_id: q.category_id,
          question_text: q.question_text,
          question_type: q.question_type,
          help_text: q.help_text,
          order_index: q.order_index,
          points_value: q.points_value,
          difficulty_level: q.difficulty_level,
          recommended_experience_level: q.recommended_experience_level,
          options: q.assessment_question_options?.sort((a, b) => a.order_index - b.order_index),
          category: q.assessment_categories,
        }))
        .sort((a, b) => {
          // Sort by relevance score from recommendations
          const aIndex = questionIds.indexOf(a.id);
          const bIndex = questionIds.indexOf(b.id);
          return aIndex - bIndex;
        });

      // Deduplicate questions by ID (in case of database duplicates)
      const uniqueQuestions = Array.from(new Map(mappedQuestions.map(q => [q.id, q])).values());

      setQuestions(uniqueQuestions);
      setHasFetchedQuestions(true);

      // Initialize assessment if user is logged in
      if (user) {
        await initializeAssessment();
      }
    } catch (_error) {
      logger._error('Error fetching questions:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions based on audience - only when profiling is complete
  useEffect(() => {
    if (!showProfiling && profilingData && !hasFetchedQuestions) {
      fetchQuestions();
    }
    // Dependencies intentionally limited to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfiling, profilingData, selectedAudience]);

  return {
    questions,
    loading,
    hasFetchedQuestions,
    fetchQuestions,
  };
};
