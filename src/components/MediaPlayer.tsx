import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MediaPlayerProps {
  bucket: string;
  path: string;
  type: 'audio' | 'video';
  className?: string;
}

interface MediaState {
  isPlaying: boolean;
  isLoading: boolean;
  mediaUrl: string | null;
  error: string | null;
  duration: number;
  currentTime: number;
}

export function MediaPlayer({ bucket, path, type, className = "" }: MediaPlayerProps) {
  const [state, setState] = useState<MediaState>({
    isPlaying: false,
    isLoading: false,
    mediaUrl: null,
    error: null,
    duration: 0,
    currentTime: 0
  });

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const { toast } = useToast();

  const updateState = (updates: Partial<MediaState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const logError = (operation: string, error: any) => {
    const errorMessage = `MediaPlayer ${operation} failed for ${bucket}/${path}`;
    console.error(errorMessage, error);
    return errorMessage;
  };

  const loadMedia = async (): Promise<string | null> => {
    if (state.mediaUrl) {
      console.log('📦 Using cached media URL');
      return state.mediaUrl;
    }

    console.log(`🔄 Loading ${type} from ${bucket}/${path}...`);
    updateState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL received from storage');
      }

      console.log('✅ Media URL loaded successfully');
      updateState({ mediaUrl: data.signedUrl, error: null });
      return data.signedUrl;

    } catch (error: any) {
      const errorMessage = logError('load', error);
      updateState({ error: errorMessage });
      
      toast({
        title: "Loading Error",
        description: `Failed to load ${type} file: ${error.message}`,
        variant: "destructive",
      });
      
      return null;
    } finally {
      updateState({ isLoading: false });
    }
  };

  const initializeMediaElement = (url: string) => {
    if (mediaRef.current) return;

    console.log(`🎵 Initializing ${type} element`);

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
      console.log(`📊 Media metadata loaded: ${media.duration}s`);
    };

    media.ontimeupdate = () => {
      updateState({ currentTime: media.currentTime });
    };

    media.onended = () => {
      console.log('🏁 Media playback ended');
      updateState({ isPlaying: false, currentTime: 0 });
    };

    media.onerror = (event) => {
      const errorMessage = logError('playback', event);
      updateState({ error: errorMessage, isPlaying: false });
      
      toast({
        title: "Playback Error",
        description: `Failed to play ${type} file`,
        variant: "destructive",
      });
    };

    media.onplay = () => updateState({ isPlaying: true });
    media.onpause = () => updateState({ isPlaying: false });
  };

  const togglePlay = async () => {
    console.log(`🎮 Toggle play - Current state: ${state.isPlaying ? 'playing' : 'paused'}`);
    
    const url = await loadMedia();
    if (!url) return;

    initializeMediaElement(url);
    
    if (!mediaRef.current) {
      console.error('❌ Media element not initialized');
      return;
    }

    try {
      if (state.isPlaying) {
        mediaRef.current.pause();
        console.log('⏸️ Media paused');
      } else {
        await mediaRef.current.play();
        console.log('▶️ Media playing');
      }
    } catch (error: any) {
      logError('toggle', error);
      toast({
        title: "Playback Error",
        description: `Failed to ${state.isPlaying ? 'pause' : 'play'} ${type}`,
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRef.current) {
        console.log('🧹 Cleaning up media element');
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
      <div className={`relative ${className}`}>
        <div className="bg-muted rounded-lg overflow-hidden aspect-video">
          {state.error ? (
            <div className="w-full h-full flex items-center justify-center bg-destructive/10">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">Failed to load video</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMedia} 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : state.mediaUrl ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={state.mediaUrl}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Button
                onClick={loadMedia}
                variant="ghost"
                disabled={state.isLoading}
                className="flex-col gap-2"
              >
                {state.isLoading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-8 w-8" />
                    <span className="text-xs">Load Video</span>
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
        
        {state.isLoading ? 'Loading...' : 
         state.error ? 'Error' :
         state.isPlaying ? 'Pause' : 'Play'}
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadMedia}
          className="text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  );
}