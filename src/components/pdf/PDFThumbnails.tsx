import React from 'react';
import { Document, Page } from 'react-pdf';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface PDFThumbnailsProps {
  fileUrl: string;
  numPages: number;
  currentPage: number;
  pagesViewed: Set<number>;
  onPageClick: (page: number) => void;
}

export function PDFThumbnails({
  fileUrl,
  numPages,
  currentPage,
  pagesViewed,
  onPageClick,
}: PDFThumbnailsProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <Document file={fileUrl}>
          {Array.from(new Array(numPages), (_, index) => {
            const pageNumber = index + 1;
            const isCurrentPage = pageNumber === currentPage;
            const isViewed = pagesViewed.has(pageNumber);

            return (
              <button
                key={`thumb_${pageNumber}`}
                onClick={() => onPageClick(pageNumber)}
                className={cn(
                  'w-full mb-3 relative group cursor-pointer transition-all',
                  'border-2 rounded-lg overflow-hidden',
                  isCurrentPage
                    ? 'border-primary shadow-md'
                    : 'border-transparent hover:border-primary/50'
                )}
              >
                <div className="relative bg-white">
                  <Page
                    pageNumber={pageNumber}
                    width={150}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />

                  {/* Viewed indicator */}
                  {isViewed && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-green-500 fill-white" />
                    </div>
                  )}

                  {/* Current page indicator */}
                  {isCurrentPage && (
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                  )}
                </div>

                {/* Page number */}
                <div
                  className={cn(
                    'text-center py-1 text-xs font-medium',
                    isCurrentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                  )}
                >
                  {pageNumber}
                </div>
              </button>
            );
          })}
        </Document>
      </div>
    </ScrollArea>
  );
}
