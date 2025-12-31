/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Date range preset options
 */
export type PresetOption =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

/**
 * Date range state interface
 */
export interface DateRangeState {
  startDate: Date | null;
  endDate: Date | null;
  preset: PresetOption | null;
}

/**
 * Date range context interface
 */
interface DateRangeContextType {
  // Current date range
  startDate: Date | null;
  endDate: Date | null;
  preset: PresetOption | null;
  setDateRange: (startDate: Date | null, endDate: Date | null) => void;
  setPreset: (preset: PresetOption) => void;
  clearDateRange: () => void;
  getDateRangeString: () => string;
  isDateRangeValid: () => boolean;

  // Comparison mode
  comparisonEnabled: boolean;
  comparisonStartDate: Date | null;
  comparisonEndDate: Date | null;
  toggleComparison: (enabled?: boolean) => void;
  getComparisonDateRangeString: () => string;

  // Preferences
  saveToPreferences: () => Promise<void>;
  loadFromPreferences: () => Promise<void>;
  isSavingPreferences: boolean;
  isLoadingPreferences: boolean;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

/**
 * Hook to access date range context
 *
 * Provides methods to manage date ranges for analytics filtering
 *
 * @example
 * ```tsx
 * const { startDate, endDate, setPreset } = useDateRange();
 *
 * // Set a preset range
 * setPreset('last30days');
 *
 * // Set custom range
 * setDateRange(new Date('2025-01-01'), new Date('2025-01-31'));
 * ```
 *
 * @throws Error if used outside DateRangeProvider
 * @returns Date range context value
 */
export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

/**
 * Session storage key for date range persistence
 */
const STORAGE_KEY = 'aiborg-analytics-date-range';

/**
 * Load date range from sessionStorage
 */
const loadFromStorage = (): DateRangeState => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        preset: parsed.preset || null,
      };
    }
  } catch (_error) {
    logger._error('Error loading date range from storage:', _error);
  }

  // Default: last 30 days
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    startDate: start,
    endDate: end,
    preset: 'last30days',
  };
};

/**
 * Save date range to sessionStorage
 */
const saveToStorage = (state: DateRangeState): void => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startDate: state.startDate?.toISOString() || null,
        endDate: state.endDate?.toISOString() || null,
        preset: state.preset,
      })
    );
  } catch (_error) {
    logger._error('Error saving date range to storage:', _error);
  }
};

/**
 * Calculate comparison period dates (previous period of equal length)
 */
export const getComparisonPeriodDates = (
  startDate: Date,
  endDate: Date
): { start: Date; end: Date } => {
  const durationMs = endDate.getTime() - startDate.getTime();
  const comparisonEnd = new Date(startDate.getTime() - 1); // Day before current start
  const comparisonStart = new Date(comparisonEnd.getTime() - durationMs);

  // Set proper time boundaries
  comparisonStart.setHours(0, 0, 0, 0);
  comparisonEnd.setHours(23, 59, 59, 999);

  return { start: comparisonStart, end: comparisonEnd };
};

/**
 * Serialize date range to URL-friendly format
 */
export const serializeDateRangeToURL = (
  startDate: Date | null,
  endDate: Date | null,
  preset: PresetOption | null
): URLSearchParams => {
  const params = new URLSearchParams();

  if (startDate) {
    params.set('startDate', startDate.toISOString().split('T')[0]);
  }
  if (endDate) {
    params.set('endDate', endDate.toISOString().split('T')[0]);
  }
  if (preset && preset !== 'custom') {
    params.set('preset', preset);
  }

  return params;
};

/**
 * Deserialize date range from URL parameters
 */
export const deserializeDateRangeFromURL = (
  searchParams: URLSearchParams
): DateRangeState | null => {
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const presetStr = searchParams.get('preset') as PresetOption | null;

  if (!startDateStr || !endDateStr) {
    return null;
  }

  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null;
    }

    return {
      startDate,
      endDate,
      preset: presetStr || 'custom',
    };
  } catch (_error) {
    logger._error('Error deserializing date range from URL:', _error);
    return null;
  }
};

/**
 * Calculate dates for preset options
 */
