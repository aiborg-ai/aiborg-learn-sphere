/**
 * Offline Badge Component
 *
 * Shows a badge indicating content is available offline
 */

import { WifiOff, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface OfflineBadgeProps {
  isOffline: boolean;
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
  className?: string;
}

export function OfflineBadge({
  isOffline,
  variant = 'secondary',
  showIcon = true,
  className,
}: OfflineBadgeProps) {
  if (!isOffline) return null;

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      {showIcon && <WifiOff className="h-3 w-3" />}
      <span>Offline Available</span>
    </Badge>
  );
}

export interface ConnectionStatusBadgeProps {
  className?: string;
}

export function ConnectionStatusBadge({ className }: ConnectionStatusBadgeProps) {
  const isOnline = navigator.onLine;

  return (
    <Badge variant={isOnline ? 'default' : 'destructive'} className={cn('gap-1', className)}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </Badge>
  );
}
