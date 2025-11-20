/**
 * InstallPWAPrompt Component
 * Shows a banner/modal prompting users to install the PWA
 */

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';

export function InstallPWAPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismissInstall, shouldShowInstallPrompt } =
    usePWA();
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Show prompt after a delay if conditions are met
    const timer = setTimeout(() => {
      if (shouldShowInstallPrompt()) {
        setShow(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, [shouldShowInstallPrompt]);

  if (isInstalled || !show) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    dismissInstall();
    setShow(false);
  };

  // iOS-specific install instructions
  if (isIOS && !isInstallable) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg border-2 border-primary/20 bg-background z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">Install Aiborg App</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install this app on your iPhone: tap{' '}
              <span className="inline-flex items-center justify-center w-4 h-4 border border-current rounded">
                ↑
              </span>{' '}
              and then "Add to Home Screen"
            </p>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
              Got it
            </Button>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    );
  }

  // Standard install prompt for Android/Desktop
  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg border-2 border-primary/20 bg-background z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">Install Aiborg Learn Sphere</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Install our app for quick access and offline learning. Works on all devices!
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstall} className="text-xs">
              Install App
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
