/**
 * Rate Limiting Middleware for Supabase Edge Functions
 *
 * Provides configurable rate limiting to prevent API abuse and DDoS attacks.
 * Uses sliding window algorithm with PostgreSQL tracking.
 *
 * @module _shared/rate-limit-middleware
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifier?: string; // Custom identifier (default: user ID or IP)
  endpoint?: string; // Endpoint name (default: function name)
}

export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset_at: string;
  retry_after?: number;
}

/**
 * Extract identifier from request (user ID or IP address)
 */
function getIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to user agent hash (not ideal but better than nothing)
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `ua:${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check rate limit without incrementing counter
 */
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  endpoint: string = '*'
): Promise<RateLimitStatus> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - don't block requests if rate limit check fails
      return {
        allowed: true,
        limit: 100,
        remaining: 99,
        reset_at: new Date(Date.now() + 60000).toISOString(),
      };
    }

    return data as RateLimitStatus;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      allowed: true,
      limit: 100,
      remaining: 99,
      reset_at: new Date(Date.now() + 60000).toISOString(),
    };
  }
}

/**
 * Record API request and increment counter
 */
export async function recordRequest(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  endpoint: string = '*'
): Promise<RateLimitStatus> {
  try {
    const { data, error } = await supabase.rpc('record_api_request', {
      p_identifier: identifier,
      p_endpoint: endpoint,
    });

    if (error) {
      console.error('Failed to record API request:', error);
      return {
        allowed: true,
        limit: 100,
        remaining: 99,
        reset_at: new Date(Date.now() + 60000).toISOString(),
      };
    }

    return data as RateLimitStatus;
  } catch (error) {
    console.error('Record request error:', error);
    return {
      allowed: true,
      limit: 100,
      remaining: 99,
      reset_at: new Date(Date.now() + 60000).toISOString(),
    };
  }
}

/**
 * Apply rate limiting to an Edge Function
 * Returns 429 Too Many Requests if limit exceeded
 *
 * @param req - HTTP request
 * @param config - Rate limit configuration
 * @param userId - Optional authenticated user ID
 * @returns Rate limit status or 429 Response
 *
 * @example
 * ```typescript
 * serve(async (req) => {
 *   const rateLimitResult = await withRateLimit(req, {
 *     maxRequests: 30,
 *     windowSeconds: 60,
 *     endpoint: '/api/chat',
 *   });
 *
 *   if (rateLimitResult instanceof Response) {
 *     return rateLimitResult; // 429 error
 *   }
 *
 *   // Continue with request handling
 *   const { remaining, limit } = rateLimitResult;
 * });
 * ```
 */
export async function withRateLimit(
  req: Request,
  config: RateLimitConfig,
  userId?: string
): Promise<RateLimitStatus | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Determine identifier
  const identifier = config.identifier || getIdentifier(req, userId);
  const endpoint = config.endpoint || '*';

  // Record request and check limit
  const status = await recordRequest(supabase, identifier, endpoint);

  if (!status.allowed) {
    // Rate limit exceeded
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: status.limit,
        remaining: 0,
        reset_at: status.reset_at,
        retry_after: status.retry_after,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': status.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': status.reset_at,
          'Retry-After': (status.retry_after || 60).toString(),
        },
      }
    );
  }

  // Return status with headers for response
  return status;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(response: Response, status: RateLimitStatus): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', status.limit.toString());
  headers.set('X-RateLimit-Remaining', status.remaining.toString());
  headers.set('X-RateLimit-Reset', status.reset_at);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Rate limit middleware wrapper
 * Automatically applies rate limiting and adds headers
 *
 * @example
 * ```typescript
 * import { rateLimitMiddleware } from '../_shared/rate-limit-middleware.ts';
 *
 * serve(rateLimitMiddleware(
 *   {
 *     maxRequests: 30,
 *     windowSeconds: 60,
 *     endpoint: '/api/chat',
 *   },
 *   async (req, rateLimitStatus) => {
 *     // Your handler code here
 *     return new Response(JSON.stringify({ data: 'response' }));
 *   }
 * ));
 * ```
 */
export function rateLimitMiddleware(
  config: RateLimitConfig,
  handler: (req: Request, rateLimitStatus: RateLimitStatus) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // Apply rate limit
    const rateLimitResult = await withRateLimit(req, config);

    if (rateLimitResult instanceof Response) {
      return rateLimitResult; // 429 error
    }

    // Call handler
    const response = await handler(req, rateLimitResult);

    // Add rate limit headers
    return addRateLimitHeaders(response, rateLimitResult);
  };
}

/**
 * Get rate limit status for monitoring
 */
export async function getRateLimitStatus(
  identifier: string,
  endpoint: string = '*'
): Promise<RateLimitStatus> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  return checkRateLimit(supabase, identifier, endpoint);
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(identifier: string, endpoint?: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.rpc('reset_rate_limit', {
    p_identifier: identifier,
    p_endpoint: endpoint,
  });

  if (error) {
    throw new Error(`Failed to reset rate limit: ${error.message}`);
  }
}
