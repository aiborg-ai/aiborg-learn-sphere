/**
 * Offline Badge Component
 *
 * Shows offline availability status for content with video cache integration
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download, CheckCircle2, Loader2 } from '@/components/ui/icons';
import { VideoCacheService } from '@/services/offline/VideoCacheService';
import { cn } from '@/lib/utils';

export interface OfflineBadgeProps {
  isOffline?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
  className?: string;
}

/**
 * Simple badge indicating offline availability
 */
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

/**
 * Badge showing current connection status
 */
export function ConnectionStatusBadge({ className }: ConnectionStatusBadgeProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

export interface VideoCacheBadgeProps {
  videoUrl?: string;
  lessonId?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type CacheStatus = 'online' | 'cached' | 'downloading' | 'not-cached';

/**
 * Badge showing video cache status with download availability
 */
export function VideoCacheBadge({
  videoUrl,
  lessonId,
  className,
  showText = true,
  size = 'sm',
}: VideoCacheBadgeProps) {
  const [status, setStatus] = useState<CacheStatus>('online');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkCacheStatus = async () => {
      if (!videoUrl) {
        setStatus('online');
        return;
      }

      try {
        const isCached = await VideoCacheService.isCached(videoUrl);
        if (isCached) {
          setStatus('cached');
        } else if (lessonId) {
          const manifest = await VideoCacheService.getLessonManifest(lessonId);
          const entry = manifest.find(m => m.url === videoUrl);
          if (entry?.status === 'downloading') {
            setStatus('downloading');
          } else {
            setStatus('not-cached');
          }
        } else {
          setStatus('not-cached');
        }
      } catch {
        setStatus('online');
      }
    };

    checkCacheStatus();
  }, [videoUrl, lessonId]);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Offline but cached - show success
  if (!isOnline && status === 'cached') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-green-500/10 text-green-600 border-green-500/30',
          sizeClasses[size],
          className
        )}
      >
        <WifiOff className={cn(iconSizes[size], showText && 'mr-1')} />
        {showText && 'Available Offline'}
      </Badge>
    );
  }

  // Offline but not cached - show error
  if (!isOnline && status !== 'cached') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-destructive/10 text-destructive border-destructive/30',
          sizeClasses[size],
          className
        )}
      >
        <WifiOff className={cn(iconSizes[size], showText && 'mr-1')} />
        {showText && 'Unavailable Offline'}
      </Badge>
    );
  }

  // Online states
  switch (status) {
    case 'cached':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-green-500/10 text-green-600 border-green-500/30',
            sizeClasses[size],
            className
          )}
        >
          <CheckCircle2 className={cn(iconSizes[size], showText && 'mr-1')} />
          {showText && 'Saved for Offline'}
        </Badge>
      );

    case 'downloading':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-blue-500/10 text-blue-600 border-blue-500/30',
            sizeClasses[size],
            className
          )}
        >
          <Loader2 className={cn(iconSizes[size], 'animate-spin', showText && 'mr-1')} />
          {showText && 'Downloading...'}
        </Badge>
      );

    case 'not-cached':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-muted text-muted-foreground border-muted-foreground/30',
            sizeClasses[size],
            className
          )}
        >
          <Download className={cn(iconSizes[size], showText && 'mr-1')} />
          {showText && 'Download Available'}
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-muted text-muted-foreground border-muted-foreground/30',
            sizeClasses[size],
            className
          )}
        >
          <Wifi className={cn(iconSizes[size], showText && 'mr-1')} />
          {showText && 'Online'}
        </Badge>
      );
  }
}
