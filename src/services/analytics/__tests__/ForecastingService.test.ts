/**
 * ForecastingService Unit Tests
 * Tests revenue, user growth, and enrollment forecasting functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { ForecastingService } from '../ForecastingService';
import type { RevenueData, UserData, EnrollmentData } from '../ForecastingService';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock forecasting utilities
vi.mock('@/utils/forecasting/linearRegression', () => ({
  linearRegression: vi.fn((dataPoints) => ({
    slope: 10,
    intercept: 100,
    r2: 0.85,
  })),
  predict: vi.fn((regression, futureX) => futureX.map((x: number) => regression.slope * x + regression.intercept)),
  confidenceInterval: vi.fn((regression, futureX, dataPoints, confidenceLevel) => {
    return futureX.map((x: number) => {
      const predicted = regression.slope * x + regression.intercept;
      return {
        predicted,
        lower: predicted * 0.9,  // 10% below predicted
        upper: predicted * 1.1   // 10% above predicted
      };
    });
  }),
  assessModelQuality: vi.fn((r2) => {
    if (r2 >= 0.9) return 'excellent';
    if (r2 >= 0.7) return 'good';
    if (r2 >= 0.5) return 'fair';
    return 'poor';
  }),
}));

describe('ForecastingService', () => {
  describe('forecastRevenue', () => {
    it('should forecast revenue with sufficient data', async () => {
      // Create 60 days of historical data
      const historicalData: RevenueData[] = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1000 + i * 10,
      }));

      const result = await ForecastingService.forecastRevenue(historicalData, 30);

      expect(result).toBeDefined();
      expect(result.historical).toHaveLength(60);
      expect(result.forecast).toHaveLength(30);
      expect(result.confidence).toBe(0.85);
      expect(result.quality).toBe('good');

      // Check forecast structure
      result.forecast.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('value');
        expect(point).toHaveProperty('lower');
        expect(point).toHaveProperty('upper');
      });
    });

    it('should throw error with insufficient data', async () => {
      const insufficientData: RevenueData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1000 + i * 10,
      }));

      await expect(
        ForecastingService.forecastRevenue(insufficientData, 30)
      ).rejects.toThrow('Insufficient data for forecasting');
    });

    it('should forecast for 30, 60, and 90 day periods', async () => {
      const historicalData: RevenueData[] = Array.from({ length: 90 }, (_, i) => ({
        date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1000 + i * 10,
      }));

      const forecast30 = await ForecastingService.forecastRevenue(historicalData, 30);
      const forecast60 = await ForecastingService.forecastRevenue(historicalData, 60);
      const forecast90 = await ForecastingService.forecastRevenue(historicalData, 90);

      expect(forecast30.forecast).toHaveLength(30);
      expect(forecast60.forecast).toHaveLength(60);
      expect(forecast90.forecast).toHaveLength(90);
    });
  });

  describe('forecastUserGrowth', () => {
    it('should forecast user growth with sufficient data', async () => {
      const historicalData: UserData[] = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userCount: 100 + i,
      }));

      const result = await ForecastingService.forecastUserGrowth(historicalData, 30);

      expect(result).toBeDefined();
      expect(result.historical).toHaveLength(60);
      expect(result.forecast).toHaveLength(30);
      expect(result.confidence).toBeDefined();
      expect(result.quality).toBeDefined();
    });

    it('should throw error with insufficient data', async () => {
      const insufficientData: UserData[] = Array.from({ length: 45 }, (_, i) => ({
        date: new Date(Date.now() - (44 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userCount: 100 + i,
      }));

      await expect(
        ForecastingService.forecastUserGrowth(insufficientData, 30)
      ).rejects.toThrow('Insufficient data for forecasting');
    });
  });

  describe('forecastEnrollments', () => {
    it('should forecast enrollments with sufficient data', async () => {
      const historicalData: EnrollmentData[] = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        enrollmentCount: 50 + i,
      }));

      const result = await ForecastingService.forecastEnrollments(historicalData, 30);

      expect(result).toBeDefined();
      expect(result.historical).toHaveLength(60);
      expect(result.forecast).toHaveLength(30);
      expect(result.confidence).toBeDefined();
      expect(result.quality).toBeDefined();
    });

    it('should throw error with insufficient data', async () => {
      const insufficientData: EnrollmentData[] = Array.from({ length: 40 }, (_, i) => ({
        date: new Date(Date.now() - (39 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        enrollmentCount: 50 + i,
      }));

      await expect(
        ForecastingService.forecastEnrollments(insufficientData, 30)
      ).rejects.toThrow('Insufficient data for forecasting');
    });
  });

  describe('Confidence intervals', () => {
    it('should include confidence intervals in forecast results', async () => {
      const historicalData: RevenueData[] = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1000 + i * 10,
      }));

      const result = await ForecastingService.forecastRevenue(historicalData, 30);

      result.forecast.forEach(point => {
        expect(point.lower).toBeLessThanOrEqual(point.value);
        expect(point.upper).toBeGreaterThanOrEqual(point.value);
        expect(point.lower).toBeLessThan(point.upper);
      });
    });
  });

  describe('Model quality assessment', () => {
    it('should assess model quality based on R² value', async () => {
      const historicalData: RevenueData[] = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1000 + i * 10,
      }));

      const result = await ForecastingService.forecastRevenue(historicalData, 30);

      expect(result.quality).toBeOneOf(['excellent', 'good', 'fair', 'poor']);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});

// Custom matcher for toBeOneOf
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
