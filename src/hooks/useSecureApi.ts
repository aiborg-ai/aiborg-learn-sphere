import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiError, ApiResponse } from '@/lib/api-client';
import { rateLimiter, RateLimitPresets, RateLimitConfig } from '@/lib/security/rate-limiter';
import { sanitizeText, sanitizeHTML, sanitizeJSON, hasSQLInjectionPattern } from '@/lib/security/sanitizer';
import { rbac, Action, Resource } from '@/lib/security/rbac';
import { logger } from '@/utils/logger';

/**
 * Secure API call configuration
 * @interface SecureApiConfig
 */
export interface SecureApiConfig {
  /** Rate limit configuration */
  rateLimit?: RateLimitConfig | keyof typeof RateLimitPresets;
  /** Required RBAC permission */
  requiredPermission?: {
    action: Action;
    resource: Resource;
    resourceData?: Record<string, unknown>;
  };
  /** Sanitize input data */
  sanitizeInput?: boolean;
  /** Sanitize output data */
  sanitizeOutput?: boolean;
  /** Validate against SQL injection */
  checkSQLInjection?: boolean;
  /** Show success toast */
  showSuccessToast?: boolean;
  /** Show error toast */
  showErrorToast?: boolean;
  /** Success message */
  successMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Success callback */
  onSuccess?: (data: Record<string, unknown>) => void;
  /** Error callback */
  onError?: (error: ApiError) => void;
  /** Retry on error */
  retryOnError?: boolean;
  /** Retry count */
  retryCount?: number;
}

/**
 * Secure API call return type
 * @interface SecureApiReturn
 */
export interface SecureApiReturn<T> {
  execute: (queryFn: () => Promise<{ data: T | null; error: unknown }>, inputData?: Record<string, unknown>) => Promise<ApiResponse<T>>;
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  reset: () => void;
}

/**
 * Hook for making secure API calls with built-in security features
 * @template T - Response data type
 * @param {SecureApiConfig} [config={}] - Security configuration
 * @returns {SecureApiReturn<T>} Secure API call interface
 * @example
 * const { execute, loading, data } = useSecureApi<User>({
 *   rateLimit: 'api',
 *   requiredPermission: {
 *     action: Action.UPDATE,
 *     resource: Resource.USER
 *   },
 *   sanitizeInput: true,
 *   checkSQLInjection: true
 * });
 *
 * await execute(() => supabase.from('users').update(userData), userData);
 */
