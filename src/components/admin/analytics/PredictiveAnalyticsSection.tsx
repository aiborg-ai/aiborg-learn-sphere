/**
 * PredictiveAnalyticsSection Component
 * Displays revenue, user growth, and enrollment forecasts
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from 'recharts';
import { TrendingUp, Users, BookOpen, AlertTriangle, Info } from 'lucide-react';
import {
  usePredictiveAnalytics,
  getForecastQualityColor,
  formatConfidence,
} from '@/hooks/usePredictiveAnalytics';
import { formatNumber } from './utils';

// Mock historical data generator (replace with real data fetch)
const generateMockHistoricalData = (days: number, baseValue: number, metric: 'revenue' | 'users' | 'enrollments') => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Add some variation
    const variance = (Math.random() - 0.5) * 0.2;
    const trend = (i / days) * 0.3;
    const value = baseValue * (1 + trend + variance);

    if (metric === 'revenue') {
      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.max(0, value),
      });
    } else if (metric === 'users') {
      data.push({
        date: date.toISOString().split('T')[0],
        userCount: Math.max(0, Math.round(value)),
      });
    } else {
      data.push({
        date: date.toISOString().split('T')[0],
        enrollmentCount: Math.max(0, Math.round(value)),
      });
    }
  }

  return data;
};

type ForecastPeriod = 30 | 60 | 90;

/**
 * PredictiveAnalyticsSection component
 *
 * Displays:
 * - Revenue forecast (30/60/90 day tabs)
 * - User growth forecast
 * - Enrollment forecast
 * - Confidence indicators
 * - Warning for insufficient data
 *
 * @example
 * ```tsx
 * <PredictiveAnalyticsSection />
 * ```
 */
export function PredictiveAnalyticsSection() {
  const [forecastDays, setForecastDays] = useState<ForecastPeriod>(30);

  const {
    forecastRevenue,
    forecastUserGrowth,
    forecastEnrollments,
    state,
    hasInsufficientData,
    getQualityDescription,
  } = usePredictiveAnalytics();

  // Generate forecast on mount and when period changes
  React.useEffect(() => {
    const revenueData = generateMockHistoricalData(90, 10000, 'revenue');
    const userData = generateMockHistoricalData(90, 500, 'users');
    const enrollmentData = generateMockHistoricalData(90, 200, 'enrollments');

    forecastRevenue(revenueData, forecastDays);
    forecastUserGrowth(userData, forecastDays);
    forecastEnrollments(enrollmentData, forecastDays);
  }, [forecastDays, forecastRevenue, forecastUserGrowth, forecastEnrollments]);

  const isLoading = state.revenue.loading || state.userGrowth.loading || state.enrollments.loading;

  // Prepare chart data combining historical and forecast
  const prepareChartData = (type: 'revenue' | 'userGrowth' | 'enrollments') => {
    const forecastData = state[type].data;
    if (!forecastData) return [];

    const historicalData = forecastData.historical.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: point.value,
      forecast: null,
      lower: null,
      upper: null,
    }));

    const forecastDataPoints = forecastData.forecast.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: null,
      forecast: point.value,
      lower: point.lower,
      upper: point.upper,
    }));

    // Add connection point (last historical becomes first forecast point)
    if (historicalData.length > 0 && forecastDataPoints.length > 0) {
      const lastHistorical = historicalData[historicalData.length - 1];
      forecastDataPoints[0] = {
        ...forecastDataPoints[0],
        actual: lastHistorical.actual,
      };
    }

    // Limit historical data to last 30 days for readability
    const limitedHistorical = historicalData.slice(-30);

    return [...limitedHistorical, ...forecastDataPoints];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
        <p className="text-muted-foreground">
          AI-powered forecasts for revenue, user growth, and enrollments
        </p>
      </div>

      {/* Forecast Period Selector */}
      <Tabs value={forecastDays.toString()} onValueChange={(value) => setForecastDays(Number(value) as ForecastPeriod)}>
        <TabsList>
          <TabsTrigger value="30">30 Days</TabsTrigger>
          <TabsTrigger value="60">60 Days</TabsTrigger>
          <TabsTrigger value="90">90 Days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Insufficient Data Warning */}
      {(hasInsufficientData('revenue') || hasInsufficientData('userGrowth') || hasInsufficientData('enrollments')) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Historical Data</AlertTitle>
          <AlertDescription>
            At least 60 days of historical data is required for accurate forecasting. Current forecasts may be less reliable.
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>Predicted revenue for the next {forecastDays} days</CardDescription>
            </div>
            {state.revenue.data && (
              <div className="text-right">
                <Badge className={getForecastQualityColor(state.revenue.data.quality)}>
                  {state.revenue.data.quality.toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {formatConfidence(state.revenue.data.confidence)}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : state.revenue.error ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{state.revenue.error}</AlertDescription>
            </Alert>
          ) : state.revenue.data ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={prepareChartData('revenue')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${formatNumber(value)}`, '']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />

                  {/* Confidence interval area */}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Confidence Range"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />

                  {/* Actual values */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Actual"
                    dot={{ r: 2 }}
                  />

                  {/* Forecast values */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {getQualityDescription('revenue') && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {getQualityDescription('revenue')}
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* User Growth Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Growth Forecast
              </CardTitle>
              <CardDescription>Predicted user growth for the next {forecastDays} days</CardDescription>
            </div>
            {state.userGrowth.data && (
              <div className="text-right">
                <Badge className={getForecastQualityColor(state.userGrowth.data.quality)}>
                  {state.userGrowth.data.quality.toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {formatConfidence(state.userGrowth.data.confidence)}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : state.userGrowth.error ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{state.userGrowth.error}</AlertDescription>
            </Alert>
          ) : state.userGrowth.data ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={prepareChartData('userGrowth')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(value: number) => [formatNumber(value), '']} />
                  <Legend />

                  <Area type="monotone" dataKey="upper" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Actual"
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {getQualityDescription('userGrowth') && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {getQualityDescription('userGrowth')}
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Enrollment Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Enrollment Forecast
              </CardTitle>
              <CardDescription>Predicted enrollments for the next {forecastDays} days</CardDescription>
            </div>
            {state.enrollments.data && (
              <div className="text-right">
                <Badge className={getForecastQualityColor(state.enrollments.data.quality)}>
                  {state.enrollments.data.quality.toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {formatConfidence(state.enrollments.data.confidence)}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : state.enrollments.error ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{state.enrollments.error}</AlertDescription>
            </Alert>
          ) : state.enrollments.data ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={prepareChartData('enrollments')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(value: number) => [formatNumber(value), '']} />
                  <Legend />

                  <Area type="monotone" dataKey="upper" stroke="none" fill="#f97316" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#f97316" fillOpacity={0.1} />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Actual"
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {getQualityDescription('enrollments') && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {getQualityDescription('enrollments')}
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
