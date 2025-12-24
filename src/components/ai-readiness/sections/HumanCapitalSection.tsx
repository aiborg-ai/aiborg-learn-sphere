// ============================================================================
// Human Capital Section Component
// Fourth dimension of AI-Readiness assessment
// ============================================================================

import React from 'react';
import { RatingSlider } from '../RatingSlider';
import { DynamicFieldArray } from '../DynamicFieldArray';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { humanCapitalQuestions } from '@/constants/aiReadinessQuestions';
import type { HumanCapitalResponses } from '@/types/aiReadiness';

interface HumanCapitalSectionProps {
  data: Partial<HumanCapitalResponses>;
  onChange: (data: Partial<HumanCapitalResponses>) => void;
  className?: string;
}

export function HumanCapitalSection({ data, onChange, className }: HumanCapitalSectionProps) {
  const handleFieldChange = <K extends keyof HumanCapitalResponses>(
    field: K,
    value: HumanCapitalResponses[K]
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Get questions by type
  const ratingQuestions = humanCapitalQuestions.filter(q => q.type === 'rating');
  const textareaQuestions = humanCapitalQuestions.filter(q => q.type === 'textarea');
  const arrayQuestions = humanCapitalQuestions.filter(q => q.type === 'array');

  return (
    <div className={cn('space-y-8', className)}>
      {/* Introduction */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-white/80">
          <span className="font-semibold">Human Capital</span> evaluates your team's AI literacy,
          skills, and learning culture. People are the most critical factor in AI success - this
          section assesses whether you have the talent and capabilities needed.
        </p>
      </div>

      {/* Rating Questions */}
      <div className="space-y-6">
        {ratingQuestions.map(question => (
          <RatingSlider
            key={question.key}
            value={(data[question.key as keyof typeof data] as number) || 3}
            onChange={value =>
              handleFieldChange(question.key as keyof HumanCapitalResponses, value)
            }
            label={question.label}
            helpText={question.helpText}
            required={question.required}
          />
        ))}
      </div>

      {/* Textarea Questions */}
      {textareaQuestions.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white">Additional Details</h3>
          {textareaQuestions.map(question => (
            <div key={question.key} className="space-y-2">
              <Label className="text-base font-medium text-white flex items-center gap-2">
                {question.label}
                {question.required && <span className="text-rose-500">*</span>}
              </Label>
              {question.helpText && <p className="text-sm text-white/60">{question.helpText}</p>}
              <Textarea
                value={(data[question.key as keyof typeof data] as string) || ''}
                onChange={e =>
                  handleFieldChange(question.key as keyof HumanCapitalResponses, e.target.value)
                }
                placeholder={question.placeholder}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
                maxLength={500}
              />
              <div className="text-xs text-white/50 text-right">
                {((data[question.key as keyof typeof data] as string) || '').length}/500
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Array Questions */}
      {arrayQuestions.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          {arrayQuestions.map(question => (
            <DynamicFieldArray
              key={question.key}
              label={question.label}
              value={(data[question.key as keyof typeof data] as string[]) || []}
              onChange={value =>
                handleFieldChange(question.key as keyof HumanCapitalResponses, value)
              }
              placeholder={question.placeholder}
              helpText={question.helpText}
              maxItems={15}
              minItems={0}
              required={question.required}
            />
          ))}
        </div>
      )}

      {/* Section Tips */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <p className="text-sm text-white/70">
          💡 <span className="font-medium">Tip:</span> AI skills gaps can be addressed through
          training, hiring, or partnerships. Identify your most critical gaps and develop a plan to
          close them.
        </p>
      </div>
    </div>
  );
}
