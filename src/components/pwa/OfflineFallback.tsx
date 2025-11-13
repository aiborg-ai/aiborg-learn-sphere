/**
 * OfflineFallback Component
 * Shown when user is offline and tries to access uncached content
 */

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function OfflineFallback() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">You're Offline</h1>

        <p className="text-muted-foreground mb-6">
          It looks like you've lost your internet connection. Some content may not be available
          while you're offline.
        </p>

        <div className="space-y-4">
          <div className="text-sm text-left bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What you can do:</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Access previously viewed courses</li>
              <li>• Continue downloaded lessons</li>
              <li>• Review saved flashcards</li>
              <li>• Take practice quizzes</li>
            </ul>
          </div>

          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <p className="text-xs text-muted-foreground">
            Cached content will load automatically when you're back online
          </p>
        </div>
      </Card>
    </div>
  );
}
