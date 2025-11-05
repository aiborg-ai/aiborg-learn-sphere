/**
 * Blog Progress Indicator
 *
 * Visual stepper showing the 4-step blog creation workflow
 * Similar to ClaimProgressIndicator but customized for blog workflow
 */

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogProgressIndicatorProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { id: 1, name: 'Topic & Audience', description: 'Define your blog post' },
  { id: 2, name: 'AI Generation', description: 'Generate content with AI' },
  { id: 3, name: 'Edit & Refine', description: 'Review and customize' },
  { id: 4, name: 'Publish', description: 'Finalize and publish' },
];

export function BlogProgressIndicator({ currentStep, className }: BlogProgressIndicatorProps) {
  return (
    <div className={cn('w-full px-4 py-6', className)}>
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <li key={step.id} className="relative flex-1">
                {/* Step content */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                      {
                        'border-green-600 bg-green-600 text-white': isComplete,
                        'border-primary bg-primary text-primary-foreground shadow-lg': isCurrent,
                        'border-gray-300 bg-white text-gray-500': isPending,
                      }
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>

                  {/* Step name and description */}
                  <div className="mt-3 text-center">
                    <p
                      className={cn('text-sm font-medium transition-colors', {
                        'text-primary': isCurrent,
                        'text-green-600': isComplete,
                        'text-gray-500': isPending,
                      })}
                    >
                      {step.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connecting line */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5 transition-all duration-300"
                    style={{
                      backgroundColor: currentStep > step.id ? '#16a34a' : '#d1d5db',
                    }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
