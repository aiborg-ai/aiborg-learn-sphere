/**
 * Web Vitals Service
 * Tracks and reports Core Web Vitals and custom performance metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric extends Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
  // User context
  userId?: string;
  sessionId?: string;
  // Page context
  url: string;
  referrer: string;
  // Device context
  deviceType: string;
  connectionType?: string;
  // Timestamps
  timestamp: number;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface PerformanceReport {
  sessionId: string;
  userId?: string;
  url: string;
  metrics: {
    cls?: number;
    fcp?: number;
    inp?: number; // Replaces deprecated FID
    lcp?: number;
    ttfb?: number;
  };
  customMetrics: CustomMetric[];
  deviceInfo: {
    type: string;
    screen: string;
    connection?: string;
    memory?: number;
  };
  timestamp: number;
}

class WebVitalsService {
  private sessionId: string;
  private userId?: string;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private customMetrics: CustomMetric[] = [];
  private sendInterval: number = 30000; // Send every 30 seconds
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  /**
   * Initialize Web Vitals tracking
   */
  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this)); // Replaces deprecated FID
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Track route changes
    this.trackRouteChanges();

    // Track resource loading
    this.trackResourceTiming();

    // Track long tasks
    this.trackLongTasks();

    // Start periodic sending
    this.startPeriodicSend();

    // Send on page unload
    this.setupUnloadHandler();
  }

  /**
   * Handle metric collection
   */
  private handleMetric(metric: Metric) {
    const enhancedMetric: PerformanceMetric = {
      ...metric,
      rating: this.getRating(metric),
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      referrer: document.referrer,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      timestamp: Date.now(),
    };

    this.metrics.set(metric.name, enhancedMetric);

    // Send critical metrics immediately
    if (metric.name === 'LCP' || metric.name === 'CLS') {
      this.sendMetric(enhancedMetric);
    }

    logger.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: enhancedMetric.rating,
    });
  }

  /**
   * Get performance rating
   */
  private getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      FCP: [1800, 3000],
      INP: [200, 500], // Replaces deprecated FID
      LCP: [2500, 4000],
      TTFB: [800, 1800],
    };

    const [good, needsImprovement] = thresholds[metric.name] || [0, 0];

    if (metric.value <= good) return 'good';
    if (metric.value <= needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track custom metric
   */
  public trackCustomMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, unknown>
  ) {
    const metric: CustomMetric = {
      name,
      value,
      unit,
      metadata,
      timestamp: Date.now(),
    };

    this.customMetrics.push(metric);

    logger.log(`[Custom Metric] ${name}:`, value, unit);
  }

  /**
   * Track route changes
   */
  private trackRouteChanges() {
    let lastPath = window.location.pathname;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.trackCustomMetric(
            'route-change',
            navEntry.domContentLoadedEventEnd - navEntry.fetchStart
          );
        }
      }
    });

    if (PerformanceObserver.supportedEntryTypes.includes('navigation')) {
      observer.observe({ type: 'navigation', buffered: true });
    }

    // Also track client-side navigation
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      const newPath = window.location.pathname;

      if (newPath !== lastPath) {
        webVitalsService.trackCustomMetric('client-navigation', performance.now(), 'ms', {
          from: lastPath,
          to: newPath,
        });
        lastPath = newPath;
      }

      return result;
    };
  }

  /**
   * Track resource loading performance
   */
  private trackResourceTiming() {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;

        // Track slow resources (>1s)
        if (resourceEntry.duration > 1000) {
          this.trackCustomMetric('slow-resource', resourceEntry.duration, 'ms', {
            url: resourceEntry.name,
            type: resourceEntry.initiatorType,
            size: resourceEntry.transferSize,
          });
        }

        // Track failed resources
        if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
          this.trackCustomMetric('resource-failed', 1, 'count', {
            url: resourceEntry.name,
          });
        }
      }
    });

    if (PerformanceObserver.supportedEntryTypes.includes('resource')) {
      observer.observe({ type: 'resource', buffered: true });
    }
  }

  /**
   * Track long tasks (>50ms)
   */
  private trackLongTasks() {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.trackCustomMetric('long-task', entry.duration, 'ms', {
          startTime: entry.startTime,
        });
      }
    });

    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      observer.observe({ type: 'longtask', buffered: true });
    }
  }

  /**
   * Set user ID for tracking
   */
  public setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string | undefined {
    const connection =
      (navigator as Navigator & Record<string, unknown>).connection ||
      (navigator as Navigator & Record<string, unknown>).mozConnection ||
      (navigator as Navigator & Record<string, unknown>).webkitConnection;
    return connection?.effectiveType;
  }

  /**
   * Get device info
   */
  private getDeviceInfo() {
    const memory = (performance as Performance & Record<string, unknown>).memory;
    return {
      type: this.getDeviceType(),
      screen: `${window.screen.width}x${window.screen.height}`,
      connection: this.getConnectionType(),
      memory: memory?.jsHeapSizeLimit,
    };
  }

  /**
   * Send metric to backend
   */
  private async sendMetric(metric: PerformanceMetric) {
    try {
      await supabase.from('performance_metrics').insert({
        session_id: metric.sessionId,
        user_id: metric.userId,
        metric_name: metric.name,
        metric_value: metric.value,
        rating: metric.rating,
        url: metric.url,
        device_type: metric.deviceType,
        connection_type: metric.connectionType,
        created_at: new Date(metric.timestamp).toISOString(),
      });
    } catch (_error) {
      logger._error('Failed to send metric:', _error);
    }
  }

  /**
   * Send all collected metrics
   */
  private async sendAllMetrics() {
    if (this.metrics.size === 0 && this.customMetrics.length === 0) return;

    const report: PerformanceReport = {
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      metrics: {
        cls: this.metrics.get('CLS')?.value,
        fcp: this.metrics.get('FCP')?.value,
        inp: this.metrics.get('INP')?.value, // Replaces deprecated FID
        lcp: this.metrics.get('LCP')?.value,
        ttfb: this.metrics.get('TTFB')?.value,
      },
      customMetrics: this.customMetrics,
      deviceInfo: this.getDeviceInfo(),
      timestamp: Date.now(),
    };

    try {
      // Send to Supabase
      await supabase.from('performance_reports').insert({
        session_id: report.sessionId,
        user_id: report.userId,
        url: report.url,
        metrics: report.metrics,
        custom_metrics: report.customMetrics,
        device_info: report.deviceInfo,
        created_at: new Date(report.timestamp).toISOString(),
      });

      // Clear sent metrics
      this.customMetrics = [];
    } catch (_error) {
      logger._error('Failed to send performance report:', _error);
    }
  }

  /**
   * Start periodic sending
   */
  private startPeriodicSend() {
    this.intervalId = setInterval(() => {
      this.sendAllMetrics();
    }, this.sendInterval);
  }

  /**
   * Setup unload handler
   */
  private setupUnloadHandler() {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendAllMetrics();
      }
    });

    window.addEventListener('pagehide', () => {
      this.sendAllMetrics();
    });
  }

  /**
   * Get current metrics summary
   */
  public getMetricsSummary() {
    const summary: Record<string, unknown> = {};

    this.metrics.forEach((metric, name) => {
      summary[name] = {
        value: metric.value,
        rating: metric.rating,
      };
    });

    return summary;
  }

  /**
   * Cleanup
   */
  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.sendAllMetrics();
  }
}

// Export singleton instance
export const webVitalsService = new WebVitalsService();
