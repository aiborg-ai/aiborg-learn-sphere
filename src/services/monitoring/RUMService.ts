/**
 * Real User Monitoring (RUM) Service
 * Advanced monitoring for user interactions, errors, and performance
 */

import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  lastActivityTime: number;
  pageViews: number;
  interactions: number;
  errors: number;
  country?: string;
  city?: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
  sessionId: string;
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  target: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface APICall {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  error?: string;
}

class RUMService {
  private session: UserSession;
  private interactions: UserInteraction[] = [];
  private apiCalls: APICall[] = [];
  private errors: ErrorReport[] = [];
  private isInitialized = false;

  constructor() {
    this.session = this.createSession();
  }

  /**
   * Initialize RUM tracking
   */
  public initialize(userId?: string) {
    if (this.isInitialized) return;

    this.session.userId = userId;
    this.setupErrorTracking();
    this.setupInteractionTracking();
    this.setupAPITracking();
    this.setupNetworkTracking();
    this.setupPageVisibilityTracking();

    this.isInitialized = true;
    logger.log('[RUM] Initialized', { sessionId: this.session.id });
  }

  /**
   * Create new session
   */
  private createSession(): UserSession {
    return {
      id: `rum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      pageViews: 1,
      interactions: 0,
      errors: 0,
    };
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', event => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: this.session.userId,
        sessionId: this.session.id,
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', event => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: this.session.userId,
        sessionId: this.session.id,
      });
    });

    // React error boundary integration
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.trackError({
        message: event.detail.error.message,
        stack: event.detail.error.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: this.session.userId,
        sessionId: this.session.id,
      });
    }) as EventListener);
  }

  /**
   * Setup interaction tracking
   */
  private setupInteractionTracking() {
    // Track clicks
    document.addEventListener(
      'click',
      event => {
        const target = event.target as HTMLElement;
        this.trackInteraction({
          type: 'click',
          target: this.getElementDescriptor(target),
          timestamp: Date.now(),
          metadata: {
            x: event.clientX,
            y: event.clientY,
          },
        });
      },
      { capture: true, passive: true }
    );

    // Track scrolling
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener(
      'scroll',
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.trackInteraction({
            type: 'scroll',
            target: 'window',
            timestamp: Date.now(),
            metadata: {
              scrollY: window.scrollY,
              scrollX: window.scrollX,
            },
          });
        }, 200);
      },
      { passive: true }
    );

    // Track form inputs
    document.addEventListener(
      'input',
      event => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          this.trackInteraction({
            type: 'input',
            target: this.getElementDescriptor(target),
            timestamp: Date.now(),
          });
        }
      },
      { capture: true, passive: true }
    );
  }

  /**
   * Setup API call tracking
   */
  private setupAPITracking() {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.trackAPICall({
          url,
          method,
          duration,
          status: response.status,
          timestamp: Date.now(),
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.trackAPICall({
          url,
          method,
          duration,
          status: 0,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
      (this as any).__rum_method = method;
      (this as any).__rum_url = url.toString();
      (this as any).__rum_start = performance.now();
      return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function (...args: any[]) {
      const method = (this as any).__rum_method;
      const url = (this as any).__rum_url;
      const startTime = (this as any).__rum_start;

      this.addEventListener('loadend', () => {
        const duration = performance.now() - startTime;
        rumService.trackAPICall({
          url,
          method,
          duration,
          status: this.status,
          timestamp: Date.now(),
        });
      });

      return originalSend.apply(this, args);
    };
  }

  /**
   * Setup network tracking
   */
  private setupNetworkTracking() {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      // Track connection changes
      connection.addEventListener('change', () => {
        logger.log('[RUM] Connection changed', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      });
    }
  }

  /**
   * Setup page visibility tracking
   */
  private setupPageVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendReport();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.sendReport();
    });
  }

  /**
   * Track error
   */
  public trackError(error: ErrorReport) {
    this.errors.push(error);
    this.session.errors++;
    this.session.lastActivityTime = Date.now();

    logger.error('[RUM] Error tracked:', error);

    // Send immediately for critical errors
    this.sendErrorReport(error);
  }

  /**
   * Track interaction
   */
  private trackInteraction(interaction: UserInteraction) {
    this.interactions.push(interaction);
    this.session.interactions++;
    this.session.lastActivityTime = Date.now();

    // Limit stored interactions
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-50);
    }
  }

  /**
   * Track API call
   */
  private trackAPICall(apiCall: APICall) {
    this.apiCalls.push(apiCall);

    // Track slow API calls (>2s)
    if (apiCall.duration > 2000) {
      logger.warn('[RUM] Slow API call:', apiCall);
    }

    // Limit stored API calls
    if (this.apiCalls.length > 50) {
      this.apiCalls = this.apiCalls.slice(-25);
    }
  }

  /**
   * Track page view
   */
  public trackPageView(url: string, title: string) {
    this.session.pageViews++;
    this.session.lastActivityTime = Date.now();

    logger.log('[RUM] Page view:', { url, title });
  }

  /**
   * Get element descriptor
   */
  private getElementDescriptor(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.slice(0, 30) || '';

    return `${tag}${id}${classes} "${text}"`.trim();
  }

  /**
   * Send error report
   */
  private async sendErrorReport(error: ErrorReport) {
    try {
      await supabase.from('error_reports').insert({
        session_id: error.sessionId,
        user_id: error.userId,
        message: error.message,
        stack: error.stack,
        url: error.url,
        line: error.line,
        column: error.column,
        user_agent: error.userAgent,
        created_at: new Date(error.timestamp).toISOString(),
      });
    } catch (err) {
      logger.error('Failed to send error report:', err);
    }
  }

  /**
   * Send complete report
   */
  private async sendReport() {
    try {
      await supabase.from('rum_sessions').upsert({
        id: this.session.id,
        user_id: this.session.userId,
        start_time: new Date(this.session.startTime).toISOString(),
        last_activity_time: new Date(this.session.lastActivityTime).toISOString(),
        page_views: this.session.pageViews,
        interactions: this.session.interactions,
        errors: this.session.errors,
        interaction_data: this.interactions.slice(-20),
        api_calls: this.apiCalls.slice(-20),
      });

      // Clear sent data
      this.interactions = [];
      this.apiCalls = [];
    } catch (error) {
      logger.error('Failed to send RUM report:', error);
    }
  }

  /**
   * Get session summary
   */
  public getSessionSummary() {
    return {
      ...this.session,
      duration: Date.now() - this.session.startTime,
      averageInteractionRate:
        this.session.interactions / ((Date.now() - this.session.startTime) / 60000),
    };
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string) {
    this.session.userId = userId;
  }
}

// Export singleton instance
export const rumService = new RUMService();
