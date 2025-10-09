import { toast } from 'sonner';
import { logger } from './logger';
import type { ErrorContext } from './errorMessages';
import {
  getFriendlyErrorMessage,
  formatErrorForLogging,
  isRetryableError,
  getRetryDelay,
} from './errorMessages';

/**
 * Centralized error handler with logging and user notification
 *
 * Features:
 * - Converts technical errors to user-friendly messages
 * - Logs errors for debugging
 * - Shows toast notifications to users
 * - Supports error retry logic
 * - Provides consistent error handling across the app
 *
 * @example
 * ```typescript
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleApiError(error, { action: 'load courses', resource: 'courses' });
 * }
 * ```
 */

export interface ErrorHandlerOptions extends ErrorContext {
  /**
   * Whether to show a toast notification to the user
   * @default true
   */
  showToast?: boolean;

  /**
   * Whether to log the error
   * @default true
   */
  logError?: boolean;

  /**
   * Custom toast duration in milliseconds
   * @default 5000
   */
  toastDuration?: number;

  /**
   * Callback function to execute after error handling
   */
  onError?: (error: unknown) => void;
}

/**
 * Handle API errors with consistent logging and user feedback
 */
export const handleApiError = (error: unknown, options: ErrorHandlerOptions = {}): void => {
  const { showToast = true, logError = true, toastDuration = 5000, onError, ...context } = options;

  // Get user-friendly message
  const friendlyMessage = getFriendlyErrorMessage(error, context);

  // Log the error
  if (logError) {
    logger.error('[API Error]', formatErrorForLogging(error, context));
  }

  // Show toast notification
  if (showToast) {
    toast.error(friendlyMessage, {
      duration: toastDuration,
      description: context.details,
    });
  }

  // Call custom error callback
  if (onError) {
    onError(error);
  }
};

/**
 * Handle errors with automatic retry logic
 */
export const handleApiErrorWithRetry = async <T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions & { maxRetries?: number } = {}
): Promise<T> => {
  const { maxRetries = 3, ...errorOptions } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        handleApiError(error, errorOptions);
        throw error;
      }

      // If this is the last attempt, handle error and throw
      if (attempt === maxRetries - 1) {
        handleApiError(error, errorOptions);
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = getRetryDelay(attempt);
      logger.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: ErrorHandlerOptions = {}
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, options);
      return undefined;
    }
  };
};

/**
 * Handle form submission errors with field-specific messages
 */
export const handleFormError = (
  error: unknown,
  setError?: (field: string, error: { message: string }) => void
): void => {
  const errorMessage = getFriendlyErrorMessage(error);

  // Try to extract field-specific errors if available
  if (error && typeof error === 'object' && 'fields' in error) {
    const fields = error.fields as Record<string, string>;
    Object.entries(fields).forEach(([field, message]) => {
      setError?.(field, { message });
    });
  } else if (setError) {
    // Set general error
    setError('root', { message: errorMessage });
  } else {
    // Fallback to toast if no setError function
    toast.error(errorMessage);
  }

  logger.error('[Form Error]', formatErrorForLogging(error));
};

/**
 * Create error with additional context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Check if error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};
