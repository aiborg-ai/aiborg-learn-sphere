import { logger } from '@/utils/logger';

/**
 * Rate limiting utilities for API calls and user actions
 * @module rate-limiter
 */

/**
 * Rate limit configuration
 * @interface RateLimitConfig
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique identifier for the rate limit */
  key: string;
  /** Skip successful requests from limit */
  skipSuccessfulRequests?: boolean;
  /** Skip failed requests from limit */
  skipFailedRequests?: boolean;
}

/**
 * Rate limit entry
 * @interface RateLimitEntry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

/**
 * Rate limiter class for client-side API protection
 * @class RateLimiter
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if a request should be rate limited
   * @param {RateLimitConfig} config - Rate limit configuration
   * @returns {object} Rate limit status
   */
  checkLimit(config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const { maxRequests, windowMs, key } = config;
    const now = Date.now();
    const entry = this.limits.get(key);

    // Initialize or reset entry
    if (!entry || entry.resetTime <= now) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    // Check if already blocked
    if (entry.blocked) {
      const retryAfter = entry.resetTime - now;
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      };
    }

    // Increment count
    entry.count += 1;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      entry.blocked = true;
      const retryAfter = entry.resetTime - now;

      logger.warn(`Rate limit exceeded for key: ${key}`);

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Rate limit key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  /**
   * Start cleanup interval to remove expired entries
   * @private
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.limits.forEach((entry, key) => {
        if (entry.resetTime <= now) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.limits.delete(key));
    }, 60000); // 1 minute
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter();

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /** Standard API calls */
  api: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    key: 'api'
  },

  /** Authentication attempts */
  auth: {
    maxRequests: 5,
    windowMs: 300000, // 5 minutes
    key: 'auth'
  },

  /** File uploads */
  upload: {
    maxRequests: 10,
    windowMs: 600000, // 10 minutes
    key: 'upload'
  },

  /** Search queries */
  search: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    key: 'search'
  },

  /** Form submissions */
  form: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    key: 'form'
  },

  /** Password reset */
  passwordReset: {
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
    key: 'password-reset'
  },

  /** Email sending */
  email: {
    maxRequests: 5,
    windowMs: 300000, // 5 minutes
    key: 'email'
  }
};

/**
 * Rate limit decorator for functions
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Function} Decorator function
 * @example
 * const limitedFunction = withRateLimit(RateLimitPresets.api)(originalFunction);
 */
export function withRateLimit(config: RateLimitConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const limitCheck = rateLimiter.checkLimit(config);

      if (!limitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(limitCheck.retryAfter! / 1000)} seconds`);
      }

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        // Optionally don't count failed requests
        if (config.skipFailedRequests) {
          rateLimiter.reset(config.key);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Rate limit middleware for API calls
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Function} Middleware function
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (request: any, next: Function) => {
    const limitCheck = rateLimiter.checkLimit({
      ...config,
      key: `${config.key}-${request.userId || request.ip || 'anonymous'}`
    });

    if (!limitCheck.allowed) {
      return {
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: limitCheck.retryAfter
        },
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': limitCheck.remaining.toString(),
          'X-RateLimit-Reset': new Date(limitCheck.resetTime).toISOString(),
          'Retry-After': Math.ceil(limitCheck.retryAfter! / 1000).toString()
        }
      };
    }

    // Add rate limit headers to response
    const response = await next(request);

    if (response.headers) {
      response.headers['X-RateLimit-Limit'] = config.maxRequests.toString();
      response.headers['X-RateLimit-Remaining'] = limitCheck.remaining.toString();
      response.headers['X-RateLimit-Reset'] = new Date(limitCheck.resetTime).toISOString();
    }

    return response;
  };
}

/**
 * Debounce function with rate limiting
 * @param {Function} func - Function to debounce
 * @param {number} wait - Debounce wait time
 * @param {RateLimitConfig} [rateLimit] - Optional rate limit config
 * @returns {Function} Debounced function
 */
export function debounceWithRateLimit(
  func: Function,
  wait: number,
  rateLimit?: RateLimitConfig
): Function {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: any[] = [];

  return function (...args: any[]) {
    lastArgs = args;

    const execute = () => {
      if (rateLimit) {
        const limitCheck = rateLimiter.checkLimit(rateLimit);
        if (!limitCheck.allowed) {
          logger.warn('Rate limit exceeded for debounced function');
          return;
        }
      }
      func.apply(this, lastArgs);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(execute, wait);
  };
}

/**
 * Throttle function with rate limiting
 * @param {Function} func - Function to throttle
 * @param {number} wait - Throttle wait time
 * @param {RateLimitConfig} [rateLimit] - Optional rate limit config
 * @returns {Function} Throttled function
 */
export function throttleWithRateLimit(
  func: Function,
  wait: number,
  rateLimit?: RateLimitConfig
): Function {
  let lastTime = 0;

  return function (...args: any[]) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      if (rateLimit) {
        const limitCheck = rateLimiter.checkLimit(rateLimit);
        if (!limitCheck.allowed) {
          logger.warn('Rate limit exceeded for throttled function');
          return;
        }
      }

      lastTime = now;
      func.apply(this, args);
    }
  };
}