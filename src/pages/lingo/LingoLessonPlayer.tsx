/**
 * LingoLessonPlayer Page
 * Full-screen lesson player with question flow
 */

import { useParams, useNavigate } from 'react-router-dom';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { HeartsDisplay } from '@/components/lingo/game/HeartsDisplay';
import { QuestionContainer } from '@/components/lingo/questions/QuestionContainer';
import { useLingoLessonPlayer } from '@/hooks/useLingo';

export default function LingoLessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const {
    lesson,
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    heartsRemaining,
    progress,
    hasAnsweredCurrent,
    isLastQuestion,
    isLoading,
    error,
    submitAnswer,
    nextQuestion,
    finishLesson,
  } = useLingoLessonPlayer(lessonId || '');

  const handleExit = () => {
    if (Object.keys(answers).length > 0) {
      // Could show confirmation dialog
      if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
        navigate('/lingo');
      }
    } else {
      navigate('/lingo');
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      const stats = await finishLesson();
      if (stats) {
        navigate(`/lingo/lesson/${lessonId}/complete`, {
          state: { stats },
        });
      }
    } else {
      nextQuestion();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {error ? 'Failed to load lesson.' : 'Lesson not found.'} Please try again.
          </AlertDescription>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/lingo')}>
            Back to Lingo
          </Button>
        </Alert>
      </div>
    );
  }

  // Check if out of hearts
  if (heartsRemaining <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-6xl">💔</div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Out of Hearts!</h2>
              <p className="text-muted-foreground">
                You've run out of hearts. Take a break and try again later, or sign up for unlimited
                hearts.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/lingo')}>Back to Lingo</Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign Up for Unlimited Hearts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={handleExit} aria-label="Exit lesson">
            <X className="h-5 w-5" />
          </Button>

          <div className="flex-1 mx-4 max-w-md">
            <Progress value={progress} className="h-2" />
          </div>

          <HeartsDisplay hearts={heartsRemaining} size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-8 max-w-2xl mx-auto">
        {/* Lesson Info */}
        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">{lesson.skill}</p>
          <h1 className="text-lg font-semibold">{lesson.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        <QuestionContainer
          question={currentQuestion}
          onSubmit={submitAnswer}
          result={answers[currentQuestion.id]}
        />

        {/* Next Button */}
        {hasAnsweredCurrent && (
          <div className="mt-8">
            <Button onClick={handleNext} className="w-full" size="lg">
              {isLastQuestion ? (
                'Finish Lesson'
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      {/* Footer with progress */}
      <footer className="border-t bg-muted/30 py-4">
        <div className="container px-4 flex justify-center">
          <div className="flex gap-2">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary'
                    : answers[q.id]
                      ? answers[q.id].correct
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
