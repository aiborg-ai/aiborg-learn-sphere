import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin?: {
    display_name: string | null;
    email: string | null;
  };
}

interface UseAuditLogsOptions {
  limit?: number;
  actionType?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchAuditLogs = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('admin_audit_logs')
        .select(`
          *,
          admin:profiles!admin_id(display_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.actionType) {
        query = query.eq('action_type', options.actionType);
      }

      if (options.entityType) {
        query = query.eq('entity_type', options.entityType);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      logger.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [user, profile, options.actionType, options.entityType, options.startDate, options.endDate, options.limit]);

  const createAuditLog = useCallback(async (
    actionType: string,
    entityType: string,
    entityId: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => {
    if (!user || profile?.role !== 'admin') {
      throw new Error('Only admins can create audit logs');
    }

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          old_value: oldValue || null,
          new_value: newValue || null,
          metadata: metadata || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setLogs(prevLogs => [data, ...prevLogs]);

      return data;
    } catch (err) {
      logger.error('Error creating audit log:', err);
      throw err;
    }
  }, [user, profile]);

  const logUserRoleChange = useCallback(async (
    userId: string,
    oldRole: string,
    newRole: string
  ) => {
    return createAuditLog(
      'user_role_changed',
      'user',
      userId,
      { role: oldRole },
      { role: newRole }
    );
  }, [createAuditLog]);

  const logEnrollmentCreated = useCallback(async (
    enrollmentId: string,
    enrollmentData: Record<string, unknown>
  ) => {
    return createAuditLog(
      'enrollment_created',
      'enrollment',
      enrollmentId,
      undefined,
      enrollmentData
    );
  }, [createAuditLog]);

  const logRefundProcessed = useCallback(async (
    refundId: string,
    refundData: Record<string, unknown>
  ) => {
    return createAuditLog(
      'refund_processed',
      'refund',
      refundId,
      undefined,
      refundData
    );
  }, [createAuditLog]);

  const logPaymentStatusChange = useCallback(async (
    paymentId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    return createAuditLog(
      'payment_status_changed',
      'payment',
      paymentId,
      { status: oldStatus },
      { status: newStatus }
    );
  }, [createAuditLog]);

  const logCourseModified = useCallback(async (
    courseId: string,
    changes: Record<string, unknown>
  ) => {
    return createAuditLog(
      'course_modified',
      'course',
      courseId,
      undefined,
      changes
    );
  }, [createAuditLog]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchAuditLogs,
    createAuditLog,
    logUserRoleChange,
    logEnrollmentCreated,
    logRefundProcessed,
    logPaymentStatusChange,
    logCourseModified,
  };
};
