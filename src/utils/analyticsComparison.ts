/**
 * Analytics Comparison Utilities
 * Helper functions for comparing current and previous period analytics data
 */

import type { DateRange, AnalyticsDataWithComparison } from '@/types';

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate absolute delta between two values
 */
export function calculateDelta(current: number, previous: number): number {
  return current - previous;
}

/**
 * Wrap analytics data with comparison metrics
 */
export function withComparison<T extends Record<string, any>>(
  current: T,
  comparison: T | null,
  valueKey: keyof T
): AnalyticsDataWithComparison<T> {
  if (!comparison) {
    return {
      current,
      comparison: null,
      delta: undefined,
      percentageChange: undefined,
    };
  }

  const currentValue = Number(current[valueKey]);
  const comparisonValue = Number(comparison[valueKey]);

  return {
    current,
    comparison,
    delta: calculateDelta(currentValue, comparisonValue),
    percentageChange: calculatePercentageChange(currentValue, comparisonValue),
  };
}

/**
 * Wrap array of analytics data with comparison metrics
 */
export function withComparisonArray<T extends Record<string, any>>(
  currentArray: T[],
  comparisonArray: T[] | null,
  valueKey: keyof T,
  matchKey: keyof T = 'id' as keyof T
): Array<AnalyticsDataWithComparison<T>> {
  if (!comparisonArray || comparisonArray.length === 0) {
    return currentArray.map(item => ({
      current: item,
      comparison: null,
      delta: undefined,
      percentageChange: undefined,
    }));
  }

  return currentArray.map(currentItem => {
    // Find matching comparison item by key
    const comparisonItem = comparisonArray.find(item => item[matchKey] === currentItem[matchKey]);

    if (!comparisonItem) {
      return {
        current: currentItem,
        comparison: null,
        delta: undefined,
        percentageChange: undefined,
      };
    }

    const currentValue = Number(currentItem[valueKey]);
    const comparisonValue = Number(comparisonItem[valueKey]);

    return {
      current: currentItem,
      comparison: comparisonItem,
      delta: calculateDelta(currentValue, comparisonValue),
      percentageChange: calculatePercentageChange(currentValue, comparisonValue),
    };
  });
}

/**
 * Format comparison date range params for Supabase queries
 */
export function formatDateRangeForQuery(dateRange: DateRange | null): {
  start: string;
  end: string;
} | null {
  if (!dateRange) return null;

  return {
    start: dateRange.start,
    end: dateRange.end,
  };
}

/**
 * Get trend indicator based on percentage change
 */
export function getTrendIndicator(percentageChange: number | undefined): {
  direction: 'up' | 'down' | 'neutral';
  severity: 'high' | 'medium' | 'low';
} {
  if (percentageChange === undefined || percentageChange === 0) {
    return { direction: 'neutral', severity: 'low' };
  }

  const absChange = Math.abs(percentageChange);
  const direction = percentageChange > 0 ? 'up' : 'down';

  let severity: 'high' | 'medium' | 'low' = 'low';
  if (absChange >= 50) severity = 'high';
  else if (absChange >= 20) severity = 'medium';

  return { direction, severity };
}

/**
 * Format percentage change for display
 */
export function formatPercentageChange(
  percentageChange: number | undefined,
  includeSign: boolean = true
): string {
  if (percentageChange === undefined) return 'N/A';

  const sign = includeSign && percentageChange > 0 ? '+' : '';
  return `${sign}${percentageChange.toFixed(1)}%`;
}

/**
 * Format delta for display
 */
export function formatDelta(delta: number | undefined, includeSign: boolean = true): string {
  if (delta === undefined) return 'N/A';

  const sign = includeSign && delta > 0 ? '+' : '';
  return `${sign}${delta.toLocaleString()}`;
}
