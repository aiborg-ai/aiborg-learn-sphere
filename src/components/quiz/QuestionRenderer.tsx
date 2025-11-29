/**
 * QuestionRenderer Component
 * Renders different types of quiz questions
 */

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from '@/components/ui/icons';
import { CardImage } from '@/components/shared/OptimizedImage';
import type { QuizQuestion } from '@/services/quiz/types';

interface QuestionRendererProps {
  question: QuizQuestion;
  onAnswer: (answer: string | string[]) => void;
  initialAnswer?: string | string[];
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string | string[];
}

export function QuestionRenderer({
  question,
  onAnswer,
  initialAnswer,
  showFeedback = false,
  isCorrect,
  correctAnswer,
}: QuestionRendererProps) {
  const [selectedValue, setSelectedValue] = useState<string | string[]>(
    initialAnswer || (question.question_type === 'multiple_choice' ? [] : '')
  );

  useEffect(() => {
    if (initialAnswer) {
      setSelectedValue(initialAnswer);
    }
  }, [initialAnswer]);

  const handleChange = (value: string | string[]) => {
    setSelectedValue(value);
    onAnswer(value);
  };

  const renderMedia = () => {
    if (!question.media_url) return null;

    return (
      <div className="mb-4">
        <CardImage
          src={question.media_url}
          alt="Question media"
          className="max-w-full h-auto rounded-lg border"
        />
      </div>
    );
  };

  const renderFeedback = () => {
    if (!showFeedback) return null;

    return (
      <Card className={`mt-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertCircle
              className={`h-5 w-5 mt-0.5 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}
            />
            <div className="flex-1 space-y-2">
              <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {question.explanation && (
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              )}
              {!isCorrect && correctAnswer && (
                <p className="text-sm">
                  <strong>Correct answer:</strong> {correctAnswer}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Multiple Choice
  if (question.question_type === 'multiple_choice' && question.options) {
    return (
      <div className="space-y-4">
        {renderMedia()}

        <div className="text-lg font-medium mb-4">
          {question.question_text}
          <span className="ml-2 text-sm text-muted-foreground">({question.points} pts)</span>
        </div>

        <RadioGroup
          value={selectedValue as string}
          onValueChange={handleChange}
          disabled={showFeedback}
        >
          {question.options.map(option => (
            <div
              key={option.id}
              className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                showFeedback && option.is_correct
                  ? 'border-green-500 bg-green-50'
                  : showFeedback && selectedValue === option.id && !option.is_correct
                    ? 'border-red-500 bg-red-50'
                    : 'hover:bg-accent'
              }`}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base">
                {option.option_text}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {renderFeedback()}
      </div>
    );
  }

  // True/False
  if (question.question_type === 'true_false' && question.options) {
    return (
      <div className="space-y-4">
        {renderMedia()}

        <div className="text-lg font-medium mb-4">
          {question.question_text}
          <span className="ml-2 text-sm text-muted-foreground">({question.points} pts)</span>
        </div>

        <RadioGroup
          value={selectedValue as string}
          onValueChange={handleChange}
          disabled={showFeedback}
        >
          {question.options.map(option => (
            <div
              key={option.id}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                showFeedback && option.is_correct
                  ? 'border-green-500 bg-green-50'
                  : showFeedback && selectedValue === option.id && !option.is_correct
                    ? 'border-red-500 bg-red-50'
                    : 'hover:bg-accent'
              }`}
            >
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer text-lg font-medium">
                {option.option_text}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {renderFeedback()}
      </div>
    );
  }

  // Short Answer
  if (question.question_type === 'short_answer') {
    return (
      <div className="space-y-4">
        {renderMedia()}

        <div className="text-lg font-medium mb-4">
          {question.question_text}
          <span className="ml-2 text-sm text-muted-foreground">({question.points} pts)</span>
        </div>

        <Textarea
          value={selectedValue as string}
          onChange={e => handleChange(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[120px]"
          disabled={showFeedback}
        />

        <p className="text-sm text-muted-foreground">
          Your answer will be reviewed by the instructor.
        </p>

        {renderFeedback()}
      </div>
    );
  }

  // Fill in the Blank
  if (question.question_type === 'fill_blank') {
    return (
      <div className="space-y-4">
        {renderMedia()}

        <div className="text-lg font-medium mb-4">
          {question.question_text}
          <span className="ml-2 text-sm text-muted-foreground">({question.points} pts)</span>
        </div>

        <Input
          value={selectedValue as string}
          onChange={e => handleChange(e.target.value)}
          placeholder="Your answer"
          disabled={showFeedback}
        />

        {renderFeedback()}
      </div>
    );
  }

  // Matching (Future enhancement)
  if (question.question_type === 'matching') {
    return (
      <div className="space-y-4">
        {renderMedia()}

        <div className="text-lg font-medium mb-4">
          {question.question_text}
          <span className="ml-2 text-sm text-muted-foreground">({question.points} pts)</span>
        </div>

        <p className="text-muted-foreground">Matching questions coming soon!</p>

        {renderFeedback()}
      </div>
    );
  }

  return (
    <div className="text-center text-muted-foreground py-8">
      Unknown question type: {question.question_type}
    </div>
  );
}
