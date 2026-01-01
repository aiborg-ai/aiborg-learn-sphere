/**
 * usePWA Hook
 * Manages PWA installation prompt and app install state
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsInstalled(isStandalone);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      logger.info('PWA install prompt available');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
      logger.info('PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      logger.warn('Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await installPrompt.prompt();

      // Wait for user choice
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        logger.info('User accepted PWA install');
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        logger.info('User dismissed PWA install');
        return false;
      }
    } catch (_error) {
      logger.error('Error showing install prompt:', _error);
      return false;
    }
  };

  const dismissInstall = () => {
    setInstallPrompt(null);
    setIsInstallable(false);
    // Store dismissal in localStorage to prevent showing again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const shouldShowInstallPrompt = () => {
    if (!isInstallable || isInstalled) return false;

    // Check if user dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) return false;
    }

    return true;
  };

  return {
    installPrompt,
    isInstalled,
    isInstallable,
    promptInstall,
    dismissInstall,
    shouldShowInstallPrompt,
  };
}
