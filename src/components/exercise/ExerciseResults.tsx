/**
 * ExerciseResults Component
 * Displays submission results, test results, feedback, and score
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  AlertCircle,
  Code,
  FileText,
  RefreshCw,
  ChevronRight,
} from '@/components/ui/icons';
import type { ExerciseSubmission, Exercise } from '@/services/exercise/types';

interface ExerciseResultsProps {
  exercise: Exercise;
  submission: ExerciseSubmission;
}

export const ExerciseResults: React.FC<ExerciseResultsProps> = ({ exercise, submission }) => {
  const navigate = useNavigate();

  const isPassed = submission.status === 'passed' || submission.status === 'completed';
  const isUnderReview = submission.status === 'submitted' || submission.status === 'under_review';
  const needsRevision = submission.status === 'needs_revision';

  const getStatusConfig = () => {
    if (isPassed) {
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: 'Exercise Completed!',
        message: 'Congratulations! You have successfully completed this exercise.',
      };
    }
    if (needsRevision) {
      return {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        title: 'Revision Needed',
        message: 'Please review the feedback and submit a revised version.',
      };
    }
    if (isUnderReview) {
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        title: 'Under Review',
        message: 'Your submission is being reviewed. Check back later for feedback.',
      };
    }
    return {
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      title: 'Submission Received',
      message: 'Your submission has been received.',
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Header */}
      <Card className={`${statusConfig.borderColor} ${statusConfig.bgColor} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${statusConfig.color} mb-1`}>
                {statusConfig.title}
              </h2>
              <p className="text-muted-foreground">{statusConfig.message}</p>
            </div>
            {isPassed && submission.points_earned && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <span className="text-3xl font-bold text-primary">
                    {submission.points_earned}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">points earned</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Card */}
      {submission.score !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Your Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-primary">{submission.score}%</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPassed ? 'Passed!' : 'Keep trying!'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Points Earned</p>
                <p className="text-2xl font-semibold">{submission.points_earned || 0}</p>
                <p className="text-xs text-muted-foreground">of {exercise.points_reward}</p>
              </div>
            </div>
            <Progress value={submission.score || 0} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Test Results (for auto-graded exercises) */}
      {submission.test_results && submission.test_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              {submission.test_results.filter(t => t.passed).length} of{' '}
              {submission.test_results.length} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submission.test_results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <h4 className="font-semibold">{result.test_name}</h4>
                    </div>
                    <Badge variant={result.passed ? 'default' : 'destructive'}>
                      {result.points_earned} pts
                    </Badge>
                  </div>

                  {!result.passed && (
                    <div className="space-y-2 text-sm mt-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground mb-1">Expected:</p>
                          <code className="block p-2 bg-white rounded border">
                            {JSON.stringify(result.expected, null, 2)}
                          </code>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Your Output:</p>
                          <code className="block p-2 bg-white rounded border">
                            {JSON.stringify(result.actual, null, 2)}
                          </code>
                        </div>
                      </div>
                      {result.error && (
                        <div>
                          <p className="text-red-600 font-medium mb-1">Error:</p>
                          <code className="block p-2 bg-white rounded border text-red-600">
                            {result.error}
                          </code>
                        </div>
                      )}
                    </div>
                  )}

                  {result.execution_time_ms && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Execution time: {result.execution_time_ms}ms
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {submission.feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instructor Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{submission.feedback}</p>
            </div>
            {submission.graded_by && <Separator className="my-4" />}
            {submission.graded_by && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Graded by instructor</span>
                <span>{formatDate(submission.graded_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rubric Scores */}
      {submission.peer_review_data && submission.peer_review_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Peer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.peer_review_data.map((review, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Reviewer {index + 1}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comments}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(review.submitted_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground mb-1">Submitted</dt>
              <dd className="font-medium">{formatDate(submission.submitted_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1">Status</dt>
              <dd className="font-medium capitalize">{submission.status.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1">Revision Count</dt>
              <dd className="font-medium">{submission.revision_count}</dd>
            </div>
            {submission.graded_at && (
              <div>
                <dt className="text-muted-foreground mb-1">Graded</dt>
                <dd className="font-medium">{formatDate(submission.graded_at)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
          Back to Exercise List
        </Button>
        {needsRevision && (
          <Button onClick={() => navigate(`/exercise/${exercise.id}/submit`)} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Submit Revision
          </Button>
        )}
        {isPassed && (
          <Button onClick={() => navigate(`/course/${exercise.course_id}`)} className="flex-1">
            Continue Learning
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
