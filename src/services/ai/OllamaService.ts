/**
 * Ollama Service
 * Handles communication with local/remote Ollama API for LLM chat
 */

import { logger } from '@/utils/logger';

// Configuration from environment
const OLLAMA_HOST = import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.3:70b';

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
  modified_at: string;
}

export interface OllamaModelStatus {
  name: string;
  displayName: string;
  parameterSize: string;
  family: string;
  sizeGB: number;
  status: 'online' | 'offline' | 'loading' | 'unknown';
  lastChecked: Date;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Ollama Service class for interacting with Ollama API
 */
export class OllamaService {
  private static host = OLLAMA_HOST;
  private static modelStatusCache: Map<string, OllamaModelStatus> = new Map();
  private static lastHealthCheck: Date | null = null;
  private static isHealthy = false;

  /**
   * Get the configured Ollama host
   */
  static getHost(): string {
    return this.host;
  }

  /**
   * Set a custom Ollama host
   */
  static setHost(host: string): void {
    this.host = host;
    this.modelStatusCache.clear();
    this.lastHealthCheck = null;
  }

  /**
   * Check if Ollama server is healthy
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      this.isHealthy = response.ok;
      this.lastHealthCheck = new Date();
      return this.isHealthy;
    } catch (_error) {
      logger.error('Ollama health check failed:', _error);
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }
  }

  /**
   * Get cached health status
   */
  static getHealthStatus(): { isHealthy: boolean; lastChecked: Date | null } {
    return {
      isHealthy: this.isHealthy,
      lastChecked: this.lastHealthCheck,
    };
  }

  /**
   * List all available models on the Ollama server
   */
  static async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (_error) {
      logger.error('Failed to list Ollama models:', _error);
      return [];
    }
  }

  /**
   * Get model status with caching
   */
  static async getModelStatuses(): Promise<OllamaModelStatus[]> {
    try {
      const models = await this.listModels();
      const statuses: OllamaModelStatus[] = [];

      for (const model of models) {
        const displayName = this.formatModelName(model.name);
        const sizeGB = model.size / (1024 * 1024 * 1024);

        const status: OllamaModelStatus = {
          name: model.name,
          displayName,
          parameterSize: model.details?.parameter_size || 'Unknown',
          family: model.details?.family || 'Unknown',
          sizeGB: Math.round(sizeGB * 10) / 10,
          status: 'online',
          lastChecked: new Date(),
        };

        this.modelStatusCache.set(model.name, status);
        statuses.push(status);
      }

      return statuses;
    } catch (_error) {
      logger.error('Failed to get model statuses:', _error);
      // Return cached statuses if available
      return Array.from(this.modelStatusCache.values()).map(status => ({
        ...status,
        status: 'offline' as const,
      }));
    }
  }

  /**
   * Format model name for display
   */
  private static formatModelName(name: string): string {
    // Remove version tags for cleaner display
    const baseName = name.split(':')[0];
    // Capitalize and format
    return baseName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Send a chat message to Ollama
   */
  static async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;

    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature,
            num_predict: options.maxTokens || 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama chat failed: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      logger.error('Ollama chat _error:', _error);
      throw error;
    }
  }

  /**
   * Stream a chat response from Ollama
   */
  static async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;

    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            temperature,
            num_predict: options.maxTokens || 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama stream failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                yield json.message.content;
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (_error) {
      logger.error('Ollama stream _error:', _error);
      throw error;
    }
  }

  /**
   * Generate a simple completion (non-chat)
   */
  static async generate(prompt: string, options: ChatOptions = {}): Promise<string> {
    const model = options.model || DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;

    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: options.maxTokens || 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (_error) {
      logger.error('Ollama generate _error:', _error);
      throw error;
    }
  }

  /**
   * Get the default model
   */
  static getDefaultModel(): string {
    return DEFAULT_MODEL;
  }

  /**
   * Check if a specific model is available
   */
  static async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.listModels();
    return models.some(m => m.name === modelName);
  }
}

// Export singleton instance for convenience
export const ollamaService = OllamaService;
