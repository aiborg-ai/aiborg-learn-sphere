/**
 * Wrong Answer Explanation Service
 * Provides AI-powered explanations for incorrect answers
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { OpenRouterService } from '@/services/llm';

// Question types supported
export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'free_response';

// Learning styles for personalized explanations
export type LearningStyle = 'visual' | 'analytical' | 'conceptual' | 'example-based';

// Explanation request
export interface ExplanationRequest {
  userId: string;
  questionId: string;
  questionType: QuestionType;
  questionText: string;
  userAnswer: unknown;
  correctAnswer: unknown;
  hint?: string;
  topic?: string;
  difficulty?: string;
  learningStyle?: LearningStyle;
}

// Explanation response
export interface ExplanationResponse {
  explanation: string;
  keyTakeaway: string;
  suggestions: string[];
  cached: boolean;
  model?: string;
  tokensUsed?: number;
}

// System prompts for different question types
const SYSTEM_PROMPTS: Record<QuestionType, string> = {
  multiple_choice: `You are an encouraging AI tutor helping students understand why their answer was incorrect.

For multiple choice questions, you should:
1. Acknowledge the student's thinking (find something valid in their choice if possible)
2. Explain clearly why the chosen answer is incorrect
3. Explain why the correct answer is right
4. Provide a memorable tip or mnemonic if helpful
5. Keep the tone supportive and encouraging

Format your response as JSON:
{
  "explanation": "Your detailed explanation here",
  "keyTakeaway": "One sentence summary of the key concept",
  "suggestions": ["Suggestion 1 for improvement", "Suggestion 2"]
}`,

  fill_blank: `You are an encouraging AI tutor helping students understand fill-in-the-blank questions.

When a student's answer is incorrect, you should:
1. Note the difference between their answer and the correct one
2. Explain the correct term/concept
3. Provide memory aids (mnemonics, associations)
4. Suggest ways to remember similar concepts

Format your response as JSON:
{
  "explanation": "Your detailed explanation here",
  "keyTakeaway": "One sentence summary of the key concept",
  "suggestions": ["Memory tip 1", "Practice suggestion"]
}`,

  matching: `You are an encouraging AI tutor helping students understand matching questions.

When pairs are incorrectly matched, you should:
1. Point out which pairs were wrong
2. Explain the relationship between correctly matched items
3. Help students see the patterns or connections
4. Provide tips for remembering associations

Format your response as JSON:
{
  "explanation": "Your detailed explanation of the correct relationships",
  "keyTakeaway": "Key principle for matching these concepts",
  "suggestions": ["Pattern to remember", "Association technique"]
}`,

  ordering: `You are an encouraging AI tutor helping students understand ordering/sequencing questions.

When the order is incorrect, you should:
1. Show the correct sequence
2. Explain the logic behind the order (dependencies, chronology, etc.)
3. Highlight key transition points
4. Provide tips for remembering the sequence

Format your response as JSON:
{
  "explanation": "Your explanation of the correct order and why",
  "keyTakeaway": "Key principle for this sequence",
  "suggestions": ["Ordering strategy", "Memory technique"]
}`,

  free_response: `You are an encouraging AI tutor providing feedback on free response answers.

When reviewing a student's response, you should:
1. Acknowledge what they got right
2. Identify missing key points
3. Clarify any misconceptions
4. Suggest how to strengthen their answer
5. Be constructive and encouraging

Format your response as JSON:
{
  "explanation": "Your detailed feedback comparing their answer to the ideal",
  "keyTakeaway": "Main concept they should focus on",
  "suggestions": ["How to improve", "Additional resource to review"]
}`,
};

// Build user prompt based on question type
function buildUserPrompt(request: ExplanationRequest): string {
  const base = `Question: ${request.questionText}

Student's Answer: ${JSON.stringify(request.userAnswer)}
Correct Answer: ${JSON.stringify(request.correctAnswer)}`;

  const context = [];
  if (request.topic) context.push(`Topic: ${request.topic}`);
  if (request.difficulty) context.push(`Difficulty: ${request.difficulty}`);
  if (request.hint) context.push(`Hint that was available: ${request.hint}`);

  const contextStr = context.length > 0 ? `\n\nContext:\n${context.join('\n')}` : '';

  const styleGuide = request.learningStyle
    ? `\n\nLearning Style Preference: ${request.learningStyle}. Tailor your explanation accordingly.`
    : '';

  return base + contextStr + styleGuide;
}

// Generate cache key for explanation
function generateExplanationCacheKey(request: ExplanationRequest): string {
  // Normalize the answer for caching (handles slight variations)
  const normalizedAnswer =
    typeof request.userAnswer === 'string'
      ? request.userAnswer.toLowerCase().trim()
      : JSON.stringify(request.userAnswer);

  return `explanation_${request.questionId}_${normalizedAnswer.slice(0, 50)}_${request.learningStyle || 'default'}`;
}

/**
 * Wrong Answer Explanation Service
 */
