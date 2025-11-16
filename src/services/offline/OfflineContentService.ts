/**
 * Offline Content Service
 *
 * Provides access to cached content when offline
 */

import { supabase } from '@/integrations/supabase/client';
import { OfflineDownloadsDB } from '@/utils/offlineStorage';

export interface CachedCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  lessons: CachedLesson[];
  isOffline: boolean;
  downloadedAt?: string;
}

export interface CachedLesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  content_url?: string;
  order: number;
  isOffline: boolean;
}

class OfflineContentServiceClass {
  private readonly CACHE_NAME = 'offline-content-v1';

  /**
   * Get cached course (online or offline)
   */
  async getCourse(courseId: string): Promise<CachedCourse | null> {
    try {
      // Check if we're offline
      const isOffline = !navigator.onLine;

      if (isOffline) {
        // Try to get from cache
        return await this.getCachedCourse(courseId);
      } else {
        // Get from Supabase (online)
        const { data: course, error } = await supabase
          .from('courses')
          .select('*, lessons(*)')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        if (!course) return null;

        // Check if it's also available offline
        const download = await OfflineDownloadsDB.get(`course-${courseId}`);
        const isDownloaded = download?.status === 'completed';

        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          thumbnail_url: course.thumbnail_url,
          lessons: (course.lessons || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(lesson => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              video_url: lesson.video_url,
              content_url: lesson.content_url,
              order: lesson.order || 0,
              isOffline: isDownloaded,
            })),
          isOffline: isDownloaded,
          downloadedAt: download?.completedAt,
        };
      }
    } catch (error) {
      console.error('[OfflineContentService] Get course failed:', error);
      // Fallback to cached version if online request fails
      return await this.getCachedCourse(courseId);
    }
  }

  /**
   * Get course from cache
   */
  private async getCachedCourse(courseId: string): Promise<CachedCourse | null> {
    try {
      const download = await OfflineDownloadsDB.get(`course-${courseId}`);

      if (!download || download.status !== 'completed') {
        return null;
      }

      // Reconstruct course from cached metadata
      const metadata = download.metadata as {
        courseName?: string;
        courseDescription?: string;
        lessons?: CachedLesson[];
      };

      return {
        id: courseId,
        title: metadata?.courseName || 'Offline Course',
        description: metadata?.courseDescription || '',
        lessons: metadata?.lessons || [],
        isOffline: true,
        downloadedAt: download.completedAt,
      };
    } catch (error) {
      console.error('[OfflineContentService] Get cached course failed:', error);
      return null;
    }
  }

  /**
   * Get cached lesson
   */
  async getLesson(lessonId: string): Promise<CachedLesson | null> {
    try {
      const isOffline = !navigator.onLine;

      if (isOffline) {
        return await this.getCachedLesson(lessonId);
      } else {
        const { data: lesson, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (error) throw error;
        if (!lesson) return null;

        const download = await OfflineDownloadsDB.get(`lesson-${lessonId}`);
        const isDownloaded = download?.status === 'completed';

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          video_url: lesson.video_url,
          content_url: lesson.content_url,
          order: lesson.order || 0,
          isOffline: isDownloaded,
        };
      }
    } catch (error) {
      console.error('[OfflineContentService] Get lesson failed:', error);
      return await this.getCachedLesson(lessonId);
    }
  }

  /**
   * Get lesson from cache
   */
  private async getCachedLesson(lessonId: string): Promise<CachedLesson | null> {
    try {
      const download = await OfflineDownloadsDB.get(`lesson-${lessonId}`);

      if (!download || download.status !== 'completed') {
        return null;
      }

      const metadata = download.metadata as {
        lessonName?: string;
        lessonDescription?: string;
        videoUrl?: string;
        contentUrl?: string;
        order?: number;
      };

      return {
        id: lessonId,
        title: metadata?.lessonName || 'Offline Lesson',
        description: metadata?.lessonDescription,
        video_url: metadata?.videoUrl,
        content_url: metadata?.contentUrl,
        order: metadata?.order || 0,
        isOffline: true,
      };
    } catch (error) {
      console.error('[OfflineContentService] Get cached lesson failed:', error);
      return null;
    }
  }

  /**
   * Get all offline-available courses
   */
  async getOfflineCourses(): Promise<CachedCourse[]> {
    try {
      const downloads = await OfflineDownloadsDB.getByStatus('completed');
      const courseDownloads = downloads.filter(d => d.contentType === 'course');

      const courses: CachedCourse[] = [];
      for (const download of courseDownloads) {
        const course = await this.getCachedCourse(download.contentId);
        if (course) {
          courses.push(course);
        }
      }

      return courses;
    } catch (error) {
      console.error('[OfflineContentService] Get offline courses failed:', error);
      return [];
    }
  }

  /**
   * Get video blob from cache
   */
  async getCachedVideoBlob(videoUrl: string): Promise<Blob | null> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const response = await cache.match(videoUrl);

      if (response) {
        return await response.blob();
      }

      return null;
    } catch (error) {
      console.error('[OfflineContentService] Get cached video failed:', error);
      return null;
    }
  }

  /**
   * Get cached content URL (for videos, documents)
   */
  async getCachedContentUrl(url: string): Promise<string | null> {
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const response = await cache.match(url);

      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      return null;
    } catch (error) {
      console.error('[OfflineContentService] Get cached content URL failed:', error);
      return null;
    }
  }

  /**
   * Check if content is available offline
   */
  async isAvailableOffline(contentId: string, contentType: string): Promise<boolean> {
    try {
      const download = await OfflineDownloadsDB.get(`${contentType}-${contentId}`);
      return download?.status === 'completed';
    } catch (error) {
      console.error('[OfflineContentService] Check offline availability failed:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalDownloads: number;
    completedDownloads: number;
    failedDownloads: number;
    totalSize: number;
  }> {
    try {
      const downloads = await OfflineDownloadsDB.getAll();

      const completed = downloads.filter(d => d.status === 'completed');
      const failed = downloads.filter(d => d.status === 'failed');

      const totalSize = completed.reduce((sum, d) => sum + (d.metadata?.totalSize || 0), 0);

      return {
        totalDownloads: downloads.length,
        completedDownloads: completed.length,
        failedDownloads: failed.length,
        totalSize,
      };
    } catch (error) {
      console.error('[OfflineContentService] Get storage stats failed:', error);
      return {
        totalDownloads: 0,
        completedDownloads: 0,
        failedDownloads: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Clear all cached content
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear IndexedDB
      await OfflineDownloadsDB.clear();

      // Clear Cache API
      await caches.delete(this.CACHE_NAME);

      console.log('[OfflineContentService] All cache cleared');
    } catch (error) {
      console.error('[OfflineContentService] Clear cache failed:', error);
      throw error;
    }
  }
}

export const OfflineContentService = new OfflineContentServiceClass();
