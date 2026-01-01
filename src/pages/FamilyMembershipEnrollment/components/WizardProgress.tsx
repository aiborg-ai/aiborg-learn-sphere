/**
 * WizardProgress Component
 * Displays the step progress indicator for the enrollment wizard
 */

import { CheckCircle2, Users, CreditCard, Lock } from '@/components/ui/icons';
import type { WizardStep } from '../types';

interface WizardProgressProps {
  currentStep: number;
  steps: WizardStep[];
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full ${
                currentStep >= step.number
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              } ${currentStep === step.number ? 'ring-4 ring-amber-200 animate-pulse' : ''} transition-all duration-300`}
            >
              {currentStep > step.number ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <span className="font-bold">{step.number}</span>
              )}
            </div>
            <div className="ml-2 hidden sm:block">
              <p
                className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.title}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-amber-500' : 'bg-gray-200'
                } transition-all duration-300`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Default wizard steps configuration
export const defaultWizardSteps: WizardStep[] = [
  { number: 1, title: 'Plan', icon: CheckCircle2 },
  { number: 2, title: 'Your Info', icon: Users },
  { number: 3, title: 'Family', icon: Users },
  { number: 4, title: 'Account', icon: Lock },
  { number: 5, title: 'Payment', icon: CreditCard },
];
