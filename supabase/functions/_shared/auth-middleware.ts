/**
 * Authentication Middleware for Supabase Edge Functions
 *
 * Provides authentication helpers with account lockout protection
 * Use this instead of direct auth checks to ensure lockout policy is enforced
 *
 * @module _shared/auth-middleware
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  supabase: ReturnType<typeof createClient>;
}

export interface LockoutStatus {
  is_locked: boolean;
  locked_until?: string;
  attempt_count: number;
  retry_after_seconds?: number;
}

/**
 * Check if an email is currently locked out
 */
export async function checkAccountLockout(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<LockoutStatus> {
  const { data, error } = await supabase.rpc('check_account_lockout', {
    p_email: email,
  });

  if (error) {
    console.error('Lockout check failed:', error);
    // Fail open - don't block legitimate users due to system error
    return {
      is_locked: false,
      attempt_count: 0,
    };
  }

  return data as LockoutStatus;
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  supabase: ReturnType<typeof createClient>,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LockoutStatus> {
  const { data, error } = await supabase.rpc('record_failed_login_attempt', {
    p_email: email,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  });

  if (error) {
    console.error('Failed to record login attempt:', error);
    return {
      is_locked: false,
      attempt_count: 0,
    };
  }

  return data as LockoutStatus;
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<void> {
  const { error } = await supabase.rpc('clear_failed_login_attempts', {
    p_email: email,
  });

  if (error) {
    console.error('Failed to clear login attempts:', error);
  }
}

/**
 * Authenticate request and get user context
 * Returns null if authentication fails
 */
export async function authenticateRequest(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user || !user.email) {
    return null;
  }

  // Get user role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role,
    },
    supabase,
  };
}

/**
 * Require authentication for an endpoint
 * Returns 401 if not authenticated
 */
export async function requireAuth(req: Request): Promise<AuthContext | Response> {
  const authContext = await authenticateRequest(req);

  if (!authContext) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return authContext;
}

/**
 * Require specific role for an endpoint
 * Returns 403 if user doesn't have required role
 */
export async function requireRole(
  req: Request,
  allowedRoles: string[]
): Promise<AuthContext | Response> {
  const authResult = await requireAuth(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  if (!authResult.user.role || !allowedRoles.includes(authResult.user.role)) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return authResult;
}

/**
 * Extract client information from request
 */
export function getClientInfo(req: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Log security event to audit log
 */
export async function logSecurityEvent(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  data: {
    userId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from('security_audit_log').insert({
    event_type: eventType,
    user_id: data.userId,
    email: data.email,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    resource: data.resource,
    action: data.action,
    metadata: data.metadata,
    timestamp: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log security event:', error);
  }
}
