/**
 * Enhanced CSV Export Service
 * Advanced CSV export with bulk operations, templates, and flexible formatting
 */

import { logger } from '@/utils/logger';
import { arrayToCsv, formatDateForCsv, formatNumberForCsv } from '@/utils/export/csvExport';

export interface CSVTemplate {
  name: string;
  columns: Array<{
    key: string;
    label: string;
    format?: 'date' | 'number' | 'currency' | 'percentage' | 'text';
    decimals?: number;
  }>;
  includeMetadata: boolean;
  includeSummaryRow: boolean;
  dateFormat: 'iso' | 'us' | 'eu';
}

export interface CSVExportConfig {
  data: Array<Record<string, unknown>>;
  template?: CSVTemplate;
  filename: string;
  metadata?: Record<string, string>;
  dateRange?: { startDate: Date | null; endDate: Date | null };
}

export interface BulkExportConfig {
  exports: Array<{
    name: string;
    data: Array<Record<string, unknown>>;
    template?: CSVTemplate;
  }>;
  zipFilename: string;
  metadata?: Record<string, string>;
}

export const DEFAULT_TEMPLATES: Record<string, CSVTemplate> = {
  learnerPerformance: {
    name: 'Learner Performance',
    columns: [
      { key: 'user_id', label: 'User ID', format: 'text' },
      { key: 'full_name', label: 'Full Name', format: 'text' },
      { key: 'department', label: 'Department', format: 'text' },
      { key: 'total_enrollments', label: 'Total Courses', format: 'number', decimals: 0 },
      { key: 'completed_courses', label: 'Completed', format: 'number', decimals: 0 },
      {
        key: 'avg_progress_percentage',
        label: 'Avg Progress %',
        format: 'percentage',
        decimals: 1,
      },
      { key: 'avg_assignment_score', label: 'Avg Score %', format: 'percentage', decimals: 1 },
      {
        key: 'total_time_spent_minutes',
        label: 'Time Spent (hours)',
        format: 'number',
        decimals: 1,
      },
      { key: 'learner_status', label: 'Status', format: 'text' },
      { key: 'last_active_date', label: 'Last Active', format: 'date' },
    ],
    includeMetadata: true,
    includeSummaryRow: true,
    dateFormat: 'iso',
  },
  coursePerformance: {
    name: 'Course Performance',
    columns: [
      { key: 'course_id', label: 'Course ID', format: 'number', decimals: 0 },
      { key: 'course_title', label: 'Course Title', format: 'text' },
      { key: 'progress_percentage', label: 'Progress %', format: 'percentage', decimals: 1 },
      { key: 'time_spent_minutes', label: 'Time Spent (hours)', format: 'number', decimals: 1 },
      { key: 'engagement_score', label: 'Engagement Score', format: 'number', decimals: 0 },
      { key: 'assignments_completed', label: 'Assignments Done', format: 'number', decimals: 0 },
      { key: 'assignments_total', label: 'Total Assignments', format: 'number', decimals: 0 },
      { key: 'enrollment_date', label: 'Enrolled On', format: 'date' },
      { key: 'completion_date', label: 'Completed On', format: 'date' },
    ],
    includeMetadata: true,
    includeSummaryRow: false,
    dateFormat: 'iso',
  },
  chatbotSessions: {
    name: 'Chatbot Sessions',
    columns: [
      { key: 'session_id', label: 'Session ID', format: 'text' },
      { key: 'user_id', label: 'User ID', format: 'text' },
      { key: 'session_start', label: 'Start Time', format: 'date' },
      { key: 'session_end', label: 'End Time', format: 'date' },
      { key: 'duration_seconds', label: 'Duration (min)', format: 'number', decimals: 1 },
      { key: 'message_count', label: 'Messages', format: 'number', decimals: 0 },
      { key: 'total_tokens', label: 'Tokens Used', format: 'number', decimals: 0 },
      { key: 'total_cost', label: 'Cost', format: 'currency', decimals: 4 },
      { key: 'device_type', label: 'Device', format: 'text' },
    ],
    includeMetadata: true,
    includeSummaryRow: true,
    dateFormat: 'iso',
  },
  atRiskLearners: {
    name: 'At-Risk Learners',
    columns: [
      { key: 'user_id', label: 'User ID', format: 'text' },
      { key: 'full_name', label: 'Full Name', format: 'text' },
      { key: 'department', label: 'Department', format: 'text' },
      { key: 'risk_score', label: 'Risk Score', format: 'number', decimals: 0 },
      { key: 'learner_status', label: 'Status', format: 'text' },
      { key: 'days_inactive', label: 'Days Inactive', format: 'number', decimals: 0 },
      { key: 'avg_progress_percentage', label: 'Progress %', format: 'percentage', decimals: 1 },
      { key: 'recommended_action', label: 'Recommended Action', format: 'text' },
      { key: 'last_active_date', label: 'Last Active', format: 'date' },
    ],
    includeMetadata: true,
    includeSummaryRow: false,
    dateFormat: 'iso',
  },
  aggregatedPerformance: {
    name: 'Aggregated Performance Report',
    columns: [
      { key: 'courseTitle', label: 'Course', format: 'text' },
      { key: 'studentCount', label: 'Students', format: 'number', decimals: 0 },
      { key: 'avgProgress', label: 'Avg Progress %', format: 'percentage', decimals: 1 },
      { key: 'avgScore', label: 'Avg Score %', format: 'percentage', decimals: 1 },
      { key: 'completionRate', label: 'Completion Rate %', format: 'percentage', decimals: 1 },
      { key: 'avgEngagement', label: 'Avg Engagement', format: 'number', decimals: 0 },
      { key: 'avgTimeSpent', label: 'Avg Time (hours)', format: 'number', decimals: 1 },
      { key: 'atRiskCount', label: 'At-Risk Students', format: 'number', decimals: 0 },
    ],
    includeMetadata: true,
    includeSummaryRow: true,
    dateFormat: 'iso',
  },
};

