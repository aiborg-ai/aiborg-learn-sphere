/**
 * Live Stats Panel
 * Real-time statistics sidebar during assessment
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  Target,
  Award,
  TrendingUp,
  Zap,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface LiveStatsPanelProps {
  questionsAnswered: number;
  correctAnswers: number;
  totalPoints: number;
  averageTimePerQuestion: number;
  currentStreak: number;
  levelProgress: number;
  nearbyAchievements?: Array<{
    name: string;
    progress: number;
    total: number;
  }>;
  leaderboardChange?: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function LiveStatsPanel({
  questionsAnswered,
  correctAnswers,
  totalPoints,
  averageTimePerQuestion,
  currentStreak,
  levelProgress,
  nearbyAchievements = [],
  leaderboardChange = 0,
  isCollapsed = false,
  onToggle,
}: LiveStatsPanelProps) {
  const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
  const [animatedPoints, setAnimatedPoints] = useState(0);

  // Animate points counter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedPoints < totalPoints) {
        setAnimatedPoints(Math.min(animatedPoints + Math.ceil((totalPoints - animatedPoints) / 10), totalPoints));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [animatedPoints, totalPoints]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getAccuracyColor = () => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-blue-600';
    if (accuracy >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAccuracyBgColor = () => {
    if (accuracy >= 80) return 'bg-green-50';
    if (accuracy >= 60) return 'bg-blue-50';
    if (accuracy >= 40) return 'bg-orange-50';
    return 'bg-red-50';
  };

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="rounded-l-lg rounded-r-none shadow-lg bg-white hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-80">
      <Card className="shadow-2xl border-l-4 border-blue-500 rounded-l-lg rounded-r-none">
        <CardHeader className="pb-3 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="absolute -left-10 top-3 rounded-r-none bg-white hover:bg-gray-50 shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Live Stats
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Points */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-gray-700">Points Earned</span>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">{animatedPoints}</p>
            {currentStreak > 1 && (
              <Badge variant="secondary" className="mt-2 gap-1">
                <Zap className="h-3 w-3" />
                {currentStreak}x Streak
              </Badge>
            )}
          </div>

          {/* Accuracy */}
          <div className={`${getAccuracyBgColor()} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5" />
              <span className="font-semibold text-gray-700">Accuracy</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${getAccuracyColor()}`}>
                  {accuracy.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">
                  {correctAnswers} / {questionsAnswered} correct
                </p>
              </div>
              <div className="text-right">
                <CheckCircle className="h-6 w-6 text-green-500 inline-block" />
                <span className="text-sm text-gray-500 ml-1">{correctAnswers}</span>
                <br />
                <XCircle className="h-6 w-6 text-red-500 inline-block" />
                <span className="text-sm text-gray-500 ml-1">{questionsAnswered - correctAnswers}</span>
              </div>
            </div>
          </div>

          {/* Average Time */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-700">Avg Time/Question</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatTime(averageTimePerQuestion)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {averageTimePerQuestion < 30 ? 'Quick thinker! 🚀' :
               averageTimePerQuestion < 60 ? 'Steady pace 👍' :
               'Take your time ⏰'}
            </p>
          </div>

          {/* Level Progress */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Level Progress</span>
            </div>
            <Progress value={levelProgress} className="h-2 mb-2" />
            <p className="text-sm text-gray-600">{levelProgress.toFixed(0)}% to next level</p>
          </div>

          {/* Nearby Achievements */}
          {nearbyAchievements.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-gray-700">Almost There!</span>
              </div>
              <div className="space-y-2">
                {nearbyAchievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="bg-white rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{achievement.name}</span>
                      <span className="text-xs text-gray-500">
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / achievement.total) * 100}
                      className="h-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Change */}
          {leaderboardChange !== 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-700">Leaderboard</span>
              </div>
              <div className="flex items-center gap-2">
                {leaderboardChange > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-bold">
                      +{leaderboardChange} positions!
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600">Keep going! 💪</span>
                )}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className="text-center p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              {accuracy >= 80 ? '🔥 You\'re on fire!' :
               accuracy >= 60 ? '💪 Great job!' :
               accuracy >= 40 ? '📚 Keep learning!' :
               '🎯 Stay focused!'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
