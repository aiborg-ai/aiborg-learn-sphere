/**
 * Free Response Grading Service
 *
 * AI-powered grading for free-response questions with multi-provider support.
 * Supports Ollama (local) and OpenRouter (cloud) as LLM backends.
 */

import { logger } from '@/utils/logger';
import { OllamaService, type ChatMessage as OllamaChatMessage } from './OllamaService';
import { OpenRouterService } from '@/services/llm/OpenRouterService';
import { type ChatMessage, OPENROUTER_MODELS } from '@/services/llm/types';
import { AIContentService } from './AIContentService';

// Configuration
const DEFAULT_PROVIDER = import.meta.env.VITE_GRADING_PROVIDER || 'auto'; // 'ollama', 'openrouter', 'auto'
const GRADING_MODEL = import.meta.env.VITE_GRADING_MODEL || 'llama3.3:70b';
const OPENROUTER_GRADING_MODEL = OPENROUTER_MODELS.CLAUDE_3_HAIKU; // Cost-effective for grading

/**
 * Grading result from AI evaluation
 */
export interface GradingResult {
  score: number; // 0-1 normalized score
  passed: boolean;
  feedback: string;
  detailedFeedback?: {
    strengths: string[];
    improvements: string[];
    missedPoints: string[];
  };
  rubricScores?: RubricScore[];
  confidence: number; // 0-1 confidence in the grade
  provider: 'ollama' | 'openrouter' | 'fallback';
  processingTimeMs: number;
}

/**
 * Individual rubric criterion score
 */
export interface RubricScore {
  criterion: string;
  score: number; // 0-1
  maxScore: number;
  feedback: string;
}

/**
 * Rubric criterion definition
 */
export interface RubricCriterion {
  name: string;
  description: string;
  weight: number; // 0-1, all weights should sum to 1
  levels?: {
    score: number;
    description: string;
  }[];
}

/**
 * Grading request options
 */
export interface GradingOptions {
  userAnswer: string;
  idealAnswer: string;
  questionText: string;
  rubric?: string | RubricCriterion[];
  passScore?: number; // 0-1, default 0.65
  strictness?: number; // 0-1, affects grading leniency
  provider?: 'ollama' | 'openrouter' | 'auto';
  context?: string; // Additional context (topic, difficulty, etc.)
}

/**
 * Parse rubric into structured format
 * Now fetches from database if no rubric provided
 */
async function parseRubric(
  rubric: string | RubricCriterion[] | undefined,
  subjectArea?: string
): Promise<RubricCriterion[]> {
  // If no rubric provided, fetch from database
  if (!rubric) {
    const dbRubric = await AIContentService.getDefaultRubric(subjectArea);
    if (dbRubric && dbRubric.criteria) {
      return dbRubric.criteria as RubricCriterion[];
    }

    // Fallback to hardcoded if database unavailable
    logger.warn('[Grading] Using fallback rubric - database rubric not found');
    return [
      { name: 'Accuracy', description: 'Correctness of information', weight: 0.4 },
      { name: 'Completeness', description: 'Coverage of key points', weight: 0.3 },
      { name: 'Clarity', description: 'Clear and well-organized response', weight: 0.2 },
      { name: 'Understanding', description: 'Demonstrates understanding of concept', weight: 0.1 },
    ];
  }

  if (Array.isArray(rubric)) {
    return rubric;
  }

  // Parse string rubric into criteria
  const lines = rubric.split('\n').filter(line => line.trim());
  const criteria: RubricCriterion[] = [];

  for (const line of lines) {
    const match = line.match(/^[-•*]?\s*(.+?):\s*(.+)$/);
    if (match) {
      criteria.push({
        name: match[1].trim(),
        description: match[2].trim(),
        weight: 1 / lines.length,
      });
    }
  }

  return criteria.length > 0 ? criteria : await parseRubric(undefined, subjectArea);
}

/**
 * Build the grading prompt for the LLM
 */
