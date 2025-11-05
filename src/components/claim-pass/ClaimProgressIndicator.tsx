import { CheckCircle2 } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface ClaimProgressIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export const ClaimProgressIndicator = ({ currentStep, steps }: ClaimProgressIndicatorProps) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : currentStep === step.number
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white ring-4 ring-purple-200'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span className="font-bold text-lg">{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-semibold ${
                    currentStep >= step.number ? 'text-purple-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1 hidden sm:block">{step.description}</div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 sm:mx-4">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
