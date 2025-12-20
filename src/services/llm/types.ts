/**
 * LLM Service Types
 * TypeScript interfaces for LLM operations via OpenRouter
 */

// Chat message format
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// OpenRouter completion options
export interface CompletionOptions {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// Cached completion options
export interface CachedCompletionOptions extends CompletionOptions {
  cacheKey?: string;
  cacheTTL?: number; // seconds
  skipCache?: boolean;
}

// LLM response from OpenRouter
export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached: boolean;
  costUsd?: number;
  finishReason?: string;
}

// Cache entry stored in database
export interface CacheEntry {
  id: string;
  cacheKey: string;
  promptHash: string;
  response: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
}

// OpenRouter API response format
export interface OpenRouterAPIResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Model pricing (per 1K tokens)
export interface ModelPricing {
  promptCostPer1K: number;
  completionCostPer1K: number;
}

// Available models via OpenRouter
export const OPENROUTER_MODELS = {
  // Anthropic Claude
  CLAUDE_35_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',

  // OpenAI
  GPT_4_TURBO: 'openai/gpt-4-turbo',
  GPT_4O: 'openai/gpt-4o',
  GPT_4O_MINI: 'openai/gpt-4o-mini',

  // Meta Llama
  LLAMA_3_70B: 'meta-llama/llama-3-70b-instruct',
  LLAMA_3_8B: 'meta-llama/llama-3-8b-instruct',
} as const;

export type OpenRouterModel = (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS];

// Model pricing lookup (approximate, may change)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  [OPENROUTER_MODELS.CLAUDE_35_SONNET]: { promptCostPer1K: 0.003, completionCostPer1K: 0.015 },
  [OPENROUTER_MODELS.CLAUDE_3_HAIKU]: { promptCostPer1K: 0.00025, completionCostPer1K: 0.00125 },
  [OPENROUTER_MODELS.CLAUDE_3_OPUS]: { promptCostPer1K: 0.015, completionCostPer1K: 0.075 },
  [OPENROUTER_MODELS.GPT_4_TURBO]: { promptCostPer1K: 0.01, completionCostPer1K: 0.03 },
  [OPENROUTER_MODELS.GPT_4O]: { promptCostPer1K: 0.005, completionCostPer1K: 0.015 },
  [OPENROUTER_MODELS.GPT_4O_MINI]: { promptCostPer1K: 0.00015, completionCostPer1K: 0.0006 },
  [OPENROUTER_MODELS.LLAMA_3_70B]: { promptCostPer1K: 0.0008, completionCostPer1K: 0.0008 },
  [OPENROUTER_MODELS.LLAMA_3_8B]: { promptCostPer1K: 0.0001, completionCostPer1K: 0.0001 },
};

// Default configuration
export const LLM_DEFAULTS = {
  model: OPENROUTER_MODELS.CLAUDE_35_SONNET,
  maxTokens: 500,
  temperature: 0.7,
  cacheTTL: 60 * 60 * 24 * 7, // 7 days in seconds
} as const;

// Use case specific configurations
export const USE_CASE_CONFIG = {
  // Wrong answer explanations - need quality
  explanation: {
    model: OPENROUTER_MODELS.CLAUDE_35_SONNET,
    maxTokens: 400,
    temperature: 0.7,
    cacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Simple feedback - cost efficient
  simpleFeedback: {
    model: OPENROUTER_MODELS.CLAUDE_3_HAIKU,
    maxTokens: 200,
    temperature: 0.5,
    cacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Content generation - need quality
  contentGeneration: {
    model: OPENROUTER_MODELS.CLAUDE_35_SONNET,
    maxTokens: 1000,
    temperature: 0.8,
    cacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Quiz generation
  quizGeneration: {
    model: OPENROUTER_MODELS.CLAUDE_35_SONNET,
    maxTokens: 800,
    temperature: 0.7,
    cacheTTL: 60 * 60 * 24 * 14, // 14 days
  },

  // Summarization
  summarization: {
    model: OPENROUTER_MODELS.CLAUDE_3_HAIKU,
    maxTokens: 500,
    temperature: 0.3,
    cacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
} as const;

export type UseCaseType = keyof typeof USE_CASE_CONFIG;

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT',
      429,
      true
    );
    this.name = 'RateLimitError';
  }
}

export class InvalidRequestError extends LLMError {
  constructor(message: string) {
    super(message, 'INVALID_REQUEST', 400, false);
    this.name = 'InvalidRequestError';
  }
}

export class AuthenticationError extends LLMError {
  constructor() {
    super('Invalid API key or authentication failed', 'AUTH_ERROR', 401, false);
    this.name = 'AuthenticationError';
  }
}
