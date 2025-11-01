/**
 * Trend Analysis Utility
 * Provides smoothing and trend detection for time series data
 */

export type TrendDirection = 'up' | 'down' | 'stable';

export interface DataPoint {
  value: number;
  date: string;
}

export interface TrendResult {
  direction: TrendDirection;
  strength: number;
}

export interface SeasonalityResult {
  hasSeasonality: boolean;
  period: number;
  correlation: number;
}

/**
 * Calculate simple moving average
 * @param data Array of data points with value and date
 * @param window Window size for moving average
 * @returns Array of smoothed data points (shorter than input by window-1)
 */
export function movingAverage(data: DataPoint[], window: number): DataPoint[] {
  if (window < 1) {
    throw new Error('Window size must be at least 1');
  }

  if (window > data.length) {
    return []; // Return empty array instead of throwing
  }

  if (window === 1) {
    return [...data];
  }

  const result: DataPoint[] = [];

  for (let i = 0; i <= data.length - window; i++) {
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i + j].value;
    }
    // Use the date from the middle of the window
    const midIndex = i + Math.floor(window / 2);
    result.push({
      value: sum / window,
      date: data[midIndex].date,
    });
  }

  return result;
}

/**
 * Calculate exponential moving average (EMA)
 * More weight to recent values
 * @param data Array of data points with value and date
 * @param alpha Smoothing factor (0-1, higher = more weight to recent values)
 * @returns Array of EMA data points
 */
export function exponentialMovingAverage(data: DataPoint[], alpha: number = 0.3): DataPoint[] {
  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha must be between 0 and 1');
  }

  if (data.length === 0) {
    return [];
  }

  const result: DataPoint[] = [{ ...data[0] }];

  for (let i = 1; i < data.length; i++) {
    const ema = alpha * data[i].value + (1 - alpha) * result[i - 1].value;
    result.push({
      value: ema,
      date: data[i].date,
    });
  }

  return result;
}

/**
 * Detect overall trend direction in data
 * Uses linear regression slope to determine trend
 * @param data Array of data points with value and date
 * @param threshold Minimum slope to consider significant (default: 0.01)
 * @returns Trend result with direction and strength
 */
export function detectTrend(data: DataPoint[], threshold: number = 0.01): TrendResult {
  if (data.length < 2) {
    return {
      direction: 'stable',
      strength: 0,
    };
  }

  // Calculate simple linear regression slope
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i].value;
    sumXY += i * data[i].value;
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Normalize slope by average value to get percentage change
  const avgValue = sumY / n;
  const normalizedSlope = avgValue !== 0 ? slope / avgValue : slope;
  const strength = Math.abs(normalizedSlope);

  if (strength < threshold) {
    return {
      direction: 'stable',
      strength,
    };
  }

  return {
    direction: normalizedSlope > 0 ? 'up' : 'down',
    strength,
  };
}

/**
 * Calculate rate of change between consecutive data points
 * @param data Array of data points with value and date
 * @returns Array of percentage changes (length = data.length - 1)
 */
export function rateOfChange(data: DataPoint[]): number[] {
  if (data.length < 2) {
    return [];
  }

  const result: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const previous = data[i - 1].value;
    const current = data[i].value;

    if (previous === 0) {
      result.push(current === 0 ? 0 : 100); // Handle division by zero
    } else {
      result.push(((current - previous) / previous) * 100);
    }
  }

  return result;
}

/**
 * Detect seasonality in data (simple autocorrelation check)
 * @param data Array of data points with value and date
 * @param period Expected period length (e.g., 7 for weekly)
 * @returns Seasonality result with boolean indicator and correlation
 */
export function detectSeasonality(data: DataPoint[], period: number): SeasonalityResult {
  if (data.length < period * 2) {
    return {
      hasSeasonality: false,
      period,
      correlation: 0,
    };
  }

  // Extract values
  const values = data.map(d => d.value);

  // Calculate autocorrelation at the specified lag
  const lag = period;
  const n = values.length - lag;

  // Calculate means
  const mean1 = values.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const mean2 = values.slice(lag).reduce((sum, val) => sum + val, 0) / n;

  // Calculate covariance and variances
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = values[i] - mean1;
    const diff2 = values[i + lag] - mean2;
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(variance1 * variance2);
  const correlation = denominator === 0 ? 0 : covariance / denominator;

  // Consider seasonality detected if correlation > 0.5
  return {
    hasSeasonality: correlation > 0.5,
    period,
    correlation,
  };
}

/**
 * Smooth data by removing outliers and applying moving average
 * @param data Array of data points with value and date
 * @param window Window size for moving average
 * @param stdDevThreshold Number of standard deviations for outlier detection (default: 2)
 * @returns Smoothed data points
 */
export function smoothData(
  data: DataPoint[],
  window: number = 3,
  stdDevThreshold: number = 2
): DataPoint[] {
  if (data.length === 0) {
    return [];
  }

  // Extract values
  const values = data.map(d => d.value);

  // Calculate mean and standard deviation
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Replace outliers with mean, preserving dates
  const cleanedData: DataPoint[] = data.map((point) => {
    if (Math.abs(point.value - mean) > stdDevThreshold * stdDev) {
      return {
        value: mean,
        date: point.date,
      };
    }
    return { ...point };
  });

  // Apply moving average
  if (window > 1 && window <= cleanedData.length) {
    const smoothed = movingAverage(cleanedData, window);

    // Pad the result to match original length
    const padSize = Math.floor((window - 1) / 2);
    const result: DataPoint[] = [...cleanedData.slice(0, padSize), ...smoothed];

    // Fill remaining with last value if needed
    while (result.length < cleanedData.length) {
      const lastPoint = result[result.length - 1];
      const originalIndex = result.length;
      result.push({
        value: lastPoint.value,
        date: cleanedData[originalIndex].date,
      });
    }

    return result;
  }

  return cleanedData;
}
