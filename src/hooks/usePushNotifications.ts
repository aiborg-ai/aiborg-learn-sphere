/**
 * usePushNotifications Hook
 *
 * React hook for managing push notification state and subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PushNotificationService,
  NotificationPreferences,
  NotificationType,
} from '@/services/notifications/pushNotificationService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences;

  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreference: (type: NotificationType, enabled: boolean) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  deadlines: true,
  courseUpdates: true,
  achievements: true,
  announcements: true,
  reminders: true,
};

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSupported] = useState(() => PushNotificationService.isSupported());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (!isSupported) {
        setIsLoading(false);
        return;
      }

      try {
        await PushNotificationService.initialize();

        // Check current permission
        setPermission(PushNotificationService.getPermissionStatus());

        // Check if subscribed
        const subscribed = await PushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);

        // Load preferences if user is authenticated
        if (user) {
          const prefs = await PushNotificationService.getPreferences();
          setPreferences(prefs);
        }
      } catch (_error) {
        logger._error('Error initializing push notifications:', _error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isSupported, user]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    setIsLoading(true);
    try {
      const result = await PushNotificationService.requestPermission();
      setPermission(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      return false;
    }

    setIsLoading(true);
    try {
      // Request permission first if needed
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          return false;
        }
      }

      // Subscribe
      const subscription = await PushNotificationService.subscribe();
      const success = subscription !== null;
      setIsSubscribed(success);

      if (success) {
        logger.info('Successfully subscribed to push notifications');
      }

      return success;
    } catch (_error) {
      logger._error('Error subscribing to push notifications:', _error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    try {
      const success = await PushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        logger.info('Successfully unsubscribed from push notifications');
      }
      return success;
    } catch (_error) {
      logger._error('Error unsubscribing from push notifications:', _error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Update a specific preference
  const updatePreference = useCallback(
    async (type: NotificationType, enabled: boolean): Promise<void> => {
      if (!user) {
        return;
      }

      const newPreferences = {
        ...preferences,
        [type]: enabled,
      };

      // Optimistically update local state
      setPreferences(newPreferences);

      try {
        await PushNotificationService.updatePreferences(newPreferences);
        logger.info(`Notification preference updated: ${type} = ${enabled}`);
      } catch (_error) {
        // Revert on _error
        setPreferences(preferences);
        logger.error('Error updating notification preference:', error);
        throw error;
      }
    },
    [user, preferences]
  );

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    await PushNotificationService.sendTestNotification();
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreference,
    sendTestNotification,
  };
}
