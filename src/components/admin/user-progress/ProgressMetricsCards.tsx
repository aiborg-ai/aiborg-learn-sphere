/**
 * ProgressMetricsCards Component
 *
 * Displays summary metrics cards for user progress dashboard.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/utils/iconLoader';
import type { UserProgressMetrics } from '@/types/user-progress.types';

interface ProgressMetricsCardsProps {
  metrics: UserProgressMetrics;
  isLoading?: boolean;
}

export function ProgressMetricsCards({ metrics, isLoading }: ProgressMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="h-16 bg-muted/50 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Users',
      value: metrics.total_users.toLocaleString(),
      icon: 'Users',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      subtitle: `${metrics.active_users_30d} active (30d)`,
    },
    {
      title: 'Active Users',
      value: metrics.active_users_7d.toLocaleString(),
      icon: 'UserCheck',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      subtitle: 'Last 7 days',
    },
    {
      title: 'At Risk',
      value: metrics.at_risk_users.toLocaleString(),
      icon: 'AlertTriangle',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      subtitle: 'Inactive 7-30 days',
    },
    {
      title: 'Avg Completion',
      value: `${metrics.avg_completion_rate}%`,
      icon: 'TrendingUp',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      subtitle: 'Course progress',
    },
    {
      title: 'Avg Score',
      value: `${metrics.avg_assessment_score}%`,
      icon: 'Target',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      subtitle: 'Assessment average',
    },
    {
      title: 'Total XP',
      value: metrics.total_lingo_xp.toLocaleString(),
      icon: 'Zap',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      subtitle: 'AIBORGLingo XP',
    },
    {
      title: 'Avg Streak',
      value: metrics.avg_lingo_streak.toFixed(1),
      icon: 'Flame',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      subtitle: 'Days',
    },
    {
      title: 'Active Today',
      value: Math.round(metrics.active_users_7d / 7).toString(),
      icon: 'Activity',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      subtitle: 'Daily average',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <Icon name={card.icon} className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
