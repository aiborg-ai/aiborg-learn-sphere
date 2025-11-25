/**
 * usePredictiveAnalytics Hook
 * Manages predictive analytics and forecasting
 */

import { useState, useCallback } from 'react';
import {
  ForecastingService,
  type ForecastResult,
  type RevenueData,
  type UserData,
  type EnrollmentData,
} from '@/services/analytics/ForecastingService';
import { logger } from '@/utils/logger';

export interface PredictiveAnalyticsState {
  revenue: {
    data: ForecastResult | null;
    loading: boolean;
    error: string | null;
  };
  userGrowth: {
    data: ForecastResult | null;
    loading: boolean;
    error: string | null;
  };
  enrollments: {
    data: ForecastResult | null;
    loading: boolean;
    error: string | null;
  };
}

export interface UsePredictiveAnalyticsReturn {
  forecastRevenue: (historicalData: RevenueData[], days: 30 | 60 | 90) => Promise<void>;
  forecastUserGrowth: (historicalData: UserData[], days: 30 | 60 | 90) => Promise<void>;
  forecastEnrollments: (historicalData: EnrollmentData[], days: 30 | 60 | 90) => Promise<void>;
  state: PredictiveAnalyticsState;
  hasInsufficientData: (type: 'revenue' | 'userGrowth' | 'enrollments') => boolean;
  getQualityDescription: (type: 'revenue' | 'userGrowth' | 'enrollments') => string | null;
  reset: () => void;
}

const INITIAL_STATE: PredictiveAnalyticsState = {
  revenue: {
    data: null,
    loading: false,
    error: null,
  },
  userGrowth: {
    data: null,
    loading: false,
    error: null,
  },
  enrollments: {
    data: null,
    loading: false,
    error: null,
  },
};

/**
 * Hook for managing predictive analytics and forecasting
 *
 * Features:
 * - Revenue forecasting (30, 60, 90 days)
 * - User growth forecasting
 * - Enrollment forecasting
 * - Confidence intervals and quality assessment
 * - Warning for insufficient historical data (<60 days)
 *
 * @example
 * ```tsx
 * const { forecastRevenue, state, hasInsufficientData } = usePredictiveAnalytics();
 *
 * // Check if enough data
 * if (hasInsufficientData('revenue')) {
 *   logger.warn('Need at least 60 days of historical data');
 * }
 *
 * // Forecast revenue for 30 days
 * await forecastRevenue(historicalData, 30);
 *
 * // Access forecast
 * logger.info(state.revenue.data?.forecast);
 * logger.info(state.revenue.data?.confidence); // R² value
 * logger.info(state.revenue.data?.quality); // 'excellent', 'good', 'fair', 'poor'
 * ```
 *
 * @returns Forecasting functions and state
 */
export function usePredictiveAnalytics(): UsePredictiveAnalyticsReturn {
  const [state, setState] = useState<PredictiveAnalyticsState>(INITIAL_STATE);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /**
   * Check if historical data is insufficient for forecasting
   */
  const hasInsufficientData = useCallback(
    (type: 'revenue' | 'userGrowth' | 'enrollments'): boolean => {
      const result = state[type].data;
      if (!result) return false;

      // Check if historical data has at least 60 points
      return result.historical.length < 60;
    },
    [state]
  );

  /**
   * Get quality description for forecast
   */
  const getQualityDescription = useCallback(
    (type: 'revenue' | 'userGrowth' | 'enrollments'): string | null => {
      const result = state[type].data;
      if (!result) return null;

      return ForecastingService.getForecastQualityDescription(result.quality);
    },
    [state]
  );

  /**
   * Forecast revenue for future periods
   */
  const forecastRevenue = useCallback(
    async (historicalData: RevenueData[], days: 30 | 60 | 90): Promise<void> => {
      try {
        setState(prev => ({
          ...prev,
          revenue: {
            ...prev.revenue,
            loading: true,
            error: null,
          },
        }));

        logger.info('Starting revenue forecast', { dataPoints: historicalData.length, days });

        const result = await ForecastingService.forecastRevenue(historicalData, days);

        setState(prev => ({
          ...prev,
          revenue: {
            data: result,
            loading: false,
            error: null,
          },
        }));

        logger.info('Revenue forecast completed', {
          confidence: result.confidence,
          quality: result.quality,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Revenue forecast failed:', error);

        setState(prev => ({
          ...prev,
          revenue: {
            data: null,
            loading: false,
            error: errorMessage,
          },
        }));
      }
    },
    []
  );

  /**
   * Forecast user growth for future periods
   */
  const forecastUserGrowth = useCallback(
    async (historicalData: UserData[], days: 30 | 60 | 90): Promise<void> => {
      try {
        setState(prev => ({
          ...prev,
          userGrowth: {
            ...prev.userGrowth,
            loading: true,
            error: null,
          },
        }));

        logger.info('Starting user growth forecast', { dataPoints: historicalData.length, days });

        const result = await ForecastingService.forecastUserGrowth(historicalData, days);

        setState(prev => ({
          ...prev,
          userGrowth: {
            data: result,
            loading: false,
            error: null,
          },
        }));

        logger.info('User growth forecast completed', {
          confidence: result.confidence,
          quality: result.quality,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('User growth forecast failed:', error);

        setState(prev => ({
          ...prev,
          userGrowth: {
            data: null,
            loading: false,
            error: errorMessage,
          },
        }));
      }
    },
    []
  );

  /**
   * Forecast enrollments for future periods
   */
  const forecastEnrollments = useCallback(
    async (historicalData: EnrollmentData[], days: 30 | 60 | 90): Promise<void> => {
      try {
        setState(prev => ({
          ...prev,
          enrollments: {
            ...prev.enrollments,
            loading: true,
            error: null,
          },
        }));

        logger.info('Starting enrollments forecast', { dataPoints: historicalData.length, days });

        const result = await ForecastingService.forecastEnrollments(historicalData, days);

        setState(prev => ({
          ...prev,
          enrollments: {
            data: result,
            loading: false,
            error: null,
          },
        }));

        logger.info('Enrollments forecast completed', {
          confidence: result.confidence,
          quality: result.quality,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Enrollments forecast failed:', error);

        setState(prev => ({
          ...prev,
          enrollments: {
            data: null,
            loading: false,
            error: errorMessage,
          },
        }));
      }
    },
    []
  );

  return {
    forecastRevenue,
    forecastUserGrowth,
    forecastEnrollments,
    state,
    hasInsufficientData,
    getQualityDescription,
    reset,
  };
}

/**
 * Get forecast quality color for UI display
 */
export function getForecastQualityColor(quality: ForecastResult['quality']): string {
  switch (quality) {
    case 'excellent':
      return 'text-green-600';
    case 'good':
      return 'text-blue-600';
    case 'fair':
      return 'text-yellow-600';
    case 'poor':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get forecast quality icon for UI display
 */
export function getForecastQualityIcon(quality: ForecastResult['quality']): string {
  switch (quality) {
    case 'excellent':
      return '✓';
    case 'good':
      return '✓';
    case 'fair':
      return '⚠';
    case 'poor':
      return '⚠';
    default:
      return '?';
  }
}

/**
 * Format confidence (R²) value as percentage
 */
export function formatConfidence(r2: number): string {
  return `${(r2 * 100).toFixed(1)}%`;
}
