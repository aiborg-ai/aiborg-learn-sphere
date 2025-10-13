/**
 * QuizReview Component
 * Review quiz answers with correct/incorrect feedback
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { useQuizAttempt, useQuiz } from '@/hooks/useQuiz';

export function QuizReview() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch data
  const { data: attempt, isLoading: attemptLoading } = useQuizAttempt(attemptId);
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizId, true);

  if (attemptLoading || quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!attempt || !quiz || !quiz.questions) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Unable to load quiz review</AlertDescription>
      </Alert>
    );
  }

  if (!quiz.show_correct_answers) {
    return (
      <Alert>
        <AlertDescription>
          The instructor has disabled answer review for this quiz.
        </AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentResponse = attempt.responses?.find(r => r.question_id === currentQuestion.id);

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getCorrectAnswerText = (question: typeof currentQuestion): string | undefined => {
    if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
      const correctOption = question.options?.find(o => o.is_correct);
      return correctOption?.option_text;
    }
    return undefined;
  };

  const correctCount = attempt.responses?.filter(r => r.is_correct).length || 0;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Quiz Review: {quiz.title}</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                  Score: {Math.round(attempt.percentage || 0)}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {correctCount} / {totalQuestions} correct
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/quiz/${quizId}/results/${attemptId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <Badge variant={currentResponse?.is_correct ? 'default' : 'destructive'}>
              {currentResponse?.is_correct ? 'Correct' : 'Incorrect'}
            </Badge>
          </div>

          {/* Question navigation */}
          <div className="flex flex-wrap gap-1">
            {quiz.questions.map((q, index) => {
              const response = attempt.responses?.find(r => r.question_id === q.id);
              const isCorrect = response?.is_correct;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                    index === currentQuestionIndex ? 'ring-2 ring-primary ring-offset-2' : ''
                  } ${
                    isCorrect
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  title={`Question ${index + 1} - ${isCorrect ? 'Correct' : 'Incorrect'}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question with Feedback */}
      <Card>
        <CardContent className="pt-6">
          <QuestionRenderer
            question={currentQuestion}
            onAnswer={() => {}} // Read-only
            initialAnswer={currentResponse?.selected_option_id || currentResponse?.answer_text}
            showFeedback={true}
            isCorrect={currentResponse?.is_correct}
            correctAnswer={getCorrectAnswerText(currentQuestion)}
          />

          {/* Points Information */}
          <div className="mt-4 p-4 bg-accent rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points for this question:</span>
              <span className="font-medium">
                {currentResponse?.points_earned || 0} / {currentQuestion.points}
              </span>
            </div>
            {currentResponse?.time_spent_seconds && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Time spent:</span>
                <span>{currentResponse.time_spent_seconds}s</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Navigation */}
        <Card.Footer className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestionIndex === quiz.questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Card.Footer>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Review Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Questions:</span>
            <span className="font-medium">{totalQuestions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Correct Answers:</span>
            <span className="font-medium text-green-600">{correctCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Incorrect Answers:</span>
            <span className="font-medium text-red-600">{totalQuestions - correctCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Final Score:</span>
            <span className="font-medium">
              {attempt.score} / {attempt.total_points}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Percentage:</span>
            <span className="font-medium">{Math.round(attempt.percentage || 0)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
