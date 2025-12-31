/**
 * Lingo Grading Service
 * Handles grading of different question types
 */

import type { LingoQuestion, AnswerResult } from '@/types/lingo.types';
import { logger } from '@/utils/logger';
import {
  WrongAnswerExplanationService,
  type QuestionType,
  type LearningStyle,
  type ExplanationResponse,
} from '@/services/ai/WrongAnswerExplanationService';
import {
  FreeResponseGradingService,
  type GradingResult,
} from '@/services/ai/FreeResponseGradingService';

// Extended result with AI explanation
export interface GradingResultWithExplanation extends AnswerResult {
  aiExplanation?: ExplanationResponse;
  aiGradingResult?: GradingResult;
}

export class LingoGradingService {
  /**
   * Grade any question type
   */
  static gradeQuestion(question: LingoQuestion, userAnswer: unknown): AnswerResult {
    switch (question.type) {
      case 'multiple_choice':
        return this.gradeMultipleChoice(userAnswer as string, question.answer || '');

      case 'fill_blank':
        return this.gradeFillBlank(userAnswer as string, question.answers || []);

      case 'matching':
        return this.gradeMatching(
          userAnswer as Array<{ left: string; right: string }>,
          question.pairs || []
        );

      case 'ordering':
        return this.gradeOrdering(userAnswer as string[], question.steps || []);

      case 'free_response':
        // Free response needs async AI grading, return pending
        return {
          correct: false,
          score: 0,
          feedback: 'Awaiting AI grading...',
        };

      default:
        return { correct: false, score: 0, feedback: 'Unknown question type' };
    }
  }

  /**
   * Grade multiple choice question
   */
  static gradeMultipleChoice(userAnswer: string, correctAnswer: string): AnswerResult {
    const correct = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    return {
      correct,
      score: correct ? 1 : 0,
      feedback: correct ? 'Correct!' : `The correct answer is: ${correctAnswer}`,
    };
  }

  /**
   * Grade fill in the blank question
   * Supports multiple acceptable answers with fuzzy matching
   */
  static gradeFillBlank(userAnswer: string, acceptedAnswers: string[]): AnswerResult {
    const normalizedUser = this.normalizeText(userAnswer);

    for (const accepted of acceptedAnswers) {
      const normalizedAccepted = this.normalizeText(accepted);

      // Exact match
      if (normalizedUser === normalizedAccepted) {
        return { correct: true, score: 1, feedback: 'Correct!' };
      }

      // Fuzzy match (allow minor typos)
      if (this.fuzzyMatch(normalizedUser, normalizedAccepted, 0.85)) {
        return { correct: true, score: 0.9, feedback: 'Correct! (minor spelling accepted)' };
      }
    }

    return {
      correct: false,
      score: 0,
      feedback: `Accepted answers include: ${acceptedAnswers[0]}`,
    };
  }

  /**
   * Grade matching question
   * Returns partial credit based on correct pairs
   */
  static gradeMatching(
    userPairs: Array<{ left: string; right: string }>,
    correctPairs: Array<{ left: string; right: string }>
  ): AnswerResult {
    if (!userPairs || userPairs.length === 0) {
      return { correct: false, score: 0, feedback: 'No matches provided' };
    }

    let correctCount = 0;

    for (const userPair of userPairs) {
      const matchingCorrect = correctPairs.find(
        cp =>
          this.normalizeText(cp.left) === this.normalizeText(userPair.left) &&
          this.normalizeText(cp.right) === this.normalizeText(userPair.right)
      );
      if (matchingCorrect) {
        correctCount++;
      }
    }

    const score = correctCount / correctPairs.length;
    const allCorrect = correctCount === correctPairs.length;

    return {
      correct: allCorrect,
      score,
      feedback: allCorrect
        ? 'All matches correct!'
        : `${correctCount} of ${correctPairs.length} matches correct`,
    };
  }

  /**
   * Grade ordering question
   * Returns partial credit based on correct positions
   */
  static gradeOrdering(userOrder: string[], correctOrder: string[]): AnswerResult {
    if (!userOrder || userOrder.length === 0) {
      return { correct: false, score: 0, feedback: 'No order provided' };
    }

    if (userOrder.length !== correctOrder.length) {
      return { correct: false, score: 0, feedback: 'Incorrect number of items' };
    }

    let correctPositions = 0;

    for (let i = 0; i < userOrder.length; i++) {
      if (this.normalizeText(userOrder[i]) === this.normalizeText(correctOrder[i])) {
        correctPositions++;
      }
    }

    const score = correctPositions / correctOrder.length;
    const allCorrect = correctPositions === correctOrder.length;

    return {
      correct: allCorrect,
      score,
      feedback: allCorrect
        ? 'Perfect order!'
        : `${correctPositions} of ${correctOrder.length} in correct position`,
    };
  }

