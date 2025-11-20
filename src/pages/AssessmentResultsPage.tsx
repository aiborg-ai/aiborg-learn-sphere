/**
 * AssessmentResultsPage
 * Displays results for a completed assessment attempt with detailed analytics
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentAttempt } from '@/hooks/useAssessmentAttempts';
import { useAssessmentTool } from '@/hooks/useAssessmentTools';
import { useAssessmentRecommendations } from '@/hooks/useAssessmentRecommendations';
import { AssessmentToolService } from '@/services/assessment-tools/AssessmentToolService';
import { Navbar, Footer } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedPerformanceBreakdown } from '@/components/assessment/EnhancedPerformanceBreakdown';
import { RecommendedResources } from '@/components/assessment/RecommendedResources';
import { LearningPathRoadmap } from '@/components/assessment/LearningPathRoadmap';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Share2,
  Download,
  Target,
  Award,
  Lightbulb,
  Loader2,
  AlertCircle,
} from '@/components/ui/icons';
import { useEffect, useState } from 'react';
import type { AssessmentResults } from '@/types/assessmentTools';
import { logger } from '@/utils/logger';

export default function AssessmentResultsPage() {
  const { toolSlug, attemptId } = useParams<{ toolSlug: string; attemptId: string }>();
  const navigate = useNavigate();

  const { data: attempt, isLoading: attemptLoading } = useAssessmentAttempt(attemptId);
  const [_toolId, setToolId] = useState<string | null>(null);

  // Get tool ID from attempt
  useEffect(() => {
    if (attempt) {
      setToolId(attempt.tool_id);
    }
  }, [attempt]);

  const { data: tool } = useAssessmentTool(toolSlug || '');
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  // Generate results
  useEffect(() => {
    const generateResults = async () => {
      if (attempt && tool) {
        try {
          const res = await AssessmentToolService.generateAssessmentResults(attempt, tool);
          setResults(res);
        } catch (error) {
          logger.error('Error generating results:', error);
        } finally {
          setIsLoadingResults(false);
        }
      }
    };

    generateResults();
  }, [attempt, tool]);

  // Get personalized recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useAssessmentRecommendations(
    results,
    toolSlug || ''
  );

  if (attemptLoading || isLoadingResults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !tool || !results) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container max-w-4xl mx-auto py-16 px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Results not found. Please try again.</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isPassed = attempt.score_percentage >= tool.passing_score_percentage;
  const scoreColor = isPassed ? 'text-green-600' : 'text-orange-600';
  const accuracyPercentage =
    attempt.questions_answered > 0
      ? (attempt.correct_answers / attempt.questions_answered) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Result Hero Card */}
        <Card className="mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <CardHeader className="relative text-center pb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {isPassed ? (
                <Trophy className="h-10 w-10 text-yellow-600" />
              ) : (
                <Target className="h-10 w-10 text-primary" />
              )}
            </div>
            <CardTitle className="text-3xl mb-2">{tool.name}</CardTitle>
            <CardDescription className="text-lg">
              Attempt #{attempt.attempt_number} Results
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6 pb-8">
            {/* Score Display */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${scoreColor} mb-2`}>
                {attempt.score_percentage.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">
                {attempt.total_score} / {attempt.max_possible_score} points
              </div>
              <div className="mt-4">
                <Progress value={attempt.score_percentage} className="h-3" />
              </div>
            </div>

            {/* Pass/Fail Badge */}
            <div className="flex justify-center">
              {isPassed ? (
                <Badge className="bg-green-600 text-white text-lg px-6 py-2">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Passed
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-lg px-6 py-2">
                  <XCircle className="mr-2 h-5 w-5" />
                  Not Passed (Passing: {tool.passing_score_percentage}%)
                </Badge>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{attempt.questions_answered}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-green-600">{attempt.correct_answers}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-blue-600">
                  {accuracyPercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-purple-600">
                  {results.percentile_rank || 50}
                </div>
                <div className="text-sm text-muted-foreground">Percentile</div>
              </div>
            </div>

            {/* Time Taken */}
            {attempt.time_taken_seconds && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Completed in {Math.floor(attempt.time_taken_seconds / 60)} minutes</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Performance Breakdown */}
        {results.performance_by_category.length > 0 && (
          <EnhancedPerformanceBreakdown
            performance={results.performance_by_category}
            averageScore={attempt.score_percentage}
          />
        )}

        {/* Recommendations */}
        {results.recommendations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Suggestions to improve your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Badges Earned */}
        {results.badges_earned && results.badges_earned.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {results.badges_earned.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-4 py-2">
                    <Award className="mr-2 h-4 w-4" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Path */}
        {!recommendationsLoading &&
          recommendations?.learningPath &&
          recommendations.learningPath.length > 0 && (
            <LearningPathRoadmap steps={recommendations.learningPath} className="mb-8" />
          )}

        {/* Recommended Resources */}
        {!recommendationsLoading && recommendations && (
          <div className="mb-8">
            <RecommendedResources
              courses={recommendations.courses}
              blogPosts={recommendations.blogPosts}
              weakCategories={results.performance_by_category
                .filter(cat => cat.score_percentage < 70)
                .map(cat => cat.category_name.toLowerCase())}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" onClick={() => navigate(`/assessment/${toolSlug}`)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake Assessment
          </Button>

          <Button size="lg" variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>

          <Button size="lg" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Certificate
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(`/assessment/${toolSlug}/history`)}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            View History
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
