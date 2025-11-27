/**
 * API Response Validation Middleware
 * Provides runtime validation for Supabase query responses using Zod schemas
 */

import { z } from 'zod';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidatedResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ValidationOptions {
  /**
   * Whether to throw on validation errors (default: false in production, true in development)
   */
  throwOnError?: boolean;

  /**
   * Whether to log validation errors to console (default: true in development)
   */
  logErrors?: boolean;

  /**
   * Custom error message prefix
   */
  errorPrefix?: string;

  /**
   * Whether to validate in production (default: false for performance)
   * Set to true for critical endpoints or use sampling
   */
  validateInProduction?: boolean;

  /**
   * Sampling rate for production validation (0-1)
   * 0.01 = validate 1% of requests
   */
  samplingRate?: number;
}

const isDevelopment = import.meta.env.DEV;
const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  throwOnError: isDevelopment,
  logErrors: isDevelopment,
  errorPrefix: 'API Validation Error',
  validateInProduction: false,
  samplingRate: 0.01,
};

// ============================================================================
// VALIDATION ERROR CLASS
// ============================================================================

export class ValidationError extends Error {
  public readonly validationErrors: z.ZodError;
  public readonly originalData: unknown;

  constructor(message: string, zodError: z.ZodError, data: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.validationErrors = zodError;
    this.originalData = data;
  }
}

// ============================================================================
// SAMPLING LOGIC
// ============================================================================

function shouldValidate(options: Required<ValidationOptions>): boolean {
  // Always validate in development
  if (isDevelopment) return true;

  // Check if production validation is enabled
  if (!options.validateInProduction) return false;

  // Apply sampling rate
  return Math.random() < options.samplingRate;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a single item response from Supabase
 *
 * @example
 * ```typescript
 * const query = supabase.from('courses').select('*').eq('id', 1).single();
 * const result = await validateSingle(query, CourseSchema);
 * ```
 */
export async function validateSingle<T>(
  queryPromise: Promise<PostgrestSingleResponse<any>>,
  schema: z.ZodSchema<T>,
  options?: ValidationOptions
): Promise<ValidatedResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const { data, error: queryError } = await queryPromise;

    // Return query error immediately
    if (queryError) {
      return { data: null, error: queryError };
    }

    // Return null data immediately
    if (data === null) {
      return { data: null, error: null };
    }

    // Skip validation in production if configured
    if (!shouldValidate(opts)) {
      return { data: data as T, error: null };
    }

    // Validate the data
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      const validationError = new ValidationError(
        `${opts.errorPrefix}: Failed to validate single item`,
        validationResult.error,
        data
      );

      if (opts.logErrors) {
        logger.error(validationError.message, validationError, {
          errors: validationResult.error.errors,
          data,
        });
      }

      if (opts.throwOnError) {
        throw validationError;
      }

      // Return unvalidated data in production if not throwing
      return { data: data as T, error: validationError };
    }

    return { data: validationResult.data, error: null };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during validation'),
    };
  }
}

/**
 * Validates an array response from Supabase
 *
 * @example
 * ```typescript
 * const query = supabase.from('courses').select('*');
 * const result = await validateArray(query, CourseSchema);
 * ```
 */
export async function validateArray<T>(
  queryPromise: Promise<PostgrestResponse<any>>,
  itemSchema: z.ZodSchema<T>,
  options?: ValidationOptions
): Promise<ValidatedResponse<T[]>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const { data, error: queryError } = await queryPromise;

    // Return query error immediately
    if (queryError) {
      return { data: null, error: queryError };
    }

    // Return empty array if no data
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Skip validation in production if configured
    if (!shouldValidate(opts)) {
      return { data: data as T[], error: null };
    }

    // Create array schema
    const arraySchema = z.array(itemSchema);

    // Validate the array
    const validationResult = arraySchema.safeParse(data);

    if (!validationResult.success) {
      const validationError = new ValidationError(
        `${opts.errorPrefix}: Failed to validate array (${data.length} items)`,
        validationResult.error,
        data
      );

      if (opts.logErrors) {
        logger.error(validationError.message, validationError, {
          itemCount: data.length,
          errors: validationResult.error.errors,
          firstItem: data[0],
        });
      }

      if (opts.throwOnError) {
        throw validationError;
      }

      // Return unvalidated data in production if not throwing
      return { data: data as T[], error: validationError };
    }

    return { data: validationResult.data, error: null };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error during validation'),
    };
  }
}

