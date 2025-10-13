import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import type { ActionPlanSectionProps } from './types';

export function ActionPlanSection({ actionPlan }: ActionPlanSectionProps) {
  if (
    !actionPlan ||
    !actionPlan.recommended_next_steps ||
    actionPlan.recommended_next_steps.length === 0
  ) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recommended Next Steps
        </CardTitle>
        <CardDescription>Actionable steps for AI implementation</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {actionPlan.recommended_next_steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
