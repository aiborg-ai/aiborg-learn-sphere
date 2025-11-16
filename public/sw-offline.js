/**
 * Enhanced Service Worker for Offline Content Download
 *
 * Features:
 * - Background sync for offline progress
 * - Manual content download and caching
 * - IndexedDB for offline data storage
 * - Conflict resolution for sync
 */

/* global self, caches, indexedDB */

const CACHE_VERSION = 'v1';
const OFFLINE_CONTENT_CACHE = `offline-content-${CACHE_VERSION}`;
const OFFLINE_DATA_DB = 'aiborg-offline-data';
const OFFLINE_DATA_VERSION = 1;

// IndexedDB stores
const STORES = {
  DOWNLOADS: 'downloads',
  PROGRESS: 'progress',
  QUEUE: 'sync-queue',
};

// ============================================================================
// IndexedDB Setup
// ============================================================================

/**
 * Initialize IndexedDB for offline storage
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DATA_DB, OFFLINE_DATA_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.DOWNLOADS)) {
        const downloadStore = db.createObjectStore(STORES.DOWNLOADS, { keyPath: 'id' });
        downloadStore.createIndex('contentId', 'contentId', { unique: false });
        downloadStore.createIndex('userId', 'userId', { unique: false });
        downloadStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PROGRESS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        progressStore.createIndex('contentId', 'contentId', { unique: false });
        progressStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        progressStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

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
 * Add item to IndexedDB store
 */
async function addToStore(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get item from IndexedDB store
 */
async function getFromStore(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items from IndexedDB store matching index
 */
async function getAllFromIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = value ? index.getAll(value) : store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update item in IndexedDB store
 */
async function updateInStore(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete item from IndexedDB store
 */
async function deleteFromStore(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Service Worker Event Handlers
// ============================================================================

/**
 * Install event - setup caches
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(OFFLINE_CONTENT_CACHE).then(cache => {
      console.log('[SW] Cache opened');
      return cache;
    })
  );

  // Force activation
  self.skipWaiting();
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('offline-content-') && cacheName !== OFFLINE_CONTENT_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Message event - handle commands from client
 */
self.addEventListener('message', event => {
  console.log('[SW] Received message:', event.data);

  if (event.data.type === 'DOWNLOAD_CONTENT') {
    handleDownloadContent(event.data.payload);
  } else if (event.data.type === 'DELETE_DOWNLOAD') {
    handleDeleteDownload(event.data.payload);
  } else if (event.data.type === 'GET_DOWNLOAD_STATUS') {
    handleGetDownloadStatus(event.data.payload, event);
  } else if (event.data.type === 'SYNC_PROGRESS') {
    handleSyncProgress();
  }
});

/**
 * Background Sync event - sync offline progress when online
 */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-progress') {
    event.waitUntil(syncOfflineProgress());
  }
});

// ============================================================================
// Download Management
// ============================================================================

/**
 * Download content for offline access
 */
async function handleDownloadContent(payload) {
  const { contentId, contentType, urls, userId, metadata } = payload;

  console.log('[SW] Starting download:', contentId);

  try {
    const downloadRecord = {
      id: `${contentType}-${contentId}`,
      contentId,
      contentType,
      userId,
      status: 'downloading',
      progress: 0,
      totalFiles: urls.length,
      downloadedFiles: 0,
      createdAt: new Date().toISOString(),
      metadata,
    };

    // Save initial download record
    await addToStore(STORES.DOWNLOADS, downloadRecord);

    // Download and cache all URLs
    const cache = await caches.open(OFFLINE_CONTENT_CACHE);
    let downloadedCount = 0;

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          downloadedCount++;

          // Update progress
          downloadRecord.downloadedFiles = downloadedCount;
          downloadRecord.progress = Math.round((downloadedCount / urls.length) * 100);
          await updateInStore(STORES.DOWNLOADS, downloadRecord);

          // Notify client of progress
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'DOWNLOAD_PROGRESS',
                payload: {
                  contentId,
                  progress: downloadRecord.progress,
                },
              });
            });
          });
        }
      } catch (error) {
        console.error('[SW] Error downloading file:', url, error);
      }
    }

    // Mark as completed
    downloadRecord.status = downloadedCount === urls.length ? 'completed' : 'partial';
    downloadRecord.completedAt = new Date().toISOString();
    await updateInStore(STORES.DOWNLOADS, downloadRecord);

    // Notify client of completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'DOWNLOAD_COMPLETE',
          payload: {
            contentId,
            status: downloadRecord.status,
          },
        });
      });
    });

    console.log('[SW] Download completed:', contentId);
  } catch (error) {
    console.error('[SW] Download failed:', error);

    // Mark as failed
    const failedRecord = {
      id: `${contentType}-${contentId}`,
      contentId,
      contentType,
      userId,
      status: 'failed',
      error: error.message,
      failedAt: new Date().toISOString(),
    };
    await updateInStore(STORES.DOWNLOADS, failedRecord);
  }
}

