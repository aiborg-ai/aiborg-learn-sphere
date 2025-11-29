/**
 * Question Level Analytics Component
 * Displays granular performance analytics at the question level
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PerformanceAnalyticsService,
  type QuestionPerformance,
  type TopicPerformance,
  type LearningCurveData,
  type CommonMistake,
  type DetailedPerformanceStats,
} from '@/services/analytics/PerformanceAnalyticsService';
import { ChartLoadingSkeleton } from './AnalyticsLoadingSkeleton';
import { AnalyticsErrorDisplay } from './AnalyticsErrorBoundary';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle, Target } from '@/components/ui/icons';

interface QuestionLevelAnalyticsProps {
  userId: string;
}

export function QuestionLevelAnalytics({ userId }: QuestionLevelAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<DetailedPerformanceStats | null>(null);
  const [questions, setQuestions] = useState<QuestionPerformance[]>([]);
  const [topics, setTopics] = useState<TopicPerformance[]>([]);
  const [learningCurve, setLearningCurve] = useState<LearningCurveData[]>([]);
  const [mistakes, setMistakes] = useState<CommonMistake[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPerformanceData();
  }, [userId]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, questionsData, topicsData, curveData, mistakesData] = await Promise.all([
        PerformanceAnalyticsService.getDetailedPerformanceStats(userId),
        PerformanceAnalyticsService.getQuestionLevelPerformance(userId, 20),
        PerformanceAnalyticsService.getTopicPerformance(userId),
        PerformanceAnalyticsService.getLearningCurve(userId),
        PerformanceAnalyticsService.getCommonMistakes(userId, 5),
      ]);

      setStats(statsData);
      setQuestions(questionsData);
      setTopics(topicsData);
      setLearningCurve(curveData);
      setMistakes(mistakesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load performance data'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ChartLoadingSkeleton />;
  }

  if (error) {
    return <AnalyticsErrorDisplay error={error} retry={fetchPerformanceData} />;
  }

  if (!stats || stats.totalQuestionsAttempted === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete some quizzes or assessments to see your detailed performance analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMasteryBadge = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      expert: 'default',
      advanced: 'secondary',
      intermediate: 'outline',
      beginner: 'destructive',
    };
    return <Badge variant={variants[level] || 'secondary'}>{level}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                <p className="text-2xl font-bold">{stats.overallAccuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={stats.overallAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Questions Attempted</p>
                <p className="text-2xl font-bold">{stats.totalQuestionsAttempted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalCorrect} correct, {stats.totalIncorrect} incorrect
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time/Question</p>
                <p className="text-2xl font-bold">{stats.averageTimePerQuestion}s</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Improvement</p>
                <p className={`text-2xl font-bold ${stats.improvementRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${stats.improvementRate >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Consistency: {stats.consistencyScore}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="mistakes">Common Mistakes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance by Difficulty */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Difficulty</CardTitle>
              <CardDescription>How you perform on questions of varying difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { difficulty: 'Easy', accuracy: stats.performanceByDifficulty.easy.percentage, total: stats.performanceByDifficulty.easy.total },
                  { difficulty: 'Medium', accuracy: stats.performanceByDifficulty.medium.percentage, total: stats.performanceByDifficulty.medium.total },
                  { difficulty: 'Hard', accuracy: stats.performanceByDifficulty.hard.percentage, total: stats.performanceByDifficulty.hard.total },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="difficulty" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#8b5cf6" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Learning Curve */}
          {learningCurve.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Curve</CardTitle>
                <CardDescription>Your performance improvement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={learningCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Questions</CardTitle>
              <CardDescription>Your performance on individual questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={q.questionId} className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Question {index + 1}</span>
                          {q.topic && <Badge variant="outline" className="text-xs">{q.topic}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{q.questionText || 'Question text unavailable'}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {q.accuracy >= 80 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : q.accuracy >= 50 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-semibold">{Math.round(q.accuracy)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {q.correctAttempts}/{q.totalAttempts} correct
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={q.accuracy} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <Card key={topic.topic}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{topic.topic}</CardTitle>
                    {getMasteryBadge(topic.masteryLevel)}
                  </div>
                  <CardDescription>{topic.totalQuestions} questions attempted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Accuracy</span>
                        <span className="text-sm font-bold">{topic.averageAccuracy}%</span>
                      </div>
                      <Progress value={topic.averageAccuracy} />
                    </div>

                    {topic.weakAreas.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Needs Practice
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {topic.weakAreas.slice(0, 2).map((area, i) => (
                            <li key={i} className="line-clamp-1">• {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {topic.strongAreas.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Strong Areas
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {topic.strongAreas.slice(0, 2).map((area, i) => (
                            <li key={i} className="line-clamp-1">• {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Common Mistakes Tab */}
        <TabsContent value="mistakes">
          <Card>
            <CardHeader>
              <CardTitle>Common Mistakes</CardTitle>
              <CardDescription>Questions you frequently get wrong - focus here for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              {mistakes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">
                    No common mistakes found. Keep up the great work!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mistakes.map((mistake, index) => (
                    <div key={mistake.questionId} className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950 rounded-r-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Mistake #{index + 1}</span>
                            {mistake.topic && <Badge variant="outline">{mistake.topic}</Badge>}
                          </div>
                          <p className="text-sm mb-2">{mistake.questionText || 'Question text unavailable'}</p>
                          <p className="text-xs text-muted-foreground">
                            Answered incorrectly {mistake.incorrectCount} time{mistake.incorrectCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
