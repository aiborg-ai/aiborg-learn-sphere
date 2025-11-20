/**
 * Points Display Component
 * Compact display of points, level, and streak
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Zap } from '@/components/ui/icons';
import { PointsService } from '@/services/gamification';
import type { UserProgress } from '@/services/gamification';

interface PointsDisplayProps {
  progress: UserProgress;
  variant?: 'full' | 'compact' | 'minimal';
  showStreak?: boolean;
}

export function PointsDisplay({
  progress,
  variant = 'full',
  showStreak = true,
}: PointsDisplayProps) {
  const tier = PointsService.getLevelTier(progress.current_level);
  const multiplier = progress.points_multiplier;

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center h-8 w-8 rounded-full font-bold text-white text-sm"
          style={{ backgroundColor: tier.color }}
        >
          {progress.current_level}
        </div>
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-orange-500" />
          <span className="font-semibold text-sm">{progress.total_points.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1" style={{ borderColor: tier.color }}>
          <span className="font-bold" style={{ color: tier.color }}>
            Lvl {progress.current_level}
          </span>
        </Badge>

        <div className="flex items-center gap-1 text-sm">
          <Award className="h-4 w-4 text-orange-500" />
          <span className="font-semibold">{progress.total_points.toLocaleString()}</span>
          <span className="text-gray-500">pts</span>
        </div>

        {showStreak && progress.current_streak > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            {progress.current_streak} day streak
          </Badge>
        )}

        {multiplier > 1 && (
          <Badge variant="default" className="gap-1 bg-orange-500">
            {multiplier}x
          </Badge>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
      {/* Level */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center h-12 w-12 rounded-full font-bold text-white text-lg shadow"
          style={{ backgroundColor: tier.color }}
        >
          {progress.current_level}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">Level {progress.current_level}</div>
          <div className="text-xs text-gray-500">{tier.name}</div>
        </div>
      </div>

      <div className="h-10 w-px bg-gray-300" />

      {/* Points */}
      <div>
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-orange-500" />
          <span className="text-lg font-bold text-gray-900">
            {progress.total_points.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">points</span>
        </div>
        {multiplier > 1 && (
          <div className="text-xs text-orange-600 font-medium">
            {multiplier}x point multiplier active
          </div>
        )}
      </div>

      {/* Streak */}
      {showStreak && progress.current_streak > 0 && (
        <>
          <div className="h-10 w-px bg-gray-300" />
          <div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-lg font-bold text-gray-900">{progress.current_streak}</span>
              <span className="text-sm text-gray-500">day streak</span>
            </div>
            {progress.longest_streak > progress.current_streak && (
              <div className="text-xs text-gray-500">Best: {progress.longest_streak} days</div>
            )}
          </div>
        </>
      )}

      {/* Trend Indicator */}
      <div className="ml-auto">
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Active</span>
        </div>
      </div>
    </div>
  );
}
