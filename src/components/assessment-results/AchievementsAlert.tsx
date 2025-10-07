import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { Achievement } from './types';

interface AchievementsAlertProps {
  achievements: Achievement[];
}

export function AchievementsAlert({ achievements }: AchievementsAlertProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <Trophy className="h-4 w-4 text-yellow-600" />
      <AlertDescription>
        <div className="font-semibold mb-2">New Achievements Unlocked!</div>
        <div className="flex flex-wrap gap-2">
          {achievements.map(achievement => (
            <Badge key={achievement.id} variant="secondary">
              {achievement.name}
            </Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
