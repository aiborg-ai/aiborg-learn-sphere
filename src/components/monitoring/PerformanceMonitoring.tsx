/**
 * Performance Monitoring Component
 * Initializes comprehensive performance tracking:
 * - RUM (Real User Monitoring)
 * - Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - User Metrics (page views, interactions, engagement)
 * - Bundle loading performance
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { webVitalsService } from '@/services/monitoring/WebVitalsService';
import { rumService } from '@/services/monitoring/RUMService';
import { PerformanceMonitoringService } from '@/services/PerformanceMonitoringService';
import { UserMetricsTracker } from '@/services/UserMetricsTracker';
import { logger } from '@/utils/logger';

export function PerformanceMonitoring() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only run in production
    if (import.meta.env.DEV) {
      logger.log('[PerformanceMonitoring] Skipping in development mode');
      return;
    }

    logger.log('[PerformanceMonitoring] Initializing all monitoring services...');

    // Initialize all monitoring services
    try {
      // Legacy RUM service
      rumService.initialize(user?.id);

      // New comprehensive performance monitoring
      PerformanceMonitoringService.initialize();

      // User metrics tracking
      UserMetricsTracker.initialize(user?.id);

      // Set user ID for Web Vitals
      if (user?.id) {
        webVitalsService.setUserId(user.id);
        rumService.setUserId(user.id);
        UserMetricsTracker.setUserId(user.id);
      }

      // Track initial page view
      rumService.trackPageView(window.location.href, document.title);
      UserMetricsTracker.trackPageView(window.location.pathname);

      logger.log('[PerformanceMonitoring] All services initialized successfully');
    } catch (error) {
      logger.error('[PerformanceMonitoring] Failed to initialize:', error);
    }

    // Cleanup on unmount
    return () => {
      webVitalsService.destroy();
      PerformanceMonitoringService.destroy();
      UserMetricsTracker.destroy();
    };
  }, [user?.id]);

  // Track route changes
  useEffect(() => {
    if (import.meta.env.DEV) return;

    rumService.trackPageView(location.pathname, document.title);
    UserMetricsTracker.trackPageView(location.pathname);
  }, [location.pathname]);

  // Update user ID when user logs in/out
  useEffect(() => {
    if (import.meta.env.DEV) return;

    if (user?.id) {
      UserMetricsTracker.setUserId(user.id);
      logger.log('[PerformanceMonitoring] User ID updated:', user.id);
    } else {
      UserMetricsTracker.clearUserId();
      logger.log('[PerformanceMonitoring] User ID cleared');
    }
  }, [user?.id]);

  // This component renders nothing
  return null;
}
