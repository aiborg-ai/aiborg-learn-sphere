import { logger } from '@/utils/logger';
import {
  getFriendlyErrorMessage,
  isRetryableError,
  getRetryDelay,
  formatErrorForLogging,
  type ErrorContext,
} from './errorMessages';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Global error handler with retry mechanism
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorListeners: Set<(error: unknown, context?: ErrorContext) => void> = new Set();

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      logger.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, { action: 'async operation' });
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', event => {
      logger.error('Global error:', event.error || event.message);
      this.handleError(event.error || event.message, { action: 'script execution' });
    });
  }

  /**
   * Register error listener
   */
  public addErrorListener(listener: (error: unknown, context?: ErrorContext) => void) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Handle error and notify listeners
   */
  public handleError(error: unknown, context?: ErrorContext) {
    // Log error
    const errorData = formatErrorForLogging(error, context);
    logger.error('Error handled by GlobalErrorHandler:', errorData);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (listenerError) {
        logger.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Execute function with automatic retry on failure
   */
  public async withRetry<T>(
    fn: () => Promise<T>,
    context?: ErrorContext,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, onRetry, shouldRetry = isRetryableError } = options;

    let lastError: unknown;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if we should retry
        if (attempt > maxRetries || !shouldRetry(error, attempt)) {
          break;
        }

        // Calculate delay
        const delay = getRetryDelay(attempt - 1, baseDelay);

        // Notify about retry
        onRetry?.(attempt, error);
        logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries}) after ${delay}ms`, {
          error: formatErrorForLogging(error, context),
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    this.handleError(lastError, context);
    throw lastError;
  }

  /**
   * Get user-friendly error message
   */
  public getFriendlyMessage(error: unknown, context?: ErrorContext): string {
    return getFriendlyErrorMessage(error, context);
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Helper function for easy use
export const withRetry = globalErrorHandler.withRetry.bind(globalErrorHandler);
