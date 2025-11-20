import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertCircle,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { logger } from '@/utils/logger';
interface MediaPlayerProps {
  bucket: string;
  path: string;
  type: 'audio' | 'video';
  className?: string;
  autoPlay?: boolean;
}

interface MediaState {
  isPlaying: boolean;
  isLoading: boolean;
  mediaUrl: string | null;
  error: string | null;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  playbackRate: number;
}

export function MediaPlayer({
  bucket,
  path,
  type,
  className = '',
  autoPlay = false,
}: MediaPlayerProps) {
  const [state, setState] = useState<MediaState>({
    isPlaying: false,
    isLoading: false,
    mediaUrl: null,
    error: null,
    duration: 0,
    currentTime: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    showControls: true,
    playbackRate: 1,
  });

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const { toast } = useToast();

  // Auto-hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setState(prev => ({ ...prev, showControls: true }));

    if (state.isPlaying && type === 'video') {
      controlsTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, showControls: false }));
      }, 3000);
    }
  }, [state.isPlaying, type]);

  // Handle double tap to seek (mobile gesture)
  const handleDoubleTap = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const now = Date.now();
      const timeSince = now - lastTapRef.current;

      if (timeSince < 300 && timeSince > 0) {
        // Double tap detected
        const rect = e.currentTarget.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX - rect.left;
        const isLeftSide = tapX < rect.width / 2;

        if (mediaRef.current) {
          if (isLeftSide) {
            // Seek backward 10 seconds
            mediaRef.current.currentTime = Math.max(0, mediaRef.current.currentTime - 10);
            toast({ description: '⏪ -10s', duration: 1000 });
          } else {
            // Seek forward 10 seconds
            mediaRef.current.currentTime = Math.min(
              mediaRef.current.duration,
              mediaRef.current.currentTime + 10
            );
            toast({ description: '⏩ +10s', duration: 1000 });
          }
        }
      }

      lastTapRef.current = now;
    },
    [toast]
  );

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
    } catch (error) {
      logger.error('Fullscreen error:', error);
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.isMuted;
      if (mediaRef.current) {
        mediaRef.current.muted = newMuted;
      }
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  // Seek to position
  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    setState(prev => ({ ...prev, currentTime: newTime }));
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
  }, []);

  // Change playback rate
  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(state.playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    setState(prev => ({ ...prev, playbackRate: nextRate }));
    if (mediaRef.current) {
      mediaRef.current.playbackRate = nextRate;
    }
    toast({ description: `Speed: ${nextRate}x`, duration: 1000 });
  }, [state.playbackRate, toast]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({ ...prev, isFullscreen: !!document.fullscreenElement }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const updateState = (updates: Partial<MediaState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const logError = (operation: string, error: unknown) => {
    const errorMessage = `MediaPlayer ${operation} failed for ${bucket}/${path}`;
    logger.error(errorMessage, error);
    return errorMessage;
  };

  const loadMedia = async (): Promise<string | null> => {
    if (state.mediaUrl) {
      logger.log('📦 Using cached media URL');
      return state.mediaUrl;
    }

    logger.log(`🔄 Loading ${type} from ${bucket}/${path}...`);
    updateState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL received from storage');
      }

      logger.log('✅ Media URL loaded successfully');
      updateState({ mediaUrl: data.signedUrl, error: null });
      return data.signedUrl;
    } catch (error) {
      const errorMessage = logError('load', error);
      updateState({ error: errorMessage });

      toast({
        title: 'Loading Error',
        description: `Failed to load ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });

      return null;
    } finally {
      updateState({ isLoading: false });
    }
  };

  const initializeMediaElement = (url: string) => {
    if (mediaRef.current) return;

    logger.log(`🎵 Initializing ${type} element`);

    if (type === 'audio') {
      mediaRef.current = new Audio(url);
    } else {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      mediaRef.current = video;
    }

    const media = mediaRef.current;

    // Event listeners
    media.onloadedmetadata = () => {
      updateState({ duration: media.duration || 0 });
      logger.log(`📊 Media metadata loaded: ${media.duration}s`);
    };

    media.ontimeupdate = () => {
      updateState({ currentTime: media.currentTime });
    };

    media.onended = () => {
      logger.log('🏁 Media playback ended');
      updateState({ isPlaying: false, currentTime: 0 });
    };

    media.onerror = event => {
      const errorMessage = logError('playback', event);
      updateState({ error: errorMessage, isPlaying: false });

      toast({
        title: 'Playback Error',
        description: `Failed to play ${type} file`,
        variant: 'destructive',
      });
    };

    media.onplay = () => updateState({ isPlaying: true });
    media.onpause = () => updateState({ isPlaying: false });
  };

  const togglePlay = async () => {
    logger.log(`🎮 Toggle play - Current state: ${state.isPlaying ? 'playing' : 'paused'}`);

    const url = await loadMedia();
    if (!url) return;

    initializeMediaElement(url);

    if (!mediaRef.current) {
      logger.error('❌ Media element not initialized');
      return;
    }

    try {
      if (state.isPlaying) {
        mediaRef.current.pause();
        logger.log('⏸️ Media paused');
      } else {
        await mediaRef.current.play();
        logger.log('▶️ Media playing');
      }
    } catch (error) {
      logError('toggle', error);
      toast({
        title: 'Playback Error',
        description: `Failed to ${state.isPlaying ? 'pause' : 'play'} ${type}`,
        variant: 'destructive',
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRef.current) {
        logger.log('🧹 Cleaning up media element');
        mediaRef.current.pause();
        if (type === 'video' && mediaRef.current.parentNode) {
          mediaRef.current.parentNode.removeChild(mediaRef.current);
        }
      }
    };
  }, [type]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (type === 'video') {
    return (
      <div
        ref={containerRef}
        className={`relative group ${className} ${state.isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
        onMouseMove={resetControlsTimeout}
        onTouchStart={resetControlsTimeout}
      >
        <div
          className={`bg-muted rounded-lg overflow-hidden ${state.isFullscreen ? 'h-full' : 'aspect-video'}`}
        >
          {state.error ? (
            <div className="w-full h-full flex items-center justify-center bg-destructive/10">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">Failed to load video</p>
                <Button variant="outline" size="sm" onClick={loadMedia} className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          ) : state.mediaUrl ? (
            <>
              {/* Video element */}
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={state.mediaUrl}
                className="w-full h-full object-contain"
                preload="metadata"
                playsInline
                onClick={togglePlay}
                onTouchEnd={handleDoubleTap}
              >
                <track kind="captions" srcLang="en" label="English" src="" />
              </video>

              {/* Custom touch-optimized controls */}
              <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${
                  state.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Progress bar - touch optimized with larger hit area */}
                <div className="mb-3">
                  <Slider
                    value={[state.currentTime]}
                    max={state.duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 sm:[&_[role=slider]]:h-3 sm:[&_[role=slider]]:w-3"
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
                    {/* Skip back */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (mediaRef.current) {
                          mediaRef.current.currentTime = Math.max(
                            0,
                            mediaRef.current.currentTime - 10
                          );
                        }
                      }}
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20 active:scale-95"
                    >
                      <SkipBack className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>

                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="h-12 w-12 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20 active:scale-95"
                    >
                      {state.isPlaying ? (
                        <Pause className="h-6 w-6 sm:h-5 sm:w-5" />
                      ) : (
                        <Play className="h-6 w-6 sm:h-5 sm:w-5" />
                      )}
                    </Button>

                    {/* Skip forward */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (mediaRef.current) {
                          mediaRef.current.currentTime = Math.min(
                            mediaRef.current.duration,
                            mediaRef.current.currentTime + 10
                          );
                        }
                      }}
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20 active:scale-95"
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
                    {/* Playback speed */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cyclePlaybackRate}
                      className="h-10 sm:h-8 px-2 text-white hover:bg-white/20 active:scale-95 text-xs font-medium"
                    >
                      {state.playbackRate}x
                    </Button>

                    {/* Fullscreen */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20 active:scale-95"
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

              {/* Center play button overlay (tap to play) */}
              {!state.isPlaying && state.showControls && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 active:bg-black/40"
                  aria-label="Play video"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <Play className="h-8 w-8 sm:h-10 sm:w-10 text-black ml-1" />
                  </div>
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Button
                onClick={loadMedia}
                variant="ghost"
                disabled={state.isLoading}
                className="flex-col gap-2 h-auto py-4"
              >
                {state.isLoading ? (
                  <>
                    <div className="w-10 h-10 sm:w-8 sm:h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm sm:text-xs">Loading...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-10 w-10 sm:h-8 sm:w-8" />
                    <span className="text-sm sm:text-xs">Load Video</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button
        onClick={togglePlay}
        variant="outline"
        size="sm"
        disabled={state.isLoading || !!state.error}
        className="flex items-center gap-2"
      >
        {state.isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : state.error ? (
          <AlertCircle className="h-4 w-4" />
        ) : state.isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}

        {state.isLoading
          ? 'Loading...'
          : state.error
            ? 'Error'
            : state.isPlaying
              ? 'Pause'
              : 'Play'}
      </Button>

      <div className="flex items-center gap-2 text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        <div className="text-xs">
          <div>Audio Review</div>
          {state.duration > 0 && (
            <div className="text-[10px] opacity-75">
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <Button variant="ghost" size="sm" onClick={loadMedia} className="text-xs">
          Retry
        </Button>
      )}
    </div>
  );
}
