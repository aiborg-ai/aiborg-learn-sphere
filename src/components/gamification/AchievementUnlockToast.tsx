/**
 * Achievement Unlock Toast Component
 * Shows a celebratory notification when achievements are unlocked
 */

import React from 'react';
import { Award, Star, Sparkles, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserAchievement } from '@/services/gamification';
import type { ToastProps } from '@/types/charts';

interface AchievementUnlockToastProps {
  achievement: UserAchievement;
  onShare?: () => void;
}

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-500',
  diamond: 'from-purple-400 to-pink-500',
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
};

export function AchievementUnlockToast({ achievement, onShare }: AchievementUnlockToastProps) {
  if (!achievement.achievement) return null;

  const ach = achievement.achievement;

  return (
    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-white to-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg">
      {/* Icon */}
      <div
        className={`flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br ${
          TIER_COLORS[ach.tier]
        } shadow-lg flex-shrink-0 animate-pulse`}
      >
        <span className="text-3xl">{TIER_ICONS[ach.tier]}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-yellow-500 animate-spin" />
          <span className="text-sm font-bold text-yellow-700 uppercase tracking-wide">
            Achievement Unlocked!
          </span>
        </div>

        <h4 className="font-bold text-gray-900 text-lg mb-1">{ach.name}</h4>

        <p className="text-sm text-gray-600 mb-2">{ach.description}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-sm">
            <Award className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-orange-600">+{ach.points_value} pts</span>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-gray-700 capitalize">{ach.tier}</span>
          </div>

          {onShare && (
            <>
              <div className="h-4 w-px bg-gray-300" />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={onShare}
              >
                <Share2 className="h-3 w-3" />
                <span className="text-xs font-medium">Share</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to show achievement unlock toast with optional share callback
 * Use with toast() from shadcn/ui
 */
export function showAchievementToast(
  achievement: UserAchievement,
  toast: (props: ToastProps) => void,
  onShare?: () => void
) {
  toast({
    duration: 6000,
    className: 'p-0 border-0 bg-transparent shadow-none',
    description: <AchievementUnlockToast achievement={achievement} onShare={onShare} />,
  });
}
