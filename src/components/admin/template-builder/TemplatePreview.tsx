import React from 'react';
import { Copy, Download, Eye } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TemplateType } from './types';

interface TemplatePreviewProps {
  formData: Record<string, unknown>;
  templateType: TemplateType;
  showPreview: boolean;
  onShowPreviewChange: (show: boolean) => void;
  onCopyJSON: () => void;
  onExportJSON: () => void;
}

export function TemplatePreview({
  formData,
  templateType,
  showPreview,
  onShowPreviewChange,
  onCopyJSON,
  onExportJSON,
}: TemplatePreviewProps) {
  const getPreviewData = () => {
    return templateType === 'course' ? { courses: [formData] } : { events: [formData] };
  };

  return (
    <Dialog open={showPreview} onOpenChange={onShowPreviewChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
          <DialogDescription>JSON representation of your template</DialogDescription>
        </DialogHeader>
        <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(getPreviewData(), null, 2)}
        </pre>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCopyJSON}>
            <Copy className="h-4 w-4 mr-2" />
            Copy JSON
          </Button>
          <Button onClick={onExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