function buildGradingPrompt(options: GradingOptions, rubricCriteria: RubricCriterion[]): string {
  const rubricText = rubricCriteria
    .map((c, i) => `${i + 1}. ${c.name} (${Math.round(c.weight * 100)}%): ${c.description}`)
    .join('\n');

  const strictnessNote =
    options.strictness !== undefined
      ? options.strictness > 0.7
        ? 'Be strict in grading - expect precise and comprehensive answers.'
        : options.strictness < 0.3
          ? 'Be lenient - focus on core understanding rather than perfect answers.'
          : 'Use standard grading expectations.'
      : '';

  return `You are an expert educational assessor. Grade the following free-response answer.

QUESTION:
${options.questionText}

IDEAL ANSWER:
${options.idealAnswer}

STUDENT ANSWER:
${options.userAnswer}

RUBRIC CRITERIA:
${rubricText}

${options.context ? `CONTEXT: ${options.context}` : ''}
${strictnessNote}

Evaluate the student's answer against the ideal answer using the rubric criteria.

Respond ONLY with a valid JSON object in this exact format:
{
  "overallScore": <number 0-100>,
  "confidence": <number 0-100>,
  "rubricScores": [
    {
      "criterion": "<criterion name>",
      "score": <number 0-100>,
      "feedback": "<brief feedback for this criterion>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "missedPoints": ["<key point missed 1>"],
  "overallFeedback": "<2-3 sentence summary>"
}`;
}

/**
 * Parse LLM response into GradingResult
 */
function parseGradingResponse(
  responseText: string,
  provider: 'ollama' | 'openrouter',
  processingTimeMs: number,
  passScore: number
): GradingResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object directly
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);

    const score = (parsed.overallScore || 0) / 100;
    const confidence = (parsed.confidence || 70) / 100;

    const rubricScores: RubricScore[] = (parsed.rubricScores || []).map(
      (rs: { criterion: string; score: number; feedback: string }) => ({
        criterion: rs.criterion,
        score: (rs.score || 0) / 100,
        maxScore: 1,
        feedback: rs.feedback || '',
      })
    );

    return {
      score,
      passed: score >= passScore,
      feedback: parsed.overallFeedback || 'Grading completed.',
      detailedFeedback: {
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        missedPoints: parsed.missedPoints || [],
      },
      rubricScores,
      confidence,
      provider,
      processingTimeMs,
    };
  } catch (_error) {
    logger.error('Failed to parse grading response:', _error, responseText);

    // Return a fallback result
    return {
      score: 0.5,
      passed: false,
      feedback: 'Unable to fully evaluate response. Please review manually.',
      confidence: 0.2,
      provider,
      processingTimeMs,
    };
  }
}

/**
 * Free Response Grading Service
 */
export class FreeResponseGradingService {
  private static ollamaAvailable: boolean | null = null;
  private static lastHealthCheck: number = 0;
  private static healthCheckInterval = 60000; // 1 minute

