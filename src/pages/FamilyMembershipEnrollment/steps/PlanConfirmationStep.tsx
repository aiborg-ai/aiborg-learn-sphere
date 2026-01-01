/**
 * PlanConfirmationStep (Step 1)
 * Displays the family plan details and features
 */

import { CheckCircle2, ArrowRight, Sparkles } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactROICalculator } from '@/components/membership';

interface PlanConfirmationStepProps {
  plan: Record<string, any>;
  onNext: () => void;
}

export function PlanConfirmationStep({ plan, onNext }: PlanConfirmationStepProps) {
  if (!plan) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5">
          <Sparkles className="w-4 h-4 mr-1.5" />
          Most Popular
        </Badge>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h2>
        <p className="text-gray-600">{plan.description}</p>
      </div>

      <div className="flex items-center justify-center gap-2 py-6">
        <span className="text-5xl font-bold text-gray-900">£{plan.price.toFixed(2)}</span>
        <span className="text-xl text-gray-600">/ {plan.billing_interval}</span>
      </div>

      <CompactROICalculator className="justify-center mb-4" />

      <div className="grid sm:grid-cols-2 gap-4">
        {plan.features?.slice(0, 8).map((feature: string, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>30-Day Free Trial:</strong> Try everything free for {plan.trial_days} days. No
          credit card required. Cancel anytime.
        </p>
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
      >
        Continue to Account Setup
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
