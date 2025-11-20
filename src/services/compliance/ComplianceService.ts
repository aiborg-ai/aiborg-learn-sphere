/**
 * Compliance Training Service
 *
 * Service for managing compliance training:
 * - Requirement management
 * - User compliance tracking
 * - Auto-assignment and renewals
 * - Reminders and escalations
 * - Audit-ready reporting
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string | null;
  category: 'training' | 'certification' | 'policy_acknowledgment' | 'assessment';
  course_id: string | null;
  frequency: 'once' | 'annual' | 'bi_annual' | 'quarterly' | 'custom';
  renewal_period_days: number;
  grace_period_days: number;
  target_roles: string[];
  target_departments: string[];
  is_mandatory: boolean;
  regulatory_body: string | null;
  legal_reference: string | null;
  compliance_code: string | null;
  passing_score: number;
  max_attempts: number;
  is_active: boolean;
  effective_date: string;
  sunset_date: string | null;
}

export interface UserComplianceStatus {
  id: string;
  user_id: string;
  requirement_id: string;
  requirement?: ComplianceRequirement;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired' | 'overdue' | 'exempted';
  assigned_date: string;
  due_date: string;
  started_date: string | null;
  completed_date: string | null;
  expiry_date: string | null;
  score: number | null;
  attempts: number;
  certificate_id: string | null;
  is_renewal: boolean;
  exemption_reason: string | null;
}

export interface ComplianceAuditLog {
  id: string;
  user_id: string | null;
  requirement_id: string | null;
  status_id: string | null;
  action: string;
  status_before: string | null;
  status_after: string | null;
  reason: string | null;
  actioned_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ComplianceSummary {
  total_requirements: number;
  total_users: number;
  compliant_count: number;
  non_compliant_count: number;
  overdue_count: number;
  expiring_soon_count: number;
  compliance_rate: number;
}

export interface ComplianceReport {
  requirement_title: string;
  total_assigned: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
  avg_score: number | null;
  avg_completion_days: number | null;
}

export interface UserComplianceItem {
  status_id: string;
  requirement_id: string;
  title: string;
  category: string;
  status: string;
  due_date: string;
  expiry_date: string | null;
  score: number | null;
  is_overdue: boolean;
  is_expiring_soon: boolean;
}

class ComplianceServiceClass {
  // ===== Requirements Management =====

  /**
   * Get all compliance requirements
   */
  async getRequirements(options?: {
    category?: string;
    active_only?: boolean;
  }): Promise<ComplianceRequirement[]> {
    try {
      let query = supabase
        .from('compliance_requirements')
        .select('*')
        .order('title');

      if (options?.active_only !== false) {
        query = query.eq('is_active', true);
      }

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching requirements:', error);
      throw error;
    }
  }

  /**
   * Get a single requirement
   */
  async getRequirement(requirementId: string): Promise<ComplianceRequirement | null> {
    try {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching requirement:', error);
      throw error;
    }
  }

  /**
   * Create a new compliance requirement
   */
  async createRequirement(
    requirement: Partial<ComplianceRequirement>
  ): Promise<ComplianceRequirement> {
    try {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .insert({
          title: requirement.title,
          description: requirement.description,
          category: requirement.category || 'training',
          course_id: requirement.course_id,
          frequency: requirement.frequency || 'annual',
          renewal_period_days: requirement.renewal_period_days || 365,
          grace_period_days: requirement.grace_period_days || 14,
          target_roles: requirement.target_roles || [],
          target_departments: requirement.target_departments || [],
          is_mandatory: requirement.is_mandatory ?? true,
          regulatory_body: requirement.regulatory_body,
          legal_reference: requirement.legal_reference,
          compliance_code: requirement.compliance_code,
          passing_score: requirement.passing_score || 80,
          max_attempts: requirement.max_attempts || 3,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating requirement:', error);
      throw error;
    }
  }

  /**
   * Update a compliance requirement
   */
  async updateRequirement(
    requirementId: string,
    updates: Partial<ComplianceRequirement>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_requirements')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requirementId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating requirement:', error);
      throw error;
    }
  }

  /**
   * Archive a compliance requirement
   */
  async archiveRequirement(requirementId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_requirements')
        .update({
          is_active: false,
          sunset_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', requirementId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error archiving requirement:', error);
      throw error;
    }
  }

  // ===== User Compliance Status =====

  /**
   * Get user's compliance status
   */
  async getUserCompliance(userId: string): Promise<UserComplianceItem[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_compliance', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user compliance:', error);
      throw error;
    }
  }

  /**
   * Get all user statuses for a requirement
   */
  async getRequirementStatuses(
    requirementId: string
  ): Promise<UserComplianceStatus[]> {
    try {
      const { data, error } = await supabase
        .from('user_compliance_status')
        .select(`
          *,
          requirement:compliance_requirements(*)
        `)
        .eq('requirement_id', requirementId)
        .order('status')
        .order('due_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching requirement statuses:', error);
      throw error;
    }
  }

  /**
   * Assign requirement to user
   */
  async assignToUser(
    userId: string,
    requirementId: string,
    dueDate?: Date
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('assign_compliance_requirement', {
        p_user_id: userId,
        p_requirement_id: requirementId,
        p_due_date: dueDate?.toISOString() || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error assigning requirement:', error);
      throw error;
    }
  }

  /**
   * Bulk assign requirement to multiple users
   */
  async bulkAssign(
    userIds: string[],
    requirementId: string,
    dueDate?: Date
  ): Promise<number> {
    try {
      let count = 0;
      for (const userId of userIds) {
        await this.assignToUser(userId, requirementId, dueDate);
        count++;
      }
      return count;
    } catch (error) {
      logger.error('Error bulk assigning:', error);
      throw error;
    }
  }

  /**
   * Auto-assign requirements based on role
   */
  async autoAssignByRole(userId: string, role: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('auto_assign_by_role', {
        p_user_id: userId,
        p_role: role,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      logger.error('Error auto-assigning by role:', error);
      throw error;
    }
  }

  /**
   * Update compliance status
   */
  async updateStatus(
    statusId: string,
    updates: {
      status?: string;
      score?: number;
      completed_date?: string;
      expiry_date?: string;
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updates.status === 'in_progress' && !updates.completed_date) {
        updateData.started_date = new Date().toISOString();
      }

      if (updates.status === 'completed') {
        updateData.completed_date = updates.completed_date || new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_compliance_status')
        .update(updateData)
        .eq('id', statusId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating status:', error);
      throw error;
    }
  }

  /**
   * Complete a compliance requirement
   */
  async completeRequirement(
    statusId: string,
    score: number,
    certificateId?: string
  ): Promise<void> {
    try {
      // Get the requirement to calculate expiry
      const { data: status, error: fetchError } = await supabase
        .from('user_compliance_status')
        .select(`
          *,
          requirement:compliance_requirements(renewal_period_days)
        `)
        .eq('id', statusId)
        .single();

      if (fetchError) throw fetchError;

      const renewalDays = status.requirement?.renewal_period_days || 365;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + renewalDays);

      const { error } = await supabase
        .from('user_compliance_status')
        .update({
          status: 'completed',
          score,
          completed_date: new Date().toISOString(),
          expiry_date: expiryDate.toISOString(),
          certificate_id: certificateId,
          attempts: (status.attempts || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', statusId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error completing requirement:', error);
      throw error;
    }
  }

  /**
   * Grant exemption
   */
  async grantExemption(
    statusId: string,
    reason: string,
    exemptedBy: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_compliance_status')
        .update({
          status: 'exempted',
          exemption_reason: reason,
          exempted_by: exemptedBy,
          exemption_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', statusId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error granting exemption:', error);
      throw error;
    }
  }

  // ===== Reminders & Automation =====

  /**
   * Get users due for reminders
   */
  async getReminders(daysAhead: number = 30): Promise<Array<{
    status_id: string;
    user_id: string;
    requirement_id: string;
    requirement_title: string;
    due_date: string;
    days_until_due: number;
    reminder_type: string;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_compliance_reminders', {
        p_days_ahead: daysAhead,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching reminders:', error);
      throw error;
    }
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(
    statusId: string,
    reminderType: '7_day' | '14_day' | '30_day'
  ): Promise<void> {
    try {
      const field = `reminder_${reminderType}_sent`;
      const { error } = await supabase
        .from('user_compliance_status')
        .update({ [field]: true })
        .eq('id', statusId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking reminder sent:', error);
      throw error;
    }
  }

  /**
   * Process expiries and create renewals
   */
  async processExpiries(): Promise<{
    expired_count: number;
    renewals_created: number;
    escalations_sent: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('process_compliance_expiries');
      if (error) throw error;

      return data?.[0] || {
        expired_count: 0,
        renewals_created: 0,
        escalations_sent: 0,
      };
    } catch (error) {
      logger.error('Error processing expiries:', error);
      throw error;
    }
  }

  // ===== Reporting =====

  /**
   * Get compliance summary
   */
  async getSummary(): Promise<ComplianceSummary> {
    try {
      const { data, error } = await supabase.rpc('get_compliance_summary');
      if (error) throw error;

      return data?.[0] || {
        total_requirements: 0,
        total_users: 0,
        compliant_count: 0,
        non_compliant_count: 0,
        overdue_count: 0,
        expiring_soon_count: 0,
        compliance_rate: 0,
      };
    } catch (error) {
      logger.error('Error fetching summary:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<ComplianceReport[]> {
    try {
      const { data, error } = await supabase.rpc('generate_compliance_report', {
        p_start_date: startDate?.toISOString().split('T')[0] || null,
        p_end_date: endDate?.toISOString().split('T')[0] || null,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get audit log
   */
  async getAuditLog(options?: {
    userId?: string;
    requirementId?: string;
    action?: string;
    limit?: number;
  }): Promise<ComplianceAuditLog[]> {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options?.requirementId) {
        query = query.eq('requirement_id', options.requirementId);
      }

      if (options?.action) {
        query = query.eq('action', options.action);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching audit log:', error);
      throw error;
    }
  }

  /**
   * Export compliance data
   */
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const [requirements, report, summary] = await Promise.all([
        this.getRequirements(),
        this.generateReport(),
        this.getSummary(),
      ]);

      const exportData = {
        generated_at: new Date().toISOString(),
        summary,
        requirements,
        report,
      };

      if (format === 'csv') {
        // Convert to CSV format
        const headers = Object.keys(report[0] || {}).join(',');
        const rows = report.map(r => Object.values(r).join(','));
        return [headers, ...rows].join('\n');
      }

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  }

  // ===== Dashboard Summary =====

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<{
    summary: ComplianceSummary;
    requirements: ComplianceRequirement[];
    report: ComplianceReport[];
    recentAudit: ComplianceAuditLog[];
    upcomingReminders: number;
  }> {
    try {
      const [summary, requirements, report, auditLog, reminders] = await Promise.all([
        this.getSummary(),
        this.getRequirements(),
        this.generateReport(),
        this.getAuditLog({ limit: 10 }),
        this.getReminders(30),
      ]);

      return {
        summary,
        requirements,
        report,
        recentAudit: auditLog,
        upcomingReminders: reminders.length,
      };
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export const ComplianceService = new ComplianceServiceClass();
