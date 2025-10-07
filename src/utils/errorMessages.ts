/**
 * User-friendly error messages utility
 *
 * Converts technical error messages into user-friendly ones
 */

export interface ErrorContext {
  action?: string;
  resource?: string;
  details?: string;
}

/**
 * Get user-friendly error message
 */
export const getFriendlyErrorMessage = (error: unknown, context?: ErrorContext): string => {
  const errorMessage = getErrorMessage(error);

  // Network errors
  if (isNetworkError(error) || errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return `Unable to connect to the server${context?.action ? ` while ${context.action}` : ''}. Please check your internet connection and try again.`;
  }

  // Authentication errors
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('auth')
  ) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  // Permission errors
  if (
    errorMessage.includes('403') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('permission')
  ) {
    return `You don't have permission to ${context?.action || 'perform this action'}. Please contact your administrator if you believe this is an error.`;
  }

  // Not found errors
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return `${context?.resource || 'The requested item'} could not be found. It may have been deleted or moved.`;
  }

  // Server errors
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503')
  ) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return `The request took too long to complete${context?.action ? ` while ${context.action}` : ''}. Please try again.`;
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return `The information provided is invalid. Please check your input and try again.`;
  }

  // Database/Storage errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('storage') ||
    errorMessage.includes('quota')
  ) {
    return 'Unable to save your changes due to storage limitations. Please try again or contact support.';
  }

  // File upload errors
  if (errorMessage.includes('upload') || errorMessage.includes('file size')) {
    return 'There was a problem uploading your file. Please ensure it meets the size and format requirements.';
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return "You've made too many requests. Please wait a moment and try again.";
  }

  // Default message
  if (context?.action) {
    return `Unable to ${context.action}. ${context.details || 'Please try again or contact support if the problem persists.'}`;
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    if ('statusText' in error && typeof error.statusText === 'string') {
      return error.statusText;
    }
  }

  return 'Unknown error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    !navigator.onLine
  );
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();

  // Network errors are retryable
  if (isNetworkError(error)) {
    return true;
  }

  // Timeout errors are retryable
  if (message.includes('timeout')) {
    return true;
  }

  // Server errors (500, 502, 503) are retryable
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true;
  }

  // Rate limit errors are retryable (after a delay)
  if (message.includes('rate limit') || message.includes('too many')) {
    return true;
  }

  // Client errors (4xx) are generally not retryable
  if (message.match(/4\d{2}/)) {
    return false;
  }

  // Default to not retryable
  return false;
};

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export const getRetryDelay = (attempt: number, baseDelay = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
};

/**
 * Format error for logging/debugging
 */
export const formatErrorForLogging = (
  error: unknown,
  context?: ErrorContext
): Record<string, unknown> => {
  return {
    message: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: context || {},
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    online: navigator.onLine,
  };
};
