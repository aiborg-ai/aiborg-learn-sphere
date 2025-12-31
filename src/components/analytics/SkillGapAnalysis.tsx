import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SkillGapService } from '@/services/analytics/SkillGapService';
import type { SkillGap } from '@/services/analytics/types';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  Loader2,
  BarChart3,
  ArrowRight,
} from '@/components/ui/icons';

export const SkillGapAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);

  const loadSkillGaps = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const gaps = await SkillGapService.analyzeSkillGaps(user.id);
      setSkillGaps(gaps);
    } catch (error) {
      logger.error('Error loading skill gaps:', error);
      setSkillGaps([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSkillGaps();
    }
  }, [user, loadSkillGaps]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getPriorityIcon = (score: number) => {
    if (score > 80) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (score > 60) return <Zap className="h-4 w-4 text-orange-600" />;
    return <Target className="h-4 w-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (skillGaps.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Complete an assessment to see your personalized skill gap analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skill Gap Analysis
          </CardTitle>
          <CardDescription>
            Prioritized areas for improvement with predicted outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="priority">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="priority">By Priority</TabsTrigger>
              <TabsTrigger value="impact">By Impact</TabsTrigger>
              <TabsTrigger value="timeline">By Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="priority" className="space-y-4 mt-6">
              {skillGaps
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .map((gap, idx) => (
                  <Card
                    key={idx}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        gap.priorityScore > 80
                          ? '#ef4444'
                          : gap.priorityScore > 60
                            ? '#f97316'
                            : '#3b82f6',
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getPriorityIcon(gap.priorityScore)}
                          <div>
                            <CardTitle className="text-lg">{gap.categoryName}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Badge className={getImpactColor(gap.businessImpact)}>
                                {gap.businessImpact} impact
                              </Badge>
                              <span className="text-xs">
                                Priority: {Math.round(gap.priorityScore)}/100
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Current vs Target */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Proficiency</span>
                          <span className="font-semibold">
                            {Math.round(gap.currentProficiency)}%
                          </span>
                        </div>
                        <Progress value={gap.currentProficiency} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Gap to close: {Math.round(gap.gapSize)}%</span>
                        </div>
                      </div>

                      {/* Predictions */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            30 Days
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(gap.predictedProficiency30d)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +{Math.round(gap.predictedProficiency30d - gap.currentProficiency)}%
                            predicted
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            90 Days
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round(gap.predictedProficiency90d)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +{Math.round(gap.predictedProficiency90d - gap.currentProficiency)}%
                            predicted
                          </p>
                        </div>
                      </div>

                      {/* Time Estimate */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Estimated {gap.estimatedHoursToClose}h to close gap
                        </span>
                      </div>

                      {/* Recommended Action */}
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Recommended Action
                        </p>
                        <p className="text-sm text-muted-foreground">{gap.recommendedAction}</p>
                        <Button className="mt-3 w-full" variant="outline">
                          View Resources
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="impact" className="mt-6">
              <div className="space-y-3">
                {skillGaps
                  .sort((a, b) => {
                    const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return (
                      (impactOrder[b.businessImpact] || 0) - (impactOrder[a.businessImpact] || 0)
                    );
                  })
                  .map((gap, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{gap.categoryName}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(gap.gapSize)}% gap
                        </p>
                      </div>
                      <Badge className={getImpactColor(gap.businessImpact)}>
                        {gap.businessImpact}
                      </Badge>
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <div className="space-y-4">
                {skillGaps
                  .sort((a, b) => a.estimatedHoursToClose - b.estimatedHoursToClose)
                  .map((gap, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-20 text-right">
                        <p className="text-2xl font-bold">{gap.estimatedHoursToClose}h</p>
                      </div>
                      <div className="flex-1">
                        <Progress
                          value={100 - (gap.estimatedHoursToClose / 100) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="flex-shrink-0 w-40">
                        <p className="font-medium text-sm">{gap.categoryName}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
