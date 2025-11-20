import { lazy, Suspense } from 'react';
import { Loader2 } from '@/components/ui/icons';

// Lazy load the PDF viewer to reduce initial bundle size
const PDFViewer = lazy(() => import('./PDFViewer'));

interface LazyPDFViewerProps {
  url: string;
  title?: string;
}

export function LazyPDFViewer({ url, title }: LazyPDFViewerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96 bg-muted/30 rounded-lg">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
          </div>
        </div>
      }
    >
      <PDFViewer url={url} title={title} />
    </Suspense>
  );
}
