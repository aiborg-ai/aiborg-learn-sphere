import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner = () => {
  const { isOnline, wasOffline } = useOnlineStatus({ showToast: false });

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <>
      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              <strong>No internet connection.</strong> Some features may not be available offline.
              Your changes will be saved when you reconnect.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {isOnline && wasOffline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <Alert className="rounded-none border-x-0 border-t-0 bg-green-50 dark:bg-green-950 border-green-200">
            <Wifi className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Back online!</strong> Your connection has been restored.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};
