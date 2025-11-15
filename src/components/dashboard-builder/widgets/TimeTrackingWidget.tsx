/**
 * Time Tracking Widget
 *
 * Track time spent learning with bar chart
 */

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WidgetComponentProps, ChartWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function TimeTrackingWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ChartWidgetConfig;
  const dateRange = config.dateRange || 'week';
  const showGrid = config.showGrid !== false;

  const { data: timeData, isLoading } = useQuery({
    queryKey: ['time-tracking', widget.id, dateRange],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get last 7 days
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date.toISOString().split('T')[0],
          minutes: Math.floor(Math.random() * 120) + 30, // Mock data - replace with actual tracking
        });
      }

      return days;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!timeData || timeData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No time data yet</p>
      </div>
    );
  }

  const totalMinutes = timeData.reduce((sum, d) => sum + d.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">This Week</span>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {totalHours}h {remainingMinutes}m
          </p>
          <p className="text-xs text-muted-foreground">Total Time</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={timeData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => `${Math.floor(value / 60)}h ${value % 60}m`}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="text-xs text-center text-muted-foreground">
        Average: {Math.round(totalMinutes / timeData.length)} min/day
      </div>
    </div>
  );
}

export default TimeTrackingWidget;
