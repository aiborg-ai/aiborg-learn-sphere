import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LearningVelocityService } from '@/services/analytics/LearningVelocityService';
import type { LearningVelocityMetrics } from '@/services/analytics/types';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  Clock,
  Award,
  Loader2,
  Activity,
  Flame,
} from '@/components/ui/icons';

export const LearningVelocityCard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<LearningVelocityMetrics | null>(null);

  const loadVelocityMetrics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await LearningVelocityService.calculateLearningVelocity(user.id);
      setMetrics(data);
    } catch (_error) {
      logger._error('Error loading velocity metrics:', _error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadVelocityMetrics();
    }
  }, [user, loadVelocityMetrics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'plateauing':
        return <Minus className="h-5 w-5 text-yellow-600" />;
      default:
        return <Activity className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'declining':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'plateauing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getVelocityLevel = (rate: number) => {
    if (rate >= 8) return { label: 'Exceptional', color: '#10b981' };
    if (rate >= 6) return { label: 'Fast', color: '#3b82f6' };
    if (rate >= 4) return { label: 'Moderate', color: '#f59e0b' };
    if (rate >= 2) return { label: 'Slow', color: '#f97316' };
    return { label: 'Very Slow', color: '#ef4444' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Complete assessments to calculate your learning velocity!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const velocityLevel = getVelocityLevel(metrics.learningRate);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Learning Velocity
            </CardTitle>
            <CardDescription>Your learning speed and progress rate</CardDescription>
          </div>
          <Badge className={getTrendColor(metrics.improvementTrend)}>
            {metrics.improvementTrend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speedometer Gauge */}
        <div className="relative flex flex-col items-center">
          {/* SVG Speedometer */}
          <svg width="200" height="120" viewBox="0 0 200 120" className="mb-2">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Colored Arc - represents velocity */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={velocityLevel.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(metrics.learningRate / 10) * 251.2} 251.2`}
              className="transition-all duration-700 ease-out"
            />

            {/* Needle */}
            <g transform={`rotate(${(metrics.learningRate / 10) * 180 - 90} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="40"
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="6" fill="#1f2937" />
            </g>

            {/* Center Display */}
            <text
              x="100"
              y="95"
              textAnchor="middle"
              className="text-3xl font-bold"
              fill={velocityLevel.color}
            >
              {metrics.learningRate.toFixed(1)}
            </text>
            <text x="100" y="110" textAnchor="middle" className="text-xs" fill="#6b7280">
              {velocityLevel.label}
            </text>
          </svg>

          {/* Scale Labels */}
          <div className="w-full flex justify-between text-xs text-muted-foreground px-4">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              {getTrendIcon(metrics.improvementTrend)}
              <span>Trend</span>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {metrics.improvementTrend}
              {metrics.abilityChange > 0 && (
                <span className="text-green-600 ml-1">+{metrics.abilityChange.toFixed(1)}%</span>
              )}
              {metrics.abilityChange < 0 && (
                <span className="text-red-600 ml-1">{metrics.abilityChange.toFixed(1)}%</span>
              )}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Next Level</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.timeToNextLevel < 999
                ? `${metrics.timeToNextLevel} hours`
                : 'Keep learning!'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Flame className="h-4 w-4 text-orange-600" />
              <span>Streak</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.streakDays} {metrics.streakDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-purple-600" />
              <span>Accuracy</span>
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(metrics.recentAccuracy)}%</p>
          </div>
        </div>

        {/* Engagement Score Bar */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Engagement Score
            </span>
            <span className="font-semibold">{Math.round(metrics.engagementScore)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${metrics.engagementScore}%`,
                backgroundColor:
                  metrics.engagementScore >= 80
                    ? '#10b981'
                    : metrics.engagementScore >= 60
                      ? '#3b82f6'
                      : metrics.engagementScore >= 40
                        ? '#f59e0b'
                        : '#ef4444',
              }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Insights</p>
          <div className="space-y-2">
            {metrics.improvementTrend === 'accelerating' && (
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-xs text-green-800">
                  Excellent progress! Your learning rate is accelerating. Keep up the great work!
                </p>
              </div>
            )}
            {metrics.improvementTrend === 'declining' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-xs text-red-800">
                  Your learning velocity is slowing down. Try shorter study sessions or different
                  content types.
                </p>
              </div>
            )}
            {metrics.improvementTrend === 'plateauing' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <Minus className="h-4 w-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  You've reached a plateau. Challenge yourself with more advanced content to boost
                  learning velocity.
                </p>
              </div>
            )}
            {metrics.streakDays >= 7 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                <Flame className="h-4 w-4 text-orange-600 mt-0.5" />
                <p className="text-xs text-orange-800">
                  Amazing {metrics.streakDays}-day streak! Consistency is key to mastery.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
