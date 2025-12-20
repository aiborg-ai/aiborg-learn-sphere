/**
 * RetentionCard Component
 *
 * Displays a flashcard with retention prediction information.
 * Shows urgency status and optimal review timing.
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, CheckCircle2, Timer } from 'lucide-react';

interface RetentionCardItem {
  id: string;
  front: string;
  daysSinceReview: number;
  retention?: number;
  confidence?: number;
  optimalReviewDate?: Date;
  urgency: 'overdue' | 'due_soon' | 'optimal' | 'early';
  daysUntilOptimal?: number;
  estimatedRetention?: number;
}

interface RetentionCardProps {
  item: RetentionCardItem;
  onClick?: () => void;
  showDetails?: boolean;
}

export function RetentionCard({ item, onClick, showDetails = true }: RetentionCardProps) {
  const retention = item.retention ?? item.estimatedRetention ?? 0;

  const urgencyConfig = useMemo(
    () => ({
      overdue: {
        color: 'border-red-500/50 bg-red-500/5',
        badge: 'bg-red-500 text-white',
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Overdue',
      },
      due_soon: {
        color: 'border-orange-500/50 bg-orange-500/5',
        badge: 'bg-orange-500 text-white',
        icon: <Timer className="h-4 w-4" />,
        label: 'Due Soon',
      },
      optimal: {
        color: 'border-green-500/50 bg-green-500/5',
        badge: 'bg-green-500 text-white',
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: 'Optimal',
      },
      early: {
        color: 'border-blue-500/50 bg-blue-500/5',
        badge: 'bg-blue-500 text-white',
        icon: <Clock className="h-4 w-4" />,
        label: 'Early',
      },
    }),
    []
  );

  const config = urgencyConfig[item.urgency];

  const retentionColor = useMemo(() => {
    if (retention >= 0.85) return 'text-green-500';
    if (retention >= 0.7) return 'text-yellow-500';
    if (retention >= 0.5) return 'text-orange-500';
    return 'text-red-500';
  }, [retention]);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        config.color,
        onClick && 'hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with urgency badge */}
        <div className="flex items-start justify-between mb-3">
          <Badge className={cn('text-xs', config.badge)}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
          {item.daysUntilOptimal !== undefined && (
            <span className="text-xs text-muted-foreground">
              {item.daysUntilOptimal > 0 ? `${item.daysUntilOptimal}d until optimal` : 'Review now'}
            </span>
          )}
        </div>

        {/* Card front content */}
        <div className="mb-3">
          <p className="text-sm font-medium line-clamp-2">{item.front}</p>
        </div>

        {showDetails && (
          <>
            {/* Retention bar */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Retention</span>
                <span className={cn('font-medium', retentionColor)}>
                  {(retention * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={retention * 100}
                className={cn(
                  'h-1.5',
                  retention < 0.5 && '[&>div]:bg-red-500',
                  retention >= 0.5 && retention < 0.7 && '[&>div]:bg-orange-500',
                  retention >= 0.7 && retention < 0.85 && '[&>div]:bg-yellow-500',
                  retention >= 0.85 && '[&>div]:bg-green-500'
                )}
              />
            </div>

            {/* Time info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.daysSinceReview === 0
                  ? 'Today'
                  : item.daysSinceReview === 1
                    ? '1 day ago'
                    : `${item.daysSinceReview} days ago`}
              </span>
              {item.confidence !== undefined && (
                <span>{(item.confidence * 100).toFixed(0)}% confidence</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for list views
 */
export function RetentionCardCompact({ item, onClick }: RetentionCardProps) {
  const retention = item.retention ?? item.estimatedRetention ?? 0;

  const urgencyColors = {
    overdue: 'bg-red-500',
    due_soon: 'bg-orange-500',
    optimal: 'bg-green-500',
    early: 'bg-blue-500',
  };

  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors bg-transparent text-left w-full',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Urgency indicator */}
      <div className={cn('w-1 h-8 rounded-full', urgencyColors[item.urgency])} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.front}</p>
        <p className="text-xs text-muted-foreground">
          {item.daysSinceReview === 0 ? 'Today' : `${item.daysSinceReview}d ago`}
        </p>
      </div>

      {/* Retention */}
      <div className="text-right">
        <div
          className={cn(
            'text-sm font-medium',
            retention >= 0.7
              ? 'text-green-500'
              : retention >= 0.5
                ? 'text-orange-500'
                : 'text-red-500'
          )}
        >
          {(retention * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-muted-foreground">retention</div>
      </div>
    </button>
  );
}

export default RetentionCard;
