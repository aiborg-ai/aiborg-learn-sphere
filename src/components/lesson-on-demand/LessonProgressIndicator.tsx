/**
 * Lesson Progress Indicator
 * Visual stepper showing wizard progress
 */

import { CheckCircle2 } from 'lucide-react';

interface LessonProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; description: string }>;
}

export function LessonProgressIndicator({
  currentStep,
  totalSteps,
  steps,
}: LessonProgressIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900'
                        : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <div className="mt-2 text-center hidden md:block">
                  <p
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-8 hidden md:block">
                  <div
                    className={`h-full ${
                      stepNumber < currentStep ? 'bg-green-500' : 'bg-muted-foreground/30'
                    } transition-all`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Label */}
      <div className="md:hidden mt-4 text-center">
        <p className="text-sm font-medium">{steps[currentStep - 1]?.label}</p>
        <p className="text-xs text-muted-foreground">{steps[currentStep - 1]?.description}</p>
      </div>
    </div>
  );
}
