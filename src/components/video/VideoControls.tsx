/* eslint-disable jsx-a11y/prefer-tag-over-role */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';
import type { Chapter } from './types';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackSpeed: number;
  showControls: boolean;
  currentChapter: Chapter | null;
  chapters: Chapter[];
  progressBarRef: React.RefObject<HTMLDivElement>;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onVolumeChange: (value: number[]) => void;
  onMute: () => void;
  onSpeedChange: (speed: number) => void;
  onFullscreen: () => void;
  onSeek: (value: number[]) => void;
  onSetShowControls: (show: boolean) => void;
  formatTime: (seconds: number) => string;
}

export function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  playbackSpeed,
  showControls,
  currentChapter,
  chapters,
  progressBarRef,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
  onVolumeChange,
  onMute,
  onSpeedChange,
  onFullscreen,
  onSeek,
  onSetShowControls,
  formatTime,
}: VideoControlsProps) {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseEnter={() => onSetShowControls(true)}
      onMouseLeave={() => onSetShowControls(false)}
    >
      {/* Progress Bar */}
      {}
      <div
        ref={progressBarRef}
        className="relative h-1 bg-white/20 rounded-full mb-4 cursor-pointer"
        onClick={e => {
          const rect = progressBarRef.current?.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            onSeek([percentage]);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') {
            onSkipBackward();
          } else if (e.key === 'ArrowRight') {
            onSkipForward();
          }
        }}
        role="slider"
        tabIndex={0}
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={(currentTime / duration) * 100}
      >
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        {/* Chapter Markers */}
        {chapters.map(chapter => (
          <div
            key={chapter.id}
            className="absolute top-0 w-1 h-full bg-white/50"
            style={{ left: `${(chapter.startTime / duration) * 100}%` }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={onPlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onSkipBackward}
            className="text-white hover:bg-white/20"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onSkipForward}
            className="text-white hover:bg-white/20"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={onVolumeChange}
              max={100}
              className="w-24"
            />
          </div>

          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {currentChapter && (
            <Badge variant="secondary" className="text-xs">
              {currentChapter.title}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Control */}
          <select
            value={playbackSpeed}
            onChange={e => onSpeedChange(parseFloat(e.target.value))}
            className="bg-white/10 text-white text-sm px-2 py-1 rounded border border-white/20"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          <Button
            size="sm"
            variant="ghost"
            onClick={onFullscreen}
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
