/**
 * Batch Progress Monitor
 * Real-time progress modal during batch blog generation
 */

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import { BatchGenerationService } from '@/services/blog/BatchGenerationService';
import type { BatchJobProgress } from '@/types/blog-scheduler';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BatchProgressMonitorProps {
  isOpen: boolean;
  jobId: string | null;
  onClose: () => void;
  onComplete: (jobId: string) => void;
}

export function BatchProgressMonitor({
  isOpen,
  jobId,
  onClose,
  onComplete,
}: BatchProgressMonitorProps) {
  const [progress, setProgress] = useState<BatchJobProgress | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll for progress every 3 seconds
  useEffect(() => {
    if (!jobId || !isOpen) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const pollProgress = async () => {
      try {
        const status = await BatchGenerationService.checkJobStatus(jobId);
        setProgress(status);

        // Stop polling if job is complete or failed
        if (
          status.status === 'completed' ||
          status.status === 'failed' ||
          status.status === 'cancelled'
        ) {
          setIsPolling(false);
          onComplete(jobId);
        }
      } catch (_error) {
        logger.error('Error polling batch status:', _error);
      }
    };

    // Initial poll
    pollProgress();

    // Set up polling interval
    const interval = setInterval(pollProgress, 3000);

    return () => clearInterval(interval);
  }, [jobId, isOpen, onComplete]);

  if (!progress) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading batch job...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-orange-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = () => {
    switch (progress.status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            Completed
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-600">
            Processing
          </Badge>
        );
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{progress.status}</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPolling ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : progress.status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            Batch Blog Generation
          </DialogTitle>
          <DialogDescription>
            Generating {progress.total_posts} blog post{progress.total_posts !== 1 ? 's' : ''} with
            AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Status:</div>
            {getStatusBadge()}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className={getStatusColor()}>
                {progress.completed_posts + progress.failed_posts}/{progress.total_posts} (
                {progress.progress_percentage}%)
              </span>
            </div>
            <Progress value={progress.progress_percentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-green-50 p-3 text-center dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-600">{progress.completed_posts}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="rounded-lg border bg-red-50 p-3 text-center dark:bg-red-950/20">
              <div className="text-2xl font-bold text-red-600">{progress.failed_posts}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="rounded-lg border bg-blue-50 p-3 text-center dark:bg-blue-950/20">
              <div className="text-2xl font-bold text-blue-600">
                {progress.total_posts - progress.completed_posts - progress.failed_posts}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          {/* Estimated Time */}
          {isPolling &&
            progress.estimated_time_remaining !== undefined &&
            progress.estimated_time_remaining > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated time remaining:</span>
                <span className="font-medium">{formatTime(progress.estimated_time_remaining)}</span>
              </div>
            )}

          {/* Current Topic */}
          {isPolling && progress.current_topic && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Currently generating:</div>
              <div className="text-sm font-medium">{progress.current_topic}</div>
            </div>
          )}

          {/* Successful Posts List */}
          {progress.successful_posts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Successful Posts ({progress.successful_posts.length})
              </div>
              <ScrollArea className="h-[150px] rounded-md border">
                <div className="p-4 space-y-2">
                  {progress.successful_posts.map(post => (
                    <div key={post.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {post.scheduled_for
                            ? `Scheduled for ${new Date(post.scheduled_for).toLocaleString()}`
                            : 'Draft'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Failed Posts List */}
          {progress.failed_posts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                <XCircle className="h-4 w-4" />
                Failed Posts ({progress.failed_posts.length})
              </div>
              <ScrollArea className="h-[150px] rounded-md border border-red-200 dark:border-red-900">
                <div className="p-4 space-y-2">
                  {progress.failed_posts.map((post, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{post.topic}</div>
                        <div className="text-xs text-red-600">{post.error}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {isPolling ? (
              <Button
                variant="outline"
                onClick={() => {
                  setIsPolling(false);
                  onClose();
                }}
              >
                Run in Background
              </Button>
            ) : (
              <Button onClick={onClose}>
                {progress.status === 'completed' ? 'Done' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
