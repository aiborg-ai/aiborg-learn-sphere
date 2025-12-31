/**
 * AssessmentHistoryPanel Component
 * Displays attempt history with trends and comparison
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentAttemptHistory } from '@/hooks/useAssessmentAttempts';
import { useAssessmentTool } from '@/hooks/useAssessmentTools';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Target,
  Trophy,
  Loader2,
  AlertCircle,
  Eye,
} from '@/components/ui/icons';
import { format } from 'date-fns';

export function AssessmentHistoryPanel() {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const navigate = useNavigate();

  const { data: tool, isLoading: toolLoading } = useAssessmentTool(toolSlug || '');
  const { data: history, isLoading: historyLoading } = useAssessmentAttemptHistory(tool?.id);

  if (toolLoading || historyLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-16 px-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading assessment history...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tool || !history || history.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-16 px-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No assessment history found. Take the assessment to see your results here.
            </AlertDescription>
          </Alert>

          <Button onClick={() => navigate(`/assessment/${toolSlug}`)} className="mt-4" size="lg">
            Take Assessment
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate statistics
  const totalAttempts = history.length;
  const bestScore = Math.max(...history.map(h => h.score_percentage));
  const latestScore = history[history.length - 1].score_percentage;
  const averageScore = history.reduce((sum, h) => sum + h.score_percentage, 0) / history.length;

  const overallTrend = history.length > 1 ? latestScore - history[0].score_percentage : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
          <p className="text-muted-foreground">Assessment History & Progress</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{totalAttempts}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Attempts</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{bestScore.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Best Score
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{averageScore.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Target className="h-3 w-3" />
                  Average Score
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`text-3xl font-bold ${
                      overallTrend > 0
                        ? 'text-green-600'
                        : overallTrend < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {overallTrend > 0 ? '+' : ''}
                    {overallTrend.toFixed(1)}%
                  </span>
                  {overallTrend > 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : overallTrend < 0 ? (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  ) : (
                    <Minus className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Overall Trend</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempt History */}
        <Card>
          <CardHeader>
            <CardTitle>Attempt History</CardTitle>
            <CardDescription>
              View all your attempts and track your progress over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((attempt, index) => {
                const isLatest = index === history.length - 1;
                const isPassed = attempt.score_percentage >= tool.passing_score_percentage;
                const improvement = attempt.improvement_from_previous;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                      isLatest ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Left: Attempt info */}
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold">#{attempt.attempt_number}</div>
                          {isLatest && (
                            <Badge variant="secondary" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(attempt.completed_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {attempt.time_taken_seconds && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {Math.floor(attempt.time_taken_seconds / 60)} min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Score */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              isPassed ? 'text-green-600' : 'text-orange-600'
                            }`}
                          >
                            {attempt.score_percentage.toFixed(1)}%
                          </div>
                          {isPassed && (
                            <Badge className="bg-green-600 text-white text-xs">Passed</Badge>
                          )}
                        </div>

                        {/* Improvement indicator */}
                        {improvement !== undefined && improvement !== null && (
                          <div className="flex items-center gap-1">
                            {improvement > 0 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">
                                  +{improvement.toFixed(1)}%
                                </span>
                              </>
                            ) : improvement < 0 ? (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">
                                  {improvement.toFixed(1)}%
                                </span>
                              </>
                            ) : (
                              <>
                                <Minus className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-600">0%</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: View button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/assessment/${toolSlug}/results/${attempt.attempt_id}`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <Button size="lg" onClick={() => navigate(`/assessment/${toolSlug}`)}>
            Take New Attempt
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
