/**
 * useExport Hook
 * Manages data export to PDF and CSV formats
 */

import { useState, useCallback } from 'react';
import { ExportService, type ExportConfig } from '@/services/analytics/ExportService';
import type { AnalyticsSection, DateRange } from '@/utils/pdfExport';
import { logger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

export interface ExportState {
  isExporting: boolean;
  progress: number; // 0-100
  error: string | null;
}

export interface UseExportReturn {
  exportPDF: (sections: AnalyticsSection[], filename: string, dateRange?: DateRange) => Promise<void>;
  exportSinglePDF: (section: AnalyticsSection, filename: string, dateRange?: DateRange) => Promise<void>;
  exportCSV: <T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers?: string[],
    metadata?: Record<string, string>
  ) => Promise<void>;
  state: ExportState;
  reset: () => void;
}

/**
 * Hook for managing data export to PDF and CSV formats
 *
 * Features:
 * - Export to PDF (single or multiple sections)
 * - Export to CSV with validation
 * - Progress tracking for large exports
 * - Error handling with user notifications
 * - Size validation before export
 *
 * @example
 * ```tsx
 * const { exportPDF, exportCSV, state } = useExport();
 *
 * // Export to PDF
 * await exportPDF(sections, 'analytics-report', {
 *   start: '2025-01-01',
 *   end: '2025-01-31'
 * });
 *
 * // Export to CSV
 * await exportCSV(data, 'revenue-data', ['Date', 'Amount', 'Source']);
 *
 * // Check progress
 * console.log(state.progress); // 0-100
 * ```
 *
 * @returns Export functions and state
 */
export function useExport(): UseExportReturn {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
  });

  /**
   * Reset export state
   */
  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      error: null,
    });
  }, []);

  /**
   * Update progress (0-100)
   */
  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
  }, []);

  /**
   * Export analytics data to PDF (multiple sections)
   */
  const exportPDF = useCallback(
    async (
      sections: AnalyticsSection[],
      filename: string,
      dateRange?: DateRange
    ): Promise<void> => {
      try {
        setState({
          isExporting: true,
          progress: 0,
          error: null,
        });

        logger.info('Starting PDF export', { filename, sectionCount: sections.length });

        // Validate sections
        if (!sections || sections.length === 0) {
          throw new Error('No sections provided for export');
        }

        setProgress(10);

        const config: ExportConfig = {
          filename,
          dateRange,
        };

        setProgress(30);

        await ExportService.exportToPDF(sections, config);

        setProgress(100);

        toast({
          title: 'Export Successful',
          description: `PDF exported successfully as ${filename}`,
        });

        logger.info('PDF export completed', { filename });

        // Reset after a brief delay
        setTimeout(reset, 1000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('PDF export failed:', error);

        setState({
          isExporting: false,
          progress: 0,
          error: errorMessage,
        });

        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: errorMessage,
        });

        throw error;
      }
    },
    [reset, setProgress]
  );

  /**
   * Export single analytics section to PDF
   */
  const exportSinglePDF = useCallback(
    async (
      section: AnalyticsSection,
      filename: string,
      dateRange?: DateRange
    ): Promise<void> => {
      try {
        setState({
          isExporting: true,
          progress: 0,
          error: null,
        });

        logger.info('Starting single section PDF export', { filename, sectionTitle: section.title });

        // Validate section
        if (!section) {
          throw new Error('No section provided for export');
        }

        setProgress(10);

        const config: ExportConfig = {
          filename,
          dateRange,
        };

        setProgress(30);

        await ExportService.exportSingleToPDF(section, config);

        setProgress(100);

        toast({
          title: 'Export Successful',
          description: `Section exported successfully as ${filename}`,
        });

        logger.info('Single section PDF export completed', { filename });

        // Reset after a brief delay
        setTimeout(reset, 1000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Single section PDF export failed:', error);

        setState({
          isExporting: false,
          progress: 0,
          error: errorMessage,
        });

        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: errorMessage,
        });

        throw error;
      }
    },
    [reset, setProgress]
  );

  /**
   * Export data to CSV format
   */
  const exportCSV = useCallback(
    async <T extends Record<string, any>>(
      data: T[],
      filename: string,
      headers?: string[],
      metadata?: Record<string, string>
    ): Promise<void> => {
      try {
        setState({
          isExporting: true,
          progress: 0,
          error: null,
        });

        logger.info('Starting CSV export', { filename, rowCount: data.length });

        // Validate data
        if (!data || data.length === 0) {
          throw new Error('No data provided for export');
        }

        setProgress(10);

        // Validate export size
        const validation = ExportService.validateExportSize(data);
        if (!validation.valid) {
          throw new Error(validation.message || 'Data exceeds maximum export size');
        }

        setProgress(30);

        const config: ExportConfig = {
          filename,
          metadata,
        };

        setProgress(50);

        await ExportService.exportToCSV(data, config, headers);

        setProgress(100);

        const sizeEstimate = ExportService.estimateExportSize(data.length);

        toast({
          title: 'Export Successful',
          description: `${data.length.toLocaleString()} rows exported successfully as ${filename} (~${sizeEstimate})`,
        });

        logger.info('CSV export completed', { filename, rowCount: data.length });

        // Reset after a brief delay
        setTimeout(reset, 1000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('CSV export failed:', error);

        setState({
          isExporting: false,
          progress: 0,
          error: errorMessage,
        });

        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: errorMessage,
        });

        throw error;
      }
    },
    [reset, setProgress]
  );

  return {
    exportPDF,
    exportSinglePDF,
    exportCSV,
    state,
    reset,
  };
}

/**
 * Generate filename with current date
 */
export function generateExportFilename(prefix: string, extension: 'pdf' | 'csv'): string {
  return ExportService.generateFilename(prefix, extension);
}

/**
 * Generate filename with date range
 */
export function generateExportFilenameWithRange(
  prefix: string,
  dateRange: DateRange,
  extension: 'pdf' | 'csv'
): string {
  return ExportService.generateFilenameWithRange(prefix, dateRange, extension);
}
