import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, Star, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { EarlySubmissionResult } from '@/utils/earlySubmissionDetection';

interface EarlySubmissionBadgeProps {
  result: EarlySubmissionResult;
  showBonus?: boolean;
  bonusPoints?: number;
  variant?: 'badge' | 'alert' | 'inline';
}

export function EarlySubmissionBadge({
  result,
  showBonus = true,
  bonusPoints,
  variant = 'badge'
}: EarlySubmissionBadgeProps) {
  const getIcon = () => {
    switch (result.badge) {
      case 'trophy':
        return <Trophy className="h-4 w-4" />;
      case 'star':
        return <Star className="h-4 w-4" />;
      case 'checkmark':
        return <CheckCircle className="h-4 w-4" />;
      case 'clock':
        return <Clock className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (result.colorScheme) {
      case 'green':
      case 'blue':
        return 'default';
      case 'yellow':
        return 'secondary';
      case 'orange':
        return 'outline';
      case 'red':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getBackgroundColor = () => {
    switch (result.colorScheme) {
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200';
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (result.colorScheme) {
      case 'green':
        return 'text-green-700';
      case 'blue':
        return 'text-blue-700';
      case 'yellow':
        return 'text-yellow-700';
      case 'orange':
        return 'text-orange-700';
      case 'red':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  if (variant === 'badge') {
    return (
      <Badge variant={getBadgeVariant()} className="gap-1">
        {getIcon()}
        {result.message}
        {showBonus && result.bonusPercentage > 0 && (
          <span className="ml-1 font-bold">+{result.bonusPercentage}%</span>
        )}
      </Badge>
    );
  }

  if (variant === 'alert') {
    return (
      <Alert className={getBackgroundColor()}>
        <div className="flex items-start gap-2">
          <div className={getTextColor()}>{getIcon()}</div>
          <AlertDescription className={getTextColor()}>
            <div className="space-y-1">
              <p className="font-semibold">{result.message}</p>
              {showBonus && result.bonusPercentage > 0 && (
                <p className="text-sm">
                  🎉 Bonus earned: <strong>+{result.bonusPercentage}%</strong>
                  {bonusPoints !== undefined && (
                    <span> ({bonusPoints} points)</span>
                  )}
                </p>
              )}
              {result.isEarly && (
                <p className="text-sm">
                  Submitted with {result.timePercentageUsed.toFixed(0)}% of the time period used
                </p>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // variant === 'inline'
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${getBackgroundColor()}`}>
      <span className={getTextColor()}>{getIcon()}</span>
      <span className={`text-sm font-medium ${getTextColor()}`}>
        {result.message}
      </span>
      {showBonus && result.bonusPercentage > 0 && (
        <span className={`text-sm font-bold ${getTextColor()}`}>
          +{result.bonusPercentage}%
        </span>
      )}
    </div>
  );
}

/**
 * Component to show submission urgency countdown
 */
interface SubmissionUrgencyIndicatorProps {
  dueDate: Date;
  urgency: {
    level: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    colorScheme: 'red' | 'orange' | 'yellow' | 'green';
  };
  timeRemaining: string;
}

export function SubmissionUrgencyIndicator({
  dueDate,
  urgency,
  timeRemaining
}: SubmissionUrgencyIndicatorProps) {
  const getBackgroundColor = () => {
    switch (urgency.colorScheme) {
      case 'red':
        return 'bg-red-100 border-red-300';
      case 'orange':
        return 'bg-orange-100 border-orange-300';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300';
      case 'green':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getTextColor = () => {
    switch (urgency.colorScheme) {
      case 'red':
        return 'text-red-700';
      case 'orange':
        return 'text-orange-700';
      case 'yellow':
        return 'text-yellow-700';
      case 'green':
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
  };

  const shouldAnimate = urgency.level === 'critical';

  return (
    <div
      className={`border-2 rounded-lg p-3 ${getBackgroundColor()} ${
        shouldAnimate ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock className={`h-5 w-5 ${getTextColor()}`} />
        <div>
          <p className={`text-sm font-semibold ${getTextColor()}`}>
            {urgency.message}
          </p>
          <p className={`text-xs ${getTextColor()}`}>
            {timeRemaining}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to encourage early submission
 */
interface EarlySubmissionIncentiveProps {
  daysUntilDue: number;
  bonusConfig?: {
    veryEarly?: number;
    early?: number;
    onTime?: number;
  };
}

export function EarlySubmissionIncentive({
  daysUntilDue,
  bonusConfig
}: EarlySubmissionIncentiveProps) {
  const veryEarlyBonus = bonusConfig?.veryEarly ?? 5;
  const earlyBonus = bonusConfig?.early ?? 3;
  const onTimeBonus = bonusConfig?.onTime ?? 1;

  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Star className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700">
        <p className="font-semibold mb-2">Early Submission Bonus Available!</p>
        <div className="space-y-1 text-sm">
          <p>• Submit 7+ days early: <strong>+{veryEarlyBonus}% bonus</strong> 🏆</p>
          <p>• Submit 3-6 days early: <strong>+{earlyBonus}% bonus</strong> ⭐</p>
          <p>• Submit 1-2 days early: <strong>+{onTimeBonus}% bonus</strong> ✓</p>
        </div>
        {daysUntilDue > 0 && (
          <p className="mt-2 text-xs font-semibold">
            {daysUntilDue >= 7
              ? `You can still earn the maximum ${veryEarlyBonus}% bonus!`
              : daysUntilDue >= 3
              ? `You can still earn a ${earlyBonus}% bonus!`
              : `You can still earn a ${onTimeBonus}% bonus!`}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
