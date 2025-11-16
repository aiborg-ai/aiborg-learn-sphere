/**
 * Download Manager UI Component
 *
 * Full-page interface for managing offline downloads
 */

import { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, HardDrive, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DownloadManager } from '@/services/offline/DownloadManager';
import { OfflineContentService } from '@/services/offline/OfflineContentService';
import { getStorageUsage } from '@/utils/offlineStorage';
import type { OfflineDownload } from '@/utils/offlineStorage';

export function DownloadManagerUI() {
  const [downloads, setDownloads] = useState<OfflineDownload[]>([]);
  const [storageStats, setStorageStats] = useState<{
    usage: number;
    quota: number;
    percentage: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadDownloads();
    loadStorageStats();
  }, []);

  async function loadDownloads() {
    try {
      setIsLoading(true);
      const userDownloads = await DownloadManager.getUserDownloads();
      setDownloads(userDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
      toast.error('Failed to load downloads');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStorageStats() {
    try {
      const stats = await getStorageUsage();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  }

  async function handleDeleteDownload(contentId: string, contentType: string) {
    try {
      await DownloadManager.deleteDownload(contentId, contentType);
      toast.success('Download removed');
      loadDownloads();
      loadStorageStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete: ${message}`);
    }
  }

  async function handleSyncProgress() {
    try {
      setIsSyncing(true);
      const result = await DownloadManager.syncProgress();
      toast.success(`Synced ${result.synced} items, ${result.failed} failed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Sync failed: ${message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleClearAll() {
    if (!confirm('Are you sure you want to delete all offline content?')) {
      return;
    }

    try {
      await OfflineContentService.clearAllCache();
      toast.success('All offline content cleared');
      loadDownloads();
      loadStorageStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to clear cache: ${message}`);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function getStatusBadge(status: OfflineDownload['status']) {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'downloading':
        return <Badge variant="secondary">Downloading...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const downloadingCount = downloads.filter(d => d.status === 'downloading').length;
  const failedCount = downloads.filter(d => d.status === 'failed').length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offline Content</h1>
          <p className="text-muted-foreground">Manage your downloaded courses and lessons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncProgress} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Progress
          </Button>
          <Button variant="destructive" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatBytes(storageStats.usage)} used</span>
                <span>{formatBytes(storageStats.quota)} total</span>
              </div>
              <Progress value={storageStats.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {storageStats.percentage.toFixed(1)}% of available storage
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{completedDownloads.length}</p>
                <p className="text-xs text-muted-foreground">Downloaded</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{downloadingCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      {!navigator.onLine && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are currently offline. You can access downloaded content, but cannot download new
            content or sync progress until you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {/* Downloads List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Downloaded Content</h2>

        {downloads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No offline content yet</p>
              <p className="text-sm text-muted-foreground">
                Download courses and lessons to access them offline
              </p>
            </CardContent>
          </Card>
        ) : (
          downloads.map(download => (
            <Card key={download.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {(download.metadata as { courseName?: string; lessonName?: string })
                        ?.courseName ||
                        (download.metadata as { lessonName?: string })?.lessonName ||
                        'Untitled'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className="capitalize">{download.contentType}</span>
                      {getStatusBadge(download.status)}
                    </CardDescription>
                  </div>
                  {download.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDownload(download.contentId, download.contentType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {download.status === 'downloading' && (
                  <div className="space-y-2">
                    <Progress value={download.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {download.downloadedFiles} / {download.totalFiles} files
                      </span>
                      <span>{download.progress}%</span>
                    </div>
                  </div>
                )}
                {download.status === 'completed' && (
                  <div className="text-sm text-muted-foreground">
                    <p>Downloaded: {new Date(download.createdAt).toLocaleDateString()}</p>
                    {download.metadata?.totalSize && (
                      <p>Size: {formatBytes(download.metadata.totalSize as number)}</p>
                    )}
                  </div>
                )}
                {download.status === 'failed' && download.error && (
                  <p className="text-sm text-destructive">Error: {download.error}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
