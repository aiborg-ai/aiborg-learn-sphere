/**
 * QuizTimer Component
 * Countdown timer for timed quizzes
 */

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface QuizTimerProps {
  timeLimitMinutes: number;
  onTimeout: () => void;
  startTime: Date;
}

export function QuizTimer({ timeLimitMinutes, onTimeout, startTime }: QuizTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimitMinutes * 60);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, timeLimitMinutes * 60 - elapsed);

      setTimeRemaining(remaining);

      // Warn when 5 minutes left
      if (remaining <= 300 && remaining > 0 && !hasWarned) {
        setHasWarned(true);
      }

      // Timeout
      if (remaining === 0) {
        onTimeout();
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timeLimitMinutes, startTime, onTimeout, hasWarned]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentageRemaining = (timeRemaining / (timeLimitMinutes * 60)) * 100;
  const isLowTime = timeRemaining <= 300; // 5 minutes or less
  const isCritical = timeRemaining <= 60; // 1 minute or less

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock
            className={`h-5 w-5 ${
              isCritical
                ? 'text-red-500 animate-pulse'
                : isLowTime
                  ? 'text-orange-500'
                  : 'text-muted-foreground'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              isCritical ? 'text-red-500' : isLowTime ? 'text-orange-500' : 'text-foreground'
            }`}
          >
            Time Remaining: {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <Progress
        value={percentageRemaining}
        className={`h-2 ${isCritical ? 'bg-red-100' : isLowTime ? 'bg-orange-100' : ''}`}
      />

      {isLowTime && !isCritical && (
        <Alert variant="default" className="border-orange-500">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            Less than 5 minutes remaining! Please review and submit your answers.
          </AlertDescription>
        </Alert>
      )}

      {isCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Less than 1 minute remaining! Quiz will auto-submit soon.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
