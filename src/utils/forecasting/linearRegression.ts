/**
 * Linear Regression Utility
 * Implements simple linear regression using least squares method
 * For forecasting analytics data (revenue, users, enrollments)
 */

export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number; // Coefficient of determination (confidence measure)
}

/**
 * Calculate linear regression using least squares method
 * @param data Array of {x, y} data points
 * @returns Regression coefficients and R² value
 */
export function linearRegression(data: DataPoint[]): RegressionResult {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points');
  }

  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  // Calculate sums
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
    sumY2 += point.y * point.y;
  }

  // Calculate slope (m) and intercept (b) for y = mx + b
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const meanY = sumY / n;
  let ssTotal = 0; // Total sum of squares
  let ssResidual = 0; // Residual sum of squares

  for (const point of data) {
    const predicted = slope * point.x + intercept;
    ssTotal += (point.y - meanY) ** 2;
    ssResidual += (point.y - predicted) ** 2;
  }

  const r2 = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;

  return {
    slope,
    intercept,
    r2: Math.max(0, Math.min(1, r2)), // Clamp between 0 and 1
  };
}

/**
 * Predict future values based on regression model
 * @param regression Regression result from linearRegression()
 * @param futureX X values to predict Y for
 * @returns Array of predicted Y values
 */
export function predict(regression: RegressionResult, futureX: number[]): number[] {
  return futureX.map((x) => regression.slope * x + regression.intercept);
}

/**
 * Calculate confidence interval for predictions
 * @param regression Regression result
 * @param futureX X values to predict Y for
 * @param data Original data points
 * @param confidenceLevel Confidence level (default: 0.95 for 95%)
 * @returns Array of {predicted, lower, upper} bounds
 */
export function confidenceInterval(
  regression: RegressionResult,
  futureX: number[],
  data: DataPoint[],
  confidenceLevel: number = 0.95
): Array<{ predicted: number; lower: number; upper: number }> {
  const n = data.length;

  // Calculate standard error
  let sumSquaredResiduals = 0;
  let sumX = 0;
  let sumX2 = 0;

  for (const point of data) {
    const predicted = regression.slope * point.x + regression.intercept;
    sumSquaredResiduals += (point.y - predicted) ** 2;
    sumX += point.x;
    sumX2 += point.x * point.x;
  }

  const standardError = Math.sqrt(sumSquaredResiduals / (n - 2));
  const meanX = sumX / n;
  const sxx = sumX2 - (sumX * sumX) / n;

  // t-value for confidence level (approximation for large n)
  // Higher confidence requires larger t-value for wider intervals
  let tValue: number;
  if (confidenceLevel >= 0.99) {
    tValue = 2.576; // 99%
  } else if (confidenceLevel >= 0.95) {
    tValue = 1.96; // 95%
  } else if (confidenceLevel >= 0.90) {
    tValue = 1.645; // 90%
  } else {
    tValue = 1.28; // 80% or lower
  }

  // Use a minimum standard error for numerical stability
  // When R² = 1.0 (perfect fit), use a small fraction of the mean absolute value
  const meanAbsY = data.reduce((sum, point) => sum + Math.abs(point.y), 0) / n;
  const minStdError = meanAbsY * 0.01; // 1% of mean as minimum
  const effectiveStdError = Math.max(standardError, minStdError);

  return futureX.map((x) => {
    const predicted = regression.slope * x + regression.intercept;
    const margin = tValue * effectiveStdError * Math.sqrt(1 + 1 / n + ((x - meanX) ** 2) / sxx);

    return {
      predicted,
      lower: predicted - margin,
      upper: predicted + margin,
    };
  });
}

/**
 * Determine if regression model is reliable based on R² value
 * @param r2 R² coefficient
 * @returns Quality assessment
 */
export function assessModelQuality(r2: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (r2 >= 0.9) return 'excellent';
  if (r2 >= 0.7) return 'good';
  if (r2 >= 0.5) return 'fair';
  return 'poor';
}