export const getPresetDates = (preset: PresetOption): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of today

  const start = new Date();
  start.setHours(0, 0, 0, 0); // Start of today

  switch (preset) {
    case 'today':
      return { start, end };

    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      return { start, end };

    case 'last7days':
      start.setDate(start.getDate() - 7);
      return { start, end };

    case 'last30days':
      start.setDate(start.getDate() - 30);
      return { start, end };

    case 'last90days':
      start.setDate(start.getDate() - 90);
      return { start, end };

    case 'thisMonth':
      start.setDate(1); // First day of current month
      return { start, end };

    case 'lastMonth': {
      const lastMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);
      const lastMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      return { start: lastMonthStart, end: lastMonthEnd };
    }

    case 'thisYear':
      start.setMonth(0, 1); // January 1st
      return { start, end };

    case 'custom':
    default:
      return { start, end };
  }
};

interface DateRangeProviderProps {
  children: ReactNode;
}

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRangeState] = useState<DateRangeState>(() => {
    // Priority: URL params > sessionStorage > default
    const urlState = deserializeDateRangeFromURL(searchParams);
    if (urlState) {
      return urlState;
    }
    return loadFromStorage();
  });

  const [comparisonEnabled, setComparisonEnabled] = useState<boolean>(false);
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | null>(null);
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  // Auto-calculate comparison dates when date range or comparison mode changes
  useEffect(() => {
    if (comparisonEnabled && dateRange.startDate && dateRange.endDate) {
      const { start, end } = getComparisonPeriodDates(dateRange.startDate, dateRange.endDate);
      setComparisonStartDate(start);
      setComparisonEndDate(end);
    } else {
      setComparisonStartDate(null);
      setComparisonEndDate(null);
    }
  }, [comparisonEnabled, dateRange.startDate, dateRange.endDate]);

  // Sync to URL and sessionStorage whenever date range changes
  useEffect(() => {
    // Save to sessionStorage
    saveToStorage(dateRange);

    // Update URL parameters immediately
    if (dateRange.startDate && dateRange.endDate) {
      const params = serializeDateRangeToURL(
        dateRange.startDate,
        dateRange.endDate,
        dateRange.preset
      );

      // Preserve existing non-date params
      const currentParams = new URLSearchParams(searchParams);
      const keysToKeep = Array.from(currentParams.keys()).filter(
        key => !['startDate', 'endDate', 'preset'].includes(key)
      );

      keysToKeep.forEach(key => {
        const value = currentParams.get(key);
        if (value) params.set(key, value);
      });

      setSearchParams(params, { replace: true });
    }
  }, [dateRange, setSearchParams, searchParams]);

  /**
   * Set custom date range
   */
  const setDateRange = (startDate: Date | null, endDate: Date | null) => {
    setDateRangeState({
      startDate,
      endDate,
      preset: 'custom',
    });
  };

  /**
   * Set date range using preset
   */
  const setPreset = (preset: PresetOption) => {
    if (preset === 'custom') {
      // Don't auto-calculate dates for custom preset
      setDateRangeState({
        startDate: null,
        endDate: null,
        preset: 'custom',
      });
      return;
    }

    const { start, end } = getPresetDates(preset);
    setDateRangeState({
      startDate: start,
      endDate: end,
      preset,
    });
  };

  /**
   * Clear date range and reset to default (last 30 days)
   */
  const clearDateRange = () => {
    const { start, end } = getPresetDates('last30days');
    setDateRangeState({
      startDate: start,
      endDate: end,
      preset: 'last30days',
    });
  };

  /**
   * Get formatted date range string for display
   */
  const getDateRangeString = (): string => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return 'No date range selected';
    }

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  };

  /**
   * Check if current date range is valid
   */
  const isDateRangeValid = (): boolean => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return false;
    }

    // Start date must be before or equal to end date
    if (dateRange.startDate > dateRange.endDate) {
      return false;
    }

    // End date cannot be in the future
    const now = new Date();
    if (dateRange.endDate > now) {
      return false;
    }

    return true;
  };

  /**
   * Toggle comparison mode
   */
  const toggleComparison = useCallback((enabled?: boolean) => {
    setComparisonEnabled(prev => (enabled !== undefined ? enabled : !prev));
  }, []);

  /**
   * Get formatted comparison date range string
   */
  const getComparisonDateRangeString = useCallback((): string => {
    if (!comparisonStartDate || !comparisonEndDate) {
      return 'No comparison period';
    }

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return `${formatDate(comparisonStartDate)} - ${formatDate(comparisonEndDate)}`;
  }, [comparisonStartDate, comparisonEndDate]);

  /**
   * Save current date range to user preferences
   */
  const saveToPreferences = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate || !dateRange.preset) {
      logger.warn('Cannot save incomplete date range to preferences');
      return;
    }

    setIsSavingPreferences(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No user logged in, cannot save preferences');
        return;
      }

      const { error } = await supabase.rpc('save_last_used_date_range', {
        target_user_id: user.id,
        preset_value: dateRange.preset,
        start_date: dateRange.startDate.toISOString().split('T')[0],
        end_date: dateRange.endDate.toISOString().split('T')[0],
      });

      if (error) {
        logger.error('Error saving date range preferences:', error);
        throw error;
      }

      logger.info('Date range preferences saved successfully');
    } catch (_error) {
      logger._error('Failed to save date range preferences:', _error);
    } finally {
      setIsSavingPreferences(false);
    }
  }, [dateRange]);

  /**
   * Load last used date range from user preferences
   */
  const loadFromPreferences = useCallback(async () => {
    setIsLoadingPreferences(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No user logged in, cannot load preferences');
        return;
      }

      const { data, error } = await supabase.rpc('get_last_used_date_range', {
        target_user_id: user.id,
      });

      if (error) {
        logger.error('Error loading date range preferences:', error);
        throw error;
      }

      if (data && data.preset && data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        setDateRangeState({
          startDate,
          endDate,
          preset: data.preset as PresetOption,
        });

        logger.info('Date range preferences loaded successfully');
      }
    } catch (_error) {
      logger._error('Failed to load date range preferences:', _error);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  // Auto-load preferences on mount (if no URL params)
  useEffect(() => {
    const urlState = deserializeDateRangeFromURL(searchParams);
    if (!urlState) {
      loadFromPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <DateRangeContext.Provider
      value={{
        // Current date range
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        preset: dateRange.preset,
        setDateRange,
        setPreset,
        clearDateRange,
        getDateRangeString,
        isDateRangeValid,

        // Comparison mode
        comparisonEnabled,
        comparisonStartDate,
        comparisonEndDate,
        toggleComparison,
        getComparisonDateRangeString,

        // Preferences
        saveToPreferences,
        loadFromPreferences,
        isSavingPreferences,
        isLoadingPreferences,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  );
};

/**
 * Preset configuration with display labels
 */
export const PRESET_CONFIG: Record<PresetOption, { label: string; description: string }> = {
  today: {
    label: 'Today',
    description: 'Data from today only',
  },
  yesterday: {
    label: 'Yesterday',
    description: 'Data from yesterday',
  },
  last7days: {
    label: 'Last 7 Days',
    description: 'Data from the past week',
  },
  last30days: {
    label: 'Last 30 Days',
    description: 'Data from the past month',
  },
  last90days: {
    label: 'Last 90 Days',
    description: 'Data from the past quarter',
  },
  thisMonth: {
    label: 'This Month',
    description: 'Data from the current month',
  },
  lastMonth: {
    label: 'Last Month',
    description: 'Data from the previous month',
  },
  thisYear: {
    label: 'This Year',
    description: 'Data from the current year',
  },
  custom: {
    label: 'Custom Range',
    description: 'Select custom date range',
  },
};

/**
 * Get preset label for display
 */
export const getPresetLabel = (preset: PresetOption | null): string => {
  if (!preset) return 'No preset';
  return PRESET_CONFIG[preset]?.label || preset;
};

/**
 * Get all available presets as options
 */
export const getPresetOptions = (): Array<{
  value: PresetOption;
  label: string;
  description: string;
}> => {
  return Object.entries(PRESET_CONFIG).map(([value, config]) => ({
    value: value as PresetOption,
    label: config.label,
    description: config.description,
  }));
};
