/**
 * Export Button Component
 * Provides UI for exporting analytics data to Excel or CSV
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from '@/components/ui/icons';
import { ExcelExportService, type ExportOptions } from '@/services/analytics/ExcelExportService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ExportButtonProps {
  userId: string;
  dateRange?: {
    start: string;
    end: string;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({ userId, dateRange, variant = 'outline', size = 'default' }: ExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includePerformance, setIncludePerformance] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      const options: ExportOptions = {
        userId,
        dateRange,
        includeOverview,
        includePerformance,
        includeGoals,
      };

      await ExcelExportService.exportAnalytics(options);

      toast({
        title: 'Export Successful',
        description: 'Your analytics have been exported to Excel.',
      });
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPerformanceCSV = async () => {
    try {
      setIsExporting(true);
      await ExcelExportService.exportPerformanceSummaryCSV(userId);

      toast({
        title: 'Export Successful',
        description: 'Performance summary exported to CSV.',
      });
    } catch (error) {
      logger.error('Error exporting performance CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export performance data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGoalsCSV = async () => {
    try {
      setIsExporting(true);
      await ExcelExportService.exportGoalsSummaryCSV(userId);

      toast({
        title: 'Export Successful',
        description: 'Goals summary exported to CSV.',
      });
    } catch (error) {
      logger.error('Error exporting goals CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export goals data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Excel Export with Customization */}
        <div className="px-2 py-2">
          <div className="text-sm font-medium mb-2">Full Excel Export</div>
          <div className="space-y-1 ml-2">
            <DropdownMenuCheckboxItem
              checked={includeOverview}
              onCheckedChange={setIncludeOverview}
              className="text-xs"
            >
              Include Overview
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={includePerformance}
              onCheckedChange={setIncludePerformance}
              className="text-xs"
            >
              Include Performance
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={includeGoals}
              onCheckedChange={setIncludeGoals}
              className="text-xs"
            >
              Include Goals
            </DropdownMenuCheckboxItem>
          </div>
          <Button
            onClick={handleExportExcel}
            disabled={isExporting || (!includeOverview && !includePerformance && !includeGoals)}
            size="sm"
            className="w-full mt-2"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        <DropdownMenuSeparator />

        {/* Quick CSV Exports */}
        <DropdownMenuLabel className="text-xs">Quick CSV Exports</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleExportPerformanceCSV} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Performance Summary (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportGoalsCSV} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Goals Summary (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
