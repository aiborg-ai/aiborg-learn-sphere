import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from '@/components/ui/icons';
import type { UserImpactsSectionProps } from './types';

export function UserImpactsSection({ userImpacts }: UserImpactsSectionProps) {
  if (userImpacts.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userImpacts.map((ui, index) => (
            <div key={ui.id} className="p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">
                {index + 1}. {ui.user_group}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">
                    <strong>Current Satisfaction:</strong> {ui.satisfaction_rating}/5
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Pain Points:</strong> {ui.user_pain_points}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    <strong>Impact Rating:</strong> {ui.impact_rating}/5
                  </p>
                  <p className="text-muted-foreground">
                    <strong>AI Improvements:</strong> {ui.ai_improvements}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
