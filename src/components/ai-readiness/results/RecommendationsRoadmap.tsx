// ============================================================================
// Recommendations Roadmap Component
// Displays personalized recommendations organized by timeframe
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Zap,
  Calendar,
  Clock,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Target as TargetIcon,
} from 'lucide-react';
import type { ReadinessRecommendation, Roadmap } from '@/types/aiReadiness';

interface RecommendationsRoadmapProps {
  roadmap: Roadmap;
  className?: string;
}

const TIMEFRAME_CONFIG = {
  quick_win: {
    label: 'Quick Wins',
    description: '0-3 months',
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  short_term: {
    label: 'Short Term',
    description: '3-6 months',
    icon: Calendar,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  medium_term: {
    label: 'Medium Term',
    description: '6-12 months',
    icon: Clock,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  long_term: {
    label: 'Long Term',
    description: '12+ months',
    icon: Hourglass,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-rose-500', icon: AlertCircle },
  high: { label: 'High', color: 'bg-orange-500', icon: TrendingUp },
  medium: { label: 'Medium', color: 'bg-blue-500', icon: TargetIcon },
  low: { label: 'Low', color: 'bg-gray-500', icon: CheckCircle2 },
};

function RecommendationCard({ recommendation }: { recommendation: ReadinessRecommendation }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority];
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Badge className={cn(priorityConfig.color, 'text-white text-xs')}>
            <PriorityIcon className="h-3 w-3 mr-1" />
            {priorityConfig.label}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-2">{recommendation.title}</h4>
          <p className="text-sm text-white/70 mb-3">{recommendation.description}</p>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-3 text-xs text-white/60 mb-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Effort: {recommendation.estimated_effort}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{recommendation.estimated_cost_range}</span>
            </div>
            {recommendation.required_resources.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{recommendation.required_resources.length} resources needed</span>
              </div>
            )}
          </div>

          {/* Toggle Details */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/70 hover:text-white hover:bg-white/10 p-0 h-auto"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
              <div>
                <div className="text-xs font-semibold text-white/80 mb-2">Expected Impact</div>
                <p className="text-sm text-white/70">{recommendation.expected_impact}</p>
              </div>

              {recommendation.required_resources.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-white/80 mb-2">Required Resources</div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.required_resources.map((resource, idx) => (
                      <Badge key={idx} variant="outline" className="text-white/70 border-white/20">
                        {resource}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {recommendation.success_metrics.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-white/80 mb-2">Success Metrics</div>
                  <ul className="space-y-1">
                    {recommendation.success_metrics.map((metric, idx) => (
                      <li key={idx} className="text-sm text-white/70 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecommendationsRoadmap({ roadmap, className }: RecommendationsRoadmapProps) {
  const timeframes = [
    { key: 'quick_win' as const, items: roadmap.quick_wins },
    { key: 'short_term' as const, items: roadmap.short_term },
    { key: 'medium_term' as const, items: roadmap.medium_term },
    { key: 'long_term' as const, items: roadmap.long_term },
  ];

  const totalRecommendations =
    roadmap.quick_wins.length +
    roadmap.short_term.length +
    roadmap.medium_term.length +
    roadmap.long_term.length;

  return (
    <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TargetIcon className="h-5 w-5" />
          Implementation Roadmap
        </CardTitle>
        <CardDescription className="text-white/60">
          {totalRecommendations} personalized recommendations to advance your AI journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {timeframes.map(({ key, items }) => {
          const config = TIMEFRAME_CONFIG[key];
          const Icon = config.icon;

          if (items.length === 0) return null;

          const criticalCount = items.filter(i => i.priority === 'critical').length;
          const highCount = items.filter(i => i.priority === 'high').length;

          return (
            <div key={key} className="space-y-4">
              {/* Timeframe Header */}
              <div
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border-2',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{config.label}</h3>
                    <p className="text-xs text-white/60">{config.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{items.length}</div>
                  <div className="text-xs text-white/60">
                    {criticalCount > 0 && `${criticalCount} critical`}
                    {criticalCount > 0 && highCount > 0 && ', '}
                    {highCount > 0 && `${highCount} high`}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                {items.map(item => (
                  <RecommendationCard key={item.id} recommendation={item} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Summary */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-white/80">
            💡 <span className="font-semibold">Pro Tip:</span> Focus on quick wins first to build
            momentum and demonstrate value. Use early successes to secure buy-in for longer-term
            initiatives.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
