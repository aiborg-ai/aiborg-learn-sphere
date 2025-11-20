/**
 * VideoEmbed Component
 *
 * Embeds videos from YouTube, Vimeo, and other sources
 * with responsive sizing and accessibility features
 */

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, AlertCircle, Youtube, Video } from '@/components/ui/icons';

type VideoProvider = 'youtube' | 'vimeo' | 'dailymotion' | 'unknown';

interface VideoInfo {
  provider: VideoProvider;
  videoId: string;
  embedUrl: string;
  thumbnailUrl?: string;
}

interface VideoEmbedProps {
  url: string;
  title?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  startTime?: number;
  className?: string;
  onError?: (error: string) => void;
}

interface VideoEmbedInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

/**
 * Parse video URL and extract provider and video ID
 */
function parseVideoUrl(url: string): VideoInfo | null {
  if (!url) return null;

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        provider: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        provider: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      };
    }
  }

  // Dailymotion patterns
  const dailymotionPattern = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/;
  const dailymotionMatch = url.match(dailymotionPattern);
  if (dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    return {
      provider: 'dailymotion',
      videoId,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
    };
  }

  return null;
}

/**
 * Build embed URL with parameters
 */
function buildEmbedUrl(
  info: VideoInfo,
  options: {
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
    loop?: boolean;
    startTime?: number;
  }
): string {
  const params = new URLSearchParams();

  switch (info.provider) {
    case 'youtube':
      if (options.autoplay) params.set('autoplay', '1');
      if (options.muted) params.set('mute', '1');
      if (!options.controls) params.set('controls', '0');
      if (options.loop) {
        params.set('loop', '1');
        params.set('playlist', info.videoId);
      }
      if (options.startTime) params.set('start', options.startTime.toString());
      params.set('rel', '0'); // Don't show related videos
      params.set('modestbranding', '1'); // Minimal YouTube branding
      break;

    case 'vimeo':
      if (options.autoplay) params.set('autoplay', '1');
      if (options.muted) params.set('muted', '1');
      if (options.loop) params.set('loop', '1');
      if (options.startTime) params.set('t', `${options.startTime}s`);
      params.set('dnt', '1'); // Do not track
      break;

    case 'dailymotion':
      if (options.autoplay) params.set('autoplay', '1');
      if (options.muted) params.set('mute', '1');
      if (!options.controls) params.set('controls', '0');
      if (options.startTime) params.set('start', options.startTime.toString());
      break;
  }

  const paramString = params.toString();
  return paramString ? `${info.embedUrl}?${paramString}` : info.embedUrl;
}

/**
 * Get aspect ratio class
 */
function getAspectRatioClass(ratio: string): string {
  switch (ratio) {
    case '4:3':
      return 'aspect-[4/3]';
    case '1:1':
      return 'aspect-square';
    default:
      return 'aspect-video';
  }
}

/**
 * Get provider icon
 */
function getProviderIcon(provider: VideoProvider) {
  switch (provider) {
    case 'youtube':
      return Youtube;
    case 'vimeo':
    case 'dailymotion':
    default:
      return Video;
  }
}

/**
 * VideoEmbed Component
 */
export function VideoEmbed({
  url,
  title,
  aspectRatio = '16:9',
  autoplay = false,
  muted = false,
  controls = true,
  loop = false,
  startTime,
  className = '',
  onError,
}: VideoEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const videoInfo = useMemo(() => parseVideoUrl(url), [url]);

  const embedUrl = useMemo(() => {
    if (!videoInfo) return null;
    return buildEmbedUrl(videoInfo, { autoplay, muted, controls, loop, startTime });
  }, [videoInfo, autoplay, muted, controls, loop, startTime]);

  if (!videoInfo || !embedUrl) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${getAspectRatioClass(aspectRatio)} ${className}`}
      >
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Invalid video URL</p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported: YouTube, Vimeo, Dailymotion
          </p>
        </div>
      </div>
    );
  }

  const ProviderIcon = getProviderIcon(videoInfo.provider);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative overflow-hidden rounded-lg bg-muted ${getAspectRatioClass(aspectRatio)}`}
      >
        {isLoading && <Skeleton className="absolute inset-0" />}

        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load video</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={title || `${videoInfo.provider} video`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
              onError?.('Failed to load video');
            }}
          />
        )}
      </div>

      {/* Provider badge */}
      <div className="absolute top-2 left-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-xs">
          <ProviderIcon className="h-3 w-3" />
          <span className="capitalize">{videoInfo.provider}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * VideoEmbedInput Component
 * Input field for video URLs with validation and preview
 */
export function VideoEmbedInput({
  value,
  onChange,
  placeholder = 'Paste YouTube or Vimeo URL...',
  label = 'Video URL',
  error,
}: VideoEmbedInputProps) {
  const videoInfo = useMemo(() => parseVideoUrl(value), [value]);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="video-url">{label}</Label>
        <div className="relative mt-1.5">
          <Input
            id="video-url"
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={error ? 'border-destructive' : ''}
          />
          {videoInfo && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {React.createElement(getProviderIcon(videoInfo.provider), {
                className: 'h-4 w-4 text-muted-foreground',
              })}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>

      {/* Preview */}
      {value && videoInfo && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <VideoEmbed url={value} aspectRatio="16:9" />
        </Card>
      )}

      {value && !videoInfo && (
        <p className="text-sm text-muted-foreground">Supported: YouTube, Vimeo, Dailymotion URLs</p>
      )}
    </div>
  );
}

/**
 * Utility function to extract video info
 */
export { parseVideoUrl };
