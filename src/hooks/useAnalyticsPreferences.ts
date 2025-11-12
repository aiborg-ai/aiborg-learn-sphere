/**
 * Analytics Preferences Hooks
 * React Query hooks for managing user analytics preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnalyticsPreferencesService } from '@/services/AnalyticsPreferencesService';
import type { AnalyticsPreferences, AnalyticsPreferencesUpdate } from '@/types';
import { logger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

// Query keys factory
export const analyticsPreferencesKeys = {
  all: ['analytics-preferences'] as const,
  user: (userId: string) => [...analyticsPreferencesKeys.all, userId] as const,
};

/**
 * Hook to get analytics preferences for current user
 *
 * @example
 * ```tsx
 * const { data: preferences, isLoading } = useAnalyticsPreferences(user.id);
 *
 * if (preferences?.real_time_enabled) {
 *   // Enable real-time subscriptions
 * }
 * ```
 */
export function useAnalyticsPreferences(userId: string) {
  return useQuery({
    queryKey: analyticsPreferencesKeys.user(userId),
    queryFn: () => AnalyticsPreferencesService.getPreferences(userId),
    staleTime: 1000 * 60 * 15, // 15 minutes - preferences don't change often
    enabled: !!userId,
  });
}

/**
 * Mutation hook to update analytics preferences
 *
 * @example
 * ```tsx
 * const { mutate: updatePrefs } = useUpdateAnalyticsPreferences(user.id);
 *
 * updatePrefs({
 *   auto_refresh_interval: 180000,
 *   real_time_enabled: true
 * });
 * ```
 */
export function useUpdateAnalyticsPreferences(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: AnalyticsPreferencesUpdate) =>
      AnalyticsPreferencesService.updatePreferences(userId, updates),
    onMutate: async updates => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: analyticsPreferencesKeys.user(userId) });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData<AnalyticsPreferences>(
        analyticsPreferencesKeys.user(userId)
      );

      // Optimistically update to the new value
      if (previousPreferences) {
        queryClient.setQueryData<AnalyticsPreferences>(analyticsPreferencesKeys.user(userId), {
          ...previousPreferences,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      // Return context with the snapshot
      return { previousPreferences };
    },
    onError: (error, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          analyticsPreferencesKeys.user(userId),
          context.previousPreferences
        );
      }

      logger.error('Error updating analytics preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Preferences',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
    onSuccess: () => {
      logger.info('Analytics preferences updated successfully');
      toast({
        title: 'Preferences Updated',
        description: 'Your analytics preferences have been saved',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: analyticsPreferencesKeys.user(userId) });
    },
  });
}

/**
 * Mutation hook to reset preferences to defaults
 *
 * @example
 * ```tsx
 * const { mutate: resetPrefs } = useResetAnalyticsPreferences(user.id);
 *
 * resetPrefs();
 * ```
 */
export function useResetAnalyticsPreferences(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AnalyticsPreferencesService.resetToDefaults(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsPreferencesKeys.user(userId) });
      logger.info('Analytics preferences reset to defaults');
      toast({
        title: 'Preferences Reset',
        description: 'Your analytics preferences have been reset to defaults',
      });
    },
    onError: error => {
      logger.error('Error resetting analytics preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Reset Preferences',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

/**
 * Hook to get default preferences object (not from DB)
 *
 * Useful for displaying default values in forms before user has saved preferences
 */
export function useDefaultPreferences() {
  return AnalyticsPreferencesService.getDefaultPreferencesObject();
}

/**
 * Hook to get refresh interval options for UI
 *
 * @example
 * ```tsx
 * const intervals = useRefreshIntervalOptions();
 *
 * return (
 *   <select>
 *     {intervals.map(option => (
 *       <option key={option.value} value={option.value}>
 *         {option.label}
 *       </option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useRefreshIntervalOptions() {
  return AnalyticsPreferencesService.getRefreshIntervalOptions();
}

/**
 * Hook to validate preferences before saving
 *
 * @example
 * ```tsx
 * const validate = useValidatePreferences();
 *
 * const result = validate(formData);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function useValidatePreferences() {
  return (preferences: AnalyticsPreferencesUpdate) =>
    AnalyticsPreferencesService.validatePreferences(preferences);
}

/**
 * Hook to check if a specific page should refresh based on preferences
 *
 * @example
 * ```tsx
 * const { data: preferences } = useAnalyticsPreferences(user.id);
 * const shouldRefresh = useShouldRefreshPage(preferences, 'chatbot');
 *
 * useAutoRefresh({
 *   enabled: shouldRefresh,
 *   // ...
 * });
 * ```
 */
export function useShouldRefreshPage(
  preferences: AnalyticsPreferences | undefined,
  page: 'chatbot' | 'learner' | 'manager'
): boolean {
  if (!preferences) return false;
  return AnalyticsPreferencesService.shouldRefreshPage(preferences, page);
}

/**
 * Hook to get formatted refresh interval label
 *
 * @example
 * ```tsx
 * const label = useRefreshIntervalLabel(180000);
 * // Returns: "3 minutes"
 * ```
 */
export function useRefreshIntervalLabel(milliseconds: number): string {
  return AnalyticsPreferencesService.getRefreshIntervalLabel(milliseconds);
}
