/**
 * QuizTaker Component
 * Main component for taking a quiz
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { QuizTimer } from './QuizTimer';
import { QuizProgress } from './QuizProgress';
import { useQuiz, useStartQuiz, useSubmitQuizAnswer, useCompleteQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export function QuizTaker() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Quiz data
  const { data: quizData, isLoading: quizLoading } = useQuiz(quizId, true);

  // Mutations
  const startQuiz = useStartQuiz();
  const submitAnswer = useSubmitQuizAnswer();
  const completeQuiz = useCompleteQuiz();

  // State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, Date>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [attemptStartTime, setAttemptStartTime] = useState<Date | null>(null);

  // Start quiz on load
  useEffect(() => {
    if (quizData && user && !attemptId) {
      startQuizAttempt();
    }
  }, [quizData, user]);

  // Track time for current question
  useEffect(() => {
    if (quizData && currentQuestionIndex < quizData.questions!.length) {
      const questionId = quizData.questions![currentQuestionIndex].id;
      if (!questionStartTimes[questionId]) {
        setQuestionStartTimes(prev => ({
          ...prev,
          [questionId]: new Date(),
        }));
      }
    }
  }, [currentQuestionIndex, quizData]);

  const startQuizAttempt = async () => {
    if (!quizData || !user) return;

    try {
      const attempt = await startQuiz.mutateAsync({
        quiz_bank_id: quizData.id,
        user_id: user.id,
      });

      setAttemptId(attempt.id);
      setAttemptStartTime(new Date(attempt.started_at));
      logger.info('Quiz attempt started', { attemptId: attempt.id });
    } catch (error) {
      logger.error('Failed to start quiz', { error });
      navigate('/courses');
    }
  };

  const handleAnswer = async (answer: string | string[]) => {
    if (!attemptId || !quizData) return;

    const question = quizData.questions![currentQuestionIndex];

    // Update local state
    setAnswers(prev => ({
      ...prev,
      [question.id]: answer,
    }));

    // Calculate time spent
    const startTime = questionStartTimes[question.id];
    const timeSpent = startTime
      ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      : 0;

    // Submit answer to backend
    try {
      await submitAnswer.mutateAsync({
        attempt_id: attemptId,
        question_id: question.id,
        selected_option_id: typeof answer === 'string' ? answer : undefined,
        answer_text: typeof answer === 'string' ? answer : undefined,
        time_spent_seconds: timeSpent,
      });
    } catch (error) {
      logger.error('Failed to submit answer', { error });
    }
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.questions!.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    try {
      const result = await completeQuiz.mutateAsync(attemptId);

      // Navigate to results page
      navigate(`/quiz/${quizId}/results/${attemptId}`, {
        state: { result },
      });
    } catch (error) {
      logger.error('Failed to submit quiz', { error });
    }
  };

  const handleTimeout = () => {
    setShowSubmitDialog(false);
    handleSubmit();
  };

  if (quizLoading || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This quiz has no questions. Please contact your instructor.
        </AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;
  const canSubmit = answeredQuestions === quizData.questions.length;

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quizData.title}</CardTitle>
          {quizData.description && <p className="text-muted-foreground">{quizData.description}</p>}
        </CardHeader>
      </Card>

      {/* Timer (if timed quiz) */}
      {quizData.time_limit_minutes && attemptStartTime && (
        <QuizTimer
          timeLimitMinutes={quizData.time_limit_minutes}
          startTime={attemptStartTime}
          onTimeout={handleTimeout}
        />
      )}

      {/* Progress */}
      <QuizProgress
        totalQuestions={quizData.questions.length}
        answeredQuestions={answeredQuestions}
        currentQuestion={currentQuestionIndex}
        questionStatuses={quizData.questions.map(q => (answers[q.id] ? 'answered' : 'unanswered'))}
      />

      {/* Question */}
      <Card>
        <CardContent className="pt-6">
          <QuestionRenderer
            question={currentQuestion}
            onAnswer={handleAnswer}
            initialAnswer={answers[currentQuestion.id]}
          />
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {isLastQuestion ? (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={!canSubmit || completeQuiz.isPending}
              >
                {completeQuiz.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Unanswered questions warning */}
      {isLastQuestion && !canSubmit && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {quizData.questions.length - answeredQuestions} unanswered question(s). Please
            answer all questions before submitting.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to submit your quiz?</p>
              <p className="font-medium">
                You have answered {answeredQuestions} out of {quizData.questions.length} questions.
              </p>
              {!canSubmit && (
                <p className="text-destructive">
                  ⚠️ Warning: You still have {quizData.questions.length - answeredQuestions}{' '}
                  unanswered questions.
                </p>
              )}
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Quiz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
