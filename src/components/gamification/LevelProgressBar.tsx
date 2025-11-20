/**
 * Level Progress Bar Component
 * Shows user's current level and progress to next level
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap } from '@/components/ui/icons';
import { PointsService } from '@/services/gamification';
import type { UserProgress } from '@/services/gamification';

interface LevelProgressBarProps {
  progress: UserProgress;
  showDetails?: boolean;
  compact?: boolean;
}

export function LevelProgressBar({
  progress,
  showDetails = true,
  compact = false,
}: LevelProgressBarProps) {
  const currentLevel = progress.current_level;
  const currentPoints = progress.total_points;
  const currentStreak = progress.current_streak;
  const multiplier = progress.points_multiplier;

  // Calculate progress
  const pointsToNext = PointsService.getPointsToNextLevel(currentPoints, currentLevel);
  const levelProgress = PointsService.getLevelProgress(currentPoints, currentLevel);
  const tier = PointsService.getLevelTier(currentLevel);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center h-12 w-12 rounded-full font-bold text-white"
          style={{ backgroundColor: tier.color }}
        >
          {currentLevel}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Level {currentLevel} - {tier.name}
            </span>
            <span className="text-xs text-gray-500">{levelProgress.toFixed(0)}%</span>
          </div>
          <Progress value={levelProgress} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Level Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center h-16 w-16 rounded-full font-bold text-white text-2xl shadow-lg"
                style={{ backgroundColor: tier.color }}
              >
                {currentLevel}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Level {currentLevel}</h3>
                <p className="text-sm text-gray-600">{tier.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {currentPoints.toLocaleString()} pts
                  </Badge>
                  {multiplier > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {multiplier}x multiplier
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {currentStreak > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
                <div className="text-xs text-gray-500">day streak</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress to Level {currentLevel + 1}
              </span>
              <span className="text-sm text-gray-600">
                {pointsToNext.toLocaleString()} pts needed
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Level {currentLevel}</span>
              <span>{levelProgress.toFixed(1)}%</span>
              <span>Level {currentLevel + 1}</span>
            </div>
          </div>

          {/* Additional Details */}
          {showDetails && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {progress.lifetime_points.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Lifetime Points</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{progress.longest_streak}</div>
                <div className="text-xs text-gray-500">Longest Streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  {levelProgress.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">To Next Level</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
