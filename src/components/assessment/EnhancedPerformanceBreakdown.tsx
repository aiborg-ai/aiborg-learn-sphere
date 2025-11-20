/**
 * EnhancedPerformanceBreakdown Component
 * Visualizes assessment performance with better insights
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Target,
  Award,
  Minus,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface CategoryPerformance {
  category_name: string;
  score_percentage: number;
  correct_answers: number;
  questions_answered: number;
}

interface EnhancedPerformanceBreakdownProps {
  performance: CategoryPerformance[];
  averageScore: number;
}

function getPerformanceLevel(percentage: number): {
  label: string;
  color: string;
  icon: typeof CheckCircle2;
  bgColor: string;
} {
  if (percentage >= 80) {
    return {
      label: 'Excellent',
      color: 'text-green-600 dark:text-green-400',
      icon: CheckCircle2,
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    };
  } else if (percentage >= 70) {
    return {
      label: 'Good',
      color: 'text-blue-600 dark:text-blue-400',
      icon: Target,
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    };
  } else if (percentage >= 60) {
    return {
      label: 'Fair',
      color: 'text-yellow-600 dark:text-yellow-400',
      icon: Minus,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    };
  } else {
    return {
      label: 'Needs Improvement',
      color: 'text-orange-600 dark:text-orange-400',
      icon: AlertTriangle,
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    };
  }
}

export function EnhancedPerformanceBreakdown({
  performance,
  averageScore,
}: EnhancedPerformanceBreakdownProps) {
  if (performance.length === 0) {
    return null;
  }

  // Sort by score to show weakest first (for focus)
  const sortedPerformance = [...performance].sort(
    (a, b) => a.score_percentage - b.score_percentage
  );

  // Identify strengths and weaknesses
  const strengths = performance.filter(p => p.score_percentage >= 80);
  const weaknesses = performance.filter(p => p.score_percentage < 70);

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Analysis
          </CardTitle>
          <CardDescription>Detailed breakdown of your performance by category</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {strengths.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Strong Areas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {weaknesses.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Focus Areas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {averageScore.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Overall</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              By Category
            </h4>
            {sortedPerformance.map((cat, index) => {
              const level = getPerformanceLevel(cat.score_percentage);
              const Icon = level.icon;
              const isAboveAverage = cat.score_percentage >= averageScore;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className={cn('h-4 w-4 flex-shrink-0', level.color)} />
                      <span className="font-medium truncate">{cat.category_name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant="outline" className={cn('text-xs', level.bgColor)}>
                        {level.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {cat.correct_answers}/{cat.questions_answered}
                      </span>
                      <div className="flex items-center gap-1">
                        {isAboveAverage ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-orange-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <Progress value={cat.score_percentage} className="h-2" />
                    {/* Average marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary"
                      style={{ left: `${averageScore}%` }}
                      title={`Average: ${averageScore.toFixed(0)}%`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={cn('font-semibold', level.color)}>
                      {cat.score_percentage.toFixed(1)}%
                    </span>
                    {!isAboveAverage && (
                      <span className="text-orange-600 dark:text-orange-400">
                        {(averageScore - cat.score_percentage).toFixed(0)}% below average
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {strengths.length > 0 && (
            <Card className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-900 dark:text-green-100">Your Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0" />
                      <span className="text-sm">{s.category_name}</span>
                      <span className="text-sm font-semibold ml-auto">
                        {s.score_percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <Card className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/10 dark:to-amber-950/10 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-orange-900 dark:text-orange-100">Areas to Improve</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400 flex-shrink-0" />
                      <span className="text-sm">{w.category_name}</span>
                      <span className="text-sm font-semibold ml-auto">
                        {w.score_percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
