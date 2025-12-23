/**
 * Survey Service
 * Handles survey CRUD operations and response submission
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyTemplate,
  CreateSurveyRequest,
  CreateQuestionRequest,
  SubmitResponseRequest,
  SurveyAnalytics,
  QuestionAnalytics,
  SurveyResultsData,
  AudienceCategory,
} from './types';

export class SurveyService {
  // ============================================================
  // Survey CRUD
  // ============================================================

  /**
   * Get all surveys (admin)
   */
  static async getAllSurveys(): Promise<Survey[]> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch surveys:', error);
      throw error;
    }

    return (data || []) as unknown as Survey[];
  }

  /**
   * Get active surveys for public display
   */
  static async getActiveSurveys(): Promise<Survey[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch active surveys:', error);
      throw error;
    }

    return (data || []) as unknown as Survey[];
  }

  /**
   * Get survey by ID with questions
   */
  static async getSurveyWithQuestions(
    surveyId: string
  ): Promise<{ survey: Survey; questions: SurveyQuestion[] }> {
    const [surveyResult, questionsResult] = await Promise.all([
      supabase.from('surveys').select('*').eq('id', surveyId).single(),
      supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_index', { ascending: true }),
    ]);

    if (surveyResult.error) {
      logger.error('Failed to fetch survey:', surveyResult.error);
      throw surveyResult.error;
    }

    if (questionsResult.error) {
      logger.error('Failed to fetch questions:', questionsResult.error);
      throw questionsResult.error;
    }

    return {
      survey: surveyResult.data as unknown as Survey,
      questions: (questionsResult.data || []) as unknown as SurveyQuestion[],
    };
  }

  /**
   * Create a new survey
   */
  static async createSurvey(request: CreateSurveyRequest): Promise<Survey> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('surveys')
      .insert({
        title: request.title,
        description: request.description,
        target_category: request.target_category,
        starts_at: request.starts_at,
        ends_at: request.ends_at,
        max_responses: request.max_responses,
        allow_anonymous: request.allow_anonymous ?? true,
        show_results_publicly: request.show_results_publicly ?? false,
        created_by: user?.user?.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create survey:', error);
      throw error;
    }

    return data as unknown as Survey;
  }

  /**
   * Update survey
   */
  static async updateSurvey(
    surveyId: string,
    updates: Partial<CreateSurveyRequest & { status: string }>
  ): Promise<Survey> {
    const { data, error } = await supabase
      .from('surveys')
      .update(updates)
      .eq('id', surveyId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update survey:', error);
      throw error;
    }

    return data as unknown as Survey;
  }

  /**
   * Delete survey
   */
  static async deleteSurvey(surveyId: string): Promise<void> {
    const { error } = await supabase.from('surveys').delete().eq('id', surveyId);

    if (error) {
      logger.error('Failed to delete survey:', error);
      throw error;
    }
  }

  // ============================================================
  // Questions CRUD
  // ============================================================

  /**
   * Add question to survey
   */
  static async addQuestion(request: CreateQuestionRequest): Promise<SurveyQuestion> {
    const { data, error } = await supabase
      .from('survey_questions')
      .insert({
        survey_id: request.survey_id,
        question_text: request.question_text,
        question_type: request.question_type,
        options: request.options,
        is_required: request.is_required ?? true,
        order_index: request.order_index,
        metadata: request.metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add question:', error);
      throw error;
    }

    return data as unknown as SurveyQuestion;
  }

  /**
   * Update question
   */
  static async updateQuestion(
    questionId: string,
    updates: Partial<CreateQuestionRequest>
  ): Promise<SurveyQuestion> {
    const { data, error } = await supabase
      .from('survey_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update question:', error);
      throw error;
    }

    return data as unknown as SurveyQuestion;
  }

  /**
   * Delete question
   */
  static async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase.from('survey_questions').delete().eq('id', questionId);

    if (error) {
      logger.error('Failed to delete question:', error);
      throw error;
    }
  }

  /**
   * Reorder questions
   */
  static async reorderQuestions(
    surveyId: string,
    questionOrders: Array<{ id: string; order_index: number }>
  ): Promise<void> {
    const updates = questionOrders.map(q =>
      supabase.from('survey_questions').update({ order_index: q.order_index }).eq('id', q.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      logger.error('Failed to reorder questions:', errors[0].error);
      throw errors[0].error;
    }
  }

  // ============================================================
  // Response Submission
  // ============================================================

  /**
   * Start a survey response (creates response record)
   */
  static async startResponse(
    surveyId: string,
    category: AudienceCategory,
    email?: string
  ): Promise<SurveyResponse> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: surveyId,
        respondent_id: user?.user?.id || null,
        respondent_category: category,
        respondent_email: email,
        is_complete: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to start response:', error);
      throw error;
    }

    return data as unknown as SurveyResponse;
  }

  /**
   * Submit survey response with all answers
   */
  static async submitResponse(request: SubmitResponseRequest): Promise<SurveyResponse> {
    // Start response
    const response = await this.startResponse(
      request.survey_id,
      request.respondent_category,
      request.respondent_email
    );

    // Submit all answers
    const answerInserts = Object.entries(request.answers).map(([questionId, value]) => ({
      response_id: response.id,
      question_id: questionId,
      answer_value: value,
    }));

    if (answerInserts.length > 0) {
      const { error: answersError } = await supabase.from('survey_answers').insert(answerInserts);

      if (answersError) {
        logger.error('Failed to submit answers:', answersError);
        throw answersError;
      }
    }

    // Mark as complete
    const { data: updatedResponse, error: updateError } = await supabase
      .from('survey_responses')
      .update({
        is_complete: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', response.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to complete response:', updateError);
      throw updateError;
    }

    return updatedResponse as unknown as SurveyResponse;
  }

  // ============================================================
  // Analytics
  // ============================================================

  /**
   * Get survey analytics overview
   */
  static async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics | null> {
    const { data, error } = await supabase
      .from('survey_analytics')
      .select('*')
      .eq('survey_id', surveyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      logger.error('Failed to fetch analytics:', error);
      throw error;
    }

    return data as unknown as SurveyAnalytics;
  }

  /**
   * Get detailed question analytics
   */
  static async getQuestionAnalytics(surveyId: string): Promise<QuestionAnalytics[]> {
    // Get all questions
    const { data: questions, error: qError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index');

    if (qError) {
      logger.error('Failed to fetch questions for analytics:', qError);
      throw qError;
    }

    // Get all answers with response category
    const { data: answers, error: aError } = await supabase
      .from('survey_answers')
      .select(
        `
        *,
        survey_responses!inner(respondent_category, is_complete)
      `
      )
      .in(
        'question_id',
        (questions || []).map(q => q.id)
      );

    if (aError) {
      logger.error('Failed to fetch answers for analytics:', aError);
      throw aError;
    }

    // Process analytics for each question
    return (questions || []).map(question => {
      const questionAnswers = (answers || []).filter(
        a => a.question_id === question.id && a.survey_responses?.is_complete
      );

      const distribution: Record<string, number> = {};
      const byCategory: Record<AudienceCategory, Record<string, number>> = {
        professional: {},
        student: {},
        entrepreneur: {},
        career_changer: {},
      };

      for (const answer of questionAnswers) {
        const value = answer.answer_value;
        const category = answer.survey_responses?.respondent_category as AudienceCategory;

        // Handle different answer types
        if (Array.isArray(value)) {
          // Multiple choice
          for (const v of value) {
            const key = String(v);
            distribution[key] = (distribution[key] || 0) + 1;
            if (category) {
              byCategory[category][key] = (byCategory[category][key] || 0) + 1;
            }
          }
        } else {
          const key = String(value);
          distribution[key] = (distribution[key] || 0) + 1;
          if (category) {
            byCategory[category][key] = (byCategory[category][key] || 0) + 1;
          }
        }
      }

      return {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        total_answers: questionAnswers.length,
        answer_distribution: distribution,
        by_category: byCategory,
      } as QuestionAnalytics;
    });
  }

  /**
   * Get responses over time
   */
  static async getResponsesOverTime(
    surveyId: string,
    days: number = 30
  ): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('survey_responses')
      .select('completed_at')
      .eq('survey_id', surveyId)
      .eq('is_complete', true)
      .gte('completed_at', startDate.toISOString())
      .order('completed_at');

    if (error) {
      logger.error('Failed to fetch responses over time:', error);
      throw error;
    }

    // Group by date
    const counts: Record<string, number> = {};
    for (const response of data || []) {
      if (response.completed_at) {
        const date = response.completed_at.split('T')[0];
        counts[date] = (counts[date] || 0) + 1;
      }
    }

    // Fill in missing dates
    const result: Array<{ date: string; count: number }> = [];
    const current = new Date(startDate);
    const end = new Date();

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({ date: dateStr, count: counts[dateStr] || 0 });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Get full survey results data
   */
  static async getSurveyResults(surveyId: string): Promise<SurveyResultsData> {
    const [surveyData, analytics, questionAnalytics, responsesOverTime] = await Promise.all([
      this.getSurveyWithQuestions(surveyId),
      this.getSurveyAnalytics(surveyId),
      this.getQuestionAnalytics(surveyId),
      this.getResponsesOverTime(surveyId),
    ]);

    // Calculate category breakdown
    const totalResponses = analytics?.completed_responses || 0;
    const categoryBreakdown = [
      {
        category: 'professional' as AudienceCategory,
        count: analytics?.professional_responses || 0,
        percentage:
          totalResponses > 0
            ? ((analytics?.professional_responses || 0) / totalResponses) * 100
            : 0,
      },
      {
        category: 'student' as AudienceCategory,
        count: analytics?.student_responses || 0,
        percentage:
          totalResponses > 0 ? ((analytics?.student_responses || 0) / totalResponses) * 100 : 0,
      },
      {
        category: 'entrepreneur' as AudienceCategory,
        count: analytics?.entrepreneur_responses || 0,
        percentage:
          totalResponses > 0
            ? ((analytics?.entrepreneur_responses || 0) / totalResponses) * 100
            : 0,
      },
      {
        category: 'career_changer' as AudienceCategory,
        count: analytics?.career_changer_responses || 0,
        percentage:
          totalResponses > 0
            ? ((analytics?.career_changer_responses || 0) / totalResponses) * 100
            : 0,
      },
    ];

    return {
      survey: surveyData.survey,
      analytics: analytics || {
        survey_id: surveyId,
        title: surveyData.survey.title,
        status: surveyData.survey.status,
        total_responses: 0,
        completed_responses: 0,
        professional_responses: 0,
        student_responses: 0,
        entrepreneur_responses: 0,
        career_changer_responses: 0,
      },
      questions: questionAnalytics,
      responses_over_time: responsesOverTime,
      category_breakdown: categoryBreakdown,
    };
  }

  // ============================================================
  // Templates
  // ============================================================

  /**
   * Get all templates
   */
  static async getTemplates(): Promise<SurveyTemplate[]> {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name');

    if (error) {
      logger.error('Failed to fetch templates:', error);
      throw error;
    }

    return (data || []) as unknown as SurveyTemplate[];
  }

  /**
   * Create survey from template
   */
  static async createFromTemplate(
    templateId: string,
    title: string,
    description?: string
  ): Promise<Survey> {
    // Get template
    const { data: template, error: tError } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (tError) {
      logger.error('Failed to fetch template:', tError);
      throw tError;
    }

    // Create survey
    const survey = await this.createSurvey({
      title,
      description,
      target_category: (template as unknown as SurveyTemplate).category,
    });

    // Add questions from template
    const questions = (template as unknown as SurveyTemplate).questions || [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await this.addQuestion({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required,
        order_index: i,
        metadata: q.metadata,
      });
    }

    return survey;
  }
}
