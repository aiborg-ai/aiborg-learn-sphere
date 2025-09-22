import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiError, ApiResponse } from '@/lib/api-client';
import { logger } from '@/utils/logger';

/**
 * Configuration options for useApiCall hook
 * @interface UseApiCallOptions
 */
interface UseApiCallOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryOnError?: boolean;
  retryCount?: number;
}

/**
 * Return type for useApiCall hook
 * @template T - Type of the expected data
 * @interface UseApiCallReturn
 */
interface UseApiCallReturn<T> {
  /** Execute the API call with the provided query function */
  execute: (queryFn: () => Promise<{ data: T | null; error: any }>) => Promise<ApiResponse<T>>;
  /** Loading state indicator */
  loading: boolean;
  /** Error object if the call failed */
  error: ApiError | null;
  /** Response data if the call succeeded */
  data: T | null;
  /** Reset the hook state to initial values */
  reset: () => void;
}

/**
 * Custom hook for making API calls with standardized error handling and loading states
 * @template T - Type of the expected response data
 * @param {UseApiCallOptions} [options={}] - Configuration options
 * @returns {UseApiCallReturn<T>} Object containing execute function and state
 * @example
 * const { execute, loading, error, data } = useApiCall<User[]>({
 *   showSuccessToast: true,
 *   successMessage: 'Users loaded successfully',
 *   onSuccess: (users) => console.log('Loaded', users.length, 'users')
 * });
 *
 * await execute(() => supabase.from('users').select());
 */
export function useApiCall<T = any>(
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation successful',
    errorMessage,
    onSuccess,
    onError,
    retryOnError = false,
    retryCount = 3,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { toast } = useToast();

  /**
   * Execute the API call with optional retry logic and toast notifications
   * @param {Function} queryFn - Query function that returns data and error
   * @returns {Promise<ApiResponse<T>>} The API response
   */
  const execute = useCallback(
    async (queryFn: () => Promise<{ data: T | null; error: any }>) => {
      setLoading(true);
      setError(null);

      try {
        const result = retryOnError
          ? await apiClient.retryQuery(queryFn, retryCount)
          : await apiClient.query(queryFn);

        if (result.error) {
          setError(result.error);

          if (showErrorToast) {
            toast({
              title: 'Error',
              description: errorMessage || result.error.message,
              variant: 'destructive',
            });
          }

          onError?.(result.error);
        } else if (result.data) {
          setData(result.data);

          if (showSuccessToast) {
            toast({
              title: 'Success',
              description: successMessage,
            });
          }

          onSuccess?.(result.data);
        }

        return result;
      } catch (unexpectedError) {
        logger.error('Unexpected error in useApiCall:', unexpectedError);
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
            variant: 'destructive',
          });
        }

        return { error: apiError };
      } finally {
        setLoading(false);
      }
    },
    [
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      retryOnError,
      retryCount,
      toast,
    ]
  );

  /**
   * Reset all state to initial values
   * @returns {void}
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
}

/**
 * Specialized hook for mutation operations (create, update, delete)
 * Automatically shows success and error toasts
 * @template T - Type of the expected response data
 * @param {UseApiCallOptions} [options={}] - Configuration options
 * @returns {UseApiCallReturn<T>} Object containing execute function and state
 * @example
 * const createUser = useMutation<User>({
 *   successMessage: 'User created successfully',
 *   onSuccess: (user) => navigate(`/users/${user.id}`)
 * });
 *
 * await createUser.execute(() =>
 *   supabase.from('users').insert({ name, email })
 * );
 */
export function useMutation<T = any>(options: UseApiCallOptions = {}) {
  return useApiCall<T>({
    showSuccessToast: true,
    showErrorToast: true,
    ...options,
  });
}

/**
 * Specialized hook for query operations (read/fetch)
 * Includes automatic retry logic and only shows error toasts
 * @template T - Type of the expected response data
 * @param {UseApiCallOptions} [options={}] - Configuration options
 * @returns {UseApiCallReturn<T>} Object containing execute function and state
 * @example
 * const fetchUsers = useQuery<User[]>({
 *   retryOnError: true,
 *   retryCount: 3,
 *   onSuccess: (users) => setUserList(users)
 * });
 *
 * useEffect(() => {
 *   fetchUsers.execute(() => supabase.from('users').select());
 * }, []);
 */
export function useQuery<T = any>(options: UseApiCallOptions = {}) {
  return useApiCall<T>({
    showSuccessToast: false,
    showErrorToast: true,
    retryOnError: true,
    ...options,
  });
}