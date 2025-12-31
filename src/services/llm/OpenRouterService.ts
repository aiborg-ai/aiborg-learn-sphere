/**
 * OpenRouter Service
 * Core LLM integration via OpenRouter API
 */

import { logger } from '@/utils/logger';
import { ResponseCache, generateCacheKey } from './ResponseCache';
import {
  ChatMessage,
  CachedCompletionOptions,
  LLMResponse,
  OpenRouterAPIResponse,
  LLM_DEFAULTS,
  MODEL_PRICING,
  USE_CASE_CONFIG,
  UseCaseType,
  LLMError,
  RateLimitError,
  AuthenticationError,
  InvalidRequestError,
  OPENROUTER_MODELS,
} from './types';

// OpenRouter API configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const DEFAULT_MODEL =
  import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || OPENROUTER_MODELS.CLAUDE_35_SONNET;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Calculate cost for a completion
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return 0;
  }
  return (
    (promptTokens / 1000) * pricing.promptCostPer1K +
    (completionTokens / 1000) * pricing.completionCostPer1K
  );
}

/**
 * Sleep helper for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * OpenRouter Service
 */
export class OpenRouterService {
  /**
   * Check if API key is configured
   */
  static isConfigured(): boolean {
    return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 10;
  }

  /**
   * Generate a completion from OpenRouter
   */
  static async generateCompletion(options: CachedCompletionOptions): Promise<LLMResponse> {
    const {
      messages,
      model = DEFAULT_MODEL,
      maxTokens = LLM_DEFAULTS.maxTokens,
      temperature = LLM_DEFAULTS.temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      stop,
      cacheKey,
      cacheTTL = LLM_DEFAULTS.cacheTTL,
      skipCache = false,
    } = options;

    // Generate cache key if not provided
    const effectiveCacheKey = cacheKey || generateCacheKey(messages, model);

    // Check cache first (unless skipped)
    if (!skipCache) {
      const cachedResponse = await ResponseCache.get(effectiveCacheKey);
      if (cachedResponse) {
        logger.info('LLM cache hit:', effectiveCacheKey);
        return {
          content: cachedResponse,
          model,
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          cached: true,
          costUsd: 0,
        };
      }
    }

    // Make API request with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.makeAPIRequest(
          messages,
          model,
          maxTokens,
          temperature,
          topP,
          frequencyPenalty,
          presencePenalty,
          stop
        );

        // Calculate cost
        const costUsd = calculateCost(
          model,
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );

        // Extract content
        const content = response.choices[0]?.message?.content || '';

        // Cache the response
        if (!skipCache && content) {
          await ResponseCache.set(
            effectiveCacheKey,
            generateCacheKey(messages, model),
            content,
            model,
            response.usage.total_tokens,
            costUsd,
            cacheTTL
          );
        }

        return {
          content,
          model: response.model,
          tokensUsed: {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens,
          },
          cached: false,
          costUsd,
          finishReason: response.choices[0]?.finish_reason,
        };
      } catch (_error) {
        lastError = _error as Error;

        // Check if retryable
        if (error instanceof RateLimitError) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }

        // Non-retryable errors
        if (error instanceof AuthenticationError || error instanceof InvalidRequestError) {
          throw error;
        }

        // Unknown errors - retry
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError || new LLMError('Failed to generate completion', 'UNKNOWN_ERROR');
  }

  /**
   * Generate completion for a specific use case
   */
  static async generateForUseCase(
    useCase: UseCaseType,
    messages: ChatMessage[],
    additionalOptions?: Partial<CachedCompletionOptions>
  ): Promise<LLMResponse> {
    const config = USE_CASE_CONFIG[useCase];
    return this.generateCompletion({
      messages,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      cacheTTL: config.cacheTTL,
      ...additionalOptions,
    });
  }

  /**
   * Simple text completion (convenience method)
   */
  static async complete(
    prompt: string,
    options?: Partial<CachedCompletionOptions>
  ): Promise<string> {
    const response = await this.generateCompletion({
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });
    return response.content;
  }

  /**
   * Chat completion with system prompt
   */
  static async chat(
    systemPrompt: string,
    userMessage: string,
    options?: Partial<CachedCompletionOptions>
  ): Promise<string> {
    const response = await this.generateCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      ...options,
    });
    return response.content;
  }

  /**
   * Make the actual API request to OpenRouter
   */
  private static async makeAPIRequest(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    topP?: number,
    frequencyPenalty?: number,
    presencePenalty?: number,
    stop?: string[]
  ): Promise<OpenRouterAPIResponse> {
    if (!this.isConfigured()) {
      throw new AuthenticationError();
    }

    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    if (topP !== undefined) body.top_p = topP;
    if (frequencyPenalty !== undefined) body.frequency_penalty = frequencyPenalty;
    if (presencePenalty !== undefined) body.presence_penalty = presencePenalty;
    if (stop) body.stop = stop;

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AIBorg Learn Sphere',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;

        switch (response.status) {
          case 401:
            throw new AuthenticationError();
          case 429:
            throw new RateLimitError();
          case 400:
            throw new InvalidRequestError(errorMessage);
          default:
            throw new LLMError(errorMessage, 'API_ERROR', response.status, response.status >= 500);
        }
      }

      const data = (await response.json()) as OpenRouterAPIResponse;
      return data;
    } catch (_error) {
      if (_error instanceof LLMError) {
        throw _error;
      }
      throw new LLMError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR',
        undefined,
        true
      );
    }
  }

  /**
   * Get available models
   */
  static getAvailableModels(): typeof OPENROUTER_MODELS {
    return OPENROUTER_MODELS;
  }

  /**
   * Get model pricing
   */
  static getModelPricing(
    model: string
  ): { promptCostPer1K: number; completionCostPer1K: number } | null {
    return MODEL_PRICING[model] || null;
  }

  /**
   * Estimate cost for a message
   */
  static estimateCost(
    messages: ChatMessage[],
    model: string = DEFAULT_MODEL,
    estimatedCompletionTokens: number = 200
  ): number {
    // Rough estimate: 4 chars per token
    const promptChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const estimatedPromptTokens = Math.ceil(promptChars / 4);
    return calculateCost(model, estimatedPromptTokens, estimatedCompletionTokens);
  }
}
