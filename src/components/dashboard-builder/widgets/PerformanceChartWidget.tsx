/**
 * Performance Chart Widget
 *
 * Visualize performance metrics over time with line/bar chart
 */

import { useQuery } from '@tanstack/react-query';
import { LineChart, TrendingUp } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart as RechartsLine,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetComponentProps, ChartWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function PerformanceChartWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ChartWidgetConfig;
  const chartType = config.chartType || 'line';
  const dateRange = config.dateRange || 'month';
  const showGrid = config.showGrid !== false;

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['performance-chart', widget.id, dateRange],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch assessment results
      const { data: assessments, error } = await supabase
        .from('assessment_results')
        .select('score, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dataMap: Record<string, { total: number; count: number }> = {};

      assessments?.forEach(assessment => {
        const date = new Date(assessment.completed_at).toLocaleDateString();
        if (!dataMap[date]) {
          dataMap[date] = { total: 0, count: 0 };
        }
        dataMap[date].total += assessment.score;
        dataMap[date].count += 1;
      });

      return Object.entries(dataMap).map(([date, data]) => ({
        date,
        score: Math.round(data.total / data.count),
      }));
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No performance data yet</p>
        <p className="text-xs mt-1">Complete assessments to track performance!</p>
      </div>
    );
  }

  const ChartComponent = chartType === 'bar' ? BarChart : RechartsLine;
  const DataComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <ChartComponent data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <DataComponent
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Average Score</span>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="font-semibold">
            {Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default PerformanceChartWidget;
