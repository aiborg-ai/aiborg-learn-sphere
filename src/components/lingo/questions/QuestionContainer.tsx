/**
 * QuestionContainer Component
 * Wrapper that renders the appropriate question component based on type
 */

import { useState } from 'react';
import type { LingoQuestion, AnswerResult, LingoQuestionType } from '@/types/lingo.types';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import { MatchingQuestion } from './MatchingQuestion';
import { OrderingQuestion } from './OrderingQuestion';
import { FreeResponseQuestion } from './FreeResponseQuestion';

interface QuestionContainerProps {
  question: LingoQuestion;
  onSubmit: (questionId: string, answer: unknown) => Promise<AnswerResult>;
  result?: AnswerResult;
  disabled?: boolean;
}

export function QuestionContainer({
  question,
  onSubmit,
  result,
  disabled = false,
}: QuestionContainerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (answer: unknown) => {
    setIsSubmitting(true);
    try {
      await onSubmit(question.id, answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    const questionType = question.question_type as LingoQuestionType;

    switch (questionType) {
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            onSubmit={handleSubmit}
            result={result}
            disabled={disabled}
          />
        );

      case 'fill_blank':
        return (
          <FillBlankQuestion
            question={question}
            onSubmit={handleSubmit}
            result={result}
            disabled={disabled}
          />
        );

      case 'matching':
        return (
          <MatchingQuestion
            question={question}
            onSubmit={handleSubmit}
            result={result}
            disabled={disabled}
          />
        );

      case 'ordering':
        return (
          <OrderingQuestion
            question={question}
            onSubmit={handleSubmit}
            result={result}
            disabled={disabled}
          />
        );

      case 'free_response':
        return (
          <FreeResponseQuestion
            question={question}
            onSubmit={handleSubmit}
            result={result}
            disabled={disabled}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Unknown question type: {questionType}
          </div>
        );
    }
  };

  return <div className="w-full">{renderQuestion()}</div>;
}
