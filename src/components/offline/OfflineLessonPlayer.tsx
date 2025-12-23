/**
 * Offline Lesson Player Component
 *
 * Complete lesson player with offline video support, progress tracking,
 * and lesson content display
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  WifiOff,
  Loader2,
} from '@/components/ui/icons';
import { OfflineVideoPlayer } from './OfflineVideoPlayer';
import { VideoCacheBadge, ConnectionStatusBadge } from './OfflineBadge';
import { VideoCacheService, type CacheStats } from '@/services/offline/VideoCacheService';
import { DownloadManager } from '@/services/offline/DownloadManager';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  content?: string;
  duration_minutes?: number;
  order_index: number;
}

export interface LessonProgress {
  lessonId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastUpdated: string;
}

interface OfflineLessonPlayerProps {
  lessons: Lesson[];
  currentLessonIndex?: number;
  courseId: string;
  courseTitle?: string;
  onLessonChange?: (lessonIndex: number) => void;
  onProgress?: (progress: LessonProgress) => void;
  onComplete?: (lessonId: string) => void;
  className?: string;
}

export function OfflineLessonPlayer({
  lessons,
  currentLessonIndex = 0,
  courseId,
  courseTitle,
  onLessonChange,
  onProgress,
  onComplete,
  className,
}: OfflineLessonPlayerProps) {
  const [activeLessonIndex, setActiveLessonIndex] = useState(currentLessonIndex);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const { toast } = useToast();

  const currentLesson = lessons[activeLessonIndex];

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cache stats
  useEffect(() => {
    const loadCacheStats = async () => {
      const stats = await VideoCacheService.getCacheStats();
      setCacheStats(stats);
    };
    loadCacheStats();
  }, []);

  // Navigate to lesson
  const goToLesson = useCallback(
    (index: number) => {
      if (index >= 0 && index < lessons.length) {
        setActiveLessonIndex(index);
        onLessonChange?.(index);
      }
    },
    [lessons.length, onLessonChange]
  );

  // Handle video progress
  const handleVideoProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!currentLesson) return;

      const progress: LessonProgress = {
        lessonId: currentLesson.id,
        currentTime,
        duration,
        completed: false,
        lastUpdated: new Date().toISOString(),
      };

      onProgress?.(progress);

      // Save progress offline if not online
      if (!navigator.onLine) {
        DownloadManager.saveOfflineProgress(currentLesson.id, 'lesson', {
          currentTime,
          duration,
          percentComplete: (currentTime / duration) * 100,
        }).catch(logger.error);
      }
    },
    [currentLesson, onProgress]
  );

  // Handle video completion
  const handleVideoComplete = useCallback(() => {
    if (!currentLesson) return;

    setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
    onComplete?.(currentLesson.id);

    // Auto-advance to next lesson
    if (activeLessonIndex < lessons.length - 1) {
      setTimeout(() => {
        goToLesson(activeLessonIndex + 1);
      }, 1500);
    }
  }, [currentLesson, activeLessonIndex, lessons.length, onComplete, goToLesson]);

  // Download all lessons for offline
  const handleDownloadAll = async () => {
    if (!isOnline) {
      toast({
        title: 'No Internet Connection',
        description: 'Connect to the internet to download lessons.',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloadingAll(true);
    let downloadedCount = 0;

    try {
      for (const lesson of lessons) {
        if (lesson.video_url) {
          try {
            await VideoCacheService.cacheVideo(lesson.video_url, lesson.id, {
              expiresInDays: 30,
            });
            downloadedCount++;
          } catch (error) {
            logger.error(`Failed to download lesson ${lesson.id}:`, error);
          }
        }
      }

      const stats = await VideoCacheService.getCacheStats();
      setCacheStats(stats);

      toast({
        title: 'Download Complete',
        description: `${downloadedCount} of ${lessons.filter(l => l.video_url).length} videos saved for offline.`,
      });
    } catch (error) {
      logger.error('Download all failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Some videos could not be downloaded.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (!currentLesson) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No lessons available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[1fr,300px]', className)}>
      {/* Main content */}
      <div className="space-y-4">
        {/* Connection status bar */}
        {!isOnline && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <WifiOff className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              You're offline. Only downloaded lessons are available.
            </p>
          </div>
        )}

        {/* Video player */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{currentLesson.title}</CardTitle>
                {currentLesson.description && (
                  <CardDescription className="mt-1">{currentLesson.description}</CardDescription>
                )}
              </div>
              <ConnectionStatusBadge />
            </div>
          </CardHeader>
          <CardContent>
            {currentLesson.video_url ? (
              <OfflineVideoPlayer
                src={currentLesson.video_url}
                lessonId={currentLesson.id}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
              />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">This lesson has no video content</p>
                </div>
              </div>
            )}

            {/* Lesson content */}
            {currentLesson.content && (
              <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToLesson(activeLessonIndex - 1)}
            disabled={activeLessonIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Lesson {activeLessonIndex + 1} of {lessons.length}
          </span>

          <Button
            variant="outline"
            onClick={() => goToLesson(activeLessonIndex + 1)}
            disabled={activeLessonIndex === lessons.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Sidebar - Lesson list */}
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{courseTitle || 'Lessons'}</CardTitle>
            {isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
                className="h-8 text-xs"
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-1" />
                    Download All
                  </>
                )}
              </Button>
            )}
          </div>
          {cacheStats && cacheStats.totalVideos > 0 && (
            <p className="text-xs text-muted-foreground">
              {cacheStats.totalVideos} videos cached ({formatSize(cacheStats.totalSize)})
            </p>
          )}
        </CardHeader>
        <Separator />
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => goToLesson(index)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors mb-1',
                  index === activeLessonIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {completedLessons.has(lesson.id) ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        index === activeLessonIndex && 'text-primary'
                      )}
                    >
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {lesson.duration_minutes && (
                        <span className="text-xs text-muted-foreground">
                          {lesson.duration_minutes} min
                        </span>
                      )}
                      {lesson.video_url && (
                        <VideoCacheBadge
                          videoUrl={lesson.video_url}
                          lessonId={lesson.id}
                          size="sm"
                          showText={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
