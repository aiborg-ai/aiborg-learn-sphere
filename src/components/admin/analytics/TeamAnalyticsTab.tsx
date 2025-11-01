/**
 * TeamAnalyticsTab Component
 * Displays comprehensive team analytics with metrics and performance data
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
import { Users, UserPlus, TrendingUp, Activity } from 'lucide-react';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useAllTeamAnalytics } from '@/hooks/admin/useAdminTeamAnalytics';
import { ExportButton } from '@/components/admin/ExportButton';
import { formatNumber } from './utils';
import type { AnalyticsSection } from '@/utils/pdfExport';

/**
 * TeamAnalyticsTab component
 *
 * Displays:
 * - Metrics cards: Total teams, members, engagement, completion rate
 * - Team performance chart (bar chart comparing teams)
 * - Engagement trend chart (line chart over time)
 * - Export functionality
 *
 * @example
 * ```tsx
 * <TeamAnalyticsTab />
 * ```
 */
export function TeamAnalyticsTab() {
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

  const { metrics, performance, isLoading, isError } = useAllTeamAnalytics(dateRange);

  // Prepare export sections
  const exportSections: AnalyticsSection[] = React.useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: 'Team Analytics Summary',
        metrics: [
          { label: 'Total Teams', value: formatNumber(metrics.totalTeams) },
          { label: 'Total Members', value: formatNumber(metrics.totalMembers) },
          { label: 'Average Engagement Score', value: metrics.avgEngagementScore.toFixed(1) },
          { label: 'Average Completion Rate', value: `${metrics.avgCompletionRate.toFixed(1)}%` },
          { label: 'Active Teams (Week)', value: formatNumber(metrics.activeTeamsWeek) },
        ],
      },
    ];
  }, [metrics]);

  // Prepare CSV export data
  const exportData = React.useMemo(() => {
    if (!performance) return [];
    return performance.map(t => ({
      Team: t.teamName,
      Members: t.memberCount,
      'Engagement Score': t.engagementScore.toFixed(1),
      'Completion Rate': `${t.completionRate.toFixed(1)}%`,
    }));
  }, [performance]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load team analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Analytics</h2>
          <p className="text-muted-foreground">
            Team performance, engagement, and learning progress
          </p>
        </div>
        {!isLoading && metrics && (
          <ExportButton
            section="team-analytics"
            sections={exportSections}
            data={exportData}
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Teams */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(metrics?.totalTeams || 0)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatNumber(metrics?.activeTeamsWeek || 0)} active this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Members */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(metrics?.totalMembers || 0)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg {metrics ? (metrics.totalMembers / (metrics.totalTeams || 1)).toFixed(1) : '0'}{' '}
                  members per team
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Engagement Score */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.avgEngagementScore.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">out of 10</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Completion Rate */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.avgCompletionRate.toFixed(1) || '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">course completion average</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Comparison</CardTitle>
          <CardDescription>Engagement scores and completion rates by team</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : performance && performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="engagementScore" name="Engagement Score" fill="#10b981" />
                <Bar dataKey="completionRate" name="Completion Rate %" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No performance data available for selected date range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
          <CardDescription>Team engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : performance && performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={performance.map((team, index) => ({
                  index: index + 1,
                  engagement: team.engagementScore,
                  completion: team.completionRate,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: 'Teams', position: 'insideBottom', offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  name="Engagement Score"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completion"
                  name="Completion Rate %"
                  stroke="#3b82f6"
                  strokeWidth={2}
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
    </div>
  );
}
