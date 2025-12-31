/**
 * Offline Video Player Component
 *
 * Video player that automatically uses cached video blobs when offline
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Download,
  Trash2,
  AlertCircle,
  WifiOff,
  Loader2,
} from '@/components/ui/icons';
import { VideoCacheService } from '@/services/offline/VideoCacheService';
import { VideoCacheBadge } from './OfflineBadge';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface OfflineVideoPlayerProps {
  src: string;
  lessonId: string;
  className?: string;
  autoPlay?: boolean;
  poster?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

interface VideoState {
  isPlaying: boolean;
  isLoading: boolean;
  videoUrl: string | null;
  isFromCache: boolean;
  error: string | null;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  playbackRate: number;
}

interface CacheState {
  isCached: boolean;
  isDownloading: boolean;
  downloadProgress: number;
}

export function OfflineVideoPlayer({
  src,
  lessonId,
  className = '',
  autoPlay = false,
  poster,
  onProgress,
  onComplete,
}: OfflineVideoPlayerProps) {
  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    isLoading: true,
    videoUrl: null,
    isFromCache: false,
    error: null,
    duration: 0,
    currentTime: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    showControls: true,
    playbackRate: 1,
  });

  const [cacheState, setCacheState] = useState<CacheState>({
    isCached: false,
    isDownloading: false,
    downloadProgress: 0,
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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

  // Load video (from cache or network)
  const loadVideo = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First check if video is cached
      const cachedUrl = await VideoCacheService.getVideoObjectUrl(src);

      if (cachedUrl) {
        setState(prev => ({
          ...prev,
          videoUrl: cachedUrl,
          isFromCache: true,
          isLoading: false,
        }));
        setCacheState(prev => ({ ...prev, isCached: true }));
        logger.info('[OfflineVideoPlayer] Playing from cache');
        return;
      }

      // If not cached and offline, show error
      if (!navigator.onLine) {
        setState(prev => ({
          ...prev,
          error: 'Video not available offline. Please download it first while online.',
          isLoading: false,
        }));
        return;
      }

      // Play from network
      setState(prev => ({
        ...prev,
        videoUrl: src,
        isFromCache: false,
        isLoading: false,
      }));
      setCacheState(prev => ({ ...prev, isCached: false }));
      logger.info('[OfflineVideoPlayer] Playing from network');
    } catch (_error) {
      logger._error('[OfflineVideoPlayer] Failed to load video:', _error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load video',
        isLoading: false,
      }));
    }
  }, [src]);

  // Initial load
  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  // Check cache status
  useEffect(() => {
    const checkCache = async () => {
      const isCached = await VideoCacheService.isCached(src);
      setCacheState(prev => ({ ...prev, isCached }));
    };
    checkCache();
  }, [src]);

  // Download video for offline
  const handleDownload = async () => {
    if (!isOnline) {
      toast({
        title: 'No Internet Connection',
        description: 'You need to be online to download videos.',
        variant: 'destructive',
      });
      return;
    }

    setCacheState(prev => ({ ...prev, isDownloading: true, downloadProgress: 0 }));

    try {
      await VideoCacheService.cacheVideo(src, lessonId, {
        onProgress: progress => {
          setCacheState(prev => ({ ...prev, downloadProgress: progress }));
        },
        expiresInDays: 30,
      });

      setCacheState({ isCached: true, isDownloading: false, downloadProgress: 100 });

      toast({
        title: 'Download Complete',
        description: 'Video is now available offline.',
      });
    } catch (_error) {
      logger._error('[OfflineVideoPlayer] Download failed:', _error);
      setCacheState(prev => ({ ...prev, isDownloading: false, downloadProgress: 0 }));

      toast({
        title: 'Download Failed',
        description: 'Failed to download video for offline use.',
        variant: 'destructive',
      });
    }
  };

  // Delete cached video
  const handleDeleteCache = async () => {
    try {
      const video = await VideoCacheService.getVideoByUrl(src);
      if (video) {
        await VideoCacheService.deleteVideo(video.id);
        setCacheState({ isCached: false, isDownloading: false, downloadProgress: 0 });

        // Reload from network if currently playing from cache
        if (state.isFromCache) {
          await loadVideo();
        }

        toast({
          title: 'Cache Cleared',
          description: 'Offline video has been removed.',
        });
      }
    } catch (_error) {
      logger._error('[OfflineVideoPlayer] Failed to delete cache:', _error);
      toast({
        title: 'Error',
        description: 'Failed to remove cached video.',
        variant: 'destructive',
      });
    }
  };

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setState(prev => ({ ...prev, showControls: true }));

    if (state.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, showControls: false }));
      }, 3000);
    }
  }, [state.isPlaying]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        logger.error('[OfflineVideoPlayer] Play failed:', error);
      });
    }
  }, [state.isPlaying]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setState(prev => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setState(prev => ({ ...prev, isFullscreen: false }));
      }
    } catch (_error) {
      logger._error('[OfflineVideoPlayer] Fullscreen _error:', _error);
    }
  }, []);

  // Handle seek
  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    setState(prev => ({ ...prev, currentTime: newTime }));
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, []);

  // Handle volume
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.isMuted;
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
      );
    }
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: video.duration }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: video.currentTime }));
      onProgress?.(video.currentTime, video.duration);
    };

    const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }));

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onComplete?.();
    };

    const handleError = () => {
      setState(prev => ({
        ...prev,
        error: 'Failed to play video',
        isPlaying: false,
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onProgress, onComplete]);

  // Autoplay
  useEffect(() => {
    if (autoPlay && videoRef.current && state.videoUrl && !state.error) {
      videoRef.current.play().catch(logger.error);
    }
  }, [autoPlay, state.videoUrl, state.error]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (state.videoUrl && state.isFromCache) {
        URL.revokeObjectURL(state.videoUrl);
      }
    };
  }, [state.videoUrl, state.isFromCache]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative group',
        state.isFullscreen ? 'fixed inset-0 z-50 bg-black' : '',
        className
      )}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      <div
        className={cn(
          'bg-muted rounded-lg overflow-hidden',
          state.isFullscreen ? 'h-full' : 'aspect-video'
        )}
      >
        {/* Loading state */}
        {state.isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {state.error && (
          <div className="w-full h-full flex items-center justify-center bg-destructive/10 p-4">
            <div className="text-center max-w-sm">
              {!isOnline ? (
                <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              )}
              <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
              {isOnline && (
                <Button variant="outline" size="sm" onClick={loadVideo}>
                  Retry
                </Button>
              )}
              {!isOnline && !cacheState.isCached && (
                <p className="text-xs text-muted-foreground">
                  Connect to the internet and download this video for offline viewing.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Video element */}
        {state.videoUrl && !state.error && (
          <>
            <video
              ref={videoRef}
              src={state.videoUrl}
              poster={poster}
              className="w-full h-full object-contain"
              playsInline
              onClick={togglePlay}
            />

            {/* Cache status badge */}
            <div className="absolute top-3 left-3">
              <VideoCacheBadge videoUrl={src} lessonId={lessonId} size="sm" />
            </div>

            {/* Download/Delete button */}
            <div className="absolute top-3 right-3">
              {cacheState.isDownloading ? (
                <div className="bg-black/70 rounded-lg p-2 min-w-[120px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="text-xs text-white">
                      {Math.round(cacheState.downloadProgress)}%
                    </span>
                  </div>
                  <Progress value={cacheState.downloadProgress} className="h-1" />
                </div>
              ) : cacheState.isCached ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCache}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              ) : (
                isOnline && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Save Offline
                  </Button>
                )
              )}
            </div>

            {/* Controls */}
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 transition-opacity duration-300',
                state.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
            >
              {/* Progress bar */}
              <div className="mb-3">
                <Slider
                  value={[state.currentTime]}
                  max={state.duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/80 mt-1">
                  <span>{formatTime(state.currentTime)}</span>
                  <span>{formatTime(state.duration)}</span>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between gap-2">
                {/* Left controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skip(-10)}
                    className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="h-12 w-12 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20"
                  >
                    {state.isPlaying ? (
                      <Pause className="h-6 w-6 sm:h-5 sm:w-5" />
                    ) : (
                      <Play className="h-6 w-6 sm:h-5 sm:w-5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skip(10)}
                    className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>

                  {/* Volume - hidden on mobile */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      {state.isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[state.isMuted ? 0 : state.volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                  >
                    {state.isFullscreen ? (
                      <Minimize className="h-5 w-5 sm:h-4 sm:w-4" />
                    ) : (
                      <Maximize className="h-5 w-5 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Center play button overlay */}
            {!state.isPlaying && state.showControls && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 active:bg-black/40"
                aria-label="Play video"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 text-black ml-1" />
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