/**
 * Validates data with a custom schema (for non-Supabase responses)
 *
 * @example
 * ```typescript
 * const apiData = await fetch('/api/custom');
 * const result = validateData(CustomSchema, apiData);
 * ```
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: ValidationOptions
): ValidatedResponse<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip validation in production if configured
  if (!shouldValidate(opts)) {
    return { data: data as T, error: null };
  }

  const validationResult = schema.safeParse(data);

  if (!validationResult.success) {
    const validationError = new ValidationError(
      `${opts.errorPrefix}: Failed to validate data`,
      validationResult.error,
      data
    );

    if (opts.logErrors) {
      logger.error(validationError.message, validationError, {
        errors: validationResult.error.errors,
        data,
      });
    }

    if (opts.throwOnError) {
      throw validationError;
    }

    return { data: null, error: validationError };
  }

  return { data: validationResult.data, error: null };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wraps a Supabase query builder to add automatic validation
 *
 * @example
 * ```typescript
 * const validatedQuery = withValidation(
 *   supabase.from('courses'),
 *   CourseSchema
 * );
 * const { data } = await validatedQuery.select('*');
 * ```
 */
export function withValidation<T>(
  queryBuilder: any,
  schema: z.ZodSchema<T>,
  options?: ValidationOptions
) {
  return new Proxy(queryBuilder, {
    get(target, prop) {
      const original = target[prop];

      // Intercept execution methods
      if (prop === 'single') {
        return async function (...args: any[]) {
          const query = original.apply(target, args);
          return validateSingle(query, schema, options);
        };
      }

      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return async function (...args: any[]) {
          // This is the final execution of the query
          const result = await target;
          if (Array.isArray(result.data)) {
            return validateArray(Promise.resolve(result), schema, options);
          } else {
            return validateSingle(Promise.resolve(result), schema, options);
          }
        };
      }

      // Pass through all other properties
      return original;
    },
  });
}

/**
 * Validates partial updates (PATCH/UPDATE operations)
 * Uses partial schema that makes all fields optional
 */
export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  data: unknown,
  options?: ValidationOptions
): ValidatedResponse<Partial<z.infer<T>>> {
  const partialSchema = schema.partial();
  return validateData(partialSchema, data, options);
}

// ============================================================================
// MONITORING & LOGGING
// ============================================================================

export interface ValidationMetrics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  validationErrors: Array<{
    timestamp: Date;
    error: z.ZodError;
    data: unknown;
  }>;
}

const metrics: ValidationMetrics = {
  totalValidations: 0,
  successfulValidations: 0,
  failedValidations: 0,
  validationErrors: [],
};

/**
 * Get current validation metrics
 * Useful for monitoring and debugging
 */
export function getValidationMetrics(): Readonly<ValidationMetrics> {
  return { ...metrics };
}

/**
 * Reset validation metrics
 */
export function resetValidationMetrics(): void {
  metrics.totalValidations = 0;
  metrics.successfulValidations = 0;
  metrics.failedValidations = 0;
  metrics.validationErrors = [];
}

/**
 * Track validation in metrics
 */
function trackValidation(success: boolean, error?: z.ZodError, data?: unknown): void {
  metrics.totalValidations++;
  if (success) {
    metrics.successfulValidations++;
  } else {
    metrics.failedValidations++;
    if (error && data) {
      metrics.validationErrors.push({
        timestamp: new Date(),
        error,
        data,
      });
      // Keep only last 100 errors
      if (metrics.validationErrors.length > 100) {
        metrics.validationErrors.shift();
      }
    }
  }
}
