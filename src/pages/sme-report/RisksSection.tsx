import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from '@/components/ui/icons';
import type { RisksSectionProps } from './types';

export function RisksSection({ risks }: RisksSectionProps) {
  if (risks.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Risk Analysis & Mitigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {risks.map((risk, index) => (
            <div key={risk.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">
                  {index + 1}. {risk.risk_factor}
                </h3>
                <div className="flex gap-2">
                  <Badge variant="outline">Likelihood: {risk.likelihood}/5</Badge>
                  <Badge variant="destructive">Impact: {risk.impact_rating}/5</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Risk:</strong> {risk.specific_risk}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                <strong>Mitigation:</strong> {risk.mitigation_strategy}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