export class EnhancedCSVExportService {
  private static readonly MAX_ROWS = 50000;

  /**
   * Export data to CSV with template
   */
  static async exportToCSV(config: CSVExportConfig): Promise<void> {
    try {
      logger.info('Starting enhanced CSV export', {
        filename: config.filename,
        rowCount: config.data.length,
        template: config.template?.name,
      });

      // Validate data
      if (!config.data || config.data.length === 0) {
        throw new Error('No data provided for export');
      }

      if (config.data.length > this.MAX_ROWS) {
        throw new Error(
          `Data exceeds maximum export limit of ${this.MAX_ROWS.toLocaleString()} rows`
        );
      }

      // Format data according to template
      let formattedData = config.data;
      let headers: string[] | undefined;

      if (config.template) {
        const result = this.applyTemplate(config.data, config.template);
        formattedData = result.data;
        headers = result.headers;
      }

      // Build CSV content
      let csvContent = '';

      // Add metadata if included
      if (config.template?.includeMetadata && config.metadata) {
        csvContent += this.buildMetadataSection(config.metadata, config.dateRange);
        csvContent += '\n\n';
      }

      // Add data
      csvContent += arrayToCsv(formattedData, headers);

      // Add summary row if enabled
      if (config.template?.includeSummaryRow) {
        csvContent += '\n';
        csvContent += this.buildSummaryRow(formattedData, config.template);
      }

      // Download file
      this.downloadCSV(csvContent, config.filename);

      logger.info('Enhanced CSV export completed', { filename: config.filename });
    } catch (_error) {
      logger.error('Error in enhanced CSV export:', _error);
      throw error;
    }
  }

