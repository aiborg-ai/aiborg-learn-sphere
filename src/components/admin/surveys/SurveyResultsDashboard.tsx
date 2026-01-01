/**
 * Survey Results Dashboard
 * Admin view for survey analytics and response data
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SurveyService,
  AUDIENCE_CATEGORIES,
  type Survey,
  type SurveyResultsData,
  type QuestionAnalytics,
  type AudienceCategory,
} from '@/services/surveys';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  ClipboardList,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  PieChartIcon,
  BarChart3,
} from 'lucide-react';

const CATEGORY_COLORS: Record<AudienceCategory, string> = {
  professional: '#3B82F6', // blue
  student: '#22C55E', // green
  entrepreneur: '#A855F7', // purple
  career_changer: '#F97316', // orange
};

const CHART_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
];

interface SurveyResultsDashboardProps {
  className?: string;
}

export function SurveyResultsDashboard({ className }: SurveyResultsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<SurveyResultsData | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load all surveys
  useEffect(() => {
    const loadSurveys = async () => {
      try {
        setLoading(true);
        const data = await SurveyService.getAllSurveys();
        setSurveys(data);
        if (data.length > 0) {
          setSelectedSurveyId(data[0].id);
        }
      } catch (_error) {
        logger.error('Failed to load surveys:', _error);
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, []);

  // Load results for selected survey
  useEffect(() => {
    const loadResults = async () => {
      if (!selectedSurveyId) return;

      try {
        setLoadingResults(true);
        const data = await SurveyService.getSurveyResults(selectedSurveyId);
        setResultsData(data);
      } catch (_error) {
        logger.error('Failed to load survey results:', _error);
      } finally {
        setLoadingResults(false);
      }
    };

    loadResults();
  }, [selectedSurveyId]);

  const handleRefresh = async () => {
    if (!selectedSurveyId) return;
    setLoadingResults(true);
    try {
      const data = await SurveyService.getSurveyResults(selectedSurveyId);
      setResultsData(data);
    } catch (_error) {
      logger.error('Failed to refresh results:', _error);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleExportCSV = () => {
    if (!resultsData) return;

    // Create CSV content
    const headers = ['Question', 'Answer', 'Count', 'Percentage'];
    const rows: string[][] = [];

    for (const q of resultsData.questions) {
      const total = q.total_answers;
      for (const [answer, count] of Object.entries(q.answer_distribution)) {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
        rows.push([q.question_text, answer, String(count), `${percentage}%`]);
      }
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join(
      '\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-results-${selectedSurveyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (surveys.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Surveys Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first survey to start gathering feedback.
          </p>
          <Button>Create Survey</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Survey Selector and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Survey Results</CardTitle>
              <CardDescription>View and analyze survey responses</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSurveyId || ''} onValueChange={setSelectedSurveyId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a survey" />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map(survey => (
                    <SelectItem key={survey.id} value={survey.id}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            survey.status === 'active'
                              ? 'default'
                              : survey.status === 'draft'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-xs"
                        >
                          {survey.status}
                        </Badge>
                        <span className="truncate max-w-[180px]">{survey.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loadingResults}
              >
                <RefreshCw className={cn('h-4 w-4', loadingResults && 'animate-spin')} />
              </Button>
              <Button variant="outline" onClick={handleExportCSV} disabled={!resultsData}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loadingResults ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resultsData ? (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Total Responses"
              value={resultsData.analytics.total_responses}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Completed"
              value={resultsData.analytics.completed_responses}
              subtext={`${Math.round((resultsData.analytics.completed_responses / Math.max(1, resultsData.analytics.total_responses)) * 100)}% completion rate`}
              color="green"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Avg. Completion"
              value={
                resultsData.analytics.avg_completion_seconds
                  ? `${Math.round(resultsData.analytics.avg_completion_seconds / 60)} min`
                  : '-'
              }
              color="orange"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Questions"
              value={resultsData.questions.length}
              color="purple"
            />
          </div>

          {/* Category Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Responses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resultsData.category_breakdown.filter(c => c.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="category"
                        label={({ category, percentage }) =>
                          `${AUDIENCE_CATEGORIES.find(c => c.id === category)?.name.split(' ')[0]} ${percentage.toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {resultsData.category_breakdown.map(entry => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value,
                          AUDIENCE_CATEGORIES.find(c => c.id === name)?.name || name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {resultsData.category_breakdown.map(cat => (
                    <div key={cat.category} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                      />
                      <span className="text-muted-foreground">
                        {AUDIENCE_CATEGORIES.find(c => c.id === cat.category)?.name}:
                      </span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Responses Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={resultsData.responses_over_time.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={d =>
                          new Date(d).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        }
                        className="text-xs"
                      />
                      <YAxis allowDecimals={false} className="text-xs" />
                      <Tooltip
                        labelFormatter={d => new Date(d).toLocaleDateString()}
                        formatter={(value: number) => [value, 'Responses']}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Question Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="0">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  {resultsData.questions.map((q, idx) => (
                    <TabsTrigger key={q.question_id} value={String(idx)} className="text-xs">
                      Q{idx + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {resultsData.questions.map((question, idx) => (
                  <TabsContent key={question.question_id} value={String(idx)}>
                    <QuestionResults question={question} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select a survey to view results</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className={cn('inline-flex p-3 rounded-full mb-3', colorClasses[color])}>{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
      </CardContent>
    </Card>
  );
}

// Question Results Component
function QuestionResults({ question }: { question: QuestionAnalytics }) {
  const sortedAnswers = useMemo(() => {
    return Object.entries(question.answer_distribution)
      .map(([answer, count]) => ({
        answer,
        count,
        percentage: question.total_answers > 0 ? (count / question.total_answers) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [question]);

  const chartData = sortedAnswers.slice(0, 10); // Top 10 for chart

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-1">{question.question_text}</h4>
        <p className="text-sm text-muted-foreground">
          {question.total_answers} responses • {question.question_type.replace('_', ' ')}
        </p>
      </div>

      {question.question_type === 'text' ? (
        // Text responses as list
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {sortedAnswers.map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        // Bar chart for choice questions
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="answer"
                  width={150}
                  tickFormatter={val => (val.length > 25 ? val.slice(0, 22) + '...' : val)}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} (${((value / question.total_answers) * 100).toFixed(1)}%)`,
                    'Responses',
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {sortedAnswers.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[200px]">{item.answer}</span>
                  <span className="font-medium">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown for this question */}
      {question.question_type !== 'text' && (
        <div className="pt-4 border-t">
          <h5 className="text-sm font-medium mb-3">Responses by Category</h5>
          <div className="grid gap-4 md:grid-cols-4">
            {AUDIENCE_CATEGORIES.map(cat => {
              const categoryAnswers = question.by_category[cat.id] || {};
              const topAnswer = Object.entries(categoryAnswers).sort((a, b) => b[1] - a[1])[0];

              return (
                <div key={cat.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.id] }}
                    />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  {topAnswer ? (
                    <p className="text-xs text-muted-foreground">
                      Top: <span className="text-foreground">{topAnswer[0]}</span> ({topAnswer[1]})
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No responses</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
