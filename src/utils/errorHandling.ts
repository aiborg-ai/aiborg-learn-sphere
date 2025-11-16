/**
 * Error Handling Utilities
 *
 * Centralized error handling and logging
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', statusCode: 400 },
  INVALID_INPUT: { code: 'INVALID_INPUT', statusCode: 400 },
  INVALID_CONFIG: { code: 'INVALID_CONFIG', statusCode: 400 },

  // Authentication errors (401)
  UNAUTHORIZED: { code: 'UNAUTHORIZED', statusCode: 401 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', statusCode: 401 },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', statusCode: 401 },

  // Authorization errors (403)
  FORBIDDEN: { code: 'FORBIDDEN', statusCode: 403 },
  INSUFFICIENT_PERMISSIONS: { code: 'INSUFFICIENT_PERMISSIONS', statusCode: 403 },

  // Not found errors (404)
  NOT_FOUND: { code: 'NOT_FOUND', statusCode: 404 },
  DASHBOARD_NOT_FOUND: { code: 'DASHBOARD_NOT_FOUND', statusCode: 404 },
  TEMPLATE_NOT_FOUND: { code: 'TEMPLATE_NOT_FOUND', statusCode: 404 },

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 },

  // Server errors (500)
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', statusCode: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', statusCode: 500 },
};

// Handle errors and return AppError
export function handleError(error: unknown): AppError {
  // Log full error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('Error occurred:', error);
  }

  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };

    // Map common Supabase errors
    switch (supabaseError.code) {
      case 'PGRST116':
        return new AppError(
          'Resource not found',
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.statusCode
        );
      case '23505':
        return new AppError(
          'This resource already exists',
          ERROR_CODES.VALIDATION_ERROR.code,
          ERROR_CODES.VALIDATION_ERROR.statusCode
        );
      case '42501':
        return new AppError(
          'You do not have permission to perform this action',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      default:
        return new AppError(
          'A database error occurred',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
    }
  }

  // Generic error for unexpected issues
  return new AppError(
    'An unexpected error occurred. Please try again.',
    ERROR_CODES.INTERNAL_ERROR.code,
    ERROR_CODES.INTERNAL_ERROR.statusCode
  );
}

// Sanitize error message for users
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  // Never expose raw error details
  return 'An error occurred. Please contact support if the issue persists.';
}

// Log error (can be extended to send to error tracking service)
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  };

  // In production, send to error tracking service (Sentry, etc.)
  if (!import.meta.env.DEV) {
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Error Log]', errorData);
  }
}

// Async error wrapper for service methods
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorContext?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(error, { context: errorContext });
    throw handleError(error);
  }
}

// Sync error wrapper
export function withErrorHandlingSync<T>(fn: () => T, errorContext?: string): T {
  try {
    return fn();
  } catch (error) {
    logError(error, { context: errorContext });
    throw handleError(error);
  }
}

export default {
  AppError,
  ERROR_CODES,
  handleError,
  sanitizeErrorMessage,
  logError,
  withErrorHandling,
  withErrorHandlingSync,
};
