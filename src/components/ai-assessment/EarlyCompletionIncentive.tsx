/**
 * Early Completion Incentive Component
 * Displays motivational messaging and potential bonuses for quick assessment completion
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Trophy, Star, Clock } from 'lucide-react';

interface EarlyCompletionIncentiveProps {
  estimatedTimeMinutes: number;
  elapsedTimeMinutes: number;
  questionCount: number;
  questionsAnswered: number;
  currentScore?: number;
}

export function EarlyCompletionIncentive({
  estimatedTimeMinutes,
  elapsedTimeMinutes,
  questionCount,
  questionsAnswered,
  currentScore,
}: EarlyCompletionIncentiveProps) {
  const timePercentageUsed = (elapsedTimeMinutes / estimatedTimeMinutes) * 100;
  const _progressPercentage = (questionsAnswered / questionCount) * 100;

  // Determine potential bonus tier
  let bonusTier: 'excellent' | 'great' | 'good' | 'standard' | null = null;
  let bonusPercentage = 0;
  let message = '';
  let icon: React.ReactNode = null;
  let colorScheme = '';

  if (timePercentageUsed < 50) {
    bonusTier = 'excellent';
    bonusPercentage = 5;
    message = "Excellent pace! You're on track for a 5% bonus!";
    icon = <Trophy className="h-4 w-4 text-yellow-600" />;
    colorScheme = 'bg-yellow-50 border-yellow-200 text-yellow-800';
  } else if (timePercentageUsed < 70) {
    bonusTier = 'great';
    bonusPercentage = 3;
    message = "Great speed! You're on track for a 3% bonus!";
    icon = <Star className="h-4 w-4 text-blue-600" />;
    colorScheme = 'bg-blue-50 border-blue-200 text-blue-800';
  } else if (timePercentageUsed < 90) {
    bonusTier = 'good';
    bonusPercentage = 1;
    message = "Good pace! You're on track for a 1% bonus!";
    icon = <Zap className="h-4 w-4 text-green-600" />;
    colorScheme = 'bg-green-50 border-green-200 text-green-800';
  } else {
    bonusTier = 'standard';
    message = 'Take your time and focus on accuracy!';
    icon = <Clock className="h-4 w-4 text-gray-600" />;
    colorScheme = 'bg-gray-50 border-gray-200 text-gray-800';
  }

  // Only show bonus incentive if score is decent (>= 50%)
  const showBonus = bonusTier !== 'standard' && (!currentScore || currentScore >= 50);

  return (
    <Alert className={`${colorScheme} border`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 space-y-2">
          <AlertDescription className="font-medium">{message}</AlertDescription>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                {Math.round(elapsedTimeMinutes)}min / {estimatedTimeMinutes}min
              </span>
            </div>

            {showBonus && (
              <Badge variant="outline" className="text-xs">
                Potential: +{bonusPercentage}% bonus
              </Badge>
            )}
          </div>

          <Progress value={Math.min(100, timePercentageUsed)} className="h-1.5" />

          <p className="text-xs opacity-75">
            Complete quickly and accurately to earn bonus points!
          </p>
        </div>
      </div>
    </Alert>
  );
}

/**
 * Compact version for sidebar or minimal space
 */
export function EarlyCompletionBadge({
  _timePercentageUsed,
  bonusPercentage,
}: {
  timePercentageUsed: number;
  bonusPercentage: number;
}) {
  if (bonusPercentage === 0) return null;

  let icon: React.ReactNode;
  let variant: 'default' | 'secondary' | 'outline' = 'default';

  if (bonusPercentage >= 5) {
    icon = <Trophy className="h-3 w-3" />;
    variant = 'default';
  } else if (bonusPercentage >= 3) {
    icon = <Star className="h-3 w-3" />;
    variant = 'secondary';
  } else {
    icon = <Zap className="h-3 w-3" />;
    variant = 'outline';
  }

  return (
    <Badge variant={variant} className="gap-1 text-xs">
      {icon}
      Speed Bonus: +{bonusPercentage}%
    </Badge>
  );
}
