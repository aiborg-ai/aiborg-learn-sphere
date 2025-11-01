/**
 * Linear Regression Unit Tests
 * Tests linear regression calculations and predictions
 */

import { describe, it, expect } from 'vitest';
import { linearRegression, predict, confidenceInterval, assessModelQuality } from '../linearRegression';

describe('linearRegression', () => {
  it('should calculate regression for simple linear data', () => {
    const data = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
    ];

    const result = linearRegression(data);

    expect(result.slope).toBeCloseTo(2, 1);
    expect(result.intercept).toBeCloseTo(0, 1);
    expect(result.r2).toBeCloseTo(1, 2);
  });

  it('should handle data with intercept', () => {
    const data = [
      { x: 1, y: 5 },
      { x: 2, y: 7 },
      { x: 3, y: 9 },
      { x: 4, y: 11 },
    ];

    const result = linearRegression(data);

    expect(result.slope).toBeCloseTo(2, 1);
    expect(result.intercept).toBeCloseTo(3, 1);
  });

  it('should throw error with insufficient data points', () => {
    const data = [{ x: 1, y: 2 }];

    expect(() => linearRegression(data)).toThrow('Need at least 2 data points');
  });

  it('should calculate R² value correctly', () => {
    const data = [
      { x: 1, y: 2.1 },
      { x: 2, y: 3.9 },
      { x: 3, y: 6.1 },
      { x: 4, y: 7.8 },
      { x: 5, y: 10.2 },
    ];

    const result = linearRegression(data);

    expect(result.r2).toBeGreaterThan(0.9);
    expect(result.r2).toBeLessThanOrEqual(1);
  });
});

describe('predict', () => {
  it('should predict values using regression model', () => {
    const regression = {
      slope: 2,
      intercept: 3,
      r2: 0.95,
    };

    const futureX = [6, 7, 8];
    const predictions = predict(regression, futureX);

    expect(predictions).toHaveLength(3);
    expect(predictions[0]).toBeCloseTo(15, 1); // 2*6 + 3
    expect(predictions[1]).toBeCloseTo(17, 1); // 2*7 + 3
    expect(predictions[2]).toBeCloseTo(19, 1); // 2*8 + 3
  });

  it('should handle single prediction', () => {
    const regression = {
      slope: 5,
      intercept: 10,
      r2: 0.9,
    };

    const predictions = predict(regression, [1]);

    expect(predictions).toHaveLength(1);
    expect(predictions[0]).toBe(15); // 5*1 + 10
  });
});

describe('confidenceInterval', () => {
  it('should calculate confidence intervals', () => {
    const regression = {
      slope: 2,
      intercept: 3,
      r2: 0.9,
    };

    const dataPoints = [
      { x: 1, y: 5 },
      { x: 2, y: 7 },
      { x: 3, y: 9 },
      { x: 4, y: 11 },
    ];

    const futureX = [5, 6];
    const intervals = confidenceInterval(regression, futureX, dataPoints, 0.95);

    expect(intervals).toHaveLength(2);
    intervals.forEach((interval, i) => {
      const predictedValue = regression.slope * futureX[i] + regression.intercept;
      expect(interval.lower).toBeLessThan(predictedValue);
      expect(interval.upper).toBeGreaterThan(predictedValue);
      expect(interval.lower).toBeLessThan(interval.upper);
    });
  });

  it('should have wider intervals with lower confidence level', () => {
    const regression = {
      slope: 2,
      intercept: 3,
      r2: 0.85,
    };

    const dataPoints = [
      { x: 1, y: 5 },
      { x: 2, y: 7 },
      { x: 3, y: 9 },
    ];

    const futureX = [4];
    const intervals95 = confidenceInterval(regression, futureX, dataPoints, 0.95);
    const intervals90 = confidenceInterval(regression, futureX, dataPoints, 0.90);

    const range95 = intervals95[0].upper - intervals95[0].lower;
    const range90 = intervals90[0].upper - intervals90[0].lower;

    expect(range95).toBeGreaterThan(range90);
  });
});

describe('assessModelQuality', () => {
  it('should assess excellent quality for R² >= 0.9', () => {
    expect(assessModelQuality(0.95)).toBe('excellent');
    expect(assessModelQuality(0.90)).toBe('excellent');
    expect(assessModelQuality(1.0)).toBe('excellent');
  });

  it('should assess good quality for R² >= 0.7 and < 0.9', () => {
    expect(assessModelQuality(0.85)).toBe('good');
    expect(assessModelQuality(0.70)).toBe('good');
    expect(assessModelQuality(0.89)).toBe('good');
  });

  it('should assess fair quality for R² >= 0.5 and < 0.7', () => {
    expect(assessModelQuality(0.65)).toBe('fair');
    expect(assessModelQuality(0.50)).toBe('fair');
    expect(assessModelQuality(0.69)).toBe('fair');
  });

  it('should assess poor quality for R² < 0.5', () => {
    expect(assessModelQuality(0.45)).toBe('poor');
    expect(assessModelQuality(0.10)).toBe('poor');
    expect(assessModelQuality(0.0)).toBe('poor');
  });
});
