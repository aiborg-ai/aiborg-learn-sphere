import { logger } from '@/utils/logger';
/**
 * Audit Logging
 *
 * Track sensitive operations for security and compliance
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'DASHBOARD_CREATED'
  | 'DASHBOARD_UPDATED'
  | 'DASHBOARD_DELETED'
  | 'SHARE_LINK_CREATED'
  | 'SHARE_LINK_REVOKED'
  | 'TEMPLATE_PUBLISHED'
  | 'TEMPLATE_UNPUBLISHED'
  | 'TEMPLATE_CLONED'
  | 'TEMPLATE_RATED'
  | 'VIEW_SWITCHED'
  | 'CONFIG_IMPORTED'
  | 'CONFIG_EXPORTED';

export type ResourceType =
  | 'dashboard_view'
  | 'share_link'
  | 'template'
  | 'widget'
  | 'configuration';

interface AuditLogEntry {
  user_id: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp?: string;
}

// Log audit entry
export async function logAudit(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  try {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      ip_address: entry.ip_address || getClientIP(),
      user_agent: entry.user_agent || getUserAgent(),
    };

    // Log to Supabase audit table (if table exists)
    try {
      await supabase.from('audit_logs').insert(logEntry);
    } catch {
      // Table might not exist yet - just log to console
      if (import.meta.env.DEV) {
        logger.info('[Audit]', logEntry);
      }
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      logger.info('[Audit]', logEntry.action, logEntry.resource_type, logEntry.resource_id);
    }
  } catch {
    // Audit logging should never break the application
    if (import.meta.env.DEV) {
      logger.error('[Audit] Failed to log:', error);
    }
  }
}

// Helper functions
function getClientIP(): string | undefined {
  // In browser, we can't reliably get the client IP
  // This would typically be handled server-side
  return undefined;
}

function getUserAgent(): string | undefined {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return undefined;
}

// Convenience methods for common audit actions
export const audit = {
  dashboardCreated: (userId: string, viewId: string) =>
    logAudit({
      user_id: userId,
      action: 'DASHBOARD_CREATED',
      resource_type: 'dashboard_view',
      resource_id: viewId,
    }),

  dashboardUpdated: (userId: string, viewId: string, details?: Record<string, unknown>) =>
    logAudit({
      user_id: userId,
      action: 'DASHBOARD_UPDATED',
      resource_type: 'dashboard_view',
      resource_id: viewId,
      details,
    }),

  dashboardDeleted: (userId: string, viewId: string) =>
    logAudit({
      user_id: userId,
      action: 'DASHBOARD_DELETED',
      resource_type: 'dashboard_view',
      resource_id: viewId,
    }),

  shareLinkCreated: (userId: string, linkId: string, details?: Record<string, unknown>) =>
    logAudit({
      user_id: userId,
      action: 'SHARE_LINK_CREATED',
      resource_type: 'share_link',
      resource_id: linkId,
      details,
    }),

  shareLinkRevoked: (userId: string, linkId: string) =>
    logAudit({
      user_id: userId,
      action: 'SHARE_LINK_REVOKED',
      resource_type: 'share_link',
      resource_id: linkId,
    }),

  templatePublished: (userId: string, templateId: string, details?: Record<string, unknown>) =>
    logAudit({
      user_id: userId,
      action: 'TEMPLATE_PUBLISHED',
      resource_type: 'template',
      resource_id: templateId,
      details,
    }),

  templateUnpublished: (userId: string, templateId: string) =>
    logAudit({
      user_id: userId,
      action: 'TEMPLATE_UNPUBLISHED',
      resource_type: 'template',
      resource_id: templateId,
    }),

  templateCloned: (userId: string, templateId: string) =>
    logAudit({
      user_id: userId,
      action: 'TEMPLATE_CLONED',
      resource_type: 'template',
      resource_id: templateId,
    }),

  templateRated: (userId: string, templateId: string, rating: number) =>
    logAudit({
      user_id: userId,
      action: 'TEMPLATE_RATED',
      resource_type: 'template',
      resource_id: templateId,
      details: { rating },
    }),

  configImported: (userId: string, viewId: string) =>
    logAudit({
      user_id: userId,
      action: 'CONFIG_IMPORTED',
      resource_type: 'configuration',
      resource_id: viewId,
    }),

  configExported: (userId: string, viewId: string) =>
    logAudit({
      user_id: userId,
      action: 'CONFIG_EXPORTED',
      resource_type: 'configuration',
      resource_id: viewId,
    }),
};

export default audit;
