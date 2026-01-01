/**
 * Video Cache Service
 *
 * Handles video blob caching for offline playback using IndexedDB
 */

import { logger } from '@/utils/logger';

const DB_NAME = 'aiborg-video-cache';
const DB_VERSION = 1;
const VIDEO_STORE = 'video-blobs';
const MANIFEST_STORE = 'video-manifest';

export interface CachedVideo {
  id: string;
  lessonId: string;
  url: string;
  blob: Blob;
  mimeType: string;
  size: number;
  duration?: number;
  cachedAt: string;
  lastAccessedAt: string;
  expiresAt?: string;
}

export interface VideoManifestEntry {
  lessonId: string;
  videoId: string;
  url: string;
  size: number;
  mimeType: string;
  duration?: number;
  status: 'pending' | 'downloading' | 'cached' | 'failed';
  progress: number;
  cachedAt?: string;
  error?: string;
}

export interface CacheStats {
  totalVideos: number;
  totalSize: number;
  oldestVideo?: string;
  newestVideo?: string;
}

/**
 * Open video cache database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create video blobs store
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        const videoStore = db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
        videoStore.createIndex('lessonId', 'lessonId', { unique: false });
        videoStore.createIndex('url', 'url', { unique: true });
        videoStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      // Create manifest store for tracking
      if (!db.objectStoreNames.contains(MANIFEST_STORE)) {
        const manifestStore = db.createObjectStore(MANIFEST_STORE, { keyPath: 'videoId' });
        manifestStore.createIndex('lessonId', 'lessonId', { unique: false });
        manifestStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

class VideoCacheServiceClass {
  private downloadAbortControllers: Map<string, AbortController> = new Map();
  private progressCallbacks: Map<string, (progress: number) => void> = new Map();

  /**
   * Download and cache a video blob
   */
  async cacheVideo(
    url: string,
    lessonId: string,
    options: {
      onProgress?: (progress: number) => void;
      expiresInDays?: number;
    } = {}
  ): Promise<string> {
    const videoId = this.generateVideoId(url, lessonId);

    try {
      // Check if already cached
      const existing = await this.getVideoById(videoId);
      if (existing) {
        logger.info('[VideoCacheService] Video already cached:', videoId);
        await this.updateLastAccessed(videoId);
        return videoId;
      }

      // Update manifest
      await this.updateManifest({
        lessonId,
        videoId,
        url,
        size: 0,
        mimeType: '',
        status: 'downloading',
        progress: 0,
      });

      // Setup abort controller
      const abortController = new AbortController();
      this.downloadAbortControllers.set(videoId, abortController);

      if (options.onProgress) {
        this.progressCallbacks.set(videoId, options.onProgress);
      }

      // Fetch video with progress tracking
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      const mimeType = response.headers.get('content-type') || 'video/mp4';

      // Read response with progress
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        const progress = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;

        // Update manifest progress
        await this.updateManifest({
          lessonId,
          videoId,
          url,
          size: receivedBytes,
          mimeType,
          status: 'downloading',
          progress,
        });

        // Call progress callback
        const progressCallback = this.progressCallbacks.get(videoId);
        if (progressCallback) {
          progressCallback(progress);
        }
      }

      // Create blob from chunks
      const blob = new Blob(chunks, { type: mimeType });

      // Calculate expiration
      const now = new Date();
      const expiresAt = options.expiresInDays
        ? new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      // Store video blob
      const cachedVideo: CachedVideo = {
        id: videoId,
        lessonId,
        url,
        blob,
        mimeType,
        size: blob.size,
        cachedAt: now.toISOString(),
        lastAccessedAt: now.toISOString(),
        expiresAt,
      };

      await this.storeVideo(cachedVideo);

      // Update manifest as cached
      await this.updateManifest({
        lessonId,
        videoId,
        url,
        size: blob.size,
        mimeType,
        status: 'cached',
        progress: 100,
        cachedAt: now.toISOString(),
      });

      logger.info(
        '[VideoCacheService] Video cached successfully:',
        videoId,
        `${(blob.size / 1024 / 1024).toFixed(2)} MB`
      );

      return videoId;
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to cache video:', _error);

      // Update manifest as failed
      await this.updateManifest({
        lessonId,
        videoId,
        url,
        size: 0,
        mimeType: '',
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    } finally {
      this.downloadAbortControllers.delete(videoId);
      this.progressCallbacks.delete(videoId);
    }
  }

  /**
   * Cancel an in-progress download
   */
  cancelDownload(videoId: string): void {
    const controller = this.downloadAbortControllers.get(videoId);
    if (controller) {
      controller.abort();
      this.downloadAbortControllers.delete(videoId);
      logger.info('[VideoCacheService] Download cancelled:', videoId);
    }
  }

  /**
   * Get cached video by ID
   */
  async getVideoById(videoId: string): Promise<CachedVideo | null> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.get(videoId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to get video:', _error);
      return null;
    }
  }

  /**
   * Get cached video by URL
   */
  async getVideoByUrl(url: string): Promise<CachedVideo | null> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('url');
        const request = index.get(url);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to get video by URL:', _error);
      return null;
    }
  }

  /**
   * Get all cached videos for a lesson
   */
  async getVideosByLesson(lessonId: string): Promise<CachedVideo[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('lessonId');
        const request = index.getAll(lessonId);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to get videos by lesson:', _error);
      return [];
    }
  }

  /**
   * Check if video is cached
   */
  async isCached(url: string): Promise<boolean> {
    const video = await this.getVideoByUrl(url);
    return video !== null;
  }

  /**
   * Get object URL for cached video (for playback)
   */
  async getVideoObjectUrl(url: string): Promise<string | null> {
    const video = await this.getVideoByUrl(url);
    if (!video) return null;

    // Update last accessed
    await this.updateLastAccessed(video.id);

    return URL.createObjectURL(video.blob);
  }

  /**
   * Delete cached video
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      const db = await openDatabase();
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([VIDEO_STORE], 'readwrite');
          const store = transaction.objectStore(VIDEO_STORE);
          const request = store.delete(videoId);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([MANIFEST_STORE], 'readwrite');
          const store = transaction.objectStore(MANIFEST_STORE);
          const request = store.delete(videoId);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
      ]);

      logger.info('[VideoCacheService] Video deleted:', videoId);
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to delete video:', _error);
      throw error;
    }
  }

  /**
   * Delete all cached videos for a lesson
   */
  async deleteVideosByLesson(lessonId: string): Promise<void> {
    const videos = await this.getVideosByLesson(lessonId);
    for (const video of videos) {
      await this.deleteVideo(video.id);
    }
  }

  /**
   * Clear all cached videos
   */
  async clearCache(): Promise<void> {
    try {
      const db = await openDatabase();
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([VIDEO_STORE], 'readwrite');
          const store = transaction.objectStore(VIDEO_STORE);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([MANIFEST_STORE], 'readwrite');
          const store = transaction.objectStore(MANIFEST_STORE);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
      ]);

      logger.info('[VideoCacheService] Cache cleared');
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to clear cache:', _error);
      throw error;
    }
  }

  /**
   * Clear expired videos
   */
  async clearExpired(): Promise<number> {
    try {
      const db = await openDatabase();
      const now = new Date().toISOString();
      let deletedCount = 0;

      const allVideos = await new Promise<CachedVideo[]>((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      for (const video of allVideos) {
        if (video.expiresAt && video.expiresAt < now) {
          await this.deleteVideo(video.id);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info('[VideoCacheService] Cleared expired videos:', deletedCount);
      }

      return deletedCount;
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to clear expired videos:', _error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const db = await openDatabase();
      const allVideos = await new Promise<CachedVideo[]>((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const stats: CacheStats = {
        totalVideos: allVideos.length,
        totalSize: allVideos.reduce((sum, v) => sum + v.size, 0),
      };

      if (allVideos.length > 0) {
        const sorted = [...allVideos].sort((a, b) => a.cachedAt.localeCompare(b.cachedAt));
        stats.oldestVideo = sorted[0].cachedAt;
        stats.newestVideo = sorted[sorted.length - 1].cachedAt;
      }

      return stats;
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to get cache stats:', _error);
      return { totalVideos: 0, totalSize: 0 };
    }
  }

  /**
   * Get manifest for a lesson
   */
  async getLessonManifest(lessonId: string): Promise<VideoManifestEntry[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([MANIFEST_STORE], 'readonly');
        const store = transaction.objectStore(MANIFEST_STORE);
        const index = store.index('lessonId');
        const request = index.getAll(lessonId);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (_error) {
      logger.error('[VideoCacheService] Failed to get lesson manifest:', _error);
      return [];
    }
  }

  /**
   * Store video in IndexedDB
   */
  private async storeVideo(video: CachedVideo): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VIDEO_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.put(video);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update manifest entry
   */
  private async updateManifest(entry: VideoManifestEntry): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MANIFEST_STORE], 'readwrite');
      const store = transaction.objectStore(MANIFEST_STORE);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update last accessed timestamp
   */
  private async updateLastAccessed(videoId: string): Promise<void> {
    const video = await this.getVideoById(videoId);
    if (video) {
      video.lastAccessedAt = new Date().toISOString();
      await this.storeVideo(video);
    }
  }

  /**
   * Generate unique video ID
   */
  private generateVideoId(url: string, lessonId: string): string {
    // Create a simple hash from URL and lessonId
    const combined = `${lessonId}:${url}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `video-${lessonId}-${Math.abs(hash).toString(36)}`;
  }
}

export const VideoCacheService = new VideoCacheServiceClass();
