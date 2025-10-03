import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  Brain,
  TrendingUp,
  Award,
  Target,
  Zap,
  BarChart3,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  Star,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  Trophy,
  Sparkles
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

interface AssessmentResult {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  completion_time_seconds: number;
  completed_at: string;
  audience_type?: string;
}

interface CategoryInsight {
  category_name: string;
  category_score: number;
  category_max_score: number;
  strength_level: string;
  recommendations: string[];
  percentage: number;
}

interface Benchmark {
  category_name: string;
  user_score: number;
  average_score: number;
  percentile: number;
}

const COLORS = {
  expert: '#10b981',
  advanced: '#3b82f6',
  intermediate: '#f59e0b',
  beginner: '#ef4444'
};

const LEVEL_DESCRIPTIONS = {
  expert: 'You are a power user of AI tools and highly augmented in your daily workflows.',
  advanced: 'You have strong AI adoption and regularly leverage AI for productivity.',
  intermediate: 'You are on your way to becoming AI-augmented with room for growth.',
  beginner: 'You are just starting your AI journey with lots of potential to explore.'
};

export default function AIAssessmentResults() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [toolRecommendations, setToolRecommendations] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<unknown[]>([]);

  useEffect(() => {
    if (assessmentId) {
      fetchResults();
    }
  }, [assessmentId]);

  const fetchResults = async () => {
    try {
      setLoading(true);

      // Fetch assessment result
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch category insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('assessment_insights')
        .select(`
          *,
          assessment_categories (
            name,
            icon
          )
        `)
        .eq('assessment_id', assessmentId);

      if (insightsError) throw insightsError;

      const processedInsights = insightsData?.map(insight => ({
        category_name: insight.assessment_categories?.name || 'Unknown',
        category_score: insight.category_score,
        category_max_score: insight.category_max_score,
        strength_level: insight.strength_level,
        recommendations: insight.recommendations || [],
        percentage: (insight.category_score / insight.category_max_score) * 100
      })) || [];

      setInsights(processedInsights);

      // Fetch benchmark comparisons
      if (assessmentData.audience_type) {
        const { data: benchmarkData } = await supabase
          .from('assessment_benchmarks')
          .select('*')
          .eq('audience_type', assessmentData.audience_type);

        // Calculate user's percentile for each category
        const benchmarkComparisons = processedInsights.map(insight => {
          const benchmark = benchmarkData?.find(b =>
            b.category_id === insightsData?.find(i =>
              i.assessment_categories?.name === insight.category_name
            )?.category_id
          );

          let percentile = 50;
          if (benchmark) {
            if (insight.percentage >= benchmark.percentile_90) percentile = 95;
            else if (insight.percentage >= benchmark.percentile_75) percentile = 85;
            else if (insight.percentage >= benchmark.median_score) percentile = 60;
            else if (insight.percentage >= benchmark.percentile_25) percentile = 35;
            else percentile = 15;
          }

          return {
            category_name: insight.category_name,
            user_score: insight.percentage,
            average_score: benchmark?.average_score || 50,
            percentile
          };
        });

        setBenchmarks(benchmarkComparisons);
      }

      // Fetch tool recommendations based on weak areas
      const weakAreas = processedInsights.filter(i =>
        i.strength_level === 'weak' || i.strength_level === 'developing'
      );

      if (weakAreas.length > 0) {
        // Fetch recommended tools for improvement
        const { data: toolsData } = await supabase
          .from('ai_tools')
          .select('name, description, website_url, difficulty_level')
          .eq('is_active', true)
          .eq('difficulty_level', 'beginner')
          .limit(5);

        setToolRecommendations(toolsData || []);
      }

      // Check for new achievements
      await checkAchievements(assessmentData);

    } catch (error) {
      logger.error('Error fetching assessment results:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async (assessmentData: AssessmentResult) => {
    if (!user) return;

    try {
      // Check if user earned any achievements
      const scorePercentage = (assessmentData.total_score / assessmentData.max_possible_score) * 100;

      const { data: achievementsData } = await supabase
        .from('assessment_achievements')
        .select('*')
        .eq('is_active', true);

      const newAchievements = [];

      for (const achievement of achievementsData || []) {
        // Check if user already has this achievement
        const { data: existing } = await supabase
          .from('user_assessment_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_id', achievement.id)
          .single();

        if (!existing) {
          // Check if user qualifies for this achievement
          let qualified = false;

          if (achievement.criteria_type === 'score' && scorePercentage >= achievement.criteria_value) {
            qualified = true;
          }
          // Add more criteria checks as needed

          if (qualified) {
            // Award achievement
            await supabase
              .from('user_assessment_achievements')
              .insert({
                user_id: user.id,
                achievement_id: achievement.id,
                assessment_id: assessmentData.id
              });

            newAchievements.push(achievement);
          }
        }
      }

      setAchievements(newAchievements);
    } catch (error) {
      logger.error('Error checking achievements:', error);
    }
  };

  const handleShare = () => {
    if (!assessment) return;

    const shareText = `I just completed the AIBORG Assessment and scored ${assessment.total_score}/${assessment.max_possible_score}! My AI augmentation level: ${assessment.augmentation_level}. Take the assessment at AIBORG Learning Platform!`;

    if (navigator.share) {
      navigator.share({
        title: 'My AI Augmentation Score',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      // Show toast notification
    }
  };

  const handleDownloadReport = () => {
    // Generate PDF report
    // This would integrate with a PDF generation library
    logger.log('Generating PDF report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Assessment not found. Please complete an assessment first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const scorePercentage = Math.round((assessment.total_score / assessment.max_possible_score) * 100);
  const radarData = insights.map(insight => ({
    category: insight.category_name,
    score: insight.percentage,
    fullMark: 100
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link to="/ai-assessment" className="text-primary hover:underline flex items-center gap-2 mb-4">
          ← Back to Assessment
        </Link>
        <h1 className="text-4xl font-bold mb-2">Your AI Augmentation Results</h1>
        <p className="text-muted-foreground">
          Completed on {new Date(assessment.completed_at).toLocaleDateString()}
        </p>
      </div>

      {/* New Achievements Alert */}
      {achievements.length > 0 && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <Trophy className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-semibold mb-2">New Achievements Unlocked!</div>
            <div className="flex flex-wrap gap-2">
              {achievements.map(achievement => (
                <Badge key={achievement.id} variant="secondary">
                  {achievement.name}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Score Card */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{scorePercentage}%</div>
                    <div className="text-sm text-muted-foreground">AI Score</div>
                  </div>
                </div>
                <div
                  className="absolute inset-0 w-32 h-32 rounded-full border-8"
                  style={{
                    borderColor: COLORS[assessment.augmentation_level as keyof typeof COLORS],
                    borderRightColor: 'transparent',
                    borderBottomColor: 'transparent',
                    transform: `rotate(${(scorePercentage / 100) * 180 - 45}deg)`
                  }}
                />
              </div>
            </div>

            {/* Level Badge */}
            <div className="flex flex-col items-center justify-center text-center">
              <Badge
                className="text-lg px-4 py-2 mb-4"
                style={{
                  backgroundColor: COLORS[assessment.augmentation_level as keyof typeof COLORS],
                  color: 'white'
                }}
              >
                {assessment.augmentation_level.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {LEVEL_DESCRIPTIONS[assessment.augmentation_level as keyof typeof LEVEL_DESCRIPTIONS]}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Score</span>
                <span className="font-semibold">{assessment.total_score}/{assessment.max_possible_score}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion Time</span>
                <span className="font-semibold">
                  {Math.floor(assessment.completion_time_seconds / 60)}m {assessment.completion_time_seconds % 60}s
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Audience Group</span>
                <span className="font-semibold">{assessment.audience_type || 'General'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="breakdown" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="comparison">Peer Comparison</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="roadmap">Growth Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>
                Your strengths and areas for improvement across different AI usage categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Your Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{insight.category_name}</span>
                        <Badge variant={
                          insight.strength_level === 'strong' ? 'default' :
                          insight.strength_level === 'proficient' ? 'secondary' :
                          insight.strength_level === 'developing' ? 'outline' :
                          'destructive'
                        }>
                          {insight.strength_level}
                        </Badge>
                      </div>
                      <Progress value={insight.percentage} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{insight.category_score}/{insight.category_max_score} points</span>
                        <span>{Math.round(insight.percentage)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>How You Compare</CardTitle>
              <CardDescription>
                Your performance compared to other {assessment.audience_type || 'users'} on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {benchmarks.length > 0 ? (
                <div className="space-y-6">
                  {benchmarks.map((benchmark, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{benchmark.category_name}</span>
                        <div className="flex items-center gap-2">
                          {benchmark.user_score > benchmark.average_score ? (
                            <ArrowUp className="h-4 w-4 text-green-500" />
                          ) : benchmark.user_score < benchmark.average_score ? (
                            <ArrowDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm font-medium">
                            {benchmark.user_score > benchmark.average_score ? '+' : ''}
                            {Math.round(benchmark.user_score - benchmark.average_score)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">You</div>
                          <Progress value={benchmark.user_score} className="h-2" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Average</div>
                          <Progress value={benchmark.average_score} className="h-2" />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        You're in the top {100 - benchmark.percentile}% for this category
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Peer comparison data is being calculated. Check back later!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                AI tools and resources to boost your augmentation level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category-specific recommendations */}
              {insights
                .filter(i => i.strength_level === 'weak' || i.strength_level === 'developing')
                .map((insight, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Improve {insight.category_name}
                    </h4>
                    <ul className="space-y-2">
                      {insight.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

              {/* Tool recommendations */}
              {toolRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Recommended AI Tools to Get Started
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {toolRecommendations.map((tool: unknown, index) => (
                      <Card key={index} className="p-4">
                        <h5 className="font-medium mb-1">{tool.name}</h5>
                        <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {tool.difficulty_level}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap">
          <Card>
            <CardHeader>
              <CardTitle>Your AI Growth Roadmap</CardTitle>
              <CardDescription>
                A personalized path to increase your AI augmentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Week 1-2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div className="w-0.5 h-full bg-muted mt-2" />
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold mb-2">Week 1-2: Foundation</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Set up 2-3 basic AI tools from recommendations</li>
                      <li>• Complete beginner tutorials for each tool</li>
                      <li>• Practice daily with simple tasks</li>
                    </ul>
                  </div>
                </div>

                {/* Week 3-4 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/80 text-white flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div className="w-0.5 h-full bg-muted mt-2" />
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold mb-2">Week 3-4: Integration</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Integrate AI tools into your daily workflow</li>
                      <li>• Explore advanced features</li>
                      <li>• Join AI communities for tips and tricks</li>
                    </ul>
                  </div>
                </div>

                {/* Month 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/60 text-white flex items-center justify-center font-semibold">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Month 2: Expansion</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Add specialized tools for your weak areas</li>
                      <li>• Automate repetitive tasks</li>
                      <li>• Retake assessment to track progress</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Based on your current level, you could increase your AI augmentation score by
                  <span className="font-semibold"> 30-40%</span> in the next 2 months with consistent practice.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleShare} variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>
        <Button onClick={handleDownloadReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button onClick={() => navigate('/ai-assessment')} className="btn-hero">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retake Assessment
        </Button>
        <Button onClick={() => navigate('/training-programs')} variant="default">
          Browse AI Courses
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}