  /**
   * Check if Ollama is available (with caching)
   */
  private static async isOllamaAvailable(): Promise<boolean> {
    const now = Date.now();
    if (this.ollamaAvailable !== null && now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.ollamaAvailable;
    }

    try {
      this.ollamaAvailable = await OllamaService.checkHealth();
      this.lastHealthCheck = now;
      return this.ollamaAvailable;
    } catch {
      this.ollamaAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Grade a free-response answer using AI
   */
  static async grade(options: GradingOptions): Promise<GradingResult> {
    const startTime = Date.now();
    const passScore = options.passScore ?? 0.65;
    const provider = options.provider || DEFAULT_PROVIDER;
    const rubricCriteria = await parseRubric(options.rubric, options.context);
    const prompt = buildGradingPrompt(options, rubricCriteria);

    // Determine which provider to use
    if (provider === 'ollama' || provider === 'auto') {
      const ollamaAvailable = await this.isOllamaAvailable();

      if (ollamaAvailable || provider === 'ollama') {
        try {
          return await this.gradeWithOllama(prompt, passScore, startTime);
        } catch (_error) {
          logger.error('Ollama grading failed:', _error);
          if (provider === 'ollama') {
            throw error;
          }
          // Fall through to OpenRouter for 'auto' mode
        }
      }
    }

    // Use OpenRouter
    if (OpenRouterService.isConfigured()) {
      try {
        return await this.gradeWithOpenRouter(prompt, passScore, startTime);
      } catch (_error) {
        logger.error('OpenRouter grading failed:', _error);
        throw error;
      }
    }

    // No provider available - return fallback result
    logger.warn('No grading provider available, using keyword fallback');
    return this.keywordFallback(options, startTime, passScore);
  }

  /**
   * Grade using Ollama (local LLM)
   */
  private static async gradeWithOllama(
    prompt: string,
    passScore: number,
    startTime: number
  ): Promise<GradingResult> {
    const messages: OllamaChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert educational assessor. Respond only with valid JSON, no additional text.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await OllamaService.chat(messages, {
      model: GRADING_MODEL,
      temperature: 0.3, // Lower temperature for consistent grading
      maxTokens: 1024,
    });

    const processingTimeMs = Date.now() - startTime;
    return parseGradingResponse(response.message.content, 'ollama', processingTimeMs, passScore);
  }

  /**
   * Grade using OpenRouter (cloud LLM)
   */
  private static async gradeWithOpenRouter(
    prompt: string,
    passScore: number,
    startTime: number
  ): Promise<GradingResult> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an expert educational assessor. Respond only with valid JSON, no additional text.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await OpenRouterService.generateCompletion({
      messages,
      model: OPENROUTER_GRADING_MODEL,
      temperature: 0.3,
      maxTokens: 1024,
    });

    const processingTimeMs = Date.now() - startTime;
    return parseGradingResponse(response.content, 'openrouter', processingTimeMs, passScore);
  }

  /**
   * Fallback to keyword matching when no LLM is available
   */
  private static keywordFallback(
    options: GradingOptions,
    startTime: number,
    passScore: number
  ): GradingResult {
    const userWords = this.extractKeywords(options.userAnswer);
    const idealWords = this.extractKeywords(options.idealAnswer);

    let matchCount = 0;
    for (const word of userWords) {
      if (idealWords.some(iw => this.fuzzyMatch(word, iw))) {
        matchCount++;
      }
    }

    const score = idealWords.length > 0 ? Math.min(1, matchCount / idealWords.length) : 0;
    const processingTimeMs = Date.now() - startTime;

    return {
      score,
      passed: score >= passScore,
      feedback:
        score >= passScore
          ? 'Your answer covers key points from the expected response.'
          : 'Consider including more key concepts from the topic.',
      detailedFeedback: {
        strengths: matchCount > 0 ? ['Contains relevant keywords'] : [],
        improvements: score < passScore ? ['Include more key concepts'] : [],
        missedPoints: idealWords
          .filter(iw => !userWords.some(uw => this.fuzzyMatch(uw, iw)))
          .slice(0, 3),
      },
      confidence: 0.4, // Low confidence for keyword fallback
      provider: 'fallback',
      processingTimeMs,
    };
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
      'and',
      'but',
      'if',
      'or',
      'because',
      'this',
      'that',
      'these',
      'those',
      'it',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Fuzzy string matching
   */
  private static fuzzyMatch(str1: string, str2: string, threshold = 0.85): boolean {
    if (str1 === str2) return true;
    if (str1.length === 0 || str2.length === 0) return false;

    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;
    return similarity >= threshold;
  }

  /**
   * Get available providers and their status
   */
  static async getProviderStatus(): Promise<{
    ollama: { available: boolean; model: string };
    openrouter: { available: boolean; model: string };
    recommended: 'ollama' | 'openrouter' | 'none';
  }> {
    const ollamaAvailable = await this.isOllamaAvailable();
    const openrouterAvailable = OpenRouterService.isConfigured();

    return {
      ollama: { available: ollamaAvailable, model: GRADING_MODEL },
      openrouter: { available: openrouterAvailable, model: OPENROUTER_GRADING_MODEL },
      recommended: ollamaAvailable ? 'ollama' : openrouterAvailable ? 'openrouter' : 'none',
    };
  }

  /**
   * Batch grade multiple responses
   */
  static async batchGrade(
    questions: Array<{
      id: string;
      options: GradingOptions;
    }>
  ): Promise<Map<string, GradingResult>> {
    const results = new Map<string, GradingResult>();

    // Grade in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks: Array<typeof questions> = [];

    for (let i = 0; i < questions.length; i += concurrencyLimit) {
      chunks.push(questions.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async q => {
          try {
            const result = await this.grade(q.options);
            return { id: q.id, result };
          } catch (_error) {
            logger.error(`Failed to grade question ${q.id}:`, _error);
            return {
              id: q.id,
              result: {
                score: 0,
                passed: false,
                feedback: 'Grading failed. Please try again.',
                confidence: 0,
                provider: 'fallback' as const,
                processingTimeMs: 0,
              },
            };
          }
        })
      );

      for (const { id, result } of chunkResults) {
        results.set(id, result);
      }
    }

    return results;
  }
}
