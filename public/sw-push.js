/**
 * Service Worker Push Notification Handler
 *
 * This file should be included in the main service worker
 * Handles incoming push notifications and click events
 */

// Handle incoming push notifications
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      tag: data.tag || 'default',
      data: data.data || {},
      vibrate: [100, 50, 100],
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Aiborg Learn Sphere', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);

    // Fallback to basic notification
    event.waitUntil(
      self.registration.showNotification('Aiborg Learn Sphere', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';

  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Navigate to the content
        break;
      case 'dismiss':
        // Just close the notification
        return;
      default:
        break;
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate the existing window
          client.navigate(url);
          return client.focus();
        }
      }

      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', event => {
  const data = event.notification.data || {};

  // Could send analytics event here
  console.log('Notification closed:', data);
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', event => {
  console.log('Push subscription changed');

  event.waitUntil(
    // Re-subscribe with new subscription
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        // applicationServerKey should be stored or fetched
      })
      .then(newSubscription => {
        // Send new subscription to server
        return fetch('/api/push-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSubscription),
        });
      })
  );
});

console.log('Push notification handler loaded');
