/**
 * ChatbotAnalyticsTab Component
 * Displays comprehensive chatbot analytics with metrics, trends, and queries
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MessageSquare, Star, CheckCircle, Clock } from 'lucide-react';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useAllChatbotAnalytics } from '@/hooks/admin/useAdminChatbotAnalytics';
import { ExportButton } from '@/components/admin/ExportButton';
import { formatNumber } from './utils';
import type { AnalyticsSection } from '@/utils/pdfExport';

/**
 * ChatbotAnalyticsTab component
 *
 * Displays:
 * - Metrics cards: Total conversations, satisfaction, resolution rate, avg duration
 * - Conversation trend chart (line chart over time)
 * - Top queries chart (bar chart)
 * - Export functionality
 *
 * @example
 * ```tsx
 * <ChatbotAnalyticsTab />
 * ```
 */
export function ChatbotAnalyticsTab() {
  const { startDate, endDate } = useDateRange();

  const dateRange = React.useMemo(() => {
    if (!startDate || !endDate) {
      return { start: '', end: '' };
    }
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }, [startDate, endDate]);

  const { metrics, trends, topQueries, isLoading, isError } = useAllChatbotAnalytics(dateRange);

  // Prepare export sections
  const exportSections: AnalyticsSection[] = React.useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: 'Chatbot Analytics Summary',
        metrics: [
          { label: 'Total Conversations', value: formatNumber(metrics.totalConversations) },
          { label: 'Unique Users', value: formatNumber(metrics.uniqueUsers) },
          { label: 'Average Satisfaction', value: metrics.avgSatisfaction.toFixed(2) },
          { label: 'Resolution Rate', value: `${metrics.resolutionRate.toFixed(1)}%` },
          { label: 'Average Duration', value: `${metrics.avgDurationMinutes.toFixed(1)} min` },
        ],
      },
    ];
  }, [metrics]);

  // Prepare CSV export data
  const exportData = React.useMemo(() => {
    if (!topQueries) return [];
    return topQueries.map(q => ({
      Query: q.query,
      Count: q.count,
      'Avg Satisfaction': q.avgSatisfaction.toFixed(2),
    }));
  }, [topQueries]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load chatbot analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chatbot Analytics</h2>
          <p className="text-muted-foreground">
            AI chatbot performance and user interactions
          </p>
        </div>
        {!isLoading && metrics && (
          <ExportButton
            section="chatbot-analytics"
            sections={exportSections}
            data={exportData}
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Conversations */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics?.totalConversations || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatNumber(metrics?.uniqueUsers || 0)} unique users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Average Satisfaction */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.avgSatisfaction.toFixed(2) || '0.00'}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(metrics?.avgSatisfaction || 0)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Resolution Rate */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.resolutionRate.toFixed(1) || '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Successfully resolved queries
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Average Duration */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.avgDurationMinutes.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">minutes per conversation</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Trends</CardTitle>
          <CardDescription>Daily conversation volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="conversationCount"
                  name="Conversations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="uniqueUsers"
                  name="Unique Users"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No trend data available for selected date range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Queries Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Queries</CardTitle>
          <CardDescription>Most frequently asked questions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : topQueries && topQueries.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topQueries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="query"
                  width={200}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No query data available for selected date range
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
