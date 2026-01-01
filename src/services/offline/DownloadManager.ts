import { logger } from '@/utils/logger';
/**
 * Download Manager Service
 *
 * Manages offline content downloads, caching, and synchronization
 */

import { supabase } from '@/integrations/supabase/client';
import {
  OfflineDownloadsDB,
  OfflineProgressDB,
  type OfflineDownload,
  type OfflineProgress,
} from '@/utils/offlineStorage';

export interface DownloadOptions {
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface DownloadProgress {
  contentId: string;
  status: OfflineDownload['status'];
  progress: number;
  downloadedFiles: number;
  totalFiles: number;
}

class DownloadManagerClass {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private progressListeners: Map<string, (progress: DownloadProgress) => void> = new Map();

  constructor() {
    this.initializeServiceWorker();
    this.setupMessageListener();
  }

  /**
   * Initialize service worker
   */
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        logger.info('[DownloadManager] Service worker ready');
      } catch (_error) {
        logger.error('[DownloadManager] Service worker initialization failed:', _error);
      }
    }
  }

  /**
   * Setup message listener for service worker messages
   */
  private setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'DOWNLOAD_PROGRESS') {
          this.handleProgressUpdate(event.data.payload);
        } else if (event.data.type === 'DOWNLOAD_COMPLETE') {
          this.handleDownloadComplete(event.data.payload);
        }
      });
    }
  }

  /**
   * Handle progress update from service worker
   */
  private handleProgressUpdate(payload: { contentId: string; progress: number }) {
    const listener = this.progressListeners.get(payload.contentId);
    if (listener) {
      // Get full progress info from IndexedDB
      OfflineDownloadsDB.get(`content-${payload.contentId}`).then(download => {
        if (download) {
          listener({
            contentId: payload.contentId,
            status: download.status,
            progress: download.progress,
            downloadedFiles: download.downloadedFiles,
            totalFiles: download.totalFiles,
          });
        }
      });
    }
  }

  /**
   * Handle download complete from service worker
   */
  private handleDownloadComplete(payload: { contentId: string; status: string }) {
    const listener = this.progressListeners.get(payload.contentId);
    if (listener) {
      OfflineDownloadsDB.get(`content-${payload.contentId}`).then(download => {
        if (download) {
          listener({
            contentId: payload.contentId,
            status: download.status,
            progress: 100,
            downloadedFiles: download.totalFiles,
            totalFiles: download.totalFiles,
          });
        }
      });
    }
  }

  /**
   * Download course for offline access
   */
  async downloadCourse(courseId: string, options: DownloadOptions = {}): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Fetch course data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*, lessons(*)')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      if (!course) throw new Error('Course not found');

      // Collect all URLs to download
      const urls: string[] = [];

      // Add course thumbnail
      if (course.thumbnail_url) {
        urls.push(course.thumbnail_url);
      }

      // Add lesson content and videos
      if (course.lessons) {
        for (const lesson of course.lessons) {
          if (lesson.video_url) urls.push(lesson.video_url);
          if (lesson.content_url) urls.push(lesson.content_url);
          // Add any other resource URLs
        }
      }

      // Record download in database
      const { error: dbError } = await supabase.from('offline_downloads').insert({
        user_id: user.user.id,
        content_type: 'course',
        content_id: courseId,
        download_status: 'pending',
        file_size_bytes: 0, // Will be calculated
        metadata: {
          ...options.metadata,
          courseName: course.title,
          lessonCount: course.lessons?.length || 0,
        },
      });

      if (dbError) throw dbError;

      // Send download request to service worker
      await this.sendToServiceWorker({
        type: 'DOWNLOAD_CONTENT',
        payload: {
          contentId: courseId,
          contentType: 'course',
          urls,
          userId: user.user.id,
          metadata: {
            courseName: course.title,
            lessonCount: course.lessons?.length || 0,
          },
        },
      });

      logger.info('[DownloadManager] Course download initiated:', courseId);
    } catch (_error) {
      logger.error('[DownloadManager] Download course failed:', _error);
      throw error;
    }
  }

  /**
   * Download lesson for offline access
   */
  async downloadLesson(lessonId: string, options: DownloadOptions = {}): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Fetch lesson data
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      if (!lesson) throw new Error('Lesson not found');

      // Collect URLs
      const urls: string[] = [];
      if (lesson.video_url) urls.push(lesson.video_url);
      if (lesson.content_url) urls.push(lesson.content_url);

      // Record download in database
      const { error: dbError } = await supabase.from('offline_downloads').insert({
        user_id: user.user.id,
        content_type: 'lesson',
        content_id: lessonId,
        download_status: 'pending',
        metadata: {
          ...options.metadata,
          lessonName: lesson.title,
        },
      });

      if (dbError) throw dbError;

      // Send to service worker
      await this.sendToServiceWorker({
        type: 'DOWNLOAD_CONTENT',
        payload: {
          contentId: lessonId,
          contentType: 'lesson',
          urls,
          userId: user.user.id,
          metadata: {
            lessonName: lesson.title,
          },
        },
      });

      logger.info('[DownloadManager] Lesson download initiated:', lessonId);
    } catch (_error) {
      logger.error('[DownloadManager] Download lesson failed:', _error);
      throw error;
    }
  }

  /**
   * Delete downloaded content
   */
  async deleteDownload(contentId: string, contentType: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Get download record to get URLs
      const download = await OfflineDownloadsDB.get(`${contentType}-${contentId}`);
      if (!download) throw new Error('Download not found');

      // Update status in database
      await supabase
        .from('offline_downloads')
        .update({ download_status: 'deleted' })
        .eq('content_id', contentId)
        .eq('user_id', user.user.id);

      // Send delete request to service worker
      await this.sendToServiceWorker({
        type: 'DELETE_DOWNLOAD',
        payload: {
          contentId,
          contentType,
          urls: download.metadata?.urls || [],
        },
      });

      logger.info('[DownloadManager] Download deleted:', contentId);
    } catch (_error) {
      logger.error('[DownloadManager] Delete download failed:', _error);
      throw error;
    }
  }

  /**
   * Get download status
   */
  async getDownloadStatus(contentId: string, contentType: string): Promise<OfflineDownload | null> {
    try {
      return await OfflineDownloadsDB.get(`${contentType}-${contentId}`);
    } catch (_error) {
      logger.error('[DownloadManager] Get download status failed:', _error);
      return null;
    }
  }

  /**
   * Get all downloads for current user
   */
  async getUserDownloads(): Promise<OfflineDownload[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      return await OfflineDownloadsDB.getByUser(user.user.id);
    } catch (_error) {
      logger.error('[DownloadManager] Get user downloads failed:', _error);
      return [];
    }
  }

  /**
   * Register progress listener
   */
  onProgress(contentId: string, callback: (progress: DownloadProgress) => void): () => void {
    this.progressListeners.set(contentId, callback);

    // Return cleanup function
    return () => {
      this.progressListeners.delete(contentId);
    };
  }

  /**
   * Save progress while offline
   */
  async saveOfflineProgress(
    contentId: string,
    contentType: OfflineProgress['contentType'],
    progressData: Record<string, unknown>
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const progress: OfflineProgress = {
        contentId,
        contentType,
        userId: user.user.id,
        progressData,
        syncStatus: 'pending',
        timestamp: new Date().toISOString(),
      };

      await OfflineProgressDB.add(progress);

      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in (await navigator.serviceWorker.ready)) {
        await this.sendToServiceWorker({ type: 'SYNC_PROGRESS', payload: {} });
      }

      logger.info('[DownloadManager] Progress saved offline:', contentId);
    } catch (_error) {
      logger.error('[DownloadManager] Save offline progress failed:', _error);
      throw error;
    }
  }

  /**
   * Sync all pending progress
   */
  async syncProgress(): Promise<{ synced: number; failed: number }> {
    try {
      const pending = await OfflineProgressDB.getPending();
      let synced = 0;
      let failed = 0;

      for (const record of pending) {
        try {
          // Update record status
          record.syncStatus = 'syncing';
          await OfflineProgressDB.update(record);

          // Sync to server
          const { error } = await supabase.from('offline_progress').insert({
            user_id: record.userId,
            content_type: record.contentType,
            content_id: record.contentId,
            progress_data: record.progressData,
            client_timestamp: record.timestamp,
          });

          if (error) throw error;

          // Mark as synced
          record.syncStatus = 'synced';
          record.syncedAt = new Date().toISOString();
          await OfflineProgressDB.update(record);
          synced++;
        } catch (_error) {
          logger.error('[DownloadManager] Sync failed for record:', record.id, _error);
          record.syncStatus = 'failed';
          record.error = error instanceof Error ? error.message : 'Unknown error';
          await OfflineProgressDB.update(record);
          failed++;
        }
      }

      logger.info(`[DownloadManager] Sync complete: ${synced} synced, ${failed} failed`);
      return { synced, failed };
    } catch (_error) {
      logger.error('[DownloadManager] Sync progress failed:', _error);
      throw error;
    }
  }

  /**
   * Check if content is downloaded
   */
  async isDownloaded(contentId: string, contentType: string): Promise<boolean> {
    const download = await this.getDownloadStatus(contentId, contentType);
    return download?.status === 'completed';
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Send message to service worker
   */
  private async sendToServiceWorker(message: Record<string, unknown>): Promise<void> {
    if (!this.serviceWorkerRegistration?.active) {
      throw new Error('Service worker not active');
    }

    this.serviceWorkerRegistration.active.postMessage(message);
  }
}

export const DownloadManager = new DownloadManagerClass();
