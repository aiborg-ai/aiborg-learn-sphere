/**
 * Error Handling Utilities
 *
 * Centralized error handling for consistent error management across the application.
 *
 * @example Basic error handling
 * ```typescript
 * import { handleError, ApiError } from '@/utils/error-handling';
 *
 * try {
 *   await someRiskyOperation();
 * } catch (error) {
 *   handleError(error, { context: { operation: 'someRiskyOperation' } });
 * }
 * ```
 *
 * @example Using custom error types
 * ```typescript
 * import { ValidationError, NotFoundError } from '@/utils/error-handling';
 *
 * if (!data) {
 *   throw new NotFoundError('User', { userId: id });
 * }
 *
 * if (!isValid) {
 *   throw new ValidationError('Invalid input', { email: ['Invalid format'] });
 * }
 * ```
 *
 * @example Error handler wrapper
 * ```typescript
 * import { withErrorHandler } from '@/utils/error-handling';
 *
 * const safeFunction = withErrorHandler(
 *   async () => await riskyOperation(),
 *   { showToast: true, logError: true }
 * );
 * ```
 *
 * @example With retry logic
 * ```typescript
 * import { withRetry } from '@/utils/error-handling';
 *
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, delay: 1000, backoff: true }
 * );
 * ```
 */

// Export error types
export {
  AppError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  NetworkError,
  TimeoutError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  isAppError,
  isOperationalError,
} from './errorTypes';

// Export error handlers
export {
  handleError,
  withErrorHandler,
  normalizeError,
  handleApiResponse,
  withRetry,
} from './errorHandler';
