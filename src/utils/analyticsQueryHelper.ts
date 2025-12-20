/**
 * Analytics Query Helper
 * Utilities for executing analytics queries with comparison support
 */

import { supabase } from '@/integrations/supabase/client';
import type { DateRange, AnalyticsDataWithComparison } from '@/types';
import { withComparison } from './analyticsComparison';
import { logger } from '@/utils/logger';

/**
 * Execute a query for both current and comparison periods
 */
export async function executeComparisonQuery<T extends Record<string, unknown>>(
  tableName: string,
  dateRange: DateRange,
  comparisonDateRange: DateRange | null,
  selectFields: string = '*',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalFilters?: (query: any) => any
): Promise<{
  current: T[];
  comparison: T[] | null;
}> {
  // Build base query
  let currentQuery = supabase
    .from(tableName)
    .select(selectFields)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  // Apply additional filters
  if (additionalFilters) {
    currentQuery = additionalFilters(currentQuery);
  }

  // Execute current period query
  const { data: currentData, error: currentError } = await currentQuery;

  if (currentError) throw currentError;

  // If no comparison needed, return early
  if (!comparisonDateRange) {
    return {
      current: currentData || [],
      comparison: null,
    };
  }

  // Build comparison query
  let comparisonQuery = supabase
    .from(tableName)
    .select(selectFields)
    .gte('created_at', comparisonDateRange.start)
    .lte('created_at', comparisonDateRange.end);

  // Apply same additional filters
  if (additionalFilters) {
    comparisonQuery = additionalFilters(comparisonQuery);
  }

  // Execute comparison period query
  const { data: comparisonData, error: comparisonError } = await comparisonQuery;

  if (comparisonError) {
    logger.error('Comparison query error:', comparisonError);
    // Don't fail the whole request, just return without comparison
    return {
      current: currentData || [],
      comparison: null,
    };
  }

  return {
    current: currentData || [],
    comparison: comparisonData || null,
  };
}

/**
 * Execute an aggregate query with comparison
 */
export async function executeComparisonAggregateQuery<T = unknown>(
  query: string,
  currentParams: Record<string, unknown>,
  comparisonParams: Record<string, unknown> | null
): Promise<{
  current: T;
  comparison: T | null;
}> {
  // Execute current period query
  const { data: currentData, error: currentError } = await supabase.rpc(query, currentParams);

  if (currentError) throw currentError;

  // If no comparison needed, return early
  if (!comparisonParams) {
    return {
      current: currentData,
      comparison: null,
    };
  }

  // Execute comparison period query
  const { data: comparisonData, error: comparisonError } = await supabase.rpc(
    query,
    comparisonParams
  );

  if (comparisonError) {
    logger.error('Comparison query error:', comparisonError);
    return {
      current: currentData,
      comparison: null,
    };
  }

  return {
    current: currentData,
    comparison: comparisonData,
  };
}

/**
 * Example: Get session analytics with comparison
 */
export async function getSessionAnalyticsWithComparison(
  dateRange: DateRange,
  comparisonDateRange: DateRange | null,
  userId?: string
): Promise<AnalyticsDataWithComparison<{ count: number; avgDuration: number }>> {
  const buildQuery = (start: string, end: string) => {
    let query = supabase.rpc('get_session_analytics', {
      start_date: start,
      end_date: end,
    });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    return query;
  };

  // Execute current period
  const { data: currentData, error: currentError } = await buildQuery(
    dateRange.start,
    dateRange.end
  );

  if (currentError) throw currentError;

  // If no comparison, return current only
  if (!comparisonDateRange) {
    return {
      current: currentData,
      comparison: null,
    };
  }

  // Execute comparison period
  const { data: comparisonData, error: comparisonError } = await buildQuery(
    comparisonDateRange.start,
    comparisonDateRange.end
  );

  if (comparisonError) {
    logger.error('Comparison query error:', comparisonError);
    return {
      current: currentData,
      comparison: null,
    };
  }

  // Wrap with comparison metrics
  return withComparison(currentData, comparisonData, 'count');
}
