/**
 * Performance Monitoring Component
 * Initializes RUM and Web Vitals tracking
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { webVitalsService } from '@/services/monitoring/WebVitalsService';
import { rumService } from '@/services/monitoring/RUMService';

export function PerformanceMonitoring() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only run in production
    if (import.meta.env.DEV) return;

    // Initialize RUM
    rumService.initialize(user?.id);

    // Set user ID for Web Vitals
    if (user?.id) {
      webVitalsService.setUserId(user.id);
      rumService.setUserId(user.id);
    }

    // Track page view
    rumService.trackPageView(window.location.href, document.title);

    // Cleanup on unmount
    return () => {
      webVitalsService.destroy();
    };
  }, [user?.id]);

  // Track route changes
  useEffect(() => {
    if (import.meta.env.DEV) return;

    rumService.trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  // This component renders nothing
  return null;
}
