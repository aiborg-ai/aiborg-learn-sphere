import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, FileText, Download, Building2, Loader2 } from 'lucide-react';
import type { ReportHeaderProps } from './types';

export function ReportHeader({
  companyName,
  onShare,
  onPrint,
  onExportPDF,
  isExportingPDF,
}: ReportHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-8 print:hidden">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Opportunity Assessment Report</h1>
            <p className="text-muted-foreground">{companyName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={onPrint}>
            <FileText className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={onExportPDF} disabled={isExportingPDF}>
            {isExportingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
