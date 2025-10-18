/**
 * RealtimeConnectionStatus Component
 * Shows the WebSocket connection status for workshop real-time updates
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Icon } from '@/utils/iconLoader';
import type { RealtimeStatus } from '@/hooks/useWorkshopRealtime';

interface RealtimeConnectionStatusProps {
  status: RealtimeStatus;
  onReconnect?: () => void;
  compact?: boolean;
}

export function RealtimeConnectionStatus({
  status,
  onReconnect,
  compact = false,
}: RealtimeConnectionStatusProps) {
  const getStatusConfig = (status: RealtimeStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: 'Wifi' as const,
          label: 'Connected',
          color: 'bg-green-500',
          badgeVariant: 'default' as const,
          description: 'Real-time updates active',
          pulse: false,
        };
      case 'connecting':
        return {
          icon: 'Loader2' as const,
          label: 'Connecting',
          color: 'bg-yellow-500',
          badgeVariant: 'secondary' as const,
          description: 'Establishing connection...',
          pulse: true,
        };
      case 'disconnected':
        return {
          icon: 'WifiOff' as const,
          label: 'Disconnected',
          color: 'bg-gray-500',
          badgeVariant: 'secondary' as const,
          description: 'Connection lost. Click to reconnect.',
          pulse: false,
        };
      case 'error':
        return {
          icon: 'AlertCircle' as const,
          label: 'Error',
          color: 'bg-red-500',
          badgeVariant: 'destructive' as const,
          description: 'Connection error. Click to retry.',
          pulse: true,
        };
    }
  };

  const config = getStatusConfig(status);

  // Compact view - just an indicator dot
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={status !== 'connected' ? onReconnect : undefined}
              className="relative flex items-center gap-2 cursor-pointer"
              disabled={status === 'connecting'}
            >
              <span
                className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
              />
              {config.icon === 'Loader2' && (
                <Icon name={config.icon} size={12} className="animate-spin" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full view - badge with icon and text
  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.badgeVariant} className="flex items-center gap-2">
        <Icon
          name={config.icon}
          size={14}
          className={config.icon === 'Loader2' ? 'animate-spin' : ''}
        />
        <span>{config.label}</span>
        {config.pulse && <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />}
      </Badge>

      {/* Reconnect button for error/disconnected states */}
      {(status === 'error' || status === 'disconnected') && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="h-7"
        >
          <Icon name="RefreshCw" size={14} className="mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
}

/**
 * Inline connection status indicator for toolbar/header
 */
export function RealtimeConnectionBadge({
  status,
  onReconnect,
}: {
  status: RealtimeStatus;
  onReconnect?: () => void;
}) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="font-medium">Live</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
        <Icon name="Loader2" size={12} className="animate-spin" />
        <span className="font-medium">Connecting...</span>
      </div>
    );
  }

  return (
    <button
      onClick={onReconnect}
      className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
    >
      <Icon name="WifiOff" size={12} />
      <span className="font-medium">Offline - Reconnect</span>
    </button>
  );
}
