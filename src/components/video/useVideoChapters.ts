import { useState, useEffect, useCallback } from 'react';
import { Chapter } from './types';

export function useVideoChapters(
  chapters: Chapter[],
  currentTime: number,
  videoRef: React.RefObject<HTMLVideoElement>,
  setCurrentTime: (time: number) => void
) {
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    // Update current chapter
    const chapter = chapters.find(ch =>
      currentTime >= ch.startTime && currentTime <= ch.endTime
    );
    setCurrentChapter(chapter || null);
  }, [currentTime, chapters]);

  const jumpToChapter = useCallback((chapter: Chapter) => {
    if (videoRef.current) {
      videoRef.current.currentTime = chapter.startTime;
      setCurrentTime(chapter.startTime);
    }
  }, [videoRef, setCurrentTime]);

  const jumpToNote = useCallback((timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  }, [videoRef, setCurrentTime]);

  return {
    currentChapter,
    jumpToChapter,
    jumpToNote
  };
}
