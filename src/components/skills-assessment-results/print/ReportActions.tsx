/**
 * ReportActions Component
 *
 * Action buttons for Skills Assessment Report
 * Print, Export PDF, and Share functionality
 * Hidden when printing (print:hidden)
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
    <div className="print:hidden flex flex-wrap gap-3 mb-6">
      <Button onClick={onPrint} variant="outline" size="default">
        <FileText className="mr-2 h-4 w-4" />
        Print Report
      </Button>
      <Button onClick={onExportPDF} variant="outline" size="default" disabled={isExportingPDF}>
        {isExportingPDF ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
      </Button>
      <Button onClick={onShare} variant="outline" size="default">
        <Share2 className="mr-2 h-4 w-4" />
        Share Link
      </Button>
    </div>
  );
}
