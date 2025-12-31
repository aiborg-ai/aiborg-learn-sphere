/**
 * Sentry Configuration
 * Error tracking and performance monitoring for production
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only runs in production environment
 */
export function initializeSentry(): void {
  // Only initialize in production
  if (!import.meta.env.PROD) {
    return;
  }

  // Check if error reporting is enabled
  const errorReportingEnabled = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
  if (!errorReportingEnabled) {
    return;
  }

  // Get DSN from environment
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.warn('Sentry DSN not configured. Error reporting disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'production',

      // Integrations
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration({
          // Track React Router navigation
          enableInp: true,
        }),

        // Session replay for debugging
        Sentry.replayIntegration({
          maskAllText: true, // Privacy: mask all text
          blockAllMedia: true, // Privacy: block all media
        }),

        // Capture console errors
        Sentry.captureConsoleIntegration({
          levels: ['error'],
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring

      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions
      replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',

      // Filter out known noise
      beforeSend(event, hint) {
        // Filter out cancelled requests
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          if (message.includes('cancelled') || message.includes('aborted')) {
            return null;
          }
        }

        // Filter out network errors (often not actionable)
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'fb_xd_fragment',

        // Random network errors
        'Network request failed',
        'NetworkError',
        'Failed to fetch',

        // Third-party scripts
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],

      // Privacy: Don't send full URLs with query params
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          if (breadcrumb.data?.url) {
            const url = new URL(breadcrumb.data.url);
            breadcrumb.data.url = `${url.origin}${url.pathname}`;
          }
        }
        return breadcrumb;
      },
    });

    // Set user context if available
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        Sentry.setUser({
          id: user.id,
          email: user.email,
        });
      } catch {
        // Ignore parsing errors
      }
    }
  } catch (_error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (!import.meta.env.PROD) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void {
  if (!import.meta.env.PROD) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an exception manually
 */
export function captureSentryException(error: Error, context?: Record<string, unknown>): void {
  if (!import.meta.env.PROD) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureSentryMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void {
  if (!import.meta.env.PROD) return;

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set tag for filtering errors
 */
export function setSentryTag(key: string, value: string): void {
  if (!import.meta.env.PROD) return;
  Sentry.setTag(key, value);
}

/**
 * Set context for additional information
 */
export function setSentryContext(name: string, context: Record<string, unknown>): void {
  if (!import.meta.env.PROD) return;
  Sentry.setContext(name, context);
}
