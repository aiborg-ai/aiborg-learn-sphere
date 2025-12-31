import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Chapter } from './types';

interface User {
  id: string;
  email?: string;
}

interface UseVideoProgressProps {
  user: User | null;
  contentId: string;
  courseId?: number;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  currentChapter: Chapter | null;
  lastSavedProgress: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  onProgressUpdate?: (progress: number) => void;
  setWatchedPercentage: (percentage: number) => void;
  setLastSavedProgress: (progress: number) => void;
}

export function useVideoProgress({
  user,
  contentId,
  courseId,
  currentTime,
  duration,
  playbackSpeed,
  currentChapter,
  lastSavedProgress,
  videoRef,
  onProgressUpdate,
  setWatchedPercentage,
  setLastSavedProgress,
}: UseVideoProgressProps) {
  const loadProgress = useCallback(async () => {
    if (!user || !contentId) return;

    try {
      const { data } = await supabase
        .from('content_views')
        .select('progress_percentage, metadata')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const savedTime = data.metadata?.currentTime || 0;
        if (videoRef.current) {
          videoRef.current.currentTime = savedTime;
        }
        setWatchedPercentage(data.progress_percentage || 0);
        setLastSavedProgress(data.progress_percentage || 0);
      }
    } catch (_error) {
      logger._error('Error loading progress:', _error);
    }
  }, [user, contentId, videoRef, setWatchedPercentage, setLastSavedProgress]);

  const saveProgress = useCallback(async () => {
    if (!user || !contentId || !videoRef.current || !duration) return;

    const currentProgress = (currentTime / duration) * 100;

    // Only save if progress changed significantly (more than 1%)
    if (Math.abs(currentProgress - lastSavedProgress) < 1) return;

    try {
      await supabase.from('content_views').upsert(
        {
          user_id: user.id,
          content_id: contentId,
          content_type: 'video',
          course_id: courseId,
          progress_percentage: currentProgress,
          duration_seconds: Math.floor(currentTime),
          completion_status: currentProgress >= 95 ? 'completed' : 'in_progress',
          metadata: {
            currentTime,
            duration,
            playbackSpeed,
            lastChapter: currentChapter?.id,
          },
        },
        {
          onConflict: 'user_id,content_id,content_type',
        }
      );

      setLastSavedProgress(currentProgress);

      // Update user progress if part of a course
      if (courseId) {
        await supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            course_id: courseId,
            progress_percentage: currentProgress,
            time_spent_minutes: Math.floor(currentTime / 60),
            current_position: JSON.stringify({ videoId: contentId, timestamp: currentTime }),
          },
          {
            onConflict: 'user_id,course_id',
          }
        );
      }

      // Trigger callback if provided
      if (onProgressUpdate) {
        onProgressUpdate(currentProgress);
      }
    } catch (_error) {
      logger._error('Error saving progress:', _error);
    }
  }, [
    user,
    contentId,
    courseId,
    currentTime,
    duration,
    playbackSpeed,
    currentChapter,
    lastSavedProgress,
    videoRef,
    onProgressUpdate,
    setLastSavedProgress,
  ]);

  useEffect(() => {
    loadProgress();

    const interval = setInterval(() => {
      saveProgress();
    }, 30000); // Save progress every 30 seconds

    return () => {
      clearInterval(interval);
      saveProgress();
    };
  }, [loadProgress, saveProgress]);

  return { saveProgress };
}