/**
 * Delete downloaded content
 */
async function handleDeleteDownload(payload) {
  const { contentId, contentType, urls } = payload;

  console.log('[SW] Deleting download:', contentId);

  try {
    // Remove from cache
    const cache = await caches.open(OFFLINE_CONTENT_CACHE);
    for (const url of urls) {
      await cache.delete(url);
    }

    // Remove from IndexedDB
    await deleteFromStore(STORES.DOWNLOADS, `${contentType}-${contentId}`);

    console.log('[SW] Download deleted:', contentId);
  } catch (error) {
    console.error('[SW] Delete failed:', error);
  }
}

/**
 * Get download status
 */
async function handleGetDownloadStatus(payload, event) {
  const { contentId, contentType } = payload;

  try {
    const download = await getFromStore(STORES.DOWNLOADS, `${contentType}-${contentId}`);

    event.ports[0].postMessage({
      type: 'DOWNLOAD_STATUS',
      payload: download || null,
    });
  } catch (error) {
    console.error('[SW] Get status failed:', error);
    event.ports[0].postMessage({
      type: 'DOWNLOAD_STATUS',
      payload: null,
    });
  }
}

// ============================================================================
// Progress Sync
// ============================================================================

/**
 * Sync offline progress to server
 */
async function syncOfflineProgress() {
  console.log('[SW] Syncing offline progress...');

  try {
    // Get all pending progress records
    const pendingProgress = await getAllFromIndex(STORES.PROGRESS, 'syncStatus', 'pending');

    console.log('[SW] Found', pendingProgress.length, 'pending progress records');

    for (const record of pendingProgress) {
      try {
        // Send progress to API
        const response = await fetch('/api/sync-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (response.ok) {
          // Mark as synced
          record.syncStatus = 'synced';
          record.syncedAt = new Date().toISOString();
          await updateInStore(STORES.PROGRESS, record);
          console.log('[SW] Synced progress:', record.id);
        } else {
          // Mark as failed
          record.syncStatus = 'failed';
          record.error = await response.text();
          await updateInStore(STORES.PROGRESS, record);
          console.error('[SW] Sync failed:', record.id, record.error);
        }
      } catch (error) {
        console.error('[SW] Error syncing record:', record.id, error);
      }
    }

    console.log('[SW] Progress sync completed');
  } catch (error) {
    console.error('[SW] Progress sync failed:', error);
  }
}

/**
 * Handle sync progress request from client
 */
async function handleSyncProgress() {
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('sync-offline-progress');
      console.log('[SW] Background sync registered');
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
      // Fallback to immediate sync
      await syncOfflineProgress();
    }
  } else {
    // Browser doesn't support background sync, sync immediately
    await syncOfflineProgress();
  }
}

// ============================================================================
// Fetch Handler (enhanced for offline content)
// ============================================================================

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Check if this is a downloaded content request
  if (url.pathname.includes('/storage/') || url.pathname.includes('/content/')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then(response => {
          // Optionally cache the response
          if (response.ok) {
            caches.open(OFFLINE_CONTENT_CACHE).then(cache => {
              cache.put(request, response.clone());
            });
          }
          return response;
        });
      })
    );
  }
});

console.log('[SW] Service worker script loaded');
