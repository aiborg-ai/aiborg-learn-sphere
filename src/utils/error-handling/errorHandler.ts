/**
 * Centralized Error Handler
 *
 * Provides utilities for handling errors consistently across the application.
 */

import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  AppError,
  isAppError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  NetworkError,
  TimeoutError,
  RateLimitError,
} from './errorTypes';

/**
 * Error handler options
 */
interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  rethrow?: boolean;
  context?: Record<string, unknown>;
}

/**
 * Default error handler options
 */
const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logError: true,
  rethrow: false,
};

/**
 * Get user-friendly error message based on error type
 */
function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Show error toast notification
 */
function showErrorToast(error: unknown): void {
  const message = getUserMessage(error);

  if (isAppError(error)) {
    switch (error.code) {
      case 'AUTH_ERROR':
        toast.error('Authentication Error', { description: message });
        break;
      case 'AUTHORIZATION_ERROR':
        toast.error('Permission Denied', { description: message });
        break;
      case 'VALIDATION_ERROR':
        toast.error('Validation Error', { description: message });
        break;
      case 'NOT_FOUND':
        toast.error('Not Found', { description: message });
        break;
      case 'NETWORK_ERROR':
        toast.error('Network Error', { description: message });
        break;
      case 'RATE_LIMIT_ERROR':
        toast.error('Too Many Requests', { description: message });
        break;
      default:
        toast.error('Error', { description: message });
    }
  } else {
    toast.error('Error', { description: message });
  }
}

/**
 * Log error with context
 */
function logError(error: unknown, context?: Record<string, unknown>): void {
  if (isAppError(error)) {
    logger.error(error.message, {
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      stack: error.stack,
      context: { ...error.context, ...context },
    });
  } else if (error instanceof Error) {
    logger.error(error.message, {
      name: error.name,
      stack: error.stack,
      context,
    });
  } else {
    logger.error('Unknown error', { error, context });
  }
}

/**
 * Main error handler function
 *
 * @example
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error, { context: { operation: 'someAsyncOperation' } });
 * }
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Log the error
  if (opts.logError) {
    logError(error, opts.context);
  }

  // Show toast notification
  if (opts.showToast) {
    showErrorToast(error);
  }

  // Rethrow if needed
  if (opts.rethrow) {
    throw error;
  }
}

/**
 * Async error handler wrapper
 *
 * Wraps an async function and handles errors automatically
 *
 * @example
 * const safeFunction = withErrorHandler(
 *   async () => await riskyOperation(),
 *   { context: { operation: 'riskyOperation' } }
 * );
 * await safeFunction();
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: ErrorHandlerOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return undefined;
    }
  }) as T;
}

/**
 * Convert unknown errors to AppError instances
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to infer error type from message
    if (error.message.includes('unauthorized') || error.message.includes('not authenticated')) {
      return new AuthenticationError(error.message);
    }

    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return new AuthorizationError(error.message);
    }

    if (error.message.includes('not found')) {
      return new NotFoundError('Resource', { originalMessage: error.message });
    }

    if (error.message.includes('network') || error.message.includes('fetch failed')) {
      return new NetworkError(error.message);
    }

    if (error.message.includes('timeout')) {
      return new TimeoutError(error.message);
    }

    // Default to ApiError
    return new ApiError(error.message);
  }

  // For non-Error objects
  return new ApiError('An unexpected error occurred', 500, 'UNKNOWN_ERROR', {
    originalError: error,
  });
}

/**
 * Handle API response errors
 */
export async function handleApiResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || response.statusText || 'API request failed';

    switch (response.status) {
      case 400:
        throw new ValidationError(message, errorData.errors, {
          url: response.url,
          status: response.status,
        });
      case 401:
        throw new AuthenticationError(message, {
          url: response.url,
          status: response.status,
        });
      case 403:
        throw new AuthorizationError(message, {
          url: response.url,
          status: response.status,
        });
      case 404:
        throw new NotFoundError('Resource', {
          url: response.url,
          status: response.status,
        });
      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(message, retryAfter ? parseInt(retryAfter, 10) : undefined, {
          url: response.url,
          status: response.status,
        });
      }
      default:
        throw new ApiError(message, response.status, 'API_ERROR', {
          url: response.url,
          status: response.status,
          errorData,
        });
    }
  }
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on operational errors (like validation errors)
      if (isAppError(error) && !error.isOperational) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Call onRetry callback
      onRetry?.(attempt, error);

      // Calculate delay with optional exponential backoff
      const retryDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
}
