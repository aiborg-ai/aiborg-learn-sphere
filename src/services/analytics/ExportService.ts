/**
 * Export Service
 * Provides PDF and CSV export functionality for analytics data
 */

import { exportAnalyticsToPDF, exportSingleAnalyticsToPDF, AnalyticsSection, DateRange } from '@/utils/pdfExport';
import { exportToCSV, sanitizeForCsv } from '@/utils/export/csvExport';
import { logger } from '@/utils/logger';

export interface ExportConfig {
  filename: string;
  dateRange?: DateRange;
  metadata?: Record<string, string>;
}

export interface ExportValidationResult {
  valid: boolean;
  rowCount: number;
  message?: string;
}

export class ExportService {
  /**
   * Maximum number of rows allowed for CSV export
   */
  private static readonly MAX_CSV_ROWS = 50000;

  /**
   * Export analytics data to PDF format
   * @param sections - Array of analytics sections to include in PDF
   * @param config - Export configuration with filename and date range
   */
  static async exportToPDF(
    sections: AnalyticsSection[],
    config: ExportConfig
  ): Promise<void> {
    try {
      // Validate sections
      if (!sections || sections.length === 0) {
        throw new Error('No sections provided for PDF export');
      }

      // Validate filename
      if (!config.filename) {
        throw new Error('Filename is required for PDF export');
      }

      // Ensure filename has .pdf extension
      const filename = config.filename.endsWith('.pdf')
        ? config.filename
        : `${config.filename}.pdf`;

      // Call the PDF export utility
      await exportAnalyticsToPDF(sections, config.dateRange, filename);

      logger.info('PDF export completed', {
        filename,
        sectionCount: sections.length,
        dateRange: config.dateRange,
      });
    } catch (error) {
      logger.error('Error exporting to PDF:', error);
      throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export a single analytics section to PDF
   * @param section - Single analytics section to export
   * @param config - Export configuration with filename and date range
   */
  static async exportSingleToPDF(
    section: AnalyticsSection,
    config: ExportConfig
  ): Promise<void> {
    try {
      // Validate section
      if (!section) {
        throw new Error('No section provided for PDF export');
      }

      // Validate filename
      if (!config.filename) {
        throw new Error('Filename is required for PDF export');
      }

      // Ensure filename has .pdf extension
      const filename = config.filename.endsWith('.pdf')
        ? config.filename
        : `${config.filename}.pdf`;

      // Call the single section PDF export utility
      await exportSingleAnalyticsToPDF(section, config.dateRange, filename);

      logger.info('Single section PDF export completed', {
        filename,
        sectionTitle: section.title,
        dateRange: config.dateRange,
      });
    } catch (error) {
      logger.error('Error exporting single section to PDF:', error);
      throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export data to CSV format
   * @param data - Array of data objects to export
   * @param config - Export configuration with filename and optional metadata
   * @param headers - Optional custom headers for CSV columns
   */
  static async exportToCSV<T extends Record<string, any>>(
    data: T[],
    config: ExportConfig,
    headers?: string[]
  ): Promise<void> {
    try {
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data provided for CSV export');
      }

      // Validate filename
      if (!config.filename) {
        throw new Error('Filename is required for CSV export');
      }

      // Validate export size
      const validation = this.validateExportSize(data);
      if (!validation.valid) {
        throw new Error(validation.message || 'Data exceeds maximum export size');
      }

      // Ensure filename has .csv extension
      const filename = config.filename.endsWith('.csv')
        ? config.filename
        : `${config.filename}.csv`;

      // Sanitize data
      const sanitizedData = data.map(row => sanitizeForCsv(row));

      // Add metadata if provided
      if (config.metadata) {
        const metadataHeader = Object.entries(config.metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        // Export with metadata
        await exportToCSV(sanitizedData, filename, headers, metadataHeader);
      } else {
        // Export without metadata
        await exportToCSV(sanitizedData, filename, headers);
      }

      logger.info('CSV export completed', {
        filename,
        rowCount: data.length,
        columnCount: headers?.length || Object.keys(data[0]).length,
      });
    } catch (error) {
      logger.error('Error exporting to CSV:', error);
      throw new Error(`Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate export data size against maximum row limit
   * @param data - Array of data to validate
   * @returns Validation result with row count and validity status
   */
  static validateExportSize<T>(data: T[]): ExportValidationResult {
    const rowCount = data?.length || 0;

    if (rowCount === 0) {
      return {
        valid: false,
        rowCount: 0,
        message: 'No data available for export',
      };
    }

    if (rowCount > this.MAX_CSV_ROWS) {
      return {
        valid: false,
        rowCount,
        message: `Data exceeds maximum export limit of ${this.MAX_CSV_ROWS.toLocaleString()} rows. Current data has ${rowCount.toLocaleString()} rows.`,
      };
    }

    return {
      valid: true,
      rowCount,
      message: `Export size is valid (${rowCount.toLocaleString()} rows)`,
    };
  }

  /**
   * Get human-readable file size estimate for export
   * @param rowCount - Number of rows
   * @param avgBytesPerRow - Average bytes per row (default: 200)
   * @returns Formatted file size string
   */
  static estimateExportSize(rowCount: number, avgBytesPerRow: number = 200): string {
    const bytes = rowCount * avgBytesPerRow;

    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Generate default filename with timestamp
   * @param prefix - Filename prefix (e.g., 'analytics', 'revenue')
   * @param extension - File extension (pdf or csv)
   * @returns Timestamped filename
   */
  static generateFilename(prefix: string, extension: 'pdf' | 'csv'): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${prefix}_${timestamp}.${extension}`;
  }

  /**
   * Generate filename with date range
   * @param prefix - Filename prefix
   * @param dateRange - Date range object
   * @param extension - File extension
   * @returns Filename with date range
   */
  static generateFilenameWithRange(
    prefix: string,
    dateRange: DateRange,
    extension: 'pdf' | 'csv'
  ): string {
    const start = dateRange.start.split('T')[0];
    const end = dateRange.end.split('T')[0];
    return `${prefix}_${start}_to_${end}.${extension}`;
  }
}
