import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MediaPlayerProps {
  bucket: string;
  path: string;
  type: 'audio' | 'video';
  className?: string;
}

export function MediaPlayer({ bucket, path, type, className = "" }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const { toast } = useToast();

  const loadMedia = async () => {
    if (mediaUrl) return mediaUrl;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        throw error;
      }

      setMediaUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      toast({
        title: "Loading Error",
        description: "Failed to load media file",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    const url = await loadMedia();
    if (!url) return;

    if (!mediaRef.current) {
      if (type === 'audio') {
        mediaRef.current = new Audio(url);
      } else {
        // For video, we'll create a hidden video element
        const video = document.createElement('video');
        video.src = url;
        video.style.display = 'none';
        document.body.appendChild(video);
        mediaRef.current = video;
      }

      mediaRef.current.onended = () => {
        setIsPlaying(false);
      };

      mediaRef.current.onerror = () => {
        toast({
          title: "Playback Error",
          description: "Failed to play media file",
          variant: "destructive",
        });
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await mediaRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        toast({
          title: "Playback Error",
          description: "Failed to play media file",
          variant: "destructive",
        });
      }
    }
  };

  if (type === 'video') {
    return (
      <div className={`relative ${className}`}>
        <div className="bg-muted rounded-lg overflow-hidden aspect-video">
          {mediaUrl ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              className="w-full h-full object-cover"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Button
                onClick={loadMedia}
                variant="ghost"
                disabled={isLoading}
                className="flex-col gap-2"
              >
                {isLoading ? (
                  <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
      </Button>
      
      <div className="flex items-center gap-1 text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        <span className="text-xs">Audio Review</span>
      </div>
    </div>
  );
}