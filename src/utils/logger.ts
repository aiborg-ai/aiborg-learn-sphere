/**
 * Enhanced Logger utility with multiple log levels and formatting
 * Provides structured logging with timestamps, context, and performance tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  prefix?: string;
}

interface LogContext {
  [key: string]: unknown;
}

// Get environment configuration
const isDevelopment = typeof import.meta !== 'undefined' ? import.meta.env?.DEV : true;
const configuredLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

class Logger {
  private config: LoggerConfig;
  private timers: Map<string, number>;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: configuredLevel,
      enableTimestamps: true,
      enableColors: true,
      ...config,
    };
    this.timers = new Map();
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(): string {
    if (!this.config.enableTimestamps) return '';
    const now = new Date();
    return `[${now.toISOString()}]`;
  }

  /**
   * Format message with prefix and timestamp
   */
  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];

    if (this.config.enableTimestamps) {
      parts.push(this.formatTimestamp());
    }

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    parts.push(`[${level}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Format context object for display
   */
  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';
    try {
      return '\n' + JSON.stringify(context, null, 2);
    } catch {
      return '\n[Context contains circular reference]';
    }
  }

  /**
   * Log debug message (lowest priority)
   */
  debug(message: string, context?: LogContext): void {
    if (this.config.level > LogLevel.DEBUG) return;

    // eslint-disable-next-line no-console
    console.debug(this.formatMessage('DEBUG', message) + this.formatContext(context));
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.config.level > LogLevel.INFO) return;

    // eslint-disable-next-line no-console
    console.info(this.formatMessage('INFO', message) + this.formatContext(context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.config.level > LogLevel.WARN) return;

    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('WARN', message) + this.formatContext(context));
  }

  /**
   * Log error message (highest priority)
   * Also forwards errors to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.config.level > LogLevel.ERROR) return;

    const errorInfo: LogContext = { ...context };

    if (error instanceof Error) {
      errorInfo.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorInfo.error = error;
    }

    // eslint-disable-next-line no-console
    console.error(this.formatMessage('ERROR', message) + this.formatContext(errorInfo));

    // Forward to Sentry in production
    if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
      try {
        // Dynamic import to avoid bundling Sentry in development
        import('../config/sentry').then(({ captureSentryException }) => {
          if (error instanceof Error) {
            captureSentryException(error, { message, ...context });
          }
        });
      } catch {
        // Silently fail if Sentry is not available
      }
    }
  }

  /**
   * Log generic message (alias for info)
   */
  log(message: string, context?: LogContext): void {
    this.info(message, context);
  }

  /**
   * Log table (useful for arrays of objects)
   */
  table(data: unknown): void {
    if (this.config.level > LogLevel.DEBUG) return;

    // eslint-disable-next-line no-console
    console.table(data);
  }

  /**
   * Group related log messages
   */
  group(label: string, collapsed = false): void {
    if (this.config.level > LogLevel.DEBUG) return;

    if (collapsed) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(label);
    } else {
      // eslint-disable-next-line no-console
      console.group(label);
    }
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    if (this.config.level > LogLevel.DEBUG) return;

    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  /**
   * Start a performance timer
   */
  time(label: string): void {
    if (this.config.level > LogLevel.DEBUG) return;
    this.timers.set(label, performance.now());
  }

  /**
   * End a performance timer and log the duration
   */
  timeEnd(label: string): void {
    if (this.config.level > LogLevel.DEBUG) return;

    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    this.info(`${label}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Log an assertion
   */
  assert(condition: boolean, message: string): void {
    if (this.config.level > LogLevel.DEBUG) return;

    if (!condition) {
      this.error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Create a child logger with a prefix
   */
  createChild(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Trace function execution
   */
  trace<T>(fn: () => T, label?: string): T {
    const fnName = label || fn.name || 'anonymous';
    this.time(fnName);
    try {
      const result = fn();
      this.timeEnd(fnName);
      return result;
    } catch {
      this.timeEnd(fnName);
      this.error(`Error in ${fnName}`, error);
      throw error;
    }
  }

  /**
   * Trace async function execution
   */
  async traceAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
    const fnName = label || fn.name || 'anonymous';
    this.time(fnName);
    try {
      const result = await fn();
      this.timeEnd(fnName);
      return result;
    } catch {
      this.timeEnd(fnName);
      this.error(`Error in ${fnName}`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating custom instances
export { Logger };

// Backward compatibility - keep existing interface
export default logger;
