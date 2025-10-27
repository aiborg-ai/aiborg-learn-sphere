/**
 * StudioProgress Component
 * Visual progress indicator for Studio wizard
 */

import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { WizardStep } from '@/types/studio.types';

interface StudioProgressProps {
  steps: WizardStep[];
  currentStep: number;
  stepValidation: boolean[];
  onStepClick?: (step: number) => void;
  className?: string;
}

export function StudioProgress({
  steps,
  currentStep,
  stepValidation,
  onStepClick,
  className,
}: StudioProgressProps) {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const getStepStatus = (index: number): 'completed' | 'active' | 'pending' | 'invalid' => {
    if (index < currentStep) {
      return stepValidation[index] ? 'completed' : 'invalid';
    }
    if (index === currentStep) {
      return 'active';
    }
    return 'pending';
  };

  const canClickStep = (index: number): boolean => {
    // Can go back to any previous step or stay on current
    return index <= currentStep;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="text-xs text-muted-foreground text-center">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const clickable = canClickStep(index) && onStepClick;

            return (
              <button
                key={step.id}
                onClick={() => clickable && onStepClick(index)}
                disabled={!clickable}
                className={cn(
                  'flex flex-col items-center gap-2 group',
                  clickable && 'cursor-pointer hover:opacity-80',
                  !clickable && 'cursor-not-allowed'
                )}
                title={step.description}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                    status === 'active' &&
                      'bg-background border-primary text-primary ring-4 ring-primary/20',
                    status === 'pending' && 'bg-background border-border text-muted-foreground',
                    status === 'invalid' && 'bg-destructive/10 border-destructive text-destructive'
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Circle className={cn('w-5 h-5', status === 'active' && 'fill-current')} />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex flex-col items-center max-w-24">
                  <span
                    className={cn(
                      'text-xs font-medium text-center transition-colors',
                      status === 'active' && 'text-foreground',
                      status === 'completed' && 'text-muted-foreground',
                      status === 'pending' && 'text-muted-foreground/60',
                      status === 'invalid' && 'text-destructive'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.isOptional && (
                    <span className="text-[10px] text-muted-foreground">(Optional)</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="rounded-lg border bg-card p-3">
        <h3 className="font-medium text-sm mb-1">{steps[currentStep]?.title}</h3>
        {steps[currentStep]?.description && (
          <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
        )}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
interface StudioProgressCompactProps {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  className?: string;
}

export function StudioProgressCompact({
  currentStep,
  totalSteps,
  percentage,
  className,
}: StudioProgressCompactProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress value={percentage} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  );
}
