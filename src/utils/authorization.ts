/**
 * Authorization Utilities
 *
 * User ownership verification and access control
 */

import { supabase } from '@/integrations/supabase/client';

// Verify user owns a dashboard view
export async function verifyDashboardOwnership(
  viewId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('custom_dashboard_views')
      .select('user_id')
      .eq('id', viewId)
      .single();

    if (error || !data) return false;
    return data.user_id === userId;
  } catch {
    return false;
  }
}

// Verify share link is valid
export async function verifyShareLink(token: string): Promise<{
  valid: boolean;
  viewId?: string;
  requireAuth?: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('dashboard_share_links')
      .select('dashboard_view_id, expires_at, max_uses, use_count, require_auth')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { valid: false };
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false };
    }

    // Check max uses
    if (data.max_uses && data.use_count >= data.max_uses) {
      return { valid: false };
    }

    return {
      valid: true,
      viewId: data.dashboard_view_id,
      requireAuth: data.require_auth,
    };
  } catch {
    return { valid: false };
  }
}

// Rate limiting helper
const requestCounts = new Map<
  string,
  { count: number; resetAt: number; operations: Map<string, number> }
>();

export function checkRateLimit(
  userId: string,
  operation: string = 'default',
  maxRequests = 100,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    const operations = new Map<string, number>();
    operations.set(operation, 1);
    requestCounts.set(userId, { count: 1, resetAt: now + windowMs, operations });
    return true;
  }

  // Check global limit
  if (userLimit.count >= maxRequests) {
    return false;
  }

  // Check per-operation limit (stricter for sensitive operations)
  const operationCount = userLimit.operations.get(operation) || 0;
  const operationLimit = getOperationLimit(operation);

  if (operationCount >= operationLimit) {
    return false;
  }

  userLimit.count++;
  userLimit.operations.set(operation, operationCount + 1);
  return true;
}

// Get rate limit for specific operations
function getOperationLimit(operation: string): number {
  const limits: Record<string, number> = {
    'create-view': 10, // Max 10 view creations per minute
    'publish-template': 5, // Max 5 template publishes per minute
    'create-share-link': 10, // Max 10 share links per minute
    'rate-template': 20, // Max 20 ratings per minute
    'clone-template': 20, // Max 20 clones per minute
    default: 100, // Default limit
  };

  return limits[operation] || limits.default;
}

// Clean up old rate limit entries
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [userId, data] of requestCounts.entries()) {
    if (now > data.resetAt) {
      requestCounts.delete(userId);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

export default {
  verifyDashboardOwnership,
  verifyShareLink,
  checkRateLimit,
  cleanupRateLimits,
};
