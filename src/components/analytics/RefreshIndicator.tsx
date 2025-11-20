/**
 * Refresh Indicator Component
 * Displays refresh status, countdown, and manual refresh control for analytics pages
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Wifi, WifiOff, Clock, Zap } from '@/components/ui/icons';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface RefreshIndicatorProps {
  /** Is currently refreshing */
  isRefreshing: boolean;

  /** Last refresh timestamp */
  lastRefreshed: Date | null;

  /** Auto-refresh enabled */
  autoRefreshEnabled: boolean;

  /** Real-time connection status */
  realTimeConnected?: boolean;

  /** Refresh interval in milliseconds */
  refreshInterval?: number;

  /** Manual refresh callback */
  onManualRefresh?: () => void;

  /** Show/hide the indicator */
  show?: boolean;

  /** Compact mode (minimal UI) */
  compact?: boolean;

  /** Custom className */
  className?: string;
}

export default function RefreshIndicator({
  isRefreshing,
  lastRefreshed,
  autoRefreshEnabled,
  realTimeConnected = false,
  refreshInterval,
  onManualRefresh,
  show = true,
  compact = false,
  className,
}: RefreshIndicatorProps) {
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);

  // Calculate countdown to next refresh
  useEffect(() => {
    if (!autoRefreshEnabled || !lastRefreshed || !refreshInterval) {
      setNextRefreshIn(null);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const lastRefreshTime = lastRefreshed.getTime();
      const nextRefreshTime = lastRefreshTime + refreshInterval;
      const remaining = Math.max(0, Math.ceil((nextRefreshTime - now) / 1000));

      setNextRefreshIn(remaining);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, lastRefreshed, refreshInterval]);

  if (!show) return null;

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Compact mode - minimal badge only
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              {autoRefreshEnabled && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
                  {nextRefreshIn !== null && formatCountdown(nextRefreshIn)}
                </Badge>
              )}

              {realTimeConnected && (
                <Badge variant="default" className="gap-1 bg-green-500">
                  <Zap className="h-3 w-3" />
                  Live
                </Badge>
              )}

              {onManualRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              {lastRefreshed && (
                <p>Last updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}</p>
              )}
              {autoRefreshEnabled && nextRefreshIn !== null && (
                <p>Next update in {formatCountdown(nextRefreshIn)}</p>
              )}
              {realTimeConnected && <p>Real-time updates active</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full mode - detailed status
  return (
    <div className={cn('flex items-center gap-3 text-sm text-muted-foreground', className)}>
      {/* Last Refreshed */}
      {lastRefreshed && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Updated</span>
          <span className="font-medium text-foreground">
            {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Auto-refresh Status */}
      {autoRefreshEnabled && nextRefreshIn !== null && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Next in</span>
            <Badge variant="secondary" className="font-mono">
              {formatCountdown(nextRefreshIn)}
            </Badge>
          </div>
        </>
      )}

      {/* Real-time Status */}
      {realTimeConnected ? (
        <>
          <span className="text-muted-foreground/50">•</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <Badge variant="default" className="gap-1 bg-green-500">
                    <Zap className="h-3 w-3" />
                    Live
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Real-time updates active</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        autoRefreshEnabled && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs">Polling</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Auto-refresh active, real-time disabled</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )
      )}

      {/* Manual Refresh Button */}
      {onManualRefresh && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={onManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  <span className="hidden md:inline">Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Manually refresh data now</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}

      {/* Refreshing Status */}
      {isRefreshing && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <div className="flex items-center gap-1.5 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">Refreshing...</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Minimal refresh button variant
 */
export function RefreshButton({
  isRefreshing,
  onRefresh,
  className,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className={className}
    >
      <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
      Refresh
    </Button>
  );
}

/**
 * Status badge variant
 */
export function RefreshStatusBadge({
  autoRefreshEnabled,
  realTimeConnected,
  className,
}: {
  autoRefreshEnabled: boolean;
  realTimeConnected?: boolean;
  className?: string;
}) {
  if (realTimeConnected) {
    return (
      <Badge variant="default" className={cn('gap-1 bg-green-500', className)}>
        <Zap className="h-3 w-3" />
        Live
      </Badge>
    );
  }

  if (autoRefreshEnabled) {
    return (
      <Badge variant="secondary" className={cn('gap-1', className)}>
        <RefreshCw className="h-3 w-3" />
        Auto
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <WifiOff className="h-3 w-3" />
      Manual
    </Badge>
  );
}
