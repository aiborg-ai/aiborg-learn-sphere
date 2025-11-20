import React from 'react';
import { Info } from '@/components/ui/icons';

interface QuestionDisplayProps {
  question_text: string;
  help_text?: string;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question_text, help_text }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{question_text}</h3>
      {help_text && (
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {help_text}
        </p>
      )}
    </div>
  );
};
