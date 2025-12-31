/**
 * Performance Monitoring Service
 *
 * Comprehensive performance monitoring system that tracks:
 * - Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Bundle loading performance
 * - User interaction metrics
 * - Navigation timing
 * - Resource loading
 * - Custom performance marks
 *
 * @example
 * ```typescript
 * // Initialize monitoring on app start
 * PerformanceMonitoringService.initialize();
 *
 * // Track custom operations
 * PerformanceMonitoringService.startMark('data-fetch');
 * await fetchData();
 * PerformanceMonitoringService.endMark('data-fetch');
 *
 * // Get performance report
 * const report = await PerformanceMonitoringService.getPerformanceReport();
 * ```
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { NetworkConnection } from '@/types/charts';

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint (replaces FID in web-vitals v4)
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface BundleMetrics {
  name: string;
  size: number;
  loadTime: number;
  cached: boolean;
}

export interface NavigationMetrics {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  domProcessing: number;
  domContentLoaded: number;
  loadComplete: number;
}

export interface UserMetrics {
  userId?: string;
  sessionId: string;
  pageUrl: string;
  userAgent: string;
  viewport: { width: number; height: number };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

export interface PerformanceReport {
  timestamp: string;
  webVitals: WebVitalsMetrics;
  navigation: NavigationMetrics | null;
  bundles: BundleMetrics[];
  userMetrics: UserMetrics;
  customMarks: Record<string, number>;
}

class PerformanceMonitoringServiceClass {
  private webVitals: WebVitalsMetrics = {};
  private customMarks: Map<string, number> = new Map();
  private sessionId: string;
  private initialized = false;
  private reportQueue: PerformanceReport[] = [];
  private flushInterval: number | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize performance monitoring
   * Call this once when the app starts
   */
  public initialize(): void {
    if (this.initialized) {
      logger.warn('[PerformanceMonitoring] Already initialized');
      return;
    }

    logger.log('[PerformanceMonitoring] Initializing...');

    // Monitor Web Vitals
    this.monitorWebVitals();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor navigation
    this.monitorNavigation();

    // Set up periodic reporting
    this.setupPeriodicReporting();

    // Send report before page unload
    this.setupUnloadReporting();

    this.initialized = true;
    logger.log('[PerformanceMonitoring] Initialized successfully');
  }

  /**
   * Monitor Web Vitals metrics
   */
  private monitorWebVitals(): void {
    onLCP((metric: Metric) => {
      this.webVitals.lcp = metric.value;
      logger.log('[PerformanceMonitoring] LCP:', metric.value);
      this.evaluateMetric('LCP', metric.value, 2500, 4000);
    });

    onINP((metric: Metric) => {
      this.webVitals.inp = metric.value;
      logger.log('[PerformanceMonitoring] INP:', metric.value);
      this.evaluateMetric('INP', metric.value, 200, 500);
    });

    onCLS((metric: Metric) => {
      this.webVitals.cls = metric.value;
      logger.log('[PerformanceMonitoring] CLS:', metric.value);
      this.evaluateMetric('CLS', metric.value, 0.1, 0.25);
    });

    onFCP((metric: Metric) => {
      this.webVitals.fcp = metric.value;
      logger.log('[PerformanceMonitoring] FCP:', metric.value);
      this.evaluateMetric('FCP', metric.value, 1800, 3000);
    });

    onTTFB((metric: Metric) => {
      this.webVitals.ttfb = metric.value;
      logger.log('[PerformanceMonitoring] TTFB:', metric.value);
      this.evaluateMetric('TTFB', metric.value, 800, 1800);
    });
  }

  /**
   * Evaluate if metric is within acceptable thresholds
   */
  private evaluateMetric(
    name: string,
    value: number,
    goodThreshold: number,
    poorThreshold: number
  ): void {
    let rating: 'good' | 'needs-improvement' | 'poor';

    if (value <= goodThreshold) {
      rating = 'good';
    } else if (value <= poorThreshold) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    if (rating === 'poor') {
      logger.warn(`[PerformanceMonitoring] ${name} is poor: ${value}`, {
        rating,
        value,
        threshold: poorThreshold,
      });
    }
  }

  /**
   * Monitor resource loading (bundles, assets)
   */
  private monitorResourceLoading(): void {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    // Use PerformanceObserver for ongoing monitoring
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackResourceLoad(resourceEntry);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (_error) {
      logger._error('[PerformanceMonitoring] Failed to observe resources:', _error);
    }
  }

  /**
   * Track individual resource load
   */
  private trackResourceLoad(entry: PerformanceResourceTiming): void {
    const isBundle = entry.name.includes('.js') || entry.name.includes('.css');

    if (isBundle) {
      const bundleMetric: BundleMetrics = {
        name: this.extractFileName(entry.name),
        size: entry.transferSize || 0,
        loadTime: entry.duration,
        cached: entry.transferSize === 0,
      };

      // Warn about slow bundle loading
      if (bundleMetric.loadTime > 3000 && !bundleMetric.cached) {
        logger.warn('[PerformanceMonitoring] Slow bundle load:', {
          ...bundleMetric,
          loadTimeSeconds: (bundleMetric.loadTime / 1000).toFixed(2),
        });
      }
    }
  }

  /**
   * Monitor navigation timing
   */
  private monitorNavigation(): void {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = this.getNavigationMetrics();
        if (navigation) {
          logger.log('[PerformanceMonitoring] Navigation timing:', navigation);
        }
      }, 0);
    });
  }

  /**
   * Get navigation timing metrics
   */
  private getNavigationMetrics(): NavigationMetrics | null {
    if (!window.performance || !window.performance.getEntriesByType) {
      return null;
    }

    const [navigation] = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];

    if (!navigation) {
      return null;
    }

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    };
  }

  /**
   * Get all bundle metrics
   */
  private getBundleMetrics(): BundleMetrics[] {
    if (!window.performance || !window.performance.getEntriesByType) {
      return [];
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return resources
      .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
      .map(entry => ({
        name: this.extractFileName(entry.name),
        size: entry.transferSize || 0,
        loadTime: entry.duration,
        cached: entry.transferSize === 0,
      }));
  }

  /**
   * Get user metrics (browser, device, connection info)
   */
  private getUserMetrics(): UserMetrics {
    const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection;

    return {
      sessionId: this.sessionId,
      pageUrl: window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: connection
        ? {
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0,
          }
        : undefined,
    };
  }

  /**
   * Start a custom performance mark
   */
  public startMark(name: string): void {
    const timestamp = performance.now();
    this.customMarks.set(name, timestamp);
    logger.log(`[PerformanceMonitoring] Mark started: ${name}`);
  }

  /**
   * End a custom performance mark and return duration
   */
  public endMark(name: string): number | null {
    const startTime = this.customMarks.get(name);

    if (!startTime) {
      logger.warn(`[PerformanceMonitoring] No start mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.customMarks.delete(name);

    logger.log(`[PerformanceMonitoring] Mark ended: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
    });

    return duration;
  }

  /**
   * Get complete performance report
   */
  public async getPerformanceReport(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      webVitals: { ...this.webVitals },
      navigation: this.getNavigationMetrics(),
      bundles: this.getBundleMetrics(),
      userMetrics: this.getUserMetrics(),
      customMarks: Object.fromEntries(this.customMarks),
    };

    return report;
  }

  /**
   * Send performance report to backend
   */
  public async sendReport(report: PerformanceReport): Promise<void> {
    try {
      const { error } = await supabase.from('performance_metrics').insert({
        session_id: report.userMetrics.sessionId,
        user_id: report.userMetrics.userId,
        page_url: report.userMetrics.pageUrl,
        web_vitals: report.webVitals,
        navigation_timing: report.navigation,
        bundle_metrics: report.bundles,
        user_agent: report.userMetrics.userAgent,
        viewport: report.userMetrics.viewport,
        connection_info: report.userMetrics.connection,
        custom_marks: report.customMarks,
        created_at: report.timestamp,
      });

      if (error) {
        logger.error('[PerformanceMonitoring] Failed to send report:', error);
      } else {
        logger.log('[PerformanceMonitoring] Report sent successfully');
      }
    } catch (_error) {
      logger._error('[PerformanceMonitoring] Error sending report:', _error);
    }
  }

  /**
   * Queue report for batch sending
   */
  private queueReport(report: PerformanceReport): void {
    this.reportQueue.push(report);

    // Flush if queue is getting large
    if (this.reportQueue.length >= 10) {
      this.flushReports();
    }
  }

  /**
   * Flush queued reports
   */
  private async flushReports(): Promise<void> {
    if (this.reportQueue.length === 0) {
      return;
    }

    const reports = [...this.reportQueue];
    this.reportQueue = [];

    try {
      const { error } = await supabase.from('performance_metrics').insert(
        reports.map(report => ({
          session_id: report.userMetrics.sessionId,
          user_id: report.userMetrics.userId,
          page_url: report.userMetrics.pageUrl,
          web_vitals: report.webVitals,
          navigation_timing: report.navigation,
          bundle_metrics: report.bundles,
          user_agent: report.userMetrics.userAgent,
          viewport: report.userMetrics.viewport,
          connection_info: report.userMetrics.connection,
          custom_marks: report.customMarks,
          created_at: report.timestamp,
        }))
      );

      if (error) {
        logger.error('[PerformanceMonitoring] Failed to flush reports:', error);
      } else {
        logger.log(`[PerformanceMonitoring] Flushed ${reports.length} reports`);
      }
    } catch (_error) {
      logger._error('[PerformanceMonitoring] Error flushing reports:', _error);
    }
  }

  /**
   * Set up periodic reporting (every 5 minutes)
   */
  private setupPeriodicReporting(): void {
    this.flushInterval = window.setInterval(
      async () => {
        const report = await this.getPerformanceReport();
        this.queueReport(report);
        this.flushReports();
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  /**
   * Set up reporting before page unload
   */
  private setupUnloadReporting(): void {
    window.addEventListener('beforeunload', async () => {
      const report = await this.getPerformanceReport();
      // Use sendBeacon for reliable sending on unload
      const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
      navigator.sendBeacon('/api/performance', blob);
    });
  }

  /**
   * Extract filename from URL
   */
  private extractFileName(url: string): string {
    return url.split('/').pop()?.split('?')[0] || url;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Clean up and stop monitoring
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.flushReports();
    this.initialized = false;

    logger.log('[PerformanceMonitoring] Destroyed');
  }
}

// Export singleton instance
export const PerformanceMonitoringService = new PerformanceMonitoringServiceClass();
