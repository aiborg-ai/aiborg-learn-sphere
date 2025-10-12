import { logger } from '@/utils/logger';

/**
 * Custom error class for API-related errors with additional metadata
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  /**
   * Creates an instance of ApiError
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code for categorization
   * @param {number} status - HTTP status code
   * @param {unknown} [details] - Additional error details for debugging
   */
  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Standardized API response structure
 * @template T - Type of the response data
 * @interface ApiResponse
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * Singleton API client for centralized error handling and request management
 * @class ApiClient
 */
export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  /**
   * Get singleton instance of ApiClient
   * @returns {ApiClient} The ApiClient instance
   */
  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Centralized error handler that transforms various error types into ApiError
   * @private
   * @param {any} error - Raw error object from API calls
   * @returns {ApiError} Standardized ApiError instance
   */
  private handleError(error: unknown): ApiError {
    logger.error('API Error:', error);

    // Type guard for error objects with code property
    const errorWithCode = error as { code?: string; message?: string; status?: number };

    // Handle Supabase specific errors
    if (errorWithCode?.code) {
      const errorMessages: Record<string, string> = {
        '23505': 'This record already exists',
        '23503': 'Cannot delete this record as it is referenced elsewhere',
        '42P01': 'The requested resource does not exist',
        PGRST116: 'Record not found',
        '22P02': 'Invalid input format',
        '23514': 'Invalid data provided',
        '42501': 'You do not have permission to perform this action',
        '42P02': 'Invalid parameter',
        '57014': 'Query timeout - please try again',
        '53300': 'Too many connections - please try again later',
      };

      const message =
        errorMessages[errorWithCode.code] ||
        errorWithCode.message ||
        'An unexpected error occurred';
      return new ApiError(message, errorWithCode.code, errorWithCode.status || 500, error);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return new ApiError('Network error - please check your connection', 'NETWORK_ERROR', 0);
    }

    // Handle auth errors
    if (error instanceof Error && error.message?.includes('JWT')) {
      return new ApiError('Your session has expired. Please sign in again.', 'AUTH_EXPIRED', 401);
    }

    // Generic error
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new ApiError(errorMessage, 'UNKNOWN_ERROR', errorWithCode?.status || 500, error);
  }

  /**
   * Execute a query with standardized error handling
   * @template T - Expected return type of the query
   * @param {Function} queryFn - Function that returns a Promise with data and error
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   * @example
   * const { data, error } = await apiClient.query(
   *   () => supabase.from('users').select()
   * );
   */
  async query<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        return { error: this.handleError(error) };
      }

      return { data: data as T };
    } catch (error) {
      return { error: this.handleError(error) };
    }
  }

  /**
   * Execute multiple queries in parallel with transaction-like error handling
   * @template T - Expected type of individual query results
   * @param {Array<Function>} queries - Array of query functions to execute
   * @returns {Promise<ApiResponse<T[]>>} Array of results or error if any query fails
   * @example
   * const { data, error } = await apiClient.batchQuery([
   *   () => supabase.from('users').select(),
   *   () => supabase.from('posts').select()
   * ]);
   */
  async batchQuery<T>(
    queries: Array<() => Promise<{ data: unknown; error: unknown }>>
  ): Promise<ApiResponse<T[]>> {
    try {
      const results = await Promise.all(queries.map(q => q()));

      // Check if any query failed
      const firstError = results.find(r => r.error);
      if (firstError) {
        return { error: this.handleError(firstError.error) };
      }

      const data = results.map(r => r.data);
      return { data: data as T[] };
    } catch (error) {
      return { error: this.handleError(error) };
    }
  }

  /**
   * Execute a query with automatic retry logic on failure
   * @template T - Expected return type of the query
   * @param {Function} queryFn - Function that returns a Promise with data and error
   * @param {number} [maxRetries=3] - Maximum number of retry attempts
   * @param {number} [delay=1000] - Initial delay between retries in milliseconds (increases exponentially)
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   * @example
   * const { data, error } = await apiClient.retryQuery(
   *   () => supabase.from('users').select(),
   *   3, // max retries
   *   1000 // initial delay
   * );
   */
  async retryQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    maxRetries = 3,
    delay = 1000
  ): Promise<ApiResponse<T>> {
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.query(queryFn);

      if (!result.error || result.error.code === '42501') {
        // Don't retry permission errors
        return result;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    return await this.query(queryFn);
  }
}

/**
 * Singleton instance of ApiClient for application-wide use
 * @type {ApiClient}
 */
export const apiClient = ApiClient.getInstance();
