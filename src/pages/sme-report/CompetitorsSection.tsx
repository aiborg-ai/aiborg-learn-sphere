import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from '@/components/ui/icons';
import type { CompetitorsSectionProps } from './types';

export function CompetitorsSection({ competitors }: CompetitorsSectionProps) {
  if (competitors.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Competitive Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {competitors.map(comp => (
            <div key={comp.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{comp.competitor_name}</h3>
                <Badge
                  variant={
                    comp.threat_level >= 4
                      ? 'destructive'
                      : comp.threat_level >= 3
                        ? 'outline'
                        : 'secondary'
                  }
                >
                  Threat Level: {comp.threat_level}/5
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>AI Use Case:</strong> {comp.ai_use_case}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Their Advantage:</strong> {comp.advantage}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
