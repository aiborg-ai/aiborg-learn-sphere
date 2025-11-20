import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mic, Type } from '@/components/ui/icons';
import { VoiceAnswerInput } from '../VoiceAnswerInput';
import type { AssessmentQuestion } from './types';

interface AnswerOptionsProps {
  question: AssessmentQuestion;
  selectedOptions: string[];
  onSingleChoice: (optionId: string, points: number) => void;
  onMultipleChoice: (optionId: string, points: number) => void;
  onVoiceAnswer?: (text: string) => void;
  enableVoiceInput?: boolean;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  selectedOptions,
  onSingleChoice,
  onMultipleChoice,
  onVoiceAnswer,
  enableVoiceInput = true,
}) => {
  const [inputMode, setInputMode] = useState<'select' | 'voice'>('select');

  if (!question.options || question.options.length === 0) {
    return (
      <Alert aria-live="polite">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          No options available for this question. Please contact support.
          <div className="mt-2 text-xs font-mono">Question ID: {question.id}</div>
        </AlertDescription>
      </Alert>
    );
  }

  // Voice input toggle
  const InputModeToggle = () => {
    if (!enableVoiceInput || !onVoiceAnswer) return null;

    return (
      <div className="flex items-center gap-2 mb-4" aria-label="Answer input mode">
        <Button
          type="button"
          variant={inputMode === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('select')}
          aria-pressed={inputMode === 'select'}
          aria-label="Use selection mode"
        >
          <Type className="h-4 w-4 mr-2" aria-hidden="true" />
          Select Options
        </Button>
        <Button
          type="button"
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('voice')}
          aria-pressed={inputMode === 'voice'}
          aria-label="Use voice input mode"
        >
          <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
          Voice Answer
        </Button>
      </div>
    );
  };

  if (
    question.question_type === 'single_choice' ||
    question.question_type === 'frequency' ||
    question.question_type === 'scale'
  ) {
    return (
      <div className="space-y-4">
        <InputModeToggle />

        {inputMode === 'voice' && onVoiceAnswer ? (
          <VoiceAnswerInput
            questionText={question.question_text}
            onVoiceTranscription={onVoiceAnswer}
          />
        ) : (
          <RadioGroup
            value={selectedOptions[0] || ''}
            onValueChange={value => {
              const option = question.options?.find(o => o.id === value);
              if (option) {
                onSingleChoice(value, option.points);
              }
            }}
            aria-label="Select one answer option"
          >
            {question.options?.map(option => (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="mt-1"
                  aria-describedby={option.description ? `${option.id}-description` : undefined}
                />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{option.option_text}</div>
                  {option.description && (
                    <div
                      id={`${option.id}-description`}
                      className="text-sm text-muted-foreground mt-1"
                    >
                      {option.description}
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InputModeToggle />

      {inputMode === 'voice' && onVoiceAnswer ? (
        <VoiceAnswerInput
          questionText={question.question_text}
          onVoiceTranscription={onVoiceAnswer}
        />
      ) : (
        <div className="space-y-3" aria-label="Select one or more answer options">
          {question.options?.map(option => (
            <div
              key={option.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={option.id}
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={checked => {
                  if (checked) {
                    onMultipleChoice(option.id, option.points);
                  } else {
                    onMultipleChoice(option.id, option.points);
                  }
                }}
                className="mt-1"
                aria-describedby={option.description ? `${option.id}-description` : undefined}
              />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{option.option_text}</div>
                {option.description && (
                  <div
                    id={`${option.id}-description`}
                    className="text-sm text-muted-foreground mt-1"
                  >
                    {option.description}
                  </div>
                )}
                {option.tool_recommendations && option.tool_recommendations.length > 0 && (
                  <ul className="flex flex-wrap gap-1 mt-2" aria-label="Recommended tools">
                    {option.tool_recommendations.map(tool => (
                      <li key={tool} className="list-none">
                        <Badge variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
