/**
 * Assessment Analytics Dashboard
 * Detailed analytics and insights after assessment completion
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { ProfilingData, AssessmentResponse } from '@/types/assessment';

interface AssessmentData {
  id: string;
  completed_at: string;
  current_ability_estimate: number;
  augmentation_level: string;
  profiling_data: ProfilingData;
}

interface CategoryPerformance {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
  avgDifficulty: number;
}

interface HistoricalDataPoint {
  date: string;
  ability: number;
  confidence: number;
}

interface Props {
  assessmentId: string;
  userId: string;
  onClose?: () => void;
}

export function AssessmentAnalyticsDashboard({ assessmentId, userId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAnalyticsData is stable
  }, [assessmentId, userId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch current assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setCurrentAssessment(assessment);

      // Fetch historical assessments for trend
      const { data: history, error: historyError } = await supabase
        .from('user_ai_assessments')
        .select('completed_at, current_ability_estimate')
        .eq('user_id', userId)
        .eq('is_complete', true)
        .order('completed_at', { ascending: true })
        .limit(10);

      if (historyError) throw historyError;

      const historicalPoints = (history || []).map(h => ({
        date: new Date(h.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        ability: h.current_ability_estimate,
        confidence: 70 + Math.random() * 25, // Mock confidence for now
      }));
      setHistoricalData(historicalPoints);

      // Fetch responses for category breakdown
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select(
          `
          is_correct,
          assessment_questions (
            category_name,
            difficulty_level
          )
        `
        )
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      // Calculate category performance
      const categoryMap = new Map<
        string,
        { correct: number; total: number; difficulties: string[] }
      >();

      responses?.forEach((response: AssessmentResponse) => {
        const category = response.assessment_questions?.category_name || 'Unknown';
        const existing = categoryMap.get(category) || { correct: 0, total: 0, difficulties: [] };

        existing.total++;
        if (response.is_correct) existing.correct++;
        existing.difficulties.push(response.assessment_questions?.difficulty_level || 'applied');

        categoryMap.set(category, existing);
      });

      const categoryPerf: CategoryPerformance[] = Array.from(categoryMap.entries()).map(
        ([category, stats]) => {
          const difficultyScore =
            stats.difficulties.reduce((sum, diff) => {
              const scores = { foundational: 1, applied: 2, advanced: 3, expert: 4 };
              return sum + (scores[diff as keyof typeof scores] || 2);
            }, 0) / stats.difficulties.length;

          return {
            category,
            correct: stats.correct,
            total: stats.total,
            accuracy: (stats.correct / stats.total) * 100,
            avgDifficulty: difficultyScore,
          };
        }
      );

      setCategoryPerformance(categoryPerf);

      // Identify strengths and weaknesses
      const sorted = [...categoryPerf].sort((a, b) => b.accuracy - a.accuracy);
      setStrengths(sorted.slice(0, 3).map(c => c.category));
      setWeaknesses(sorted.slice(-3).map(c => c.category));

      // Generate recommendations based on performance
      const recs: string[] = [];
      if (assessment.current_ability_estimate < 0.5) {
        recs.push('Start with foundational AI concepts and terminology');
        recs.push('Focus on hands-on practice with basic AI tools');
      } else if (assessment.current_ability_estimate < 1.5) {
        recs.push('Explore practical applications of AI in your field');
        recs.push('Learn about prompt engineering and AI workflows');
      } else {
        recs.push('Dive into advanced AI techniques and frameworks');
        recs.push('Consider contributing to AI projects or research');
      }

      sorted.slice(-2).forEach(weak => {
        recs.push(`Strengthen your knowledge in ${weak.category}`);
      });

      setRecommendations(recs.slice(0, 5));
    } catch (_error) {
      logger.error('Error fetching analytics:', _error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !currentAssessment) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const latestAbility = historicalData[historicalData.length - 1]?.ability || 0;
  const previousAbility = historicalData[historicalData.length - 2]?.ability || latestAbility;
  const abilityChange = latestAbility - previousAbility;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Assessment Complete!
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Here's your detailed performance analysis
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Augmentation Level</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 capitalize">
                {currentAssessment.augmentation_level}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Ability Score</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {currentAssessment.current_ability_estimate.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {abilityChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-600">Progress</span>
              </div>
              <p
                className={`text-2xl font-bold ${abilityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {abilityChange >= 0 ? '+' : ''}
                {abilityChange.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <PieChart className="h-4 w-4 mr-2" />
            Breakdown
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <BookOpen className="h-4 w-4 mr-2" />
            Next Steps
          </TabsTrigger>
        </TabsList>

        {/* Performance Over Time Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>
                Your ability score over your last {historicalData.length} assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorAbility" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ability"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAbility)"
                    name="Ability Score"
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorConfidence)"
                    name="Confidence %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Your accuracy across different AI knowledge areas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strengths & Weaknesses Radar</CardTitle>
              <CardDescription>Skill distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={categoryPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Accuracy"
                    dataKey="accuracy"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strengths.map((strength, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-700">
                      <Award className="h-4 w-4" />
                      <span className="font-medium">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-center gap-2 text-orange-700">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Personalized Learning Recommendations
              </CardTitle>
              <CardDescription>Based on your performance, here's what we recommend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="mt-0.5">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-gray-700 flex-1">{rec}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Ready to level up?
                </h4>
                <p className="text-purple-800 text-sm mb-3">
                  Generate a personalized AI learning path based on your assessment results
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Generate Learning Path
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
