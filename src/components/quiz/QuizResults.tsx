/**
 * QuizResults Component
 * Displays quiz results after completion
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  Eye,
  Loader2,
} from '@/components/ui/icons';
import { useQuizAttempt, useQuiz } from '@/hooks/useQuiz';
import type { CompleteQuizResult } from '@/services/quiz/types';

export function QuizResults() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get result from navigation state (if coming from quiz submission)
  const navigationResult = location.state?.result as CompleteQuizResult | undefined;

  // Fetch attempt details
  const { data: attempt, isLoading: attemptLoading } = useQuizAttempt(attemptId);
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId, false);

  if (attemptLoading || quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Quiz results not found</AlertDescription>
      </Alert>
    );
  }

  const passed = attempt.passed || false;
  const percentage = attempt.percentage || 0;
  const score = attempt.score || 0;
  const totalPoints = attempt.total_points || 0;
  const pointsEarned = navigationResult?.points_awarded || 0;

  const formatTime = (seconds: number | undefined): string => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <Card className={passed ? 'border-green-500' : 'border-orange-500'}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {passed ? (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                <Target className="h-10 w-10 text-orange-600" />
              </div>
            )}
          </div>

          <CardTitle className="text-3xl">
            {passed ? '🎉 Congratulations!' : 'Quiz Completed'}
          </CardTitle>
          <CardDescription className="text-lg">{quiz.title}</CardDescription>
        </CardHeader>
      </Card>

      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Score */}
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold">{Math.round(percentage)}%</div>
            <div className="text-xl text-muted-foreground">
              {score} out of {totalPoints} points
            </div>
            <Badge
              variant={passed ? 'default' : 'secondary'}
              className={`text-lg px-4 py-1 ${passed ? 'bg-green-500' : 'bg-orange-500'}`}
            >
              {passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Pass Threshold</span>
              <span>{quiz.pass_percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="flex justify-center mb-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">{pointsEarned}</div>
              <div className="text-xs text-muted-foreground">Points Earned</div>
            </div>

            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="flex justify-center mb-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{formatTime(attempt.time_taken_seconds)}</div>
              <div className="text-xs text-muted-foreground">Time Taken</div>
            </div>

            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>

            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="flex justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">#{attempt.attempt_number}</div>
              <div className="text-xs text-muted-foreground">Attempt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {!passed && (
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-medium">Keep practicing!</p>
            <p>
              You need {quiz.pass_percentage}% to pass. You scored {Math.round(percentage)}%.
            </p>
            {quiz.max_attempts && attempt.attempt_number < quiz.max_attempts && (
              <p>You have {quiz.max_attempts - attempt.attempt_number} attempt(s) remaining.</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {passed && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-medium text-green-900">Excellent work!</p>
            <p className="text-green-800">
              You've successfully passed this quiz and earned {pointsEarned} AIBORG points!
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate(`/course/${quiz.course_id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>

            {quiz.show_correct_answers && (
              <Button
                variant="outline"
                onClick={() => navigate(`/quiz/${quizId}/review/${attemptId}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Answers
              </Button>
            )}

            {!passed && quiz.max_attempts && attempt.attempt_number < quiz.max_attempts && (
              <Button onClick={() => navigate(`/quiz/${quizId}`)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quiz Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Difficulty:</span>
            <Badge variant="outline">{quiz.difficulty_level}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category:</span>
            <span>{quiz.category || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Limit:</span>
            <span>
              {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} minutes` : 'No limit'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Attempts:</span>
            <span>{quiz.max_attempts || 'Unlimited'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed At:</span>
            <span>{new Date(attempt.completed_at!).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
