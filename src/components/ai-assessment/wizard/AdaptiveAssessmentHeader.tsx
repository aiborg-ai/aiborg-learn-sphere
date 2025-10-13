import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from 'lucide-react';
import { ADAPTIVE_CONFIG } from '@/config/adaptiveAssessment';
import type { AdaptiveQuestion } from '@/services/AdaptiveAssessmentEngine';

interface AdaptiveAssessmentHeaderProps {
  questionsAnswered: number;
  estimatedRemaining: number;
  confidenceLevel: number;
  lastAnswerCorrect: boolean | null;
  performanceTrend: 'up' | 'down' | 'stable';
  currentQuestion: AdaptiveQuestion;
}

export const AdaptiveAssessmentHeader: React.FC<AdaptiveAssessmentHeaderProps> = ({
  questionsAnswered,
  estimatedRemaining,
  confidenceLevel,
  lastAnswerCorrect,
  performanceTrend,
  currentQuestion,
}) => {
  const difficultyColor =
    currentQuestion.difficulty_level === 'foundational'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : currentQuestion.difficulty_level === 'applied'
        ? 'bg-green-50 text-green-700 border-green-200'
        : currentQuestion.difficulty_level === 'advanced'
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <CardHeader>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">AIBORG Assessment</CardTitle>
            <CardDescription>Adaptive difficulty • Personalized questions</CardDescription>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Q{questionsAnswered + 1}
            {estimatedRemaining > 0 && ` • ~${estimatedRemaining} more`}
          </Badge>
          {ADAPTIVE_CONFIG.UI.SHOW_PERFORMANCE_TREND && lastAnswerCorrect !== null && (
            <div className="flex items-center gap-1 text-sm">
              {lastAnswerCorrect ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              {performanceTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
              {performanceTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
              {performanceTrend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
            </div>
          )}
        </div>
      </div>

      {ADAPTIVE_CONFIG.UI.ENABLE_PROGRESS_VIZ && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{confidenceLevel}% confidence</span>
          </div>
          <Progress value={confidenceLevel} className="h-2" />
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Badge variant="secondary">{currentQuestion.category_name}</Badge>
        {ADAPTIVE_CONFIG.UI.SHOW_DIFFICULTY_LEVEL && (
          <Badge variant="outline" className={difficultyColor}>
            {currentQuestion.difficulty_level.charAt(0).toUpperCase() +
              currentQuestion.difficulty_level.slice(1)}
          </Badge>
        )}
        {currentQuestion.irt_difficulty !== undefined && (
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            IRT: {currentQuestion.irt_difficulty.toFixed(1)}
          </Badge>
        )}
      </div>
    </CardHeader>
  );
};
