// ============================================================================
// Change Readiness Section Component
// Sixth dimension of AI-Readiness assessment
// ============================================================================

import React from 'react';
import { RatingSlider } from '../RatingSlider';
import { DynamicFieldArray } from '../DynamicFieldArray';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { changeReadinessQuestions } from '@/constants/aiReadinessQuestions';
import type { ChangeReadinessResponses } from '@/types/aiReadiness';

interface ChangeReadinessSectionProps {
  data: Partial<ChangeReadinessResponses>;
  onChange: (data: Partial<ChangeReadinessResponses>) => void;
  className?: string;
}

export function ChangeReadinessSection({ data, onChange, className }: ChangeReadinessSectionProps) {
  const handleFieldChange = <K extends keyof ChangeReadinessResponses>(
    field: K,
    value: ChangeReadinessResponses[K]
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Get questions by type
  const ratingQuestions = changeReadinessQuestions.filter(q => q.type === 'rating');
  const textareaQuestions = changeReadinessQuestions.filter(q => q.type === 'textarea');
  const arrayQuestions = changeReadinessQuestions.filter(q => q.type === 'array');

  return (
    <div className={cn('space-y-8', className)}>
      {/* Introduction */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-white/80">
          <span className="font-semibold">Change Readiness</span> measures your organization's
          ability to embrace and manage change. AI transformation requires cultural adaptation -
          this section evaluates your capacity for successful change management.
        </p>
      </div>

      {/* Rating Questions */}
      <div className="space-y-6">
        {ratingQuestions.map(question => (
          <RatingSlider
            key={question.key}
            value={(data[question.key as keyof typeof data] as number) || 3}
            onChange={value =>
              handleFieldChange(question.key as keyof ChangeReadinessResponses, value)
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
                  handleFieldChange(question.key as keyof ChangeReadinessResponses, e.target.value)
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
                handleFieldChange(question.key as keyof ChangeReadinessResponses, value)
              }
              placeholder={question.placeholder}
              helpText={question.helpText}
              maxItems={10}
              minItems={0}
              required={question.required}
            />
          ))}
        </div>
      )}

      {/* Section Tips */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <p className="text-sm text-white/70">
          💡 <span className="font-medium">Tip:</span> Change management is critical for AI adoption
          success. Address concerns early, communicate clearly, and celebrate quick wins to build
          momentum.
        </p>
      </div>

      {/* Final Note for Last Section */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-sm text-white/80">
          <span className="font-semibold">🎉 Almost Done!</span> You've completed all six dimensions
          of the AI-Readiness assessment. Review your answers and click "Complete Assessment" to
          receive your personalized readiness report and recommendations.
        </p>
      </div>
    </div>
  );
}
