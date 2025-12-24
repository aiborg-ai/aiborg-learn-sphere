// ============================================================================
// Readiness Score Card Component
// Overall score display with maturity level and visual indicator
// ============================================================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, Target, Sparkles, Zap } from 'lucide-react';
import type { MaturityLevel } from '@/types/aiReadiness';

interface ReadinessScoreCardProps {
  score: number;
  maturityLevel: MaturityLevel;
  industryPercentile?: number;
  className?: string;
}

const MATURITY_CONFIG: Record<
  MaturityLevel,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    icon: typeof Trophy;
  }
> = {
  awareness: {
    label: 'AI Awareness',
    description: 'Beginning to explore AI opportunities',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500/10',
    icon: Sparkles,
  },
  experimenting: {
    label: 'Experimenting',
    description: 'Running pilots and building capabilities',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    icon: Target,
  },
  adopting: {
    label: 'Adopting',
    description: 'Deploying AI across multiple functions',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    icon: TrendingUp,
  },
  optimizing: {
    label: 'Optimizing',
    description: 'Scaling AI and measuring ROI',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    icon: Zap,
  },
  leading: {
    label: 'AI Leader',
    description: 'Industry-leading AI capabilities',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    icon: Trophy,
  },
};

export function ReadinessScoreCard({
  score,
  maturityLevel,
  industryPercentile,
  className,
}: ReadinessScoreCardProps) {
  const config = MATURITY_CONFIG[maturityLevel];
  const Icon = config.icon;
  const scorePercentage = Math.round(score);

  return (
    <Card className={cn('border-2', config.bgColor, 'backdrop-blur-md', className)}>
      <CardContent className="p-0">
        <div className={`h-2 bg-gradient-to-r ${config.color}`} />
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(scorePercentage / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className="text-emerald-500" stopColor="currentColor" />
                      <stop offset="100%" className="text-blue-500" stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">{scorePercentage}</div>
                    <div className="text-sm text-white/60">Score</div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-white/70 text-center">Overall AI-Readiness</div>
            </div>

            {/* Maturity Level */}
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center mb-4`}
              >
                <Icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{config.label}</h3>
              <p className="text-white/70 text-sm">{config.description}</p>
              {industryPercentile !== undefined && (
                <Badge variant="outline" className="mt-4 text-white/80 border-white/30">
                  Top {100 - Math.round(industryPercentile)}% in your industry
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-white/70">Maturity Level</span>
                <span className="font-semibold text-white">
                  {maturityLevel === 'awareness' && '1 of 5'}
                  {maturityLevel === 'experimenting' && '2 of 5'}
                  {maturityLevel === 'adopting' && '3 of 5'}
                  {maturityLevel === 'optimizing' && '4 of 5'}
                  {maturityLevel === 'leading' && '5 of 5'}
                </span>
              </div>
              {industryPercentile !== undefined && (
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-white/70">Industry Rank</span>
                  <span className="font-semibold text-white">
                    {Math.round(industryPercentile)}th percentile
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-white/70">Status</span>
                <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                  {score >= 80
                    ? 'Excellent'
                    : score >= 60
                      ? 'Good'
                      : score >= 40
                        ? 'Fair'
                        : 'Developing'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
