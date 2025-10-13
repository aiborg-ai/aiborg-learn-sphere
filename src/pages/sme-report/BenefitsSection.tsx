import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import type { BenefitsSectionProps } from './types';

export function BenefitsSection({ benefits }: BenefitsSectionProps) {
  if (benefits.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Benefits Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map(benefit => (
            <div key={benefit.id} className="border-l-4 border-green-500 pl-4 py-2">
              <h3 className="font-semibold mb-1">{benefit.benefit_area}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Current:</strong> {benefit.current_status}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>With AI:</strong> {benefit.ai_improvement}
              </p>
              <Badge variant="default">Impact: {benefit.impact_rating}/5</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
