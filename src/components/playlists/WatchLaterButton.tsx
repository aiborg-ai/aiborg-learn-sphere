import React from 'react';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle } from 'lucide-react';
import { useWatchLater } from '@/hooks/useWatchLater';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    } catch (error) {
      logger.error('Watch later error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update watch later queue',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        'transition-colors',
        inQueue && 'text-blue-600 dark:text-blue-500',
        className
      )}
      title={inQueue ? 'Remove from Watch Later' : 'Add to Watch Later'}
    >
      {inQueue ? (
        <CheckCircle className={cn('h-4 w-4', showLabel && 'mr-2')} />
      ) : (
        <Clock className={cn('h-4 w-4', showLabel && 'mr-2')} />
      )}
      {showLabel && (inQueue ? 'In Queue' : 'Watch Later')}
    </Button>
  );
}
