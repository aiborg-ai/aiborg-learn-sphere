import React, { Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedVideoPlayer } from '@/components/EnhancedVideoPlayer';
import { logger } from '@/utils/logger';
import type { CourseMaterial } from './types';
import { Loader2 } from '@/components/ui/icons';

// Lazy load PDFViewer to avoid bundling 413 KB PDF.js in initial load
const PDFViewer = React.lazy(() =>
  import('@/components/pdf/PDFViewer').then(module => ({ default: module.PDFViewer }))
);

interface MaterialViewerDialogProps {
  material: CourseMaterial | null;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MaterialViewerDialog({
  material,
  courseId,
  isOpen,
  onClose,
}: MaterialViewerDialogProps) {
  if (!material) return null;

  const isPdf =
    material.material_type === 'handbook' || material.file_url?.toLowerCase().endsWith('.pdf');
  const isVideo = material.material_type === 'recording';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{material.title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          {/* PDF Viewer - Lazy loaded */}
          {isPdf && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[500px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <PDFViewer
                fileUrl={material.file_url}
                contentId={material.id}
                courseId={parseInt(courseId)}
                title={material.title}
                onProgressUpdate={progress => {
                  logger.log(`Material progress: ${progress}%`);
                }}
              />
            </Suspense>
          )}

          {/* Video Player */}
          {isVideo && (
            <EnhancedVideoPlayer
              videoUrl={material.file_url}
              contentId={material.id}
              courseId={parseInt(courseId)}
              title={material.title}
              onProgressUpdate={progress => {
                logger.log(`Material progress: ${progress}%`);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
