import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Download, RefreshCw, ChevronRight } from 'lucide-react';

interface ActionButtonsProps {
  onShare: () => void;
  onDownload: () => void;
  onRetake: () => void;
  onBrowse: () => void;
}

export function ActionButtons({ onShare, onDownload, onRetake, onBrowse }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button onClick={onShare} variant="outline">
        <Share2 className="h-4 w-4 mr-2" />
        Share Results
      </Button>
      <Button onClick={onDownload} variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Download Report
      </Button>
      <Button onClick={onRetake} className="btn-hero">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retake Assessment
      </Button>
      <Button onClick={onBrowse} variant="default">
        Browse AI Courses
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
