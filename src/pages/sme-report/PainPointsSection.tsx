import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { PainPointsSectionProps } from './types';

export function PainPointsSection({ painPoints }: PainPointsSectionProps) {
  if (painPoints.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Pain Points & AI Opportunities
        </CardTitle>
        <CardDescription>Identified pain points and how AI can address them</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {painPoints.map((pp, index) => (
            <div key={pp.id} className="border-l-4 border-orange-500 pl-4 py-2">
              <h3 className="font-semibold mb-1">
                {index + 1}. {pp.pain_point}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>AI Solution:</strong> {pp.ai_capability_to_address}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Current Impact:</span>
                  <Badge variant="destructive">{pp.current_impact}/5</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Expected Impact After AI:</span>
                  <Badge variant="default">{pp.impact_after_ai}/5</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
