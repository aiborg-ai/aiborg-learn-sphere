import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ScenarioQuestion } from '../ScenarioQuestion';
import { DragDropRanking } from '../DragDropRanking';
import { CodeEvaluation } from '../CodeEvaluation';
import { CaseStudy } from '../CaseStudy';
import { AnswerOptions } from './AnswerOptions';
import { QuestionDisplay } from './QuestionDisplay';
import type { AdaptiveQuestion } from '@/services/AdaptiveAssessmentEngine';

interface QuestionRendererProps {
  currentQuestion: AdaptiveQuestion;
  selectedOptions: string[];
  onSingleChoice: (optionId: string) => void;
  onMultipleChoice: (optionId: string) => void;
  onVoiceAnswer: (text: string) => void;
  onSelectionChange: (options: string[]) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  currentQuestion,
  selectedOptions,
  onSingleChoice,
  onMultipleChoice,
  onVoiceAnswer,
  onSelectionChange,
}) => {
  if (!currentQuestion || !currentQuestion.options || currentQuestion.options.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No options available for this question. Please contact support.
          <div className="mt-2 text-xs font-mono">Question ID: {currentQuestion?.id}</div>
        </AlertDescription>
      </Alert>
    );
  }

  switch (currentQuestion.question_type) {
    case 'scenario_multimedia':
      return (
        <ScenarioQuestion
          question={currentQuestion}
          selectedOptions={selectedOptions}
          onSelectionChange={onSelectionChange}
          showHints={false}
        />
      );

    case 'drag_drop_ranking':
    case 'drag_drop_ordering':
      return (
        <DragDropRanking
          question={currentQuestion}
          selectedOrdering={selectedOptions}
          onOrderingChange={onSelectionChange}
        />
      );

    case 'code_evaluation':
      return (
        <CodeEvaluation
          question={currentQuestion}
          selectedOptions={selectedOptions}
          onSelectionChange={onSelectionChange}
        />
      );

    case 'case_study':
      return (
        <CaseStudy
          question={currentQuestion}
          selectedOptions={selectedOptions}
          onSelectionChange={onSelectionChange}
        />
      );

    case 'single_choice':
    case 'frequency':
    case 'scale':
      // Standard single choice with voice input support
      return (
        <div className="space-y-4">
          <QuestionDisplay
            question_text={currentQuestion.question_text}
            help_text={currentQuestion.help_text}
          />
          <AnswerOptions
            question={currentQuestion}
            selectedOptions={selectedOptions}
            onSingleChoice={(optionId, _points) => onSingleChoice(optionId)}
            onMultipleChoice={() => {}}
            onVoiceAnswer={onVoiceAnswer}
            enableVoiceInput={true}
          />
        </div>
      );

    case 'multiple_choice':
    default:
      // Standard multiple choice with voice input support
      return (
        <div className="space-y-4">
          <QuestionDisplay
            question_text={currentQuestion.question_text}
            help_text={currentQuestion.help_text}
          />
          <AnswerOptions
            question={currentQuestion}
            selectedOptions={selectedOptions}
            onSingleChoice={() => {}}
            onMultipleChoice={(optionId, _points) => onMultipleChoice(optionId)}
            onVoiceAnswer={onVoiceAnswer}
            enableVoiceInput={true}
          />
        </div>
      );
  }
};
