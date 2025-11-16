/**
 * useOfflineContent Hook
 *
 * React hook for managing offline content downloads and sync
 */

import { useState, useEffect, useCallback } from 'react';
import { DownloadManager } from '@/services/offline/DownloadManager';
import { OfflineContentService } from '@/services/offline/OfflineContentService';
import type { OfflineDownload } from '@/utils/offlineStorage';

export function useOfflineContent(contentId?: string, contentType?: string) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check download status
    if (contentId && contentType) {
      checkDownloadStatus();
    }
  }, [contentId, contentType]);

  useEffect(() => {
    // Listen for online/offline events
    function handleOnline() {
      setIsOnline(true);
      // Try to sync progress when coming online
      DownloadManager.syncProgress().catch(console.error);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function checkDownloadStatus() {
    if (!contentId || !contentType) return;

    const downloaded = await DownloadManager.isDownloaded(contentId, contentType);
    setIsDownloaded(downloaded);

    const status = await DownloadManager.getDownloadStatus(contentId, contentType);
    if (status?.status === 'downloading') {
      setIsDownloading(true);
      setDownloadProgress(status.progress);
    }
  }

  const download = useCallback(async () => {
    if (!contentId || !contentType) return;

    setIsDownloading(true);

    const cleanup = DownloadManager.onProgress(contentId, progress => {
      setDownloadProgress(progress.progress);

      if (progress.status === 'completed') {
        setIsDownloaded(true);
        setIsDownloading(false);
      } else if (progress.status === 'failed') {
        setIsDownloading(false);
      }
    });

    try {
      if (contentType === 'course') {
        await DownloadManager.downloadCourse(contentId);
      } else if (contentType === 'lesson') {
        await DownloadManager.downloadLesson(contentId);
      }
    } catch (error) {
      setIsDownloading(false);
      throw error;
    }

    return cleanup;
  }, [contentId, contentType]);

  const remove = useCallback(async () => {
    if (!contentId || !contentType) return;

    await DownloadManager.deleteDownload(contentId, contentType);
    setIsDownloaded(false);
  }, [contentId, contentType]);

  const syncProgress = useCallback(async () => {
    return await DownloadManager.syncProgress();
  }, []);

  return {
    isDownloaded,
    isDownloading,
    downloadProgress,
    isOnline,
    download,
    remove,
    syncProgress,
  };
}

export function useOfflineDownloads() {
  const [downloads, setDownloads] = useState<OfflineDownload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  async function loadDownloads() {
    try {
      setIsLoading(true);
      const userDownloads = await DownloadManager.getUserDownloads();
      setDownloads(userDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const refresh = useCallback(() => {
    loadDownloads();
  }, []);

  return {
    downloads,
    isLoading,
    refresh,
  };
}

export function useStorageStats() {
  const [stats, setStats] = useState<{
    totalDownloads: number;
    completedDownloads: number;
    failedDownloads: number;
    totalSize: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);
      const storageStats = await OfflineContentService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const refresh = useCallback(() => {
    loadStats();
  }, []);

  return {
    stats,
    isLoading,
    refresh,
  };
}