export function useSecureApi<T = unknown>(
  config: SecureApiConfig = {}
): SecureApiReturn<T> {
  const {
    rateLimit,
    requiredPermission,
    sanitizeInput = true,
    sanitizeOutput = false,
    checkSQLInjection = true,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation successful',
    errorMessage,
    onSuccess,
    onError,
    retryOnError = false,
    retryCount = 3
  } = config;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { toast } = useToast();

  /**
   * Execute secure API call
   */
  const execute = useCallback(
    async (
      queryFn: () => Promise<{ data: T | null; error: unknown }>,
      inputData?: Record<string, unknown>
    ): Promise<ApiResponse<T>> => {
      // Check RBAC permissions
      if (requiredPermission) {
        const hasPermission = rbac.can(
          requiredPermission.action,
          requiredPermission.resource,
          requiredPermission.resourceData || inputData
        );

        if (!hasPermission) {
          const permissionError = new ApiError(
            'You do not have permission to perform this action',
            'PERMISSION_DENIED',
            403
          );
          setError(permissionError);

          if (showErrorToast) {
            toast({
              title: 'Permission Denied',
              description: 'You do not have permission to perform this action',
              variant: 'destructive'
            });
          }

          return { error: permissionError };
        }
      }

      // Check rate limit
      if (rateLimit) {
        const rateLimitConfig = typeof rateLimit === 'string'
          ? RateLimitPresets[rateLimit]
          : rateLimit;

        const limitCheck = rateLimiter.checkLimit(rateLimitConfig);

        if (!limitCheck.allowed) {
          const rateLimitError = new ApiError(
            `Rate limit exceeded. Try again in ${Math.ceil(limitCheck.retryAfter! / 1000)} seconds`,
            'RATE_LIMIT_EXCEEDED',
            429,
            { retryAfter: limitCheck.retryAfter }
          );
          setError(rateLimitError);

          if (showErrorToast) {
            toast({
              title: 'Too Many Requests',
              description: rateLimitError.message,
              variant: 'destructive'
            });
          }

          return { error: rateLimitError };
        }
      }

      // Sanitize input data
      let sanitizedInput = inputData;
      if (sanitizeInput && inputData) {
        if (typeof inputData === 'string') {
          sanitizedInput = sanitizeText(inputData);

          // Check for SQL injection
          if (checkSQLInjection && hasSQLInjectionPattern(inputData)) {
            const injectionError = new ApiError(
              'Invalid input detected',
              'INVALID_INPUT',
              400
            );
            setError(injectionError);

            if (showErrorToast) {
              toast({
                title: 'Invalid Input',
                description: 'Your input contains invalid characters',
                variant: 'destructive'
              });
            }

            logger.warn('Potential SQL injection attempt blocked');
            return { error: injectionError };
          }
        } else if (typeof inputData === 'object') {
          sanitizedInput = sanitizeObjectInput(inputData, checkSQLInjection);
        }
      }

      setLoading(true);
      setError(null);

      try {
        // Execute the query with retry logic if enabled
        const result = retryOnError
          ? await apiClient.retryQuery(queryFn, retryCount)
          : await apiClient.query(queryFn);

        if (result.error) {
          setError(result.error);

          if (showErrorToast) {
            toast({
              title: 'Error',
              description: errorMessage || result.error.message,
              variant: 'destructive'
            });
          }

          onError?.(result.error);
        } else if (result.data) {
          // Sanitize output if needed
          let processedData = result.data;
          if (sanitizeOutput) {
            processedData = sanitizeObjectOutput(result.data);
          }

          setData(processedData);

          if (showSuccessToast) {
            toast({
              title: 'Success',
              description: successMessage
            });
          }

          onSuccess?.(processedData);
        }

        return result;
      } catch (unexpectedError) {
        logger.error('Unexpected error in secure API call:', unexpectedError);
        const apiError = new ApiError(
          'An unexpected error occurred',
          'UNEXPECTED_ERROR',
          500
        );
        setError(apiError);

        if (showErrorToast) {
          toast({
            title: 'Error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive'
          });
        }

        return { error: apiError };
      } finally {
        setLoading(false);
      }
    },
    [
      rateLimit,
      requiredPermission,
      sanitizeInput,
      sanitizeOutput,
      checkSQLInjection,
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      retryOnError,
      retryCount,
      toast
    ]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
}

/**
 * Sanitize object input recursively
 * @param {any} obj - Object to sanitize
 * @param {boolean} checkSQL - Check for SQL injection
 * @returns {any} Sanitized object
 */
function sanitizeObjectInput(obj: unknown, checkSQL: boolean): unknown {
  if (typeof obj === 'string') {
    if (checkSQL && hasSQLInjectionPattern(obj)) {
      throw new Error('Invalid input detected');
    }
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectInput(item, checkSQL));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      // Sanitize the key as well
      const sanitizedKey = sanitizeText(key);
      if (checkSQL && hasSQLInjectionPattern(key)) {
        throw new Error('Invalid input detected');
      }
      sanitized[sanitizedKey] = sanitizeObjectInput(obj[key], checkSQL);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize object output recursively
 * @param {any} obj - Object to sanitize
 * @returns {any} Sanitized object
 */
function sanitizeObjectOutput(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Check if it looks like HTML
    if (/<[^>]*>/g.test(obj)) {
      return sanitizeHTML(obj);
    }
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectOutput);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObjectOutput(obj[key]);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Hook for secure mutations
 * @template T - Response data type
 * @param {SecureApiConfig} [config={}] - Security configuration
 * @returns {SecureApiReturn<T>} Secure mutation interface
 */
export function useSecureMutation<T = unknown>(config: SecureApiConfig = {}) {
  return useSecureApi<T>({
    showSuccessToast: true,
    showErrorToast: true,
    rateLimit: 'form',
    sanitizeInput: true,
    checkSQLInjection: true,
    ...config
  });
}

/**
 * Hook for secure queries
 * @template T - Response data type
 * @param {SecureApiConfig} [config={}] - Security configuration
 * @returns {SecureApiReturn<T>} Secure query interface
 */
export function useSecureQuery<T = unknown>(config: SecureApiConfig = {}) {
  return useSecureApi<T>({
    showSuccessToast: false,
    showErrorToast: true,
    rateLimit: 'api',
    retryOnError: true,
    sanitizeOutput: true,
    ...config
  });
}