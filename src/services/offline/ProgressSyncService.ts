import { logger } from '@/utils/logger';
/**
 * Progress Sync Service
 *
 * Automatically syncs offline progress when device comes back online
 */

import { supabase } from '@/integrations/supabase/client';
import { OfflineProgressDB, type OfflineProgress } from '@/utils/offlineStorage';

export type SyncEventListener = (event: SyncEvent) => void;

export interface SyncEvent {
  type: 'sync-started' | 'sync-completed' | 'sync-failed' | 'item-synced' | 'item-failed';
  data?: unknown;
}

class ProgressSyncServiceClass {
  private listeners: Set<SyncEventListener> = new Set();
  private isSyncing = false;
  private syncInterval: number | null = null;

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  /**
   * Setup network change listeners
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      logger.info('[ProgressSyncService] Device is online, syncing...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      logger.info('[ProgressSyncService] Device is offline');
      this.emit({ type: 'sync-failed', data: { reason: 'offline' } });
    });
  }

  /**
   * Start periodic sync (every 5 minutes when online)
   */
  private startPeriodicSync() {
    this.syncInterval = window.setInterval(
      () => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncAll();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending progress
   */
  async syncAll(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      logger.info('[ProgressSyncService] Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      logger.info('[ProgressSyncService] Device is offline, skipping sync');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.emit({ type: 'sync-started' });

    try {
      const pending = await OfflineProgressDB.getPending();
      logger.info(`[ProgressSyncService] Syncing ${pending.length} items...`);

      let synced = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          await this.syncItem(item);
          synced++;
          this.emit({ type: 'item-synced', data: item });
        } catch (_error) {
          logger._error('[ProgressSyncService] Failed to sync item:', item.id, _error);
          failed++;
          this.emit({ type: 'item-failed', data: { item, error } });
        }
      }

      logger.info(`[ProgressSyncService] Sync completed: ${synced} synced, ${failed} failed`);
      this.emit({ type: 'sync-completed', data: { synced, failed } });

      return { synced, failed };
    } catch (_error) {
      logger._error('[ProgressSyncService] Sync all failed:', _error);
      this.emit({ type: 'sync-failed', data: error });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual progress item
   */
  private async syncItem(item: OfflineProgress): Promise<void> {
    // Update status to syncing
    item.syncStatus = 'syncing';
    await OfflineProgressDB.update(item);

    try {
      // Determine which table to update based on content type
      if (item.contentType === 'lesson') {
        await this.syncLessonProgress(item);
      } else if (item.contentType === 'course') {
        await this.syncCourseProgress(item);
      } else if (item.contentType === 'quiz') {
        await this.syncQuizProgress(item);
      } else if (item.contentType === 'assessment') {
        await this.syncAssessmentProgress(item);
      } else if (item.contentType === 'video') {
        await this.syncVideoProgress(item);
      }

      // Mark as synced
      item.syncStatus = 'synced';
      item.syncedAt = new Date().toISOString();
      await OfflineProgressDB.update(item);
    } catch (_error) {
      // Mark as failed
      item.syncStatus = 'failed';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      await OfflineProgressDB.update(item);
      throw error;
    }
  }

  /**
   * Sync lesson progress
   */
  private async syncLessonProgress(item: OfflineProgress): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const progressData = item.progressData as {
      completed?: boolean;
      progress?: number;
      lastPosition?: number;
    };

    // Check if progress record exists
    const { data: existing } = await supabase
      .from('user_lesson_progress')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('lesson_id', item.contentId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_lesson_progress')
        .update({
          completed: progressData.completed || false,
          progress: progressData.progress || 0,
          last_position: progressData.lastPosition || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase.from('user_lesson_progress').insert({
        user_id: user.user.id,
        lesson_id: item.contentId,
        completed: progressData.completed || false,
        progress: progressData.progress || 0,
        last_position: progressData.lastPosition || 0,
      });

      if (error) throw error;
    }
  }

  /**
   * Sync course progress
   */
  private async syncCourseProgress(item: OfflineProgress): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const progressData = item.progressData as {
      completed?: boolean;
      progress?: number;
    };

    const { data: existing } = await supabase
      .from('user_course_progress')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('course_id', item.contentId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_course_progress')
        .update({
          completed: progressData.completed || false,
          progress: progressData.progress || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('user_course_progress').insert({
        user_id: user.user.id,
        course_id: item.contentId,
        completed: progressData.completed || false,
        progress: progressData.progress || 0,
      });

      if (error) throw error;
    }
  }

  /**
   * Sync quiz progress
   */
  private async syncQuizProgress(item: OfflineProgress): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const progressData = item.progressData as {
      answers?: Record<string, unknown>;
      score?: number;
      completed?: boolean;
    };

    const { error } = await supabase.from('quiz_submissions').insert({
      user_id: user.user.id,
      quiz_id: item.contentId,
      answers: progressData.answers || {},
      score: progressData.score || 0,
      completed: progressData.completed || false,
      submitted_at: item.timestamp,
    });

    if (error) throw error;
  }

  /**
   * Sync assessment progress
   */
  private async syncAssessmentProgress(item: OfflineProgress): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const progressData = item.progressData as {
      answers?: Record<string, unknown>;
      score?: number;
      completed?: boolean;
    };

    const { error } = await supabase.from('assessment_results').insert({
      user_id: user.user.id,
      assessment_id: item.contentId,
      answers: progressData.answers || {},
      score: progressData.score || 0,
      completed: progressData.completed || false,
      submitted_at: item.timestamp,
    });

    if (error) throw error;
  }

  /**
   * Sync video progress
   */
  private async syncVideoProgress(item: OfflineProgress): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const progressData = item.progressData as {
      watchTime?: number;
      completed?: boolean;
    };

    // Store in offline_progress table as there's no specific video progress table
    const { error } = await supabase.from('offline_progress').upsert({
      user_id: user.user.id,
      content_type: 'video',
      content_id: item.contentId,
      progress_data: progressData,
      sync_status: 'synced',
      client_timestamp: item.timestamp,
      synced_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  /**
   * Add event listener
   */
  on(listener: SyncEventListener): () => void {
    this.listeners.add(listener);

    // Return cleanup function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (_error) {
        logger._error('[ProgressSyncService] Listener _error:', _error);
      }
    });
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isSyncing: boolean;
    isOnline: boolean;
  } {
    return {
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
    };
  }
}

export const ProgressSyncService = new ProgressSyncServiceClass();
