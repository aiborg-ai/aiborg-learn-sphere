import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from '@/components/ui/icons';
import { getRatingColor, getRatingLabel } from './utils';
import type { ExecutiveSummaryProps } from './types';

export function ExecutiveSummary({
  assessment,
  painPoints,
  benefits,
  risks,
}: ExecutiveSummaryProps) {
  const overallRating = assessment.overall_opportunity_rating || 0;
  const ratingPercentage = (overallRating / 5) * 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Overall AI Opportunity Rating</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={ratingPercentage} className="h-4" />
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getRatingColor(overallRating)}`}>
                {overallRating.toFixed(1)}/5.0
              </div>
              <div className="text-sm text-muted-foreground">{getRatingLabel(overallRating)}</div>
            </div>
          </div>
        </div>

        {assessment.ai_adoption_benefit_summary && (
          <div>
            <h3 className="font-semibold mb-2">Summary of AI Benefits</h3>
            <p className="text-muted-foreground">{assessment.ai_adoption_benefit_summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{painPoints.length}</div>
            <div className="text-sm text-muted-foreground">Pain Points Identified</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{benefits.length}</div>
            <div className="text-sm text-muted-foreground">Benefits Analyzed</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{risks.length}</div>
            <div className="text-sm text-muted-foreground">Risks Assessed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