export class WrongAnswerExplanationService {
  /**
   * Generate explanation for a wrong answer
   */
  static async generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    try {
      // Check if OpenRouter is configured
      if (!OpenRouterService.isConfigured()) {
        return this.getFallbackExplanation(request);
      }

      // Generate cache key
      const cacheKey = generateExplanationCacheKey(request);

      // Check explanation cache first
      const cachedExplanation = await this.checkExplanationCache(
        request.questionId,
        request.userAnswer,
        request.learningStyle
      );

      if (cachedExplanation) {
        return {
          explanation: cachedExplanation.explanation,
          keyTakeaway: cachedExplanation.keyTakeaway || '',
          suggestions: cachedExplanation.suggestions || [],
          cached: true,
        };
      }

      // Build messages
      const systemPrompt = SYSTEM_PROMPTS[request.questionType];
      const userPrompt = buildUserPrompt(request);

      // Call OpenRouter
      const response = await OpenRouterService.generateForUseCase(
        'explanation',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          cacheKey,
        }
      );

      // Parse response
      let parsedResponse: { explanation: string; keyTakeaway: string; suggestions: string[] };
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback if no JSON found
          parsedResponse = {
            explanation: response.content,
            keyTakeaway: '',
            suggestions: [],
          };
        }
      } catch {
        parsedResponse = {
          explanation: response.content,
          keyTakeaway: '',
          suggestions: [],
        };
      }

      // Save to explanation cache for future use
      await this.saveToExplanationCache(
        request.questionId,
        request.userAnswer,
        parsedResponse.explanation,
        request.learningStyle
      );

      // Log to user's explanation history
      await this.logExplanation(
        request,
        parsedResponse.explanation,
        response.model,
        response.tokensUsed?.total
      );

      return {
        explanation: parsedResponse.explanation,
        keyTakeaway: parsedResponse.keyTakeaway,
        suggestions: parsedResponse.suggestions,
        cached: response.cached,
        model: response.model,
        tokensUsed: response.tokensUsed?.total,
      };
    } catch (error) {
      logger.error('Error generating explanation:', error);
      return this.getFallbackExplanation(request);
    }
  }

  /**
   * Rate an explanation (for improving quality)
   */
  static async rateExplanation(explanationId: string, rating: number): Promise<void> {
    try {
      await supabase.from('wrong_answer_explanations').update({ rating }).eq('id', explanationId);

      // Update avg_rating in cache if applicable
      const { data: explanation } = await supabase
        .from('wrong_answer_explanations')
        .select('cache_key')
        .eq('id', explanationId)
        .single();

      if (explanation?.cache_key) {
        // Update cache rating (calculate new average)
        const { data: cacheData } = await supabase
          .from('explanation_cache')
          .select('avg_rating, hit_count')
          .eq('cache_key', explanation.cache_key)
          .single();

        if (cacheData) {
          const currentAvg = cacheData.avg_rating || rating;
          const hitCount = cacheData.hit_count || 1;
          const newAvg = (currentAvg * hitCount + rating) / (hitCount + 1);

          await supabase
            .from('explanation_cache')
            .update({ avg_rating: newAvg })
            .eq('cache_key', explanation.cache_key);
        }
      }
    } catch (error) {
      logger.error('Error rating explanation:', error);
    }
  }

  /**
   * Get user's explanation history
   */
  static async getUserExplanationHistory(
    userId: string,
    limit: number = 20
  ): Promise<
    Array<{
      id: string;
      questionType: QuestionType;
      explanation: string;
      rating: number | null;
      createdAt: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('wrong_answer_explanations')
        .select('id, question_type, explanation_text, rating, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(e => ({
        id: e.id,
        questionType: e.question_type as QuestionType,
        explanation: e.explanation_text,
        rating: e.rating,
        createdAt: e.created_at,
      }));
    } catch (error) {
      logger.error('Error getting explanation history:', error);
      return [];
    }
  }

  /**
   * Check explanation cache
   */
  private static async checkExplanationCache(
    questionId: string,
    userAnswer: unknown,
    learningStyle?: LearningStyle
  ): Promise<{ explanation: string; keyTakeaway?: string; suggestions?: string[] } | null> {
    try {
      const normalizedAnswer =
        typeof userAnswer === 'string'
          ? userAnswer.toLowerCase().trim()
          : JSON.stringify(userAnswer);

      const { data, error } = await supabase
        .from('explanation_cache')
        .select('explanation_text, hit_count')
        .eq('question_id', questionId)
        .eq('wrong_answer_pattern', normalizedAnswer.slice(0, 255))
        .eq('learning_style', learningStyle || 'default')
        .single();

      if (error || !data) return null;

      // Update hit count
      await supabase
        .from('explanation_cache')
        .update({ hit_count: (data.hit_count || 0) + 1 })
        .eq('question_id', questionId)
        .eq('wrong_answer_pattern', normalizedAnswer.slice(0, 255));

      return { explanation: data.explanation_text };
    } catch {
      return null;
    }
  }

  /**
   * Save to explanation cache
   */
  private static async saveToExplanationCache(
    questionId: string,
    userAnswer: unknown,
    explanation: string,
    learningStyle?: LearningStyle
  ): Promise<void> {
    try {
      const normalizedAnswer =
        typeof userAnswer === 'string'
          ? userAnswer.toLowerCase().trim()
          : JSON.stringify(userAnswer);

      await supabase.from('explanation_cache').upsert(
        {
          question_id: questionId,
          wrong_answer_pattern: normalizedAnswer.slice(0, 255),
          explanation_text: explanation,
          learning_style: learningStyle || 'default',
          hit_count: 0,
        },
        { onConflict: 'question_id,wrong_answer_pattern,learning_style' }
      );
    } catch (error) {
      logger.error('Error saving to explanation cache:', error);
    }
  }

  /**
   * Log explanation to user history
   */
  private static async logExplanation(
    request: ExplanationRequest,
    explanation: string,
    model: string,
    tokensUsed?: number
  ): Promise<void> {
    try {
      await supabase.from('wrong_answer_explanations').insert({
        user_id: request.userId,
        question_id: request.questionId,
        question_type: request.questionType,
        user_answer: request.userAnswer,
        correct_answer: request.correctAnswer,
        explanation_text: explanation,
        explanation_style: request.learningStyle || 'default',
        model_used: model,
        tokens_used: tokensUsed,
        cache_key: generateExplanationCacheKey(request),
      });
    } catch (error) {
      logger.error('Error logging explanation:', error);
    }
  }

  /**
   * Get fallback explanation when AI is not available
   */
  private static getFallbackExplanation(request: ExplanationRequest): ExplanationResponse {
    const explanations: Record<QuestionType, string> = {
      multiple_choice: `The correct answer is: ${JSON.stringify(request.correctAnswer)}. Your answer was not correct. Review the question and try to understand why the correct answer is the best choice.`,
      fill_blank: `The correct answer is: ${JSON.stringify(request.correctAnswer)}. Pay attention to the exact terminology used in this topic.`,
      matching: `Some of your matches were incorrect. Review the relationships between the items and try again.`,
      ordering: `The correct order is: ${JSON.stringify(request.correctAnswer)}. Think about the logical sequence or dependencies between the items.`,
      free_response: `Your answer was partially correct but could be improved. Compare your response with the ideal answer to identify missing key points.`,
    };

    return {
      explanation: explanations[request.questionType],
      keyTakeaway: 'Review the material and try again.',
      suggestions: ['Review the lesson content', 'Practice similar questions'],
      cached: false,
    };
  }
}
