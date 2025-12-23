/**
 * Learning Outcomes Dashboard Component
 * Displays pre/post assessment comparisons, mastery progression, and learning metrics
 * Critical for CODiE 2026 award - demonstrates measurable learning outcomes
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  PrePostAssessmentService,
  type ImprovementMetrics,
  type MasteryProgression,
  type CohortComparison,
  type MasteryLevel,
} from '@/services/analytics/PrePostAssessmentService';
import {
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Users,
  Clock,
  ChevronRight,
  Sparkles,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  FileText,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningOutcomesDashboardProps {
  className?: string;
  compact?: boolean;
  courseId?: string;
}

// Mastery level configuration
const MASTERY_LEVELS: Record<
  MasteryLevel,
  { label: string; color: string; icon: string; bgColor: string }
> = {
  novice: {
    label: 'Novice',
    color: 'text-gray-400',
    icon: '○',
    bgColor: 'bg-gray-500/20',
  },
  beginner: {
    label: 'Beginner',
    color: 'text-blue-400',
    icon: '★',
    bgColor: 'bg-blue-500/20',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'text-green-400',
    icon: '🏆',
    bgColor: 'bg-green-500/20',
  },
  proficient: {
    label: 'Proficient',
    color: 'text-yellow-400',
    icon: '🥇',
    bgColor: 'bg-yellow-500/20',
  },
  advanced: {
    label: 'Advanced',
    color: 'text-orange-400',
    icon: '👑',
    bgColor: 'bg-orange-500/20',
  },
  expert: {
    label: 'Expert',
    color: 'text-purple-400',
    icon: '💎',
    bgColor: 'bg-purple-500/20',
  },
  master: {
    label: 'Master',
    color: 'text-pink-400',
    icon: '💠',
    bgColor: 'bg-pink-500/20',
  },
};

export function LearningOutcomesDashboard({
  className,
  compact = false,
  courseId,
}: LearningOutcomesDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [improvementHistory, setImprovementHistory] = useState<ImprovementMetrics[]>([]);
  const [masteryProgression, setMasteryProgression] = useState<MasteryProgression[]>([]);
  const [cohortComparison, setCohortComparison] = useState<CohortComparison | null>(null);
  const [summaryStats, setSummaryStats] = useState<{
    totalAssessments: number;
    avgImprovement: number;
    skillsMastered: number;
    percentileRank: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [history, mastery, cohort, summary] = await Promise.all([
        PrePostAssessmentService.getUserImprovementHistory(user.id, 10),
        PrePostAssessmentService.getMasteryProgression(user.id),
        PrePostAssessmentService.getCohortComparison(user.id, courseId),
        PrePostAssessmentService.getLearningOutcomesSummary(user.id, 'monthly'),
      ]);

      setImprovementHistory(history);
      setMasteryProgression(mastery);
      setCohortComparison(cohort);
      setSummaryStats(
        summary
          ? {
              totalAssessments: summary.assessmentsCompleted,
              avgImprovement: summary.scoreImprovement,
              skillsMastered: summary.skillsMastered,
              percentileRank: summary.percentileRank,
            }
          : null
      );
    } catch (error) {
      logger.error('Error fetching learning outcomes:', error);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSkeleton compact={compact} />;
  }

  if (compact) {
    return (
      <CompactView
        className={className}
        improvementHistory={improvementHistory}
        masteryProgression={masteryProgression}
        summaryStats={summaryStats}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-400" />
            Learning Outcomes
          </h2>
          <p className="text-white/60 mt-1">Track your improvement and mastery progression</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-white/70">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assessments Completed"
          value={summaryStats?.totalAssessments || improvementHistory.length}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Avg Improvement"
          value={`${(summaryStats?.avgImprovement || calculateAvgImprovement(improvementHistory)).toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
          trend={
            summaryStats?.avgImprovement
              ? summaryStats.avgImprovement > 0
                ? 'up'
                : 'down'
              : undefined
          }
        />
        <StatCard
          title="Skills Mastered"
          value={
            summaryStats?.skillsMastered ||
            masteryProgression.filter(
              m => m.currentLevel === 'master' || m.currentLevel === 'expert'
            ).length
          }
          icon={<Award className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Class Percentile"
          value={`${(summaryStats?.percentileRank || cohortComparison?.percentileRank || 0).toFixed(0)}%`}
          icon={<Users className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assessments" className="data-[state=active]:bg-white/10">
            Pre/Post Assessments
          </TabsTrigger>
          <TabsTrigger value="mastery" className="data-[state=active]:bg-white/10">
            Mastery Progression
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-white/10">
            Cohort Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Improvements */}
            <RecentImprovementsCard improvements={improvementHistory.slice(0, 5)} />

            {/* Top Skills */}
            <TopSkillsCard mastery={masteryProgression.slice(0, 5)} />
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-6">
          <AssessmentsView improvements={improvementHistory} />
        </TabsContent>

        <TabsContent value="mastery" className="mt-6">
          <MasteryView mastery={masteryProgression} />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <CohortComparisonView comparison={cohortComparison} improvements={improvementHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
  trend?: 'up' | 'down';
}) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
  };

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>{icon}</div>
          {trend && (
            <div
              className={cn(
                'flex items-center text-xs',
                trend === 'up' ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-white mt-3">{value}</p>
        <p className="text-sm text-white/60">{title}</p>
      </CardContent>
    </Card>
  );
}

function RecentImprovementsCard({ improvements }: { improvements: ImprovementMetrics[] }) {
  if (improvements.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Recent Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No assessment comparisons yet</p>
            <p className="text-sm mt-2">
              Complete a pre and post assessment to see your improvement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Recent Improvements
        </CardTitle>
        <CardDescription className="text-white/60">
          Your latest pre/post assessment comparisons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {improvements.map(improvement => (
          <div key={improvement.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={improvement.isSignificant ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {improvement.isSignificant ? 'Significant' : 'Measured'}
                </Badge>
                <span className="text-xs text-white/50">
                  {new Date(improvement.calculatedAt).toLocaleDateString()}
                </span>
              </div>
              <ImprovementIndicator change={improvement.scoreChange} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-white/50">Pre</p>
                <p className="text-white font-medium">{improvement.preScore.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-white/50">Post</p>
                <p className="text-white font-medium">{improvement.postScore.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-white/50">Effect Size</p>
                <p
                  className={cn(
                    'font-medium',
                    improvement.effectSize && improvement.effectSize >= 0.5
                      ? 'text-green-400'
                      : 'text-white'
                  )}
                >
                  {improvement.effectSize ? improvement.effectSize.toFixed(2) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TopSkillsCard({ mastery }: { mastery: MasteryProgression[] }) {
  if (mastery.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-400" />
            Top Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No skill mastery data yet</p>
            <p className="text-sm mt-2">Complete assessments to build your skill profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-400" />
          Top Skills
        </CardTitle>
        <CardDescription className="text-white/60">Your highest mastery levels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mastery.map(skill => {
          const levelConfig = MASTERY_LEVELS[skill.currentLevel];
          return (
            <div key={skill.skillId} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-medium">{skill.skillName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-sm', levelConfig.color)}>
                      {levelConfig.icon} {levelConfig.label}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{skill.currentScore.toFixed(0)}%</p>
                  {skill.projectedNextLevelDays && (
                    <p className="text-xs text-white/50">
                      ~{skill.projectedNextLevelDays}d to next level
                    </p>
                  )}
                </div>
              </div>
              <Progress value={skill.levelProgress} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AssessmentsView({ improvements }: { improvements: ImprovementMetrics[] }) {
  if (improvements.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="py-12">
          <div className="text-center text-white/60">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No Assessment Comparisons Yet</h3>
            <p>
              Complete both a pre-assessment and post-assessment to see your learning improvement.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {improvements.map(improvement => (
        <Card key={improvement.id} className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scores Comparison */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Score Comparison</h4>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {improvement.preScore.toFixed(0)}%
                    </div>
                    <p className="text-sm text-white/50">Pre-Assessment</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/30" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {improvement.postScore.toFixed(0)}%
                    </div>
                    <p className="text-sm text-white/50">Post-Assessment</p>
                  </div>
                </div>
                <ImprovementIndicator change={improvement.scoreChange} showLabel />
              </div>

              {/* Statistical Metrics */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Statistical Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <MetricItem
                    label="Effect Size (d)"
                    value={improvement.effectSize?.toFixed(2) || 'N/A'}
                    description={getEffectSizeLabel(improvement.effectSize)}
                  />
                  <MetricItem
                    label="Normalized Gain"
                    value={
                      improvement.normalizedGain
                        ? `${(improvement.normalizedGain * 100).toFixed(1)}%`
                        : 'N/A'
                    }
                    description={getNormalizedGainLabel(improvement.normalizedGain)}
                  />
                  <MetricItem label="Days Between" value={improvement.daysBetween.toFixed(0)} />
                  <MetricItem
                    label="Confidence"
                    value={`${(improvement.confidenceLevel * 100).toFixed(0)}%`}
                  />
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Category Improvements</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {improvement.categoryImprovements.slice(0, 4).map(cat => (
                    <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                      <span className="text-white/70 truncate">{cat.categoryName}</span>
                      <ImprovementIndicator change={cat.change} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MasteryView({ mastery }: { mastery: MasteryProgression[] }) {
  const levelOrder: MasteryLevel[] = [
    'master',
    'expert',
    'advanced',
    'proficient',
    'intermediate',
    'beginner',
    'novice',
  ];

  // Group by level
  const groupedByLevel = levelOrder.reduce(
    (acc, level) => {
      acc[level] = mastery.filter(m => m.currentLevel === level);
      return acc;
    },
    {} as Record<MasteryLevel, MasteryProgression[]>
  );

  return (
    <div className="space-y-6">
      {/* Mastery Level Legend */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {levelOrder.map(level => {
              const config = MASTERY_LEVELS[level];
              const count = groupedByLevel[level].length;
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className={cn('text-lg', config.color)}>{config.icon}</span>
                  <span className="text-white/70 text-sm">{config.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mastery.map(skill => {
          const levelConfig = MASTERY_LEVELS[skill.currentLevel];
          return (
            <Card
              key={skill.skillId}
              className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{skill.skillName}</h4>
                    <div className={cn('flex items-center gap-1 text-sm mt-1', levelConfig.color)}>
                      <span>{levelConfig.icon}</span>
                      <span>{levelConfig.label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{skill.currentScore.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Level Progress</span>
                    <span>{skill.levelProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={skill.levelProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-white/50">
                  <div>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {skill.timeAtCurrentLevelDays}d at level
                  </div>
                  <div>
                    <TrendingUp className="h-3 w-3 inline mr-1" />+
                    {skill.avgImprovementPerWeek.toFixed(1)}/week
                  </div>
                </div>

                {skill.projectedNextLevelDays && (
                  <p className="text-xs text-amber-400 mt-2">
                    <Sparkles className="h-3 w-3 inline mr-1" />~{skill.projectedNextLevelDays} days
                    to next level
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mastery.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="py-12">
            <div className="text-center text-white/60">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-white mb-2">No Mastery Data Yet</h3>
              <p>Complete assessments to track your mastery progression across different skills.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CohortComparisonView({
  comparison,
  improvements,
}: {
  comparison: CohortComparison | null;
  improvements: ImprovementMetrics[];
}) {
  if (!comparison) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="py-12">
          <div className="text-center text-white/60">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No Cohort Data Available</h3>
            <p>Complete more assessments to see how you compare to your peers.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Your Position */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-400" />
            Your Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-amber-400 mb-2">
              {comparison.percentileRank.toFixed(0)}%
            </div>
            <p className="text-white/60">Percentile Rank</p>
            <p className="text-sm text-white/50 mt-1">
              You outperform {comparison.percentileRank.toFixed(0)}% of learners
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Your Avg Improvement</span>
              <span
                className={cn(
                  'font-bold',
                  comparison.aboveAverage ? 'text-green-400' : 'text-white'
                )}
              >
                {comparison.userImprovement.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Cohort Average</span>
              <span className="text-white">{comparison.cohortAverageImprovement.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Cohort Median</span>
              <span className="text-white">{comparison.cohortMedianImprovement.toFixed(1)}%</span>
            </div>
          </div>

          {comparison.aboveAverage && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />
                You're performing above average!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement Distribution */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Improvement Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {improvements.slice(0, 6).map(imp => (
              <div key={imp.id} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-16">
                  {new Date(imp.calculatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      imp.scoreChange > 0 ? 'bg-green-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(Math.abs(imp.scoreChange), 100)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium w-12 text-right',
                    imp.scoreChange > 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {imp.scoreChange > 0 ? '+' : ''}
                  {imp.scoreChange.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

function ImprovementIndicator({
  change,
  size = 'md',
  showLabel = false,
}: {
  change: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        sizeClasses,
        isPositive ? 'text-green-400' : isNeutral ? 'text-white/50' : 'text-red-400'
      )}
    >
      {isPositive ? (
        <ArrowUp className={iconSize} />
      ) : isNeutral ? (
        <Minus className={iconSize} />
      ) : (
        <ArrowDown className={iconSize} />
      )}
      <span className="font-medium">
        {isPositive ? '+' : ''}
        {change.toFixed(1)}%
      </span>
      {showLabel && (
        <span className="text-white/50 ml-1">
          {isPositive ? 'improvement' : isNeutral ? 'no change' : 'decrease'}
        </span>
      )}
    </div>
  );
}

function MetricItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      {description && <p className="text-xs text-white/40">{description}</p>}
    </div>
  );
}

function CompactView({
  className,
  improvementHistory,
  masteryProgression,
  summaryStats,
}: {
  className?: string;
  improvementHistory: ImprovementMetrics[];
  masteryProgression: MasteryProgression[];
  summaryStats: {
    totalAssessments: number;
    avgImprovement: number;
    skillsMastered: number;
    percentileRank: number;
  } | null;
}) {
  const avgImprovement =
    summaryStats?.avgImprovement || calculateAvgImprovement(improvementHistory);
  const expertSkills = masteryProgression.filter(
    m => m.currentLevel === 'expert' || m.currentLevel === 'master'
  ).length;

  return (
    <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-amber-400" />
          Learning Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold text-green-400">
              {avgImprovement > 0 ? '+' : ''}
              {avgImprovement.toFixed(1)}%
            </p>
            <p className="text-xs text-white/50">Avg Improvement</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold text-purple-400">{expertSkills}</p>
            <p className="text-xs text-white/50">Expert Skills</p>
          </div>
        </div>

        {improvementHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">Latest Assessment</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">
                {improvementHistory[0].preScore.toFixed(0)}% →{' '}
                {improvementHistory[0].postScore.toFixed(0)}%
              </span>
              <ImprovementIndicator change={improvementHistory[0].scoreChange} size="sm" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 bg-white/10 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 bg-white/10" />
            <Skeleton className="h-16 bg-white/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-white/10" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-white/10" />
        ))}
      </div>
      <Skeleton className="h-64 bg-white/10" />
    </div>
  );
}

// Utility functions

function calculateAvgImprovement(improvements: ImprovementMetrics[]): number {
  if (improvements.length === 0) return 0;
  return improvements.reduce((sum, i) => sum + i.percentageImprovement, 0) / improvements.length;
}

function getEffectSizeLabel(effectSize: number | null): string {
  if (effectSize === null) return '';
  if (effectSize >= 0.8) return 'Large';
  if (effectSize >= 0.5) return 'Medium';
  if (effectSize >= 0.2) return 'Small';
  return 'Negligible';
}

function getNormalizedGainLabel(gain: number | null): string {
  if (gain === null) return '';
  if (gain >= 0.7) return 'High';
  if (gain >= 0.3) return 'Medium';
  return 'Low';
}

// Export individual components for flexible use
export {
  StatCard,
  RecentImprovementsCard,
  TopSkillsCard,
  AssessmentsView,
  MasteryView,
  CohortComparisonView,
};
