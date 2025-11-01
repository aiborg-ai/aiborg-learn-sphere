/**
 * Achievement Share Card
 * Visual card for sharing achievements on social media
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Sparkles } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/services/gamification';

interface AchievementShareCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  userName?: string;
  compact?: boolean;
}

const TIER_COLORS = {
  bronze: 'from-amber-700 via-amber-600 to-amber-900',
  silver: 'from-gray-400 via-gray-300 to-gray-600',
  gold: 'from-yellow-400 via-yellow-300 to-yellow-600',
  platinum: 'from-cyan-300 via-cyan-200 to-cyan-500',
  diamond: 'from-purple-400 via-pink-300 to-pink-500',
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
};

const TIER_GRADIENTS = {
  bronze: 'from-amber-50 to-orange-100',
  silver: 'from-gray-50 to-gray-200',
  gold: 'from-yellow-50 to-amber-100',
  platinum: 'from-cyan-50 to-blue-100',
  diamond: 'from-purple-50 to-pink-100',
};

export function AchievementShareCard({
  achievement,
  userAchievement,
  userName = 'AIBORG Learner',
  compact = false,
}: AchievementShareCardProps) {
  const earnedDate = userAchievement?.earned_at
    ? new Date(userAchievement.earned_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  if (compact) {
    return (
      <div className="relative overflow-hidden">
        <div
          className={`bg-gradient-to-br ${TIER_GRADIENTS[achievement.tier]} border-2 border-${achievement.tier}-400 rounded-lg p-4`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`h-16 w-16 rounded-full bg-gradient-to-br ${TIER_COLORS[achievement.tier]} flex items-center justify-center shadow-lg`}
            >
              <span className="text-3xl">{TIER_ICONS[achievement.tier]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-bold text-gray-600 uppercase">
                  Achievement Unlocked!
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{achievement.name}</h3>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">
                {achievement.points_value} points
              </span>
            </div>
            <Badge variant="outline" className="capitalize">
              {achievement.tier}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden shadow-2xl max-w-md mx-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Header Banner */}
      <div
        className={`relative bg-gradient-to-r ${TIER_GRADIENTS[achievement.tier]} py-6 px-6 border-b-4 border-${achievement.tier}-400`}
      >
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <div
              className={`relative h-24 w-24 rounded-full bg-gradient-to-br ${TIER_COLORS[achievement.tier]} flex items-center justify-center shadow-2xl ring-4 ring-white`}
            >
              <span className="text-5xl">{TIER_ICONS[achievement.tier]}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-600 animate-pulse" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Achievement Unlocked!
            </span>
            <Sparkles className="h-5 w-5 text-yellow-600 animate-pulse" />
          </div>
        </div>
      </div>

      <CardContent className="relative p-6 bg-white">
        {/* Achievement Details */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{achievement.name}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{achievement.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="h-5 w-5 text-orange-500" />
              <span className="text-xs text-gray-600 font-medium">Points</span>
            </div>
            <p className="text-center text-2xl font-bold text-orange-600">
              {achievement.points_value}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="h-5 w-5 text-purple-500" />
              <span className="text-xs text-gray-600 font-medium">Tier</span>
            </div>
            <p className="text-center text-lg font-bold text-purple-600 capitalize">
              {achievement.tier}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Earned by</p>
              <p className="font-semibold text-gray-900">{userName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">{earnedDate}</p>
            </div>
          </div>
        </div>

        {/* AIBORG Branding */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-gray-900">AIBORG</span>
            <span className="text-sm text-gray-500">AI Learning & Assessment</span>
          </div>
        </div>
      </CardContent>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-4">
        <Sparkles className="h-8 w-8 text-yellow-400 opacity-50" />
      </div>
      <div className="absolute bottom-0 left-0 p-4">
        <Sparkles className="h-6 w-6 text-purple-400 opacity-30" />
      </div>
    </Card>
  );
}
