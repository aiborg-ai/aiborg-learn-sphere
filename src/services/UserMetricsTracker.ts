/**
 * User Metrics Tracker
 *
 * Tracks user behavior and interaction metrics:
 * - Page views and navigation
 * - User engagement (time on page, interactions)
 * - Feature usage
 * - Error tracking
 * - Conversion funnels
 *
 * @example
 * ```typescript
 * // Track page view
 * UserMetricsTracker.trackPageView('/dashboard');
 *
 * // Track user action
 * UserMetricsTracker.trackEvent('course_enrolled', {
 *   courseId: '123',
 *   courseName: 'AI Fundamentals'
 * });
 *
 * // Track conversion
 * UserMetricsTracker.trackConversion('signup_complete', {
 *   userId: 'user123',
 *   plan: 'pro'
 * });
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PageViewMetric {
  userId?: string;
  sessionId: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  timestamp: string;
  timeOnPage?: number;
}

export interface UserEventMetric {
  userId?: string;
  sessionId: string;
  eventName: string;
  eventCategory: string;
  eventData?: Record<string, any>;
  timestamp: string;
}

export interface ConversionMetric {
  userId?: string;
  sessionId: string;
  conversionType: string;
  conversionValue?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface EngagementMetric {
  userId?: string;
  sessionId: string;
  pageUrl: string;
  interactions: number;
  scrollDepth: number;
  timeActive: number;
  timeInactive: number;
  timestamp: string;
}

class UserMetricsTrackerClass {
  private sessionId: string;
  private userId?: string;
  private currentPageUrl: string = '';
  private currentPageStart: number = 0;
  private interactions: number = 0;
  private maxScrollDepth: number = 0;
  private activeTime: number = 0;
  private inactiveTime: number = 0;
  private lastActiveTime: number = Date.now();
  private isActive: boolean = true;
  private inactivityThreshold: number = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize user metrics tracking
   */
  public initialize(userId?: string): void {
    this.userId = userId;

    // Track page views on navigation
    this.setupPageViewTracking();

    // Track user interactions
    this.setupInteractionTracking();

    // Track scroll depth
    this.setupScrollTracking();

    // Track active/inactive time
    this.setupActivityTracking();

    // Track errors
    this.setupErrorTracking();

    logger.log('[UserMetrics] Initialized', { sessionId: this.sessionId, userId });
  }

  /**
   * Set up page view tracking
   */
  private setupPageViewTracking(): void {
    // Track initial page view
    this.trackPageView(window.location.pathname);

    // Track page views on popstate (back/forward)
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });

    // Intercept pushState and replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView(window.location.pathname);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView(window.location.pathname);
    };
  }

  /**
   * Track a page view
   */
  public trackPageView(pageUrl: string): void {
    // Send previous page metrics
    if (this.currentPageUrl) {
      this.sendPageMetrics();
    }

    // Reset for new page
    this.currentPageUrl = pageUrl;
    this.currentPageStart = Date.now();
    this.interactions = 0;
    this.maxScrollDepth = 0;

    const metric: PageViewMetric = {
      userId: this.userId,
      sessionId: this.sessionId,
      pageUrl,
      pageTitle: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    };

    this.sendMetric('page_views', metric);

    logger.log('[UserMetrics] Page view tracked:', pageUrl);
  }

  /**
   * Set up interaction tracking (clicks, keypresses)
   */
  private setupInteractionTracking(): void {
    document.addEventListener('click', () => {
      this.interactions++;
      this.updateActivityTime();
    });

    document.addEventListener('keypress', () => {
      this.interactions++;
      this.updateActivityTime();
    });

    document.addEventListener('touchstart', () => {
      this.interactions++;
      this.updateActivityTime();
    });
  }

  /**
   * Set up scroll depth tracking
   */
  private setupScrollTracking(): void {
    let ticking = false;

    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      if (scrollPercent > this.maxScrollDepth) {
        this.maxScrollDepth = Math.min(scrollPercent, 100);
      }

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }

      this.updateActivityTime();
    });
  }

  /**
   * Set up activity tracking (active/inactive time)
   */
  private setupActivityTracking(): void {
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
      } else {
        this.isActive = true;
        this.lastActiveTime = Date.now();
      }
    });

    // Track mouse movement
    document.addEventListener('mousemove', () => {
      this.updateActivityTime();
    });

    // Periodic check for inactivity
    setInterval(() => {
      const now = Date.now();
      const timeSinceActive = now - this.lastActiveTime;

      if (timeSinceActive > this.inactivityThreshold) {
        if (this.isActive) {
          this.isActive = false;
        }
        this.inactiveTime += 1000;
      } else {
        if (!this.isActive) {
          this.isActive = true;
        }
        this.activeTime += 1000;
      }
    }, 1000);
  }

  /**
   * Update activity time
   */
  private updateActivityTime(): void {
    this.lastActiveTime = Date.now();
    this.isActive = true;
  }

  /**
   * Set up error tracking
   */
  private setupErrorTracking(): void {
    window.addEventListener('error', event => {
      this.trackEvent('javascript_error', 'errors', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.trackEvent('unhandled_rejection', 'errors', {
        reason: event.reason,
        promise: String(event.promise),
      });
    });
  }

  /**
   * Track a user event
   */
  public trackEvent(
    eventName: string,
    eventCategory: string = 'general',
    eventData?: Record<string, any>
  ): void {
    const metric: UserEventMetric = {
      userId: this.userId,
      sessionId: this.sessionId,
      eventName,
      eventCategory,
      eventData,
      timestamp: new Date().toISOString(),
    };

    this.sendMetric('user_events', metric);

    logger.log(`[UserMetrics] Event tracked: ${eventCategory}/${eventName}`, eventData);
  }

  /**
   * Track a conversion event
   */
  public trackConversion(
    conversionType: string,
    metadata?: Record<string, any>,
    conversionValue?: number
  ): void {
    const metric: ConversionMetric = {
      userId: this.userId,
      sessionId: this.sessionId,
      conversionType,
      conversionValue,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.sendMetric('conversions', metric);

    logger.log(`[UserMetrics] Conversion tracked: ${conversionType}`, {
      value: conversionValue,
      ...metadata,
    });
  }

  /**
   * Send page engagement metrics
   */
  private sendPageMetrics(): void {
    const timeOnPage = Date.now() - this.currentPageStart;

    const metric: EngagementMetric = {
      userId: this.userId,
      sessionId: this.sessionId,
      pageUrl: this.currentPageUrl,
      interactions: this.interactions,
      scrollDepth: Math.round(this.maxScrollDepth),
      timeActive: Math.round(this.activeTime),
      timeInactive: Math.round(this.inactiveTime),
      timestamp: new Date().toISOString(),
    };

    this.sendMetric('engagement_metrics', metric);

    logger.log('[UserMetrics] Page metrics sent:', {
      page: this.currentPageUrl,
      timeOnPage: `${(timeOnPage / 1000).toFixed(1)}s`,
      interactions: this.interactions,
      scrollDepth: `${metric.scrollDepth}%`,
    });
  }

  /**
   * Send metric to backend
   */
  private async sendMetric(table: string, metric: any): Promise<void> {
    try {
      const { error } = await supabase.from(table).insert(metric);

      if (error) {
        logger.error(`[UserMetrics] Failed to send ${table} metric:`, error);
      }
    } catch (error) {
      logger.error(`[UserMetrics] Error sending ${table} metric:`, error);
    }
  }

  /**
   * Set user ID (for when user logs in)
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    logger.log('[UserMetrics] User ID set:', userId);
  }

  /**
   * Clear user ID (for when user logs out)
   */
  public clearUserId(): void {
    this.userId = undefined;
    logger.log('[UserMetrics] User ID cleared');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get current session metrics
   */
  public getSessionMetrics(): {
    sessionId: string;
    userId?: string;
    currentPage: string;
    timeOnCurrentPage: number;
    totalInteractions: number;
    maxScrollDepth: number;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      currentPage: this.currentPageUrl,
      timeOnCurrentPage: Date.now() - this.currentPageStart,
      totalInteractions: this.interactions,
      maxScrollDepth: Math.round(this.maxScrollDepth),
    };
  }

  /**
   * Clean up before page unload
   */
  public destroy(): void {
    if (this.currentPageUrl) {
      this.sendPageMetrics();
    }

    logger.log('[UserMetrics] Destroyed');
  }
}

// Export singleton instance
export const UserMetricsTracker = new UserMetricsTrackerClass();
