import React from 'react';
import type { Chapter } from './types';

interface VideoChaptersProps {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onJumpToChapter: (chapter: Chapter) => void;
  formatTime: (seconds: number) => string;
}

export function VideoChapters({
  chapters,
  currentChapter,
  onJumpToChapter,
  formatTime,
}: VideoChaptersProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-white font-medium mb-3">Chapters</h3>
      {chapters.length > 0 ? (
        chapters.map(chapter => (
          <button
            key={chapter.id}
            onClick={() => onJumpToChapter(chapter)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              currentChapter?.id === chapter.id
                ? 'bg-primary/20 text-primary'
                : 'hover:bg-white/10 text-white/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{chapter.title}</span>
              <span className="text-xs opacity-60">{formatTime(chapter.startTime)}</span>
            </div>
          </button>
        ))
      ) : (
        <p className="text-white/60 text-sm">No chapters available</p>
      )}
    </div>
  );
}
