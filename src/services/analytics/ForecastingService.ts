/**
 * Forecasting Service
 * Provides revenue, user growth, and enrollment forecasting using linear regression
 */

import {
  linearRegression,
  predict,
  confidenceInterval,
  assessModelQuality,
} from '@/utils/forecasting/linearRegression';
import { logger } from '@/utils/logger';

export interface ForecastResult {
  historical: Array<{ date: string; value: number }>;
  forecast: Array<{ date: string; value: number; lower: number; upper: number }>;
  confidence: number; // R² value
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface UserData {
  date: string;
  userCount: number;
}

export interface EnrollmentData {
  date: string;
  enrollmentCount: number;
}

export class ForecastingService {
  /**
   * Minimum number of data points required for forecasting
   */
  private static readonly MIN_DATA_POINTS = 60;

  /**
   * Convert date string to numeric value (days since epoch)
   */
  private static dateToDays(dateString: string): number {
    return Math.floor(new Date(dateString).getTime() / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert days since epoch to date string
   */
  private static daysToDate(days: number): string {
    const date = new Date(days * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  /**
   * Validate historical data has enough points
   */
  private static validateData(data: unknown[], minPoints: number = this.MIN_DATA_POINTS): void {
    if (!data || data.length < minPoints) {
      throw new Error(
        `Insufficient data for forecasting. Need at least ${minPoints} days of historical data, got ${data?.length || 0}`
      );
    }
  }

  /**
   * Forecast revenue for future periods
   * @param historicalData - Historical revenue data with date and amount
   * @param days - Number of days to forecast (30, 60, or 90)
   * @returns Forecast result with historical and predicted values
   */
  static async forecastRevenue(
    historicalData: RevenueData[],
    days: 30 | 60 | 90
  ): Promise<ForecastResult> {
    try {
      // Validate data
      this.validateData(historicalData);

      // Convert dates to numeric values
      const dataPoints = historicalData.map(d => ({
        x: this.dateToDays(d.date),
        y: d.amount,
      }));

      // Perform linear regression
      const regression = linearRegression(dataPoints);

      // Assess model quality
      const quality = assessModelQuality(regression.r2);

      // Generate future x values
      const lastX = dataPoints[dataPoints.length - 1].x;
      const futureX = Array.from({ length: days }, (_, i) => lastX + i + 1);

      // Generate predictions
      const predictions = predict(regression, futureX);

      // Calculate confidence intervals
      const intervals = confidenceInterval(
        regression,
        futureX,
        dataPoints,
        0.95 // 95% confidence level
      );

      // Format historical data
      const historical = historicalData.map(d => ({
        date: d.date,
        value: d.amount,
      }));

      // Format forecast data
      const forecast = predictions.map((value, index) => ({
        date: this.daysToDate(futureX[index]),
        value: Math.max(0, value), // Ensure non-negative revenue
        lower: Math.max(0, intervals[index].lower),
        upper: Math.max(0, intervals[index].upper),
      }));

      logger.info('Revenue forecast generated', {
        historicalPoints: historical.length,
        forecastDays: days,
        r2: regression.r2,
        quality,
      });

      return {
        historical,
        forecast,
        confidence: regression.r2,
        quality,
      };
    } catch (_error) {
      logger._error('Error forecasting revenue:', _error);
      throw error;
    }
  }

  /**
   * Forecast user growth for future periods
   * @param historicalData - Historical user count data with date and userCount
   * @param days - Number of days to forecast (30, 60, or 90)
   * @returns Forecast result with historical and predicted values
   */
  static async forecastUserGrowth(
    historicalData: UserData[],
    days: 30 | 60 | 90
  ): Promise<ForecastResult> {
    try {
      // Validate data
      this.validateData(historicalData);

      // Convert dates to numeric values
      const dataPoints = historicalData.map(d => ({
        x: this.dateToDays(d.date),
        y: d.userCount,
      }));

      // Perform linear regression
      const regression = linearRegression(dataPoints);

      // Assess model quality
      const quality = assessModelQuality(regression.r2);

      // Generate future x values
      const lastX = dataPoints[dataPoints.length - 1].x;
      const futureX = Array.from({ length: days }, (_, i) => lastX + i + 1);

      // Generate predictions
      const predictions = predict(regression, futureX);

      // Calculate confidence intervals
      const intervals = confidenceInterval(
        regression,
        futureX,
        dataPoints,
        0.95 // 95% confidence level
      );

      // Format historical data
      const historical = historicalData.map(d => ({
        date: d.date,
        value: d.userCount,
      }));

      // Format forecast data
      const forecast = predictions.map((value, index) => ({
        date: this.daysToDate(futureX[index]),
        value: Math.max(0, Math.round(value)), // Ensure non-negative integer users
        lower: Math.max(0, Math.round(intervals[index].lower)),
        upper: Math.max(0, Math.round(intervals[index].upper)),
      }));

      logger.info('User growth forecast generated', {
        historicalPoints: historical.length,
        forecastDays: days,
        r2: regression.r2,
        quality,
      });

      return {
        historical,
        forecast,
        confidence: regression.r2,
        quality,
      };
    } catch (_error) {
      logger._error('Error forecasting user growth:', _error);
      throw error;
    }
  }

  /**
   * Forecast enrollments for future periods
   * @param historicalData - Historical enrollment data with date and enrollmentCount
   * @param days - Number of days to forecast (30, 60, or 90)
   * @returns Forecast result with historical and predicted values
   */
  static async forecastEnrollments(
    historicalData: EnrollmentData[],
    days: 30 | 60 | 90
  ): Promise<ForecastResult> {
    try {
      // Validate data
      this.validateData(historicalData);

      // Convert dates to numeric values
      const dataPoints = historicalData.map(d => ({
        x: this.dateToDays(d.date),
        y: d.enrollmentCount,
      }));

      // Perform linear regression
      const regression = linearRegression(dataPoints);

      // Assess model quality
      const quality = assessModelQuality(regression.r2);

      // Generate future x values
      const lastX = dataPoints[dataPoints.length - 1].x;
      const futureX = Array.from({ length: days }, (_, i) => lastX + i + 1);

      // Generate predictions
      const predictions = predict(regression, futureX);

      // Calculate confidence intervals
      const intervals = confidenceInterval(
        regression,
        futureX,
        dataPoints,
        0.95 // 95% confidence level
      );

      // Format historical data
      const historical = historicalData.map(d => ({
        date: d.date,
        value: d.enrollmentCount,
      }));

      // Format forecast data
      const forecast = predictions.map((value, index) => ({
        date: this.daysToDate(futureX[index]),
        value: Math.max(0, Math.round(value)), // Ensure non-negative integer enrollments
        lower: Math.max(0, Math.round(intervals[index].lower)),
        upper: Math.max(0, Math.round(intervals[index].upper)),
      }));

      logger.info('Enrollment forecast generated', {
        historicalPoints: historical.length,
        forecastDays: days,
        r2: regression.r2,
        quality,
      });

      return {
        historical,
        forecast,
        confidence: regression.r2,
        quality,
      };
    } catch (_error) {
      logger._error('Error forecasting enrollments:', _error);
      throw error;
    }
  }

  /**
   * Get forecast quality description
   */
  static getForecastQualityDescription(quality: ForecastResult['quality']): string {
    switch (quality) {
      case 'excellent':
        return 'High confidence - Model fits historical data very well (R² > 0.9)';
      case 'good':
        return 'Good confidence - Model fits historical data well (R² > 0.7)';
      case 'fair':
        return 'Fair confidence - Model shows moderate fit (R² > 0.5)';
      case 'poor':
        return 'Low confidence - Model fit is weak (R² ≤ 0.5). Use with caution.';
      default:
        return 'Unknown quality';
    }
  }
}
