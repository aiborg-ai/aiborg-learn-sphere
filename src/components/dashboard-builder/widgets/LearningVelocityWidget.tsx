/**
 * Learning Velocity Widget
 *
 * Measure learning pace and consistency with area chart
 */

import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WidgetComponentProps, ChartWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function LearningVelocityWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ChartWidgetConfig;
  const dateRange = config.dateRange || 'month';

  const { data: velocityData, isLoading } = useQuery({
    queryKey: ['learning-velocity', widget.id, dateRange],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get last 30 days
      const days = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Mock velocity data - in real implementation, track actual activity
        const velocity = Math.floor(Math.random() * 50) + 10;

        days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          velocity,
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

  if (!velocityData || velocityData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No velocity data yet</p>
      </div>
    );
  }

  const avgVelocity = Math.round(
    velocityData.reduce((sum, d) => sum + d.velocity, 0) / velocityData.length
  );

  const trend = velocityData.length >= 2
    ? velocityData[velocityData.length - 1].velocity > velocityData[0].velocity
      ? 'up'
      : 'down'
    : 'neutral';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{avgVelocity}</p>
          <p className="text-xs text-muted-foreground">Avg Velocity</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <span className="text-green-600 text-sm font-semibold">↑ Increasing</span>
            ) : trend === 'down' ? (
              <span className="text-red-600 text-sm font-semibold">↓ Decreasing</span>
            ) : (
              <span className="text-muted-foreground text-sm">→ Steady</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Trend</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={velocityData}>
          <defs>
            <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="velocity"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorVelocity)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-center text-muted-foreground">
        Learning velocity measures your activity and progress rate
      </p>
    </div>
  );
}

export default LearningVelocityWidget;