  /**
   * Grade free response question using AI
   * Uses FreeResponseGradingService with multi-provider support
   */
  static async gradeFreeResponse(
    userAnswer: string,
    idealAnswer: string,
    rubric: string,
    strictness: number = 0.7,
    passScore: number = 0.65,
    questionText?: string
  ): Promise<AnswerResult & { aiGradingResult?: GradingResult }> {
    try {
      // Use AI grading service
      const gradingResult = await FreeResponseGradingService.grade({
        userAnswer,
        idealAnswer,
        questionText: questionText || 'Please provide your response.',
        rubric: rubric || undefined,
        strictness,
        passScore,
      });

      return {
        correct: gradingResult.passed,
        score: gradingResult.score,
        feedback: gradingResult.feedback,
        aiGradingResult: gradingResult,
      };
    } catch (_error) {
      logger._error('Error grading free response with AI:', _error);

      // Fall back to keyword matching
      return this.gradeFreeResponseFallback(userAnswer, idealAnswer, strictness, passScore);
    }
  }

  /**
   * Fallback keyword-based grading for free response
   */
  private static gradeFreeResponseFallback(
    userAnswer: string,
    idealAnswer: string,
    strictness: number = 0.7,
    passScore: number = 0.65
  ): AnswerResult {
    const userWords = this.extractKeywords(userAnswer);
    const idealWords = this.extractKeywords(idealAnswer);

    let matchCount = 0;
    for (const word of userWords) {
      if (idealWords.some(iw => this.fuzzyMatch(word, iw, strictness))) {
        matchCount++;
      }
    }

    const score = idealWords.length > 0 ? matchCount / idealWords.length : 0;
    const passed = score >= passScore;

    return {
      correct: passed,
      score: Math.min(1, score),
      feedback: passed
        ? 'Good answer! Your response covers the key points.'
        : 'Your answer could be improved. Consider including: ' + idealWords.slice(0, 3).join(', '),
    };
  }

  // ============================================================
  // AI-Enhanced Grading
  // ============================================================

  /**
   * Grade question with AI explanation for wrong answers
   * This is the primary method to use for enhanced learning feedback
   */
  static async gradeWithExplanation(
    question: LingoQuestion,
    userAnswer: unknown,
    userId: string,
    learningStyle?: LearningStyle
  ): Promise<GradingResultWithExplanation> {
    // First, do the standard grading
    const baseResult = this.gradeQuestion(question, userAnswer);

    // If correct, no explanation needed
    if (baseResult.correct) {
      return baseResult;
    }

    // Generate AI explanation for wrong answer
    try {
      const questionType = this.mapQuestionType(question.type);
      const correctAnswer = this.getCorrectAnswer(question);

      const explanation = await WrongAnswerExplanationService.generateExplanation({
        userId,
        questionId: question.id,
        questionType,
        questionText: question.question_text || '',
        userAnswer,
        correctAnswer,
        hint: question.hint,
        topic: question.skill_id || undefined,
        difficulty: question.difficulty,
        learningStyle,
      });

      return {
        ...baseResult,
        aiExplanation: explanation,
      };
    } catch (_error) {
      logger._error('Error generating AI explanation:', _error);
      // Return base result without AI explanation on error
      return baseResult;
    }
  }

  /**
   * Map lingo question type to AI explanation question type
   */
  private static mapQuestionType(type: string): QuestionType {
    const mapping: Record<string, QuestionType> = {
      multiple_choice: 'multiple_choice',
      fill_blank: 'fill_blank',
      matching: 'matching',
      ordering: 'ordering',
      free_response: 'free_response',
    };
    return mapping[type] || 'multiple_choice';
  }

  /**
   * Extract correct answer from question based on type
   */
  private static getCorrectAnswer(question: LingoQuestion): unknown {
    switch (question.type) {
      case 'multiple_choice':
        return question.answer;
      case 'fill_blank':
        return question.answers?.[0] || '';
      case 'matching':
        return question.pairs;
      case 'ordering':
        return question.steps;
      case 'free_response':
        return question.answer || '';
      default:
        return question.answer;
    }
  }

  // ============================================================
  // Helper Functions
  // ============================================================

  /**
   * Normalize text for comparison
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a',
      'an',
      'the',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'dare',
      'ought',
      'used',
      'to',
      'of',
      'in',
      'for',
      'on',
      'with',
      'at',
      'by',
      'from',
      'as',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
      'here',
      'there',
      'when',
      'where',
      'why',
      'how',
      'all',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'just',
      'and',
      'but',
      'if',
      'or',
      'because',
      'until',
      'while',
      'this',
      'that',
      'these',
      'those',
      'it',
    ]);

    return this.normalizeText(text)
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Fuzzy string matching using Levenshtein distance
   */
  private static fuzzyMatch(str1: string, str2: string, threshold: number = 0.85): boolean {
    if (str1 === str2) return true;
    if (str1.length === 0 || str2.length === 0) return false;

    const similarity = this.calculateSimilarity(str1, str2);
    return similarity >= threshold;
  }

  /**
   * Calculate string similarity (0-1)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create distance matrix
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill in the rest of the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }
}
