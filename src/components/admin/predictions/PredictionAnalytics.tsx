/**
 * Prediction Analytics Component
 *
 * Displays prediction trends, engagement forecasts, and completion predictions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { usePredictionAnalytics } from '@/hooks/admin/usePredictionAnalytics';

export function PredictionAnalytics() {
  const { analytics, isLoading } = usePredictionAnalytics();

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
          <CardDescription>7-day and 30-day engagement forecasts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Increasing</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{analytics?.engagementIncreasing || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stable</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">{analytics?.engagementStable || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Declining</span>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span className="font-semibold">{analytics?.engagementDeclining || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Critical</span>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">{analytics?.engagementCritical || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Predictions</CardTitle>
          <CardDescription>Estimated completion probabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">High Probability (&gt;75%)</span>
              <span className="font-semibold text-green-600">{analytics?.completionHigh || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium Probability (50-75%)</span>
              <span className="font-semibold text-blue-600">
                {analytics?.completionMedium || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Low Probability (&lt;50%)</span>
              <span className="font-semibold text-red-600">{analytics?.completionLow || 0}</span>
            </div>
            <div className="pt-4 mt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg. Completion Time</span>
                <span className="font-semibold">{analytics?.avgCompletionDays || 0} days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Breakdown of learner risk levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{analytics?.riskCritical || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Critical</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{analytics?.riskHigh || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">High</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{analytics?.riskMedium || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Medium</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{analytics?.riskLow || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
