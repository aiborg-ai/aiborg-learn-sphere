/**
 * Offline Storage Manager
 *
 * Manages IndexedDB operations for offline content and progress
 */

const DB_NAME = 'aiborg-offline-data';
const DB_VERSION = 1;

export const STORES = {
  DOWNLOADS: 'downloads',
  PROGRESS: 'progress',
  QUEUE: 'sync-queue',
} as const;

export interface OfflineDownload {
  id: string;
  contentId: string;
  contentType: 'course' | 'lesson' | 'video' | 'document' | 'quiz';
  userId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'partial';
  progress: number;
  totalFiles: number;
  downloadedFiles: number;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface OfflineProgress {
  id?: number;
  contentId: string;
  contentType: 'course' | 'lesson' | 'video' | 'quiz' | 'assessment';
  userId: string;
  progressData: Record<string, unknown>;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  timestamp: string;
  syncedAt?: string;
  error?: string;
}

export interface SyncQueueItem {
  id?: number;
  action: 'progress' | 'completion' | 'quiz_submission' | 'note' | 'bookmark';
  payload: Record<string, unknown>;
  priority: number;
  createdAt: string;
  retries: number;
  lastError?: string;
}

/**
 * Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create downloads store
      if (!db.objectStoreNames.contains(STORES.DOWNLOADS)) {
        const downloadStore = db.createObjectStore(STORES.DOWNLOADS, { keyPath: 'id' });
        downloadStore.createIndex('contentId', 'contentId', { unique: false });
        downloadStore.createIndex('userId', 'userId', { unique: false });
        downloadStore.createIndex('status', 'status', { unique: false });
        downloadStore.createIndex('contentType', 'contentType', { unique: false });
      }

      // Create progress store
      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PROGRESS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        progressStore.createIndex('contentId', 'contentId', { unique: false });
        progressStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        progressStore.createIndex('timestamp', 'timestamp', { unique: false });
        progressStore.createIndex('userId', 'userId', { unique: false });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const queueStore = db.createObjectStore(STORES.QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('action', 'action', { unique: false });
        queueStore.createIndex('priority', 'priority', { unique: false });
      }
    };
  });
}

/**
 * Generic function to add item to store
 */
async function addItem<T>(storeName: string, item: T): Promise<IDBValidKey> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to get item from store
 */
async function getItem<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to get all items from store
 */
async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to get items from index
 */
async function getItemsByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to update item in store
 */
async function updateItem<T>(storeName: string, item: T): Promise<IDBValidKey> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to delete item from store
 */
async function deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from store
 */
async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Download Management
// ============================================================================

export const OfflineDownloadsDB = {
  /**
   * Add a download record
   */
  add: (download: OfflineDownload) => addItem(STORES.DOWNLOADS, download),

  /**
   * Get a download by ID
   */
  get: (id: string) => getItem<OfflineDownload>(STORES.DOWNLOADS, id),

  /**
   * Get all downloads
   */
  getAll: () => getAllItems<OfflineDownload>(STORES.DOWNLOADS),

  /**
   * Get downloads by user ID
   */
  getByUser: (userId: string) =>
    getItemsByIndex<OfflineDownload>(STORES.DOWNLOADS, 'userId', userId),

  /**
   * Get downloads by status
   */
  getByStatus: (status: OfflineDownload['status']) =>
    getItemsByIndex<OfflineDownload>(STORES.DOWNLOADS, 'status', status),

  /**
   * Get downloads by content type
   */
  getByContentType: (contentType: OfflineDownload['contentType']) =>
    getItemsByIndex<OfflineDownload>(STORES.DOWNLOADS, 'contentType', contentType),

  /**
   * Update a download record
   */
  update: (download: OfflineDownload) => updateItem(STORES.DOWNLOADS, download),

  /**
   * Delete a download record
   */
  delete: (id: string) => deleteItem(STORES.DOWNLOADS, id),

  /**
   * Clear all downloads
   */
  clear: () => clearStore(STORES.DOWNLOADS),
};

// ============================================================================
// Progress Management
// ============================================================================

export const OfflineProgressDB = {
  /**
   * Add a progress record
   */
  add: (progress: OfflineProgress) => addItem(STORES.PROGRESS, progress),

  /**
   * Get a progress record by ID
   */
  get: (id: number) => getItem<OfflineProgress>(STORES.PROGRESS, id),

  /**
   * Get all progress records
   */
  getAll: () => getAllItems<OfflineProgress>(STORES.PROGRESS),

  /**
   * Get progress by user ID
   */
  getByUser: (userId: string) =>
    getItemsByIndex<OfflineProgress>(STORES.PROGRESS, 'userId', userId),

  /**
   * Get progress by sync status
   */
  getBySyncStatus: (status: OfflineProgress['syncStatus']) =>
    getItemsByIndex<OfflineProgress>(STORES.PROGRESS, 'syncStatus', status),

  /**
   * Get pending progress (needs sync)
   */
  getPending: () => getItemsByIndex<OfflineProgress>(STORES.PROGRESS, 'syncStatus', 'pending'),

  /**
   * Update a progress record
   */
  update: (progress: OfflineProgress) => updateItem(STORES.PROGRESS, progress),

  /**
   * Delete a progress record
   */
  delete: (id: number) => deleteItem(STORES.PROGRESS, id),

  /**
   * Clear synced progress records
   */
  clearSynced: async () => {
    const synced = await OfflineProgressDB.getBySyncStatus('synced');
    for (const record of synced) {
      if (record.id) {
        await OfflineProgressDB.delete(record.id);
      }
    }
  },
};

// ============================================================================
// Sync Queue Management
// ============================================================================

export const SyncQueueDB = {
  /**
   * Add item to sync queue
   */
  add: (item: SyncQueueItem) => addItem(STORES.QUEUE, item),

  /**
   * Get queue item by ID
   */
  get: (id: number) => getItem<SyncQueueItem>(STORES.QUEUE, id),

  /**
   * Get all queue items
   */
  getAll: () => getAllItems<SyncQueueItem>(STORES.QUEUE),

  /**
   * Get queue items by action type
   */
  getByAction: (action: SyncQueueItem['action']) =>
    getItemsByIndex<SyncQueueItem>(STORES.QUEUE, 'action', action),

  /**
   * Get queue items sorted by priority
   */
  getByPriority: async (): Promise<SyncQueueItem[]> => {
    const items = await SyncQueueDB.getAll();
    return items.sort((a, b) => b.priority - a.priority);
  },

  /**
   * Update queue item
   */
  update: (item: SyncQueueItem) => updateItem(STORES.QUEUE, item),

  /**
   * Delete queue item
   */
  delete: (id: number) => deleteItem(STORES.QUEUE, id),

  /**
   * Clear all queue items
   */
  clear: () => clearStore(STORES.QUEUE),
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get total storage used by IndexedDB
 */
export async function getStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentage,
    };
  }

  return {
    usage: 0,
    quota: 0,
    percentage: 0,
  };
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  return 'indexedDB' in window;
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

/**
 * Check if storage is persistent
 */
export async function isPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persisted' in navigator.storage) {
    return await navigator.storage.persisted();
  }
  return false;
}
