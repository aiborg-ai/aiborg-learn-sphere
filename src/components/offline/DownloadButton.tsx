/**
 * Download Button Component
 *
 * Button to download content for offline access with progress indicator
 */

import { useState, useEffect } from 'react';
import { Download, Check, X, Loader2, Trash2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { DownloadManager, type DownloadProgress } from '@/services/offline/DownloadManager';

export interface DownloadButtonProps {
  contentId: string;
  contentType: 'course' | 'lesson';
  contentName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showProgress?: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: Error) => void;
}

export function DownloadButton({
  contentId,
  contentType,
  contentName,
  variant = 'outline',
  size = 'default',
  showProgress = true,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}: DownloadButtonProps) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDownloadStatus();
  }, [contentId, contentType]);

  useEffect(() => {
    if (!isDownloading) return;

    // Listen for download progress
    const cleanup = DownloadManager.onProgress(contentId, prog => {
      setProgress(prog);

      if (prog.status === 'completed') {
        setIsDownloaded(true);
        setIsDownloading(false);
        toast.success(`${contentName} downloaded successfully`);
        onDownloadComplete?.();
      } else if (prog.status === 'failed') {
        setIsDownloading(false);
        setError('Download failed');
        toast.error(`Failed to download ${contentName}`);
        onDownloadError?.(new Error('Download failed'));
      }
    });

    return cleanup;
  }, [isDownloading, contentId]);

  async function checkDownloadStatus() {
    const downloaded = await DownloadManager.isDownloaded(contentId, contentType);
    setIsDownloaded(downloaded);
  }

  async function handleDownload() {
    try {
      setIsDownloading(true);
      setError(null);
      onDownloadStart?.();

      if (contentType === 'course') {
        await DownloadManager.downloadCourse(contentId);
      } else {
        await DownloadManager.downloadLesson(contentId);
      }

      toast.info(`Downloading ${contentName}...`);
    } catch (err) {
      setIsDownloading(false);
      const error = err instanceof Error ? err : new Error('Download failed');
      setError(error.message);
      toast.error(`Failed to start download: ${error.message}`);
      onDownloadError?.(error);
    }
  }

  async function handleDelete() {
    try {
      await DownloadManager.deleteDownload(contentId, contentType);
      setIsDownloaded(false);
      toast.success(`${contentName} removed from offline storage`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Delete failed');
      toast.error(`Failed to delete download: ${error.message}`);
    }
  }

  if (isDownloaded) {
    return (
      <div className="flex items-center gap-2">
        <Button variant={variant} size={size} disabled className="gap-2">
          <Check className="h-4 w-4" />
          <span>Downloaded</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Remove download">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isDownloading) {
    return (
      <div className="space-y-2">
        <Button variant={variant} size={size} disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Downloading...</span>
          {progress && <span className="text-xs">({progress.progress}%)</span>}
        </Button>
        {showProgress && progress && (
          <div className="space-y-1">
            <Progress value={progress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.downloadedFiles} / {progress.totalFiles} files
            </p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Button variant="destructive" size={size} onClick={handleDownload} className="gap-2">
        <X className="h-4 w-4" />
        <span>Retry Download</span>
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} className="gap-2">
      <Download className="h-4 w-4" />
      <span>Download</span>
    </Button>
  );
}
