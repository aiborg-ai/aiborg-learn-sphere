import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2 } from 'lucide-react';
import type { ReportSectionProps } from './types';

export function CompanyMissionSection({ assessment }: ReportSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Mission & AI Alignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assessment.company_mission && (
          <div>
            <h3 className="font-semibold mb-2">Mission Statement</h3>
            <p className="text-muted-foreground">{assessment.company_mission}</p>
          </div>
        )}

        {assessment.ai_enhancement_description && (
          <div>
            <h3 className="font-semibold mb-2">How AI Can Enhance Mission</h3>
            <p className="text-muted-foreground">{assessment.ai_enhancement_description}</p>
          </div>
        )}

        {assessment.strategic_alignment_rating && (
          <div>
            <h3 className="font-semibold mb-2">Strategic Alignment Rating</h3>
            <div className="flex items-center gap-3">
              <Progress
                value={(assessment.strategic_alignment_rating / 5) * 100}
                className="h-3 flex-1"
              />
              <Badge variant="secondary">{assessment.strategic_alignment_rating}/5</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
