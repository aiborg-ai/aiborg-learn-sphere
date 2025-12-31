import React, { useMemo } from 'react';
import { logger } from '@/utils/logger';
import { Clock, CheckCircle } from '@/components/ui/icons';
import { useWatchLater } from '@/hooks/useWatchLater';
import { useToast } from '@/hooks/use-toast';
import { ActionButton, ActionButtonConfig } from '@/components/shared/ActionButton';

interface WatchLaterButtonProps {
  materialId: string;
  courseId?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function WatchLaterButton({
  materialId,
  courseId,
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false,
}: WatchLaterButtonProps) {
  const { toast } = useToast();
  const { addToQueue, removeFromQueue, isInQueue, getQueueItem } = useWatchLater();

  const inQueue = isInQueue(materialId);
  const queueItem = getQueueItem(materialId);

  // Define button configuration
  const config: ActionButtonConfig = useMemo(
    () => ({
      defaultIcon: Clock,
      activeIcon: CheckCircle,
      defaultLabel: 'Watch Later',
      activeLabel: 'In Queue',
      defaultTitle: 'Add to Watch Later',
      activeTitle: 'Remove from Watch Later',
      activeColorClass: 'text-blue-600 dark:text-blue-500',
    }),
    []
  );

  const handleToggle = async () => {
    try {
      if (inQueue && queueItem) {
        await removeFromQueue(queueItem.id);
        toast({
          title: 'Removed from Watch Later',
          description: 'This item has been removed from your queue',
        });
      } else {
        await addToQueue({
          material_id: materialId,
          course_id: courseId,
        });
        toast({
          title: 'Added to Watch Later',
          description: 'This item has been added to your queue',
        });
      }
    } catch (_error) {
      logger._error('Watch later _error:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update watch later queue',
        variant: 'destructive',
      });
    }
  };

  return (
    <ActionButton
      config={config}
      isActive={inQueue}
      onClick={handleToggle}
      variant={variant}
      size={size}
      className={className}
      showLabel={showLabel}
    />
  );
}
