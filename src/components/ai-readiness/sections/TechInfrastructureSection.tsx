// ============================================================================
// Tech Infrastructure Section Component
// Third dimension of AI-Readiness assessment
// ============================================================================

import React from 'react';
import { RatingSlider } from '../RatingSlider';
import { DynamicFieldArray } from '../DynamicFieldArray';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { techInfrastructureQuestions } from '@/constants/aiReadinessQuestions';
import type { TechInfrastructureResponses } from '@/types/aiReadiness';

interface TechInfrastructureSectionProps {
  data: Partial<TechInfrastructureResponses>;
  onChange: (data: Partial<TechInfrastructureResponses>) => void;
  className?: string;
}

export function TechInfrastructureSection({
  data,
  onChange,
  className,
}: TechInfrastructureSectionProps) {
  const handleFieldChange = <K extends keyof TechInfrastructureResponses>(
    field: K,
    value: TechInfrastructureResponses[K]
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Get questions by type
  const ratingQuestions = techInfrastructureQuestions.filter(q => q.type === 'rating');
  const textareaQuestions = techInfrastructureQuestions.filter(q => q.type === 'textarea');
  const arrayQuestions = techInfrastructureQuestions.filter(q => q.type === 'array');

  return (
    <div className={cn('space-y-8', className)}>
      {/* Introduction */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-white/80">
          <span className="font-semibold">Technical Infrastructure</span> assesses your IT systems,
          cloud readiness, and technical capabilities. Strong infrastructure is essential for
          deploying and scaling AI solutions effectively.
        </p>
      </div>

      {/* Rating Questions */}
      <div className="space-y-6">
        {ratingQuestions.map(question => (
          <RatingSlider
            key={question.key}
            value={(data[question.key as keyof typeof data] as number) || 3}
            onChange={value =>
              handleFieldChange(question.key as keyof TechInfrastructureResponses, value)
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
                  handleFieldChange(
                    question.key as keyof TechInfrastructureResponses,
                    e.target.value
                  )
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
                handleFieldChange(question.key as keyof TechInfrastructureResponses, value)
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
          💡 <span className="font-medium">Tip:</span> Cloud infrastructure and API availability are
          critical enablers for AI. Consider your infrastructure's ability to scale and integrate
          with AI platforms.
        </p>
      </div>
    </div>
  );
}
