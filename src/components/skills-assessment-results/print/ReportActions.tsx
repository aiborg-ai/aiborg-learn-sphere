/**
 * ReportActions Component
 * Action buttons for Skills Assessment Report
 * Print, Export PDF, and Share functionality
 * Hidden when printing
 */

import { Button } from '@/components/ui/button';
import { FileText, Download, Share2, Loader2 } from '@/components/ui/icons';

interface ReportActionsProps {
  onPrint: () => void;
  onExportPDF: () => void;
  onShare: () => void;
  isExportingPDF: boolean;
}

export function ReportActions({
  onPrint,
  onExportPDF,
  onShare,
  isExportingPDF,
}: ReportActionsProps) {
  return (
    <div className="print:hidden flex flex-wrap gap-4 mb-6">
      <Button onClick={onPrint} variant="outline" className="gap-2">
        <FileText className="h-4 w-4" />
        Print
      </Button>

      <Button onClick={onExportPDF} variant="outline" disabled={isExportingPDF} className="gap-2">
        {isExportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
      </Button>

      <Button onClick={onShare} variant="outline" className="gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
