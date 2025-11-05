/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

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
  startDate: Date | null;
  endDate: Date | null;
  preset: PresetOption | null;
  setDateRange: (startDate: Date | null, endDate: Date | null) => void;
  setPreset: (preset: PresetOption) => void;
  clearDateRange: () => void;
  getDateRangeString: () => string;
  isDateRangeValid: () => boolean;
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
  } catch (error) {
    logger.error('Error loading date range from storage:', error);
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
  } catch (error) {
    logger.error('Error saving date range to storage:', error);
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
  const [dateRange, setDateRangeState] = useState<DateRangeState>(() => loadFromStorage());

  // Persist to sessionStorage whenever date range changes
  useEffect(() => {
    saveToStorage(dateRange);
  }, [dateRange]);

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

  return (
    <DateRangeContext.Provider
      value={{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        preset: dateRange.preset,
        setDateRange,
        setPreset,
        clearDateRange,
        getDateRangeString,
        isDateRangeValid,
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
