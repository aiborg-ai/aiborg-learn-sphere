/**
 * Custom Error Types for the Application
 *
 * Provides structured error types for better error handling and debugging.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.name = this.constructor.name;

    Error.captureStackTrace(this);
  }
}

/**
 * API related errors
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode = 500,
    code = 'API_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, statusCode, true, context);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, true, context);
  }
}

/**
 * Authorization/Permission errors
 */
export class AuthorizationError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action',
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message = 'Validation failed',
    validationErrors?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.validationErrors = validationErrors;
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super(`${resource} not found`, 'NOT_FOUND', 404, true, context);
  }
}

/**
 * Network errors
 */
export class NetworkError extends AppError {
  constructor(message = 'Network request failed', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', undefined, true, context);
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  constructor(message = 'Request timed out', context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, true, context);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, false, context);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message = 'External service error',
    context?: Record<string, unknown>
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, context);
    this.service = service;
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
    this.retryAfter = retryAfter;
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational (expected and should be handled gracefully)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}
