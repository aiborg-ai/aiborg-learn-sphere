// ============================================================================
// Dimension Breakdown Component
// Visual breakdown of all 6 AI-Readiness dimensions with scores
// ============================================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Target, Database, Cpu, Users, GitBranch, RefreshCw, TrendingUp } from 'lucide-react';
import type { DimensionScore } from '@/types/aiReadiness';

interface DimensionBreakdownProps {
  dimensions: DimensionScore[];
  className?: string;
}

const DIMENSION_CONFIG = {
  strategic: {
    label: 'Strategic Alignment',
    icon: Target,
    description: 'Leadership commitment and strategic direction',
    color: 'from-blue-500 to-indigo-600',
  },
  data: {
    label: 'Data Maturity',
    icon: Database,
    description: 'Data quality, governance, and accessibility',
    color: 'from-emerald-500 to-teal-600',
  },
  tech: {
    label: 'Technical Infrastructure',
    icon: Cpu,
    description: 'IT systems, cloud, and technical capabilities',
    color: 'from-violet-500 to-purple-600',
  },
  human: {
    label: 'Human Capital',
    icon: Users,
    description: 'Skills, training, and learning culture',
    color: 'from-amber-500 to-orange-600',
  },
  process: {
    label: 'Process Maturity',
    icon: GitBranch,
    description: 'Documentation and automation readiness',
    color: 'from-pink-500 to-rose-600',
  },
  change: {
    label: 'Change Readiness',
    icon: RefreshCw,
    description: 'Change management and cultural adaptation',
    color: 'from-cyan-500 to-blue-600',
  },
};

function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-500' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-500' };
  if (score >= 40) return { label: 'Fair', color: 'text-amber-500' };
  if (score >= 20) return { label: 'Developing', color: 'text-orange-500' };
  return { label: 'Needs Focus', color: 'text-rose-500' };
}

export function DimensionBreakdown({ dimensions, className }: DimensionBreakdownProps) {
  const dimensionData = dimensions
    .filter(d => d.dimension !== 'overall')
    .map(d => ({
      ...d,
      config: DIMENSION_CONFIG[d.dimension as keyof typeof DIMENSION_CONFIG],
      level: getScoreLevel(d.score),
    }))
    .sort((a, b) => b.score - a.score); // Sort by score descending

  const highest = dimensionData[0];
  const lowest = dimensionData[dimensionData.length - 1];

  return (
    <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Dimension Breakdown
        </CardTitle>
        <p className="text-sm text-white/60">
          Your performance across the 6 AI-Readiness dimensions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="text-xs text-emerald-400 mb-1">STRONGEST DIMENSION</div>
            <div className="font-semibold text-white">{highest.config.label}</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {Math.round(highest.score)}%
            </div>
          </div>
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <div className="text-xs text-rose-400 mb-1">BIGGEST OPPORTUNITY</div>
            <div className="font-semibold text-white">{lowest.config.label}</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{Math.round(lowest.score)}%</div>
          </div>
        </div>

        {/* Dimension Cards */}
        <div className="space-y-4">
          {dimensionData.map(({ dimension, score, config, level }) => {
            const Icon = config.icon;
            const scoreRounded = Math.round(score);

            return (
              <div
                key={dimension}
                className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{config.label}</h4>
                        <p className="text-xs text-white/60">{config.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-white">{scoreRounded}%</div>
                        <Badge variant="outline" className={cn('text-xs border-0', level.color)}>
                          {level.label}
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={score}
                      className="h-2"
                      aria-label={`${config.label} progress: ${scoreRounded}%`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">
                {dimensionData.filter(d => d.score >= 60).length}
              </div>
              <div className="text-xs text-white/60">Strong Dimensions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {dimensionData.filter(d => d.score >= 40 && d.score < 60).length}
              </div>
              <div className="text-xs text-white/60">Developing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {dimensionData.filter(d => d.score < 40).length}
              </div>
              <div className="text-xs text-white/60">Need Focus</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round(highest.score - lowest.score)}%
              </div>
              <div className="text-xs text-white/60">Variance</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