  /**
   * Export multiple datasets as separate CSV files in a ZIP
   */
  static async exportBulk(config: BulkExportConfig): Promise<void> {
    try {
      logger.info('Starting bulk CSV export', {
        zipFilename: config.zipFilename,
        exportCount: config.exports.length,
      });

      // Import JSZip dynamically
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      // Add metadata file if provided
      if (config.metadata) {
        const metadataContent = this.buildMetadataSection(config.metadata);
        zip.file('export_metadata.txt', metadataContent);
      }

      // Process each export
      for (const exportItem of config.exports) {
        if (!exportItem.data || exportItem.data.length === 0) {
          logger.warn(`Skipping empty export: ${exportItem.name}`);
          continue;
        }

        let formattedData = exportItem.data;
        let headers: string[] | undefined;

        if (exportItem.template) {
          const result = this.applyTemplate(exportItem.data, exportItem.template);
          formattedData = result.data;
          headers = result.headers;
        }

        // Build CSV content
        let csvContent = arrayToCsv(formattedData, headers);

        if (exportItem.template?.includeSummaryRow) {
          csvContent += '\n';
          csvContent += this.buildSummaryRow(formattedData, exportItem.template);
        }

        // Add UTF-8 BOM
        const bom = '\uFEFF';
        const csvWithBom = bom + csvContent;

        // Add to ZIP
        const filename = exportItem.name.endsWith('.csv')
          ? exportItem.name
          : `${exportItem.name}.csv`;
        zip.file(filename, csvWithBom);
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        config.zipFilename.endsWith('.zip') ? config.zipFilename : `${config.zipFilename}.zip`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('Bulk CSV export completed', { zipFilename: config.zipFilename });
    } catch (_error) {
      logger.error('Error in bulk CSV export:', _error);
      throw error;
    }
  }

  /**
   * Apply template to data
   */
  private static applyTemplate(
    data: Array<Record<string, unknown>>,
    template: CSVTemplate
  ): { data: Array<Record<string, unknown>>; headers: string[] } {
    const headers = template.columns.map(col => col.label);

    const formattedData = data.map(row => {
      const formatted: Record<string, unknown> = {};

      for (const col of template.columns) {
        const value = row[col.key];

        if (value === null || value === undefined) {
          formatted[col.label] = '';
          continue;
        }

        switch (col.format) {
          case 'date':
            formatted[col.label] = this.formatDate(value, template.dateFormat);
            break;
          case 'number':
            formatted[col.label] = formatNumberForCsv(value, col.decimals ?? 2);
            break;
          case 'currency':
            formatted[col.label] = '$' + formatNumberForCsv(value, col.decimals ?? 2);
            break;
          case 'percentage':
            formatted[col.label] = formatNumberForCsv(value, col.decimals ?? 1) + '%';
            break;
          case 'text':
          default:
            formatted[col.label] = value;
            break;
        }
      }

      return formatted;
    });

    return { data: formattedData, headers };
  }

  /**
   * Build metadata section for CSV
   */
  private static buildMetadataSection(
    metadata: Record<string, string>,
    dateRange?: { startDate: Date | null; endDate: Date | null }
  ): string {
    const lines: string[] = [];

    // Add export info
    lines.push(`Export Type,${metadata.exportType || 'Analytics Data'}`);
    lines.push(`Generated,${new Date().toLocaleString()}`);

    // Add date range if provided
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      lines.push(
        `Date Range,${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
      );
    }

    // Add custom metadata
    for (const [key, value] of Object.entries(metadata)) {
      if (key !== 'exportType') {
        lines.push(`${key},${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Build summary row for numeric columns
   */
  private static buildSummaryRow(
    data: Array<Record<string, unknown>>,
    template: CSVTemplate
  ): string {
    const summaryValues: unknown[] = [];

    for (let i = 0; i < template.columns.length; i++) {
      const col = template.columns[i];

      if (i === 0) {
        // First column: "TOTAL" or "SUMMARY"
        summaryValues.push('SUMMARY');
      } else if (
        col.format === 'number' ||
        col.format === 'currency' ||
        col.format === 'percentage'
      ) {
        // Calculate sum or average for numeric columns
        const values = data
          .map(row => row[col.label])
          .filter(v => v !== null && v !== undefined && v !== '');

        if (values.length > 0) {
          const sum = values.reduce((acc, v) => {
            const num = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.-]/g, '')) : v;
            return acc + (isNaN(num) ? 0 : num);
          }, 0);

          const avg = sum / values.length;

          // Use average for percentages, sum for others
          const result = col.format === 'percentage' ? avg : sum;
          const formatted = formatNumberForCsv(result, col.decimals ?? 2);

          summaryValues.push(
            col.format === 'currency'
              ? `$${formatted}`
              : col.format === 'percentage'
                ? `${formatted}%`
                : formatted
          );
        } else {
          summaryValues.push('');
        }
      } else {
        // Non-numeric columns: leave empty
        summaryValues.push('');
      }
    }

    return summaryValues
      .map(v => {
        const str = String(v);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',');
  }

  /**
   * Format date according to template
   */
  private static formatDate(value: unknown, format: 'iso' | 'us' | 'eu'): string {
    const date = typeof value === 'string' ? new Date(value) : value;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    switch (format) {
      case 'us':
        return date.toLocaleDateString('en-US');
      case 'eu':
        return date.toLocaleDateString('en-GB');
      case 'iso':
      default:
        return formatDateForCsv(date);
    }
  }

  /**
   * Download CSV file
   */
  private static downloadCSV(content: string, filename: string): void {
    const bom = '\uFEFF';
    const csvWithBom = bom + content;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(
    prefix: string,
    dateRange?: { startDate: Date | null; endDate: Date | null }
  ): string {
    const date = new Date().toISOString().split('T')[0];
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const start = dateRange.startDate.toISOString().split('T')[0];
      const end = dateRange.endDate.toISOString().split('T')[0];
      return `${prefix}_${start}_to_${end}.csv`;
    }
    return `${prefix}_${date}.csv`;
  }

  /**
   * Validate export size
   */
  static validateExportSize(rowCount: number): { valid: boolean; message?: string } {
    if (rowCount === 0) {
      return { valid: false, message: 'No data available for export' };
    }

    if (rowCount > this.MAX_ROWS) {
      return {
        valid: false,
        message: `Data exceeds maximum export limit of ${this.MAX_ROWS.toLocaleString()} rows. Current data has ${rowCount.toLocaleString()} rows.`,
      };
    }

    return { valid: true };
  }
}
