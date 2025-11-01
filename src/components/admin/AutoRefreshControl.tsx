/**
 * AutoRefreshControl Component
 * Controls for automatic data refresh with interval selection
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAutoRefresh, AUTO_REFRESH_INTERVALS, getTimeSinceRefresh } from '@/hooks/useAutoRefresh';
import { RefreshCw, Clock } from 'lucide-react';

export interface AutoRefreshControlProps {
  onRefresh: () => Promise<void>;
  defaultInterval?: number;
  className?: string;
}

const INTERVAL_OPTIONS = [
  { value: AUTO_REFRESH_INTERVALS.ONE_MINUTE, label: '1 minute' },
  { value: AUTO_REFRESH_INTERVALS.FIVE_MINUTES, label: '5 minutes' },
  { value: AUTO_REFRESH_INTERVALS.FIFTEEN_MINUTES, label: '15 minutes' },
  { value: AUTO_REFRESH_INTERVALS.THIRTY_MINUTES, label: '30 minutes' },
];

/**
 * AutoRefreshControl component for managing automatic data refresh
 *
 * Features:
 * - Toggle switch to enable/disable auto-refresh
 * - Interval selector (1, 5, 15, 30 minutes)
 * - Last refresh timestamp display
 * - Loading indicator during refresh
 * - Manual refresh button
 *
 * @example
 * ```tsx
 * <AutoRefreshControl
 *   onRefresh={async () => {
 *     await refetchAnalytics();
 *   }}
 *   defaultInterval={300000} // 5 minutes
 * />
 * ```
 */
export function AutoRefreshControl({
  onRefresh,
  defaultInterval = AUTO_REFRESH_INTERVALS.FIVE_MINUTES,
  className,
}: AutoRefreshControlProps) {
  const [interval, setInterval] = React.useState(defaultInterval);

  const { state, enable, disable, toggle, refresh } = useAutoRefresh({
    interval,
    onRefresh,
    enabled: false,
  });

  /**
   * Handle interval change
   */
  const handleIntervalChange = (value: string) => {
    const newInterval = parseInt(value, 10);
    setInterval(newInterval);

    // Restart auto-refresh with new interval if it's enabled
    if (state.isEnabled) {
      disable();
      setTimeout(() => enable(), 100);
    }
  };

  /**
   * Handle manual refresh
   */
  const handleManualRefresh = async () => {
    await refresh();
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Auto-Refresh</CardTitle>
            <CardDescription className="text-xs">
              Automatically update dashboard data
            </CardDescription>
          </div>
          <Switch
            checked={state.isEnabled}
            onCheckedChange={toggle}
            aria-label="Toggle auto-refresh"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interval Selector */}
        <div className="space-y-2">
          <Label htmlFor="refresh-interval" className="text-sm">
            Refresh Interval
          </Label>
          <Select
            value={interval.toString()}
            onValueChange={handleIntervalChange}
            disabled={!state.isEnabled}
          >
            <SelectTrigger id="refresh-interval" className="w-full">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Last Refresh Display */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last refresh:</span>
          </div>
          <span className="font-medium">
            {getTimeSinceRefresh(state.lastRefresh)}
          </span>
        </div>

        {/* Manual Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={state.isRefreshing}
          className="w-full"
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', state.isRefreshing && 'animate-spin')}
          />
          {state.isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </Button>

        {/* Status Indicator */}
        <div className="text-xs text-muted-foreground text-center">
          {state.isEnabled ? (
            <span className="flex items-center justify-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Auto-refresh enabled
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
              Auto-refresh disabled
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
