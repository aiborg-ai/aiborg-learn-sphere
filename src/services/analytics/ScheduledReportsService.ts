/**
 * Scheduled Reports Service
 * Manages automated analytics report generation and delivery
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { ExcelExportService, type ExportOptions } from './ExcelExportService';

export type ReportType = 'overview' | 'performance' | 'goals' | 'full';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type DeliveryMethod = 'email' | 'download';
export type DateRangeType =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'current_month'
  | 'last_month'
  | 'custom';

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_name: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  delivery_method: DeliveryMethod;
  delivery_email?: string;
  include_overview: boolean;
  include_performance: boolean;
  include_goals: boolean;
  include_charts: boolean;
  date_range_type: DateRangeType;
  custom_start_date?: string;
  custom_end_date?: string;
  is_active: boolean;
  next_run_at: string;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportInput {
  report_name: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  delivery_method: DeliveryMethod;
  delivery_email?: string;
  include_overview?: boolean;
  include_performance?: boolean;
  include_goals?: boolean;
  include_charts?: boolean;
  date_range_type?: DateRangeType;
  custom_start_date?: string;
  custom_end_date?: string;
}

export interface UpdateScheduledReportInput extends Partial<CreateScheduledReportInput> {
  is_active?: boolean;
}

export interface ReportExecution {
  id: string;
  scheduled_report_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  file_url?: string;
  file_size_bytes?: number;
  error_message?: string;
  delivered_at?: string;
  delivery_status?: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export class ScheduledReportsService {
  /**
   * Get all scheduled reports for a user
   */
  static async getUserScheduledReports(userId: string): Promise<ScheduledReport[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching scheduled reports:', error);
        return [];
      }

      return data || [];
    } catch (_error) {
      logger.error('Error in getUserScheduledReports:', _error);
      return [];
    }
  }

  /**
   * Create a new scheduled report
   */
  static async createScheduledReport(
    userId: string,
    input: CreateScheduledReportInput
  ): Promise<ScheduledReport | null> {
    try {
      const next_run_at = this.calculateNextRunTime(input.frequency);

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          user_id: userId,
          report_name: input.report_name,
          report_type: input.report_type,
          frequency: input.frequency,
          delivery_method: input.delivery_method,
          delivery_email: input.delivery_email,
          include_overview: input.include_overview ?? true,
          include_performance: input.include_performance ?? true,
          include_goals: input.include_goals ?? true,
          include_charts: input.include_charts ?? false,
          date_range_type: input.date_range_type ?? 'last_30_days',
          custom_start_date: input.custom_start_date,
          custom_end_date: input.custom_end_date,
          is_active: true,
          next_run_at,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating scheduled report:', error);
        throw new Error('Failed to create scheduled report');
      }

      logger.info('Scheduled report created', { reportId: data.id, userId });
      return data;
    } catch (_error) {
      logger.error('Error in createScheduledReport:', _error);
      throw error;
    }
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    userId: string,
    reportId: string,
    input: UpdateScheduledReportInput
  ): Promise<ScheduledReport | null> {
    try {
      const updates: Record<string, unknown> = { ...input };

      // Recalculate next_run_at if frequency changed
      if (input.frequency) {
        updates.next_run_at = this.calculateNextRunTime(input.frequency);
      }

      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', reportId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating scheduled report:', error);
        throw new Error('Failed to update scheduled report');
      }

      logger.info('Scheduled report updated', { reportId, userId });
      return data;
    } catch (_error) {
      logger.error('Error in updateScheduledReport:', _error);
      throw error;
    }
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(userId: string, reportId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting scheduled report:', error);
        throw new Error('Failed to delete scheduled report');
      }

      logger.info('Scheduled report deleted', { reportId, userId });
      return true;
    } catch (_error) {
      logger.error('Error in deleteScheduledReport:', _error);
      throw error;
    }
  }

  /**
   * Toggle scheduled report active status
   */
  static async toggleScheduledReport(
    userId: string,
    reportId: string,
    isActive: boolean
  ): Promise<ScheduledReport | null> {
    return this.updateScheduledReport(userId, reportId, { is_active: isActive });
  }

  /**
   * Get report execution history for a scheduled report
   */
  static async getReportExecutions(
    scheduledReportId: string,
    limit: number = 50
  ): Promise<ReportExecution[]> {
    try {
      const { data, error } = await supabase
        .from('report_executions')
        .select('*')
        .eq('scheduled_report_id', scheduledReportId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching report executions:', error);
        return [];
      }

      return data || [];
    } catch (_error) {
      logger.error('Error in getReportExecutions:', _error);
      return [];
    }
  }

  /**
   * Execute a scheduled report (generate and optionally deliver)
   */
  static async executeScheduledReport(
    scheduledReport: ScheduledReport
  ): Promise<ReportExecution | null> {
    try {
      // Create execution record
      const { data: execution, error: createError } = await supabase
        .from('report_executions')
        .insert({
          scheduled_report_id: scheduledReport.id,
          status: 'processing',
        })
        .select()
        .single();

      if (createError) {
        logger.error('Error creating report execution:', createError);
        return null;
      }

      try {
        // Calculate date range
        const dateRange = this.getDateRangeForReport(scheduledReport);

        // Prepare export options
        const exportOptions: ExportOptions = {
          userId: scheduledReport.user_id,
          dateRange,
          includeOverview: scheduledReport.include_overview,
          includePerformance: scheduledReport.include_performance,
          includeGoals: scheduledReport.include_goals,
          includeCharts: scheduledReport.include_charts,
          fileName: `${scheduledReport.report_name}-${new Date().toISOString().split('T')[0]}`,
        };

        // Generate report
        await ExcelExportService.exportAnalytics(exportOptions);

        // Update execution as completed
        const { data: completedExecution, error: updateError } = await supabase
          .from('report_executions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', execution.id)
          .select()
          .single();

        if (updateError) {
          logger.error('Error updating execution status:', updateError);
          return execution;
        }

        // Update scheduled report's last_run_at and next_run_at
        await supabase
          .from('scheduled_reports')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: this.calculateNextRunTime(scheduledReport.frequency, new Date()),
          })
          .eq('id', scheduledReport.id);

        logger.info('Report execution completed', {
          executionId: execution.id,
          reportId: scheduledReport.id,
        });

        return completedExecution;
      } catch (_error) {
        // Mark execution as failed
        await supabase
          .from('report_executions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', execution.id);

        throw error;
      }
    } catch (_error) {
      logger.error('Error in executeScheduledReport:', _error);
      return null;
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  private static calculateNextRunTime(
    frequency: ReportFrequency,
    fromDate: Date = new Date()
  ): string {
    const baseDate = startOfDay(fromDate);

    switch (frequency) {
      case 'daily':
        return addDays(baseDate, 1).toISOString();
      case 'weekly':
        return addWeeks(baseDate, 1).toISOString();
      case 'monthly':
        return addMonths(baseDate, 1).toISOString();
      case 'quarterly':
        return addMonths(baseDate, 3).toISOString();
      default:
        return addWeeks(baseDate, 1).toISOString();
    }
  }

  /**
   * Get date range for a scheduled report based on date_range_type
   */
  private static getDateRangeForReport(report: ScheduledReport): {
    start: string;
    end: string;
  } {
    const now = new Date();

    switch (report.date_range_type) {
      case 'last_7_days':
        return {
          start: startOfDay(subDays(now, 7)).toISOString(),
          end: endOfDay(now).toISOString(),
        };
      case 'last_30_days':
        return {
          start: startOfDay(subDays(now, 30)).toISOString(),
          end: endOfDay(now).toISOString(),
        };
      case 'last_90_days':
        return {
          start: startOfDay(subDays(now, 90)).toISOString(),
          end: endOfDay(now).toISOString(),
        };
      case 'current_month':
        return {
          start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)).toISOString(),
          end: endOfDay(now).toISOString(),
        };
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfDay(
            new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
          ).toISOString(),
          end: endOfDay(
            new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
          ).toISOString(),
        };
      }
      case 'custom':
        return {
          start: report.custom_start_date || startOfDay(subDays(now, 30)).toISOString(),
          end: report.custom_end_date || endOfDay(now).toISOString(),
        };
      default:
        return {
          start: startOfDay(subDays(now, 30)).toISOString(),
          end: endOfDay(now).toISOString(),
        };
    }
  }

  /**
   * Get reports that are due for execution
   */
  static async getReportsDueForExecution(): Promise<ScheduledReport[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('is_active', true)
        .lte('next_run_at', new Date().toISOString())
        .order('next_run_at', { ascending: true });

      if (error) {
        logger.error('Error fetching due reports:', error);
        return [];
      }

      return data || [];
    } catch (_error) {
      logger.error('Error in getReportsDueForExecution:', _error);
      return [];
    }
  }
}
