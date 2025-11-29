/**
 * Comparison View Component
 * Allows users to compare analytics metrics between two time periods
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface ComparisonMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  unit?: string;
  format?: 'number' | 'time' | 'percentage';
  icon?: React.ReactNode;
}

export interface ComparisonViewProps {
  title: string;
  description?: string;
  metrics: ComparisonMetric[];
  currentPeriodLabel?: string;
  previousPeriodLabel?: string;
  className?: string;
}

const formatValue = (value: number, format?: 'number' | 'time' | 'percentage', unit?: string): string => {
  switch (format) {
    case 'time': {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return `${hours}h ${minutes}m`;
    }
    case 'percentage':
      return `${value}%`;
    default:
      return unit ? `${value} ${unit}` : value.toString();
  }
};

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

const getChangeIndicator = (change: number) => {
  if (change > 0) {
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      label: 'Increase',
      arrow: <ArrowUpRight className="h-3 w-3" />,
    };
  } else if (change < 0) {
    return {
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      label: 'Decrease',
      arrow: <ArrowDownRight className="h-3 w-3" />,
    };
  } else {
    return {
      icon: <Minus className="h-4 w-4" />,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      label: 'No change',
      arrow: null,
    };
  }
};

export function ComparisonView({
  title,
  description,
  metrics,
  currentPeriodLabel = 'Current Period',
  previousPeriodLabel = 'Previous Period',
  className,
}: ComparisonViewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Period Labels */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="font-medium">{currentPeriodLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">{previousPeriodLabel}</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, index) => {
              const change = calculateChange(metric.currentValue, metric.previousValue);
              const indicator = getChangeIndicator(change);
              const absChange = Math.abs(change);

              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border transition-all hover:shadow-md',
                    indicator.bgColor
                  )}
                >
                  {/* Metric Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {metric.icon && (
                        <div className="p-2 bg-background rounded-md">{metric.icon}</div>
                      )}
                      <p className="font-medium text-sm">{metric.label}</p>
                    </div>
                    {indicator.arrow}
                  </div>

                  {/* Current Value */}
                  <div className="mb-2">
                    <p className="text-2xl font-bold">
                      {formatValue(metric.currentValue, metric.format, metric.unit)}
                    </p>
                  </div>

                  {/* Previous Value & Change */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Previous:</span>
                      <span className="font-medium">
                        {formatValue(metric.previousValue, metric.format, metric.unit)}
                      </span>
                    </div>

                    <Badge
                      variant={change > 0 ? 'default' : change < 0 ? 'destructive' : 'secondary'}
                      className={cn('flex items-center gap-1', indicator.color)}
                    >
                      {indicator.icon}
                      <span>{absChange.toFixed(1)}%</span>
                    </Badge>
                  </div>

                  {/* Change Bar */}
                  <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        change > 0
                          ? 'bg-green-500'
                          : change < 0
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                      )}
                      style={{
                        width: `${Math.min(100, Math.abs(change))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {metrics.length > 0 && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Improved</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {metrics.filter(m => m.currentValue > m.previousValue).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Declined</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {metrics.filter(m => m.currentValue < m.previousValue).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unchanged</p>
                  <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                    {metrics.filter(m => m.currentValue === m.previousValue).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
