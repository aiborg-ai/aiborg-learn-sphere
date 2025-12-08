/**
 * Difficulty Adjustment Panel
 * Interactive UI for visualizing and controlling adaptive difficulty
 * Shows performance trends, ability level, and difficulty recommendations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Gauge,
  Settings,
  Info,
  ChevronUp,
  Minus,
} from '@/components/ui/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DifficultyLevel {
  value: number;
  label: string;
  color: string;
  description: string;
}

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    value: -2,
    label: 'Beginner',
    color: 'text-green-600 bg-green-50',
    description: 'Foundational concepts',
  },
  {
    value: -1,
    label: 'Elementary',
    color: 'text-blue-600 bg-blue-50',
    description: 'Basic application',
  },
  {
    value: 0,
    label: 'Intermediate',
    color: 'text-purple-600 bg-purple-50',
    description: 'Standard complexity',
  },
  {
    value: 1,
    label: 'Advanced',
    color: 'text-orange-600 bg-orange-50',
    description: 'Complex scenarios',
  },
  { value: 2, label: 'Expert', color: 'text-red-600 bg-red-50', description: 'Strategic thinking' },
];

interface PerformanceTrend {
  question_number: number;
  difficulty: number;
  was_correct: boolean;
}

interface DifficultyAdjustmentPanelProps {
  currentAbility: number;
  accuracy: number;
  questionsAnswered: number;
  performanceTrend: PerformanceTrend[];
  onDifficultyChange?: (newDifficulty: number) => void;
  showRecommendations?: boolean;
  allowManualAdjustment?: boolean;
  compact?: boolean;
}

export function DifficultyAdjustmentPanel({
  currentAbility,
  accuracy,
  questionsAnswered,
  performanceTrend,
  onDifficultyChange,
  showRecommendations = true,
  allowManualAdjustment = true,
  compact = false,
}: DifficultyAdjustmentPanelProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(currentAbility);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setSelectedDifficulty(currentAbility);
  }, [currentAbility]);

  const getCurrentLevel = (): DifficultyLevel => {
    const closestLevel = DIFFICULTY_LEVELS.reduce((prev, curr) => {
      return Math.abs(curr.value - currentAbility) < Math.abs(prev.value - currentAbility)
        ? curr
        : prev;
    });
    return closestLevel;
  };

  const getRecommendedAdjustment = (): {
    direction: 'increase' | 'decrease' | 'maintain';
    icon: typeof TrendingUp;
    color: string;
    message: string;
  } => {
    if (accuracy >= 85 && currentAbility > 0.5) {
      return {
        direction: 'increase',
        icon: TrendingUp,
        color: 'text-green-600',
        message: `Excellent performance (${accuracy.toFixed(1)}%)! Ready for more challenging content.`,
      };
    } else if (accuracy <= 50 && currentAbility < -0.5) {
      return {
        direction: 'decrease',
        icon: TrendingDown,
        color: 'text-red-600',
        message: `Consider reviewing fundamentals (${accuracy.toFixed(1)}% accuracy). Easier content recommended.`,
      };
    } else if (accuracy >= 70 && accuracy < 85) {
      return {
        direction: 'increase',
        icon: ChevronUp,
        color: 'text-blue-600',
        message: `Good progress (${accuracy.toFixed(1)}%)! You're ready to advance.`,
      };
    } else {
      return {
        direction: 'maintain',
        icon: Minus,
        color: 'text-purple-600',
        message: `Maintain current difficulty. Performance is appropriate (${accuracy.toFixed(1)}%).`,
      };
    }
  };

  const handleDifficultyChange = (value: number[]) => {
    const newDifficulty = value[0];
    setSelectedDifficulty(newDifficulty);
    if (onDifficultyChange) {
      onDifficultyChange(newDifficulty);
    }
  };

  const getPerformanceTrendIcon = () => {
    if (performanceTrend.length < 3) return null;

    const recentPerformance = performanceTrend.slice(-5);
    const correctCount = recentPerformance.filter(p => p.was_correct).length;
    const recentAccuracy = (correctCount / recentPerformance.length) * 100;

    if (recentAccuracy >= 80) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (recentAccuracy <= 40) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-blue-600" />;
    }
  };

  const currentLevel = getCurrentLevel();
  const recommendation = getRecommendedAdjustment();
  const RecommendationIcon = recommendation.icon;

  const abilityPercentage = ((currentAbility + 3) / 6) * 100; // Map -3 to +3 range to 0-100%

  return (
    <Card className={compact ? '' : 'shadow-lg'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Adaptive Difficulty
            </CardTitle>
            <CardDescription className="mt-1">
              Current level: <span className="font-semibold">{currentLevel.label}</span>
            </CardDescription>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Difficulty automatically adjusts based on your performance using IRT (Item
                  Response Theory). Ability estimate: {currentAbility.toFixed(2)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Current Level Badge */}
        <div className="mt-4">
          <Badge className={cn('text-sm px-3 py-1', currentLevel.color)}>
            {currentLevel.label} - {currentLevel.description}
          </Badge>
        </div>

        {/* Ability Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Ability Level</span>
            <div className="flex items-center gap-2">
              {getPerformanceTrendIcon()}
              <span className="text-sm font-bold">{currentAbility.toFixed(2)}</span>
            </div>
          </div>
          <Progress value={abilityPercentage} className="h-3" />
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>Beginner (-3)</span>
            <span>Intermediate (0)</span>
            <span>Expert (+3)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Stats */}
        {!compact && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{accuracy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{questionsAnswered}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="text-center p-3 bg-secondary/20 rounded-lg">
              <Gauge className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{currentLevel.label}</p>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
          </div>
        )}

        {/* Recommendation Card */}
        {showRecommendations && (
          <div
            className={cn(
              'p-4 rounded-lg border-l-4',
              recommendation.direction === 'increase'
                ? 'bg-green-50 dark:bg-green-950 border-green-500'
                : recommendation.direction === 'decrease'
                  ? 'bg-red-50 dark:bg-red-950 border-red-500'
                  : 'bg-blue-50 dark:bg-blue-950 border-blue-500'
            )}
          >
            <div className="flex items-start gap-3">
              <RecommendationIcon className={`h-5 w-5 ${recommendation.color} mt-0.5`} />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">
                  {recommendation.direction === 'increase'
                    ? '📈 Increase Difficulty'
                    : recommendation.direction === 'decrease'
                      ? '📉 Decrease Difficulty'
                      : '✅ Current Level Optimal'}
                </p>
                <p className="text-xs text-muted-foreground">{recommendation.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Difficulty Adjustment */}
        {allowManualAdjustment && !compact && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Manual Adjustment</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Target Difficulty</span>
                    <span className="text-xs font-semibold">
                      {DIFFICULTY_LEVELS.find(l => Math.abs(l.value - selectedDifficulty) < 0.5)
                        ?.label || 'Custom'}
                    </span>
                  </div>
                  <Slider
                    value={[selectedDifficulty]}
                    onValueChange={handleDifficultyChange}
                    min={-2}
                    max={2}
                    step={0.5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Easier</span>
                    <span>Harder</span>
                  </div>
                </div>

                {selectedDifficulty !== currentAbility && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>
                      Changing difficulty from {currentAbility.toFixed(2)} to{' '}
                      {selectedDifficulty.toFixed(2)}
                    </span>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    if (onDifficultyChange && selectedDifficulty !== currentAbility) {
                      onDifficultyChange(selectedDifficulty);
                    }
                  }}
                  disabled={selectedDifficulty === currentAbility}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Performance Trend Visualization */}
        {!compact && performanceTrend.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Recent Performance
            </h4>
            <div className="flex items-end justify-between h-20 gap-1">
              {performanceTrend.slice(-10).map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      point.was_correct ? 'bg-green-500' : 'bg-red-400'
                    )}
                    style={{
                      height: `${Math.abs(point.difficulty + 3) * 13}%`,
                      minHeight: '8px',
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{point.question_number}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Green = Correct • Red = Incorrect • Height = Difficulty
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for in-quiz display
 */
export function DifficultyAdjustmentCompact({
  currentAbility,
  accuracy,
  questionsAnswered,
  performanceTrend,
}: Omit<
  DifficultyAdjustmentPanelProps,
  'compact' | 'showRecommendations' | 'allowManualAdjustment'
>) {
  return (
    <DifficultyAdjustmentPanel
      currentAbility={currentAbility}
      accuracy={accuracy}
      questionsAnswered={questionsAnswered}
      performanceTrend={performanceTrend}
      compact={true}
      showRecommendations={false}
      allowManualAdjustment={false}
    />
  );
}
