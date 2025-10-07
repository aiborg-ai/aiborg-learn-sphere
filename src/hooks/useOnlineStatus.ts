import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to detect and track online/offline status
 *
 * @returns {object} Online status and utilities
 * @returns {boolean} isOnline - Whether the app is currently online
 * @returns {boolean} wasOffline - Whether the app was offline (for detecting recovery)
 * @returns {function} checkConnection - Manually check connection status
 */
export const useOnlineStatus = (
  options: {
    showToast?: boolean;
    onOnline?: () => void;
    onOffline?: () => void;
  } = {}
) => {
  const { showToast = true, onOnline, onOffline } = options;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      if (wasOffline) {
        if (showToast) {
          toast({
            title: 'Back Online',
            description: 'Your connection has been restored.',
            duration: 3000,
          });
        }
        onOnline?.();
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);

      if (showToast) {
        toast({
          title: 'No Internet Connection',
          description: 'Some features may not be available offline.',
          variant: 'destructive',
          duration: 5000,
        });
      }
      onOffline?.();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status periodically (every 30 seconds)
    const interval = setInterval(async () => {
      const online = await checkConnection();
      if (online !== isOnline) {
        if (online) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, wasOffline, showToast, toast, onOnline, onOffline, checkConnection]);

  return {
    isOnline,
    wasOffline,
    checkConnection,
  };
};
