/**
 * Assessment Timer Hook
 * Tracks time spent on assessments with pause/resume support
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAssessmentTimerOptions {
  autoStart?: boolean;
  onTick?: (seconds: number) => void;
}

interface UseAssessmentTimerReturn {
  /** Total seconds elapsed */
  elapsedSeconds: number;
  /** Whether timer is currently running */
  isRunning: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset the timer to 0 */
  reset: () => void;
  /** Get formatted time string (MM:SS) */
  formattedTime: string;
}

export function useAssessmentTimer(
  options: UseAssessmentTimerOptions = {}
): UseAssessmentTimerReturn {
  const { autoStart = true, onTick } = options;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);

  // Start the timer
  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }
  }, [isRunning]);

  // Pause the timer
  const pause = useCallback(() => {
    if (isRunning && startTimeRef.current) {
      accumulatedTimeRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      startTimeRef.current = null;
      setIsRunning(false);
    }
  }, [isRunning]);

  // Resume the timer
  const resume = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }
  }, [isRunning]);

  // Reset the timer
  const reset = useCallback(() => {
    setElapsedSeconds(0);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = isRunning ? Date.now() : null;
  }, [isRunning]);

  // Format time as MM:SS
  const formattedTime = useCallback(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedSeconds])();

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = startTimeRef.current || Date.now();

      intervalRef.current = setInterval(() => {
        const currentElapsed = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0;
        const totalElapsed = accumulatedTimeRef.current + currentElapsed;
        setElapsedSeconds(totalElapsed);
        onTick?.(totalElapsed);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    elapsedSeconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
    formattedTime,
  };
}
