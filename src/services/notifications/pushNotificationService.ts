/**
 * Push Notification Service
 *
 * Handles Web Push notification subscriptions and permissions
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  deadlines: boolean;
  courseUpdates: boolean;
  achievements: boolean;
  announcements: boolean;
  reminders: boolean;
}

export type NotificationType = keyof NotificationPreferences;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  deadlines: true,
  courseUpdates: true,
  achievements: true,
  announcements: true,
  reminders: true,
};

class PushNotificationServiceClass {
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize the service with the service worker registration
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      logger.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      logger.info('Push notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize push notification service:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      logger.warn('Notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      logger.info('Notification permission:', permission);
      return permission;
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.initialize();
    }

    if (!this.swRegistration) {
      logger.error('Service worker not available');
      return null;
    }

    try {
      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        logger.error('VAPID public key not configured');
        return null;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      logger.info('Push subscription created');

      // Save subscription to database
      await this.saveSubscription(subscription);

      return subscription;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(subscription.endpoint);
        logger.info('Push subscription removed');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.initialize();
    }

    if (!this.swRegistration) {
      return null;
    }

    try {
      return await this.swRegistration.pushManager.getSubscription();
    } catch (error) {
      logger.error('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      logger.warn('User not authenticated, cannot save subscription');
      return;
    }

    const subscriptionData = subscription.toJSON();

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscriptionData.keys?.p256dh || '',
        auth_key: subscriptionData.keys?.auth || '',
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'endpoint',
      }
    );

    if (error) {
      logger.error('Failed to save push subscription:', error);
      throw error;
    }

    logger.info('Push subscription saved to database');
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscription(endpoint: string): Promise<void> {
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);

    if (error) {
      logger.error('Failed to remove push subscription:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for current user
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return DEFAULT_PREFERENCES;
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error || !data) {
      return DEFAULT_PREFERENCES;
    }

    return {
      deadlines: data.deadlines ?? true,
      courseUpdates: data.course_updates ?? true,
      achievements: data.achievements ?? true,
      announcements: data.announcements ?? true,
      reminders: data.reminders ?? true,
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('notification_preferences').upsert(
      {
        user_id: user.user.id,
        deadlines: preferences.deadlines,
        course_updates: preferences.courseUpdates,
        achievements: preferences.achievements,
        announcements: preferences.announcements,
        reminders: preferences.reminders,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      logger.error('Failed to update notification preferences:', error);
      throw error;
    }

    logger.info('Notification preferences updated');
  }

  /**
   * Send a test notification (for debugging)
   */
  async sendTestNotification(): Promise<void> {
    if (Notification.permission !== 'granted') {
      logger.warn('Notification permission not granted');
      return;
    }

    // Use service worker to show notification
    if (this.swRegistration) {
      await this.swRegistration.showNotification('Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
        data: {
          type: 'test',
          url: '/',
        },
      });
    }
  }

  /**
   * Convert URL-safe base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export const PushNotificationService = new PushNotificationServiceClass();
