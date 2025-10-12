/**
 * Client-side Rate Limiter
 *
 * Implements rate limiting for authentication and other sensitive operations
 * to prevent brute force attacks and resource abuse.
 *
 * Note: This is CLIENT-SIDE protection only. Server-side rate limiting
 * should also be implemented in Supabase Edge Functions.
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // Optional block duration after limit exceeded
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number; // Timestamp when limit resets
  message?: string;
}

class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; blockedUntil?: number }> =
    new Map();

  /**
   * Check if an action is allowed under rate limiting rules
   * @param key - Unique identifier for the action (e.g., 'signin:user@example.com')
   * @param config - Rate limit configuration
   * @returns Rate limit result
   */
  checkLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const existing = this.attempts.get(key);

    // Check if currently blocked
    if (existing?.blockedUntil && existing.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: existing.blockedUntil,
        message: `Too many attempts. Please try again after ${new Date(existing.blockedUntil).toLocaleTimeString()}.`,
      };
    }

    // No existing attempts or window expired
    if (!existing || now - existing.firstAttempt > config.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Within time window - check if limit exceeded
    if (existing.count >= config.maxAttempts) {
      const blockUntil = config.blockDurationMs
        ? now + config.blockDurationMs
        : existing.firstAttempt + config.windowMs;

      this.attempts.set(key, {
        ...existing,
        blockedUntil: blockUntil,
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockUntil,
        message: `Too many attempts. Please try again in ${Math.ceil((blockUntil - now) / 1000)} seconds.`,
      };
    }

    // Increment attempt count
    existing.count++;
    this.attempts.set(key, existing);

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - existing.count,
      resetTime: existing.firstAttempt + config.windowMs,
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Key to reset
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.attempts.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      // Remove entries older than 1 hour
      if (now - value.firstAttempt > 3600000) {
        this.attempts.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 600000);
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Sign in: 5 attempts per 15 minutes
  SIGN_IN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  },

  // Sign up: 3 attempts per hour
  SIGN_UP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  },

  // Password reset: 3 attempts per hour
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  },

  // OAuth: 5 attempts per 5 minutes
  OAUTH: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  },
} as const;

/**
 * Check rate limit for sign in attempts
 * @param email - User email
 * @returns Rate limit result
 */
export const checkSignInLimit = (email: string): RateLimitResult => {
  return rateLimiter.checkLimit(`signin:${email.toLowerCase()}`, RATE_LIMITS.SIGN_IN);
};

/**
 * Check rate limit for sign up attempts
 * @param email - User email
 * @returns Rate limit result
 */
export const checkSignUpLimit = (email: string): RateLimitResult => {
  return rateLimiter.checkLimit(`signup:${email.toLowerCase()}`, RATE_LIMITS.SIGN_UP);
};

/**
 * Check rate limit for password reset attempts
 * @param email - User email
 * @returns Rate limit result
 */
export const checkPasswordResetLimit = (email: string): RateLimitResult => {
  return rateLimiter.checkLimit(`reset:${email.toLowerCase()}`, RATE_LIMITS.PASSWORD_RESET);
};

/**
 * Check rate limit for OAuth attempts
 * @param provider - OAuth provider name
 * @returns Rate limit result
 */
export const checkOAuthLimit = (provider: string): RateLimitResult => {
  return rateLimiter.checkLimit(`oauth:${provider}`, RATE_LIMITS.OAUTH);
};

/**
 * Reset rate limit after successful authentication
 * @param email - User email
 */
export const resetAuthLimit = (email: string): void => {
  rateLimiter.reset(`signin:${email.toLowerCase()}`);
  rateLimiter.reset(`signup:${email.toLowerCase()}`);
};

export default rateLimiter;
