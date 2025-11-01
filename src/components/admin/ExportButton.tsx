/**
 * ExportButton Component
 * Export data to PDF or CSV formats
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useExport, generateExportFilename } from '@/hooks/useExport';
import { Download, FileText, Table } from 'lucide-react';
import type { AnalyticsSection, DateRange } from '@/utils/pdfExport';

export interface ExportButtonProps {
  section?: string;
  sections?: AnalyticsSection[];
  data?: any[];
  dateRange?: DateRange;
  headers?: string[];
  metadata?: Record<string, string>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * ExportButton component for exporting analytics data
 *
 * Features:
 * - Dropdown menu: "Export to PDF" / "Export to CSV"
 * - Progress indicator for large exports
 * - Error handling with toast notifications
 * - Automatic filename generation
 * - Support for single section or multiple sections
 *
 * @example
 * ```tsx
 * <ExportButton
 *   section="Revenue Analytics"
 *   sections={[revenueSection]}
 *   data={revenueData}
 *   dateRange={{ start: '2025-01-01', end: '2025-01-31' }}
 * />
 * ```
 */
export function ExportButton({
  section = 'analytics',
  sections,
  data,
  dateRange,
  headers,
  metadata,
  variant = 'outline',
  size = 'default',
  className,
}: ExportButtonProps) {
  const { exportPDF, exportCSV, state } = useExport();
  const [isOpen, setIsOpen] = React.useState(false);

  /**
   * Handle PDF export
   */
  const handleExportPDF = async () => {
    if (!sections || sections.length === 0) {
      return;
    }

    const filename = generateExportFilename(
      section.toLowerCase().replace(/\s+/g, '-'),
      'pdf'
    );

    await exportPDF(sections, filename, dateRange);
    setIsOpen(false);
  };

  /**
   * Handle CSV export
   */
  const handleExportCSV = async () => {
    if (!data || data.length === 0) {
      return;
    }

    const filename = generateExportFilename(
      section.toLowerCase().replace(/\s+/g, '-'),
      'csv'
    );

    await exportCSV(data, filename, headers, metadata);
    setIsOpen(false);
  };

  const canExportPDF = sections && sections.length > 0;
  const canExportCSV = data && data.length > 0;
  const isExporting = state.isExporting;

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isExporting || (!canExportPDF && !canExportCSV)}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* PDF Export */}
          <DropdownMenuItem
            onClick={handleExportPDF}
            disabled={!canExportPDF || isExporting}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Export to PDF</span>
          </DropdownMenuItem>

          {/* CSV Export */}
          <DropdownMenuItem
            onClick={handleExportCSV}
            disabled={!canExportCSV || isExporting}
            className="cursor-pointer"
          >
            <Table className="mr-2 h-4 w-4" />
            <span>Export to CSV</span>
          </DropdownMenuItem>

          {/* Information */}
          {data && data.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {data.length.toLocaleString()} rows
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Progress Indicator */}
      {isExporting && state.progress > 0 && (
        <div className="absolute -bottom-8 left-0 right-0 w-full">
          <Progress value={state.progress} className="h-1" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            {state.progress}% complete
          </p>
        </div>
      )}

      {/* Error Display */}
      {state.error && !isExporting && (
        <div className="absolute -bottom-8 left-0 right-0 w-full">
          <p className="text-xs text-destructive text-center">{state.error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact export button without dropdown (single format)
 */
export interface CompactExportButtonProps {
  format: 'pdf' | 'csv';
  section?: string;
  sections?: AnalyticsSection[];
  data?: any[];
  dateRange?: DateRange;
  headers?: string[];
  metadata?: Record<string, string>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function CompactExportButton({
  format,
  section = 'analytics',
  sections,
  data,
  dateRange,
  headers,
  metadata,
  variant = 'ghost',
  size = 'sm',
  className,
}: CompactExportButtonProps) {
  const { exportPDF, exportCSV, state } = useExport();

  const handleExport = async () => {
    const filename = generateExportFilename(
      section.toLowerCase().replace(/\s+/g, '-'),
      format
    );

    if (format === 'pdf' && sections && sections.length > 0) {
      await exportPDF(sections, filename, dateRange);
    } else if (format === 'csv' && data && data.length > 0) {
      await exportCSV(data, filename, headers, metadata);
    }
  };

  const canExport =
    (format === 'pdf' && sections && sections.length > 0) ||
    (format === 'csv' && data && data.length > 0);

  const icon = format === 'pdf' ? <FileText className="h-4 w-4" /> : <Table className="h-4 w-4" />;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={!canExport || state.isExporting}
      className={className}
      title={`Export to ${format.toUpperCase()}`}
    >
      {state.isExporting ? <span className="animate-spin">⏳</span> : icon}
    </Button>
  );
}
