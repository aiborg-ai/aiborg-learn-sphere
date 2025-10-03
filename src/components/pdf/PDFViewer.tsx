import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { PDFControls } from './PDFControls';
import { PDFThumbnails } from './PDFThumbnails';
import { PDFSearch } from './PDFSearch';
import { PDFAnnotations } from './PDFAnnotations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  contentId: string; // material_id for tracking
  courseId?: number;
  title?: string;
  onProgressUpdate?: (progress: number) => void;
}

interface PDFAnnotation {
  id: string;
  page: number;
  text: string;
  highlight?: string;
  position: { x: number; y: number };
  created_at: string;
}

export function PDFViewer({
  fileUrl,
  contentId,
  courseId,
  title,
  onProgressUpdate,
}: PDFViewerProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagesViewed, setPagesViewed] = useState<Set<number>>(new Set([1]));

  // UI state
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'annotations' | 'search'>('thumbnails');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  // Progress tracking
  const [lastSavedProgress, setLastSavedProgress] = useState<number>(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load previous progress
  useEffect(() => {
    loadProgress();
    loadAnnotations();

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      saveProgress(); // Save on unmount
    };
  }, []);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    progressTimerRef.current = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [pagesViewed, currentPage]);

  const loadProgress = async () => {
    if (!user || !contentId) return;

    try {
      const { data } = await supabase
        .from('content_views')
        .select('progress_percentage, metadata')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('content_type', 'pdf')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.metadata) {
        const { last_page, pages_viewed } = data.metadata;
        if (last_page) setCurrentPage(last_page);
        if (pages_viewed && Array.isArray(pages_viewed)) {
          setPagesViewed(new Set(pages_viewed));
        }
        setLastSavedProgress(data.progress_percentage || 0);
      }
    } catch (err) {
      logger.error('Error loading PDF progress:', err);
    }
  };

  const saveProgress = async () => {
    if (!user || !contentId || numPages === 0) return;

    const pagesViewedArray = Array.from(pagesViewed);
    const progressPercentage = (pagesViewedArray.length / numPages) * 100;

    // Only save if progress changed significantly
    if (Math.abs(progressPercentage - lastSavedProgress) < 1) return;

    try {
      await supabase.from('content_views').upsert(
        {
          user_id: user.id,
          content_id: contentId,
          content_type: 'pdf',
          course_id: courseId || null,
          progress_percentage: progressPercentage,
          completion_status: progressPercentage >= 95 ? 'completed' : 'in_progress',
          metadata: {
            last_page: currentPage,
            pages_viewed: pagesViewedArray,
            total_pages: numPages,
          },
        },
        {
          onConflict: 'user_id,content_id,content_type',
        }
      );

      setLastSavedProgress(progressPercentage);

      // Update course progress if applicable
      if (courseId) {
        await supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            course_id: courseId,
            current_position: JSON.stringify({
              pdfId: contentId,
              page: currentPage,
            }),
          },
          {
            onConflict: 'user_id,course_id',
          }
        );
      }

      if (onProgressUpdate) {
        onProgressUpdate(progressPercentage);
      }

      logger.log(`PDF progress saved: ${progressPercentage.toFixed(1)}%`);
    } catch (err) {
      logger.error('Error saving PDF progress:', err);
    }
  };

  const loadAnnotations = async () => {
    if (!user || !contentId) return;

    try {
      const { data } = await supabase
        .from('shared_content')
        .select('*')
        .eq('owner_id', user.id)
        .eq('content_type', 'pdf_annotation')
        .eq('content_data->>pdf_id', contentId)
        .order('created_at', { ascending: false });

      if (data) {
        const parsedAnnotations = data.map((d) => ({
          id: d.id,
          page: d.content_data.page || 1,
          text: d.content_data.text || '',
          highlight: d.content_data.highlight,
          position: d.content_data.position || { x: 0, y: 0 },
          created_at: d.created_at,
        }));
        setAnnotations(parsedAnnotations);
      }
    } catch (err) {
      logger.error('Error loading PDF annotations:', err);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    logger.log(`PDF loaded successfully: ${numPages} pages`);
  };

  const onDocumentLoadError = (err: Error) => {
    setError('Failed to load PDF document');
    setLoading(false);
    logger.error('PDF load error:', err);
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= numPages) {
        setCurrentPage(newPage);
        setPagesViewed((prev) => new Set(prev).add(newPage));

        // Scroll to page
        const pageElement = pageRefs.current.get(newPage);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [numPages]
  );

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  const handleFitToWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // Approximate PDF width (adjust based on actual page dimensions)
      const pdfWidth = 612; // Standard A4 width in points
      const newScale = (containerWidth - 100) / pdfWidth;
      setScale(Math.max(0.5, Math.min(newScale, 2.5)));
    }
  };

  const progressPercentage = numPages > 0 ? (pagesViewed.size / numPages) * 100 : 0;

  if (loading && !numPages) {
    return (
      <Card className="w-full h-[800px] flex items-center justify-center">
        <CardContent>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading PDF...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 h-[800px]">
          {/* Main PDF Viewer */}
          <div className="lg:col-span-3 flex flex-col border-r">
            {/* Controls */}
            <PDFControls
              currentPage={currentPage}
              numPages={numPages}
              scale={scale}
              onPageChange={handlePageChange}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onFitToWidth={handleFitToWidth}
              fileUrl={fileUrl}
              fileName={title || 'document.pdf'}
            />

            {/* Progress Bar */}
            <div className="px-4 py-2 border-b bg-muted/30">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Progress: {pagesViewed.size} / {numPages} pages
                </span>
                <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* PDF Document */}
            <div
              ref={containerRef}
              className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4"
            >
              <div className="flex flex-col items-center gap-4">
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      ref={(el) => {
                        if (el) pageRefs.current.set(index + 1, el);
                      }}
                      className="mb-4 shadow-lg"
                    >
                      <Page
                        pageNumber={index + 1}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        onLoadSuccess={() => {
                          // Track that page was viewed when it loads
                          setPagesViewed((prev) => new Set(prev).add(index + 1));
                        }}
                      />
                      <div className="text-center text-sm text-muted-foreground mt-2 mb-4">
                        Page {index + 1} of {numPages}
                      </div>
                    </div>
                  ))}
                </Document>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col bg-muted/30">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                <TabsTrigger value="thumbnails">
                  <FileText className="h-4 w-4 mr-1" />
                  Pages
                </TabsTrigger>
                <TabsTrigger value="annotations">
                  📝 Notes
                </TabsTrigger>
                <TabsTrigger value="search">
                  🔍 Search
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="thumbnails" className="h-full mt-0">
                  <PDFThumbnails
                    fileUrl={fileUrl}
                    numPages={numPages}
                    currentPage={currentPage}
                    pagesViewed={pagesViewed}
                    onPageClick={handlePageChange}
                  />
                </TabsContent>

                <TabsContent value="annotations" className="h-full mt-0">
                  <PDFAnnotations
                    contentId={contentId}
                    annotations={annotations}
                    currentPage={currentPage}
                    onAnnotationClick={(page) => handlePageChange(page)}
                    onAnnotationsChange={loadAnnotations}
                  />
                </TabsContent>

                <TabsContent value="search" className="h-full mt-0">
                  <PDFSearch
                    fileUrl={fileUrl}
                    numPages={numPages}
                    onResultClick={handlePageChange}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
