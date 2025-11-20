/**
 * Enhanced Assessment Progress Indicator
 * Shows real-time progress, ability, and engagement metrics during assessment
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
} from '@/components/ui/icons';
import { ADAPTIVE_CONFIG, getAugmentationLevel } from '@/config/adaptiveAssessment';

interface AssessmentProgressIndicatorProps {
  questionsAnswered: number;
  currentAbility: number;
  confidenceLevel: number;
  performanceTrend: 'up' | 'down' | 'stable';
  lastAnswerCorrect: boolean | null;
  estimatedQuestionsRemaining?: number;
  currentDifficulty?: string;
}

export function AssessmentProgressIndicator({
  questionsAnswered,
  currentAbility,
  confidenceLevel,
  performanceTrend,
  lastAnswerCorrect,
  estimatedQuestionsRemaining,
  currentDifficulty,
}: AssessmentProgressIndicatorProps) {
  const augmentationInfo = getAugmentationLevel(currentAbility);
  const progressPercentage = (questionsAnswered / ADAPTIVE_CONFIG.MAX_QUESTIONS) * 100;

  const getTrendIcon = () => {
    switch (performanceTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendLabel = () => {
    switch (performanceTrend) {
      case 'up':
        return 'Improving';
      case 'down':
        return 'Challenging';
      default:
        return 'Steady';
    }
  };

  const getConfidenceLabel = () => {
    if (confidenceLevel >= 80) return 'High Confidence';
    if (confidenceLevel >= 60) return 'Moderate';
    if (confidenceLevel >= 40) return 'Building';
    return 'Early Stages';
  };

  const getConfidenceColor = () => {
    if (confidenceLevel >= 80) return 'text-green-600';
    if (confidenceLevel >= 60) return 'text-blue-600';
    if (confidenceLevel >= 40) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
      <CardContent className="pt-6">
        {/* Main Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Assessment Progress</span>
            </div>
            <Badge variant="outline" className="bg-white">
              {questionsAnswered} / {ADAPTIVE_CONFIG.MAX_QUESTIONS} Questions
            </Badge>
          </div>

          <Progress value={progressPercentage} className="h-3" />

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {/* Current Level */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-600 font-medium">Current Level</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{augmentationInfo.label}</p>
              <p className="text-xs text-gray-500">{augmentationInfo.percentage}%</p>
            </div>

            {/* Performance Trend */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {getTrendIcon()}
                <span className="text-xs text-gray-600 font-medium">Trend</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{getTrendLabel()}</p>
              {lastAnswerCorrect !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {lastAnswerCorrect ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    {lastAnswerCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              )}
            </div>

            {/* Confidence Level */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`h-4 w-4 ${getConfidenceColor()}`} />
                <span className="text-xs text-gray-600 font-medium">Confidence</span>
              </div>
              <p className={`text-sm font-bold ${getConfidenceColor()}`}>
                {confidenceLevel.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">{getConfidenceLabel()}</p>
            </div>

            {/* Estimated Remaining */}
            {estimatedQuestionsRemaining !== undefined && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">Remaining</span>
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {estimatedQuestionsRemaining === 0
                    ? 'Almost Done!'
                    : `~${estimatedQuestionsRemaining}`}
                </p>
                <p className="text-xs text-gray-500">
                  {estimatedQuestionsRemaining === 0 ? '🎉' : 'Questions'}
                </p>
              </div>
            )}
          </div>

          {/* Current Question Difficulty */}
          {ADAPTIVE_CONFIG.UI.SHOW_DIFFICULTY_LEVEL && currentDifficulty && (
            <div className="flex items-center justify-center mt-4 gap-2">
              <span className="text-xs text-gray-600">Current Question:</span>
              <Badge
                variant="outline"
                className={
                  currentDifficulty === 'foundational'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : currentDifficulty === 'applied'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : currentDifficulty === 'advanced'
                        ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                }
              >
                {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
              </Badge>
            </div>
          )}

          {/* Motivational Message */}
          {questionsAnswered >= ADAPTIVE_CONFIG.MIN_QUESTIONS && confidenceLevel >= 70 && (
            <div className="mt-3 text-center">
              <p className="text-sm text-green-700 font-medium">
                ✨ Great progress! Your assessment may complete soon.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
