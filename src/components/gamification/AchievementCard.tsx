/**
 * Achievement Card Component
 * Displays a single achievement/badge with unlock status
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Award, Star, Share2 } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/services/gamification';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  isUnlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
  onShare?: () => void;
}

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-500',
  diamond: 'from-purple-400 to-pink-500',
};

const TIER_TEXT_COLORS = {
  bronze: 'text-amber-700',
  silver: 'text-gray-600',
  gold: 'text-yellow-600',
  platinum: 'text-cyan-500',
  diamond: 'text-purple-500',
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
};

export function AchievementCard({
  achievement,
  userAchievement,
  isUnlocked = false,
  size = 'md',
  showPoints = true,
  onShare,
}: AchievementCardProps) {
  const unlocked = isUnlocked || !!userAchievement;
  const earnedDate = userAchievement?.earned_at
    ? new Date(userAchievement.earned_at).toLocaleDateString()
    : null;

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  return (
    <Card
      className={`${sizeClasses[size]} ${
        unlocked
          ? 'border-2 bg-gradient-to-br from-white to-gray-50'
          : 'border bg-gray-50 opacity-60'
      } transition-all hover:scale-105`}
    >
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          {/* Badge Icon */}
          <div className="relative flex-shrink-0">
            <div
              className={`${iconSizes[size]} rounded-full ${
                unlocked
                  ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]} shadow-lg`
                  : 'bg-gray-300'
              } flex items-center justify-center text-2xl`}
            >
              {unlocked ? (
                <span className="text-3xl">{TIER_ICONS[achievement.tier]}</span>
              ) : (
                <Lock className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {/* Tier badge */}
            {unlocked && (
              <div className="absolute -top-1 -right-1">
                <Star className={`h-4 w-4 fill-yellow-400 text-yellow-400`} />
              </div>
            )}
          </div>

          {/* Achievement Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4
                  className={`font-semibold ${
                    size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
                  } ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}
                >
                  {achievement.name}
                </h4>

                <p
                  className={`${
                    size === 'sm' ? 'text-xs' : 'text-sm'
                  } text-gray-600 mt-1 line-clamp-2`}
                >
                  {achievement.description}
                </p>
              </div>

              {/* Tier Badge */}
              <Badge
                variant="outline"
                className={`${TIER_TEXT_COLORS[achievement.tier]} border-current text-xs`}
              >
                {achievement.tier}
              </Badge>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {showPoints && (
                  <div className="flex items-center gap-1 text-sm">
                    <Award className="h-4 w-4 text-orange-500" />
                    <span className={unlocked ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                      {achievement.points_value} pts
                    </span>
                  </div>
                )}

                {earnedDate && <span className="text-xs text-gray-500">Earned {earnedDate}</span>}

                {!unlocked &&
                  achievement.rarity_percentage &&
                  achievement.rarity_percentage < 25 && (
                    <Badge variant="secondary" className="text-xs">
                      Rare ({achievement.rarity_percentage}%)
                    </Badge>
                  )}
              </div>

              {unlocked && onShare && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={onShare}
                >
                  <Share2 className="h-3 w-3" />
                  <span className="text-xs">Share</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
