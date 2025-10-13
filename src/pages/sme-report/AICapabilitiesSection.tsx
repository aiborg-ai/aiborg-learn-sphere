import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import type { ReportSectionProps } from './types';

export function AICapabilitiesSection({ assessment }: ReportSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          AI Capabilities Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Current AI Adoption Level</h3>
            <Badge variant="outline" className="capitalize">
              {assessment.current_ai_adoption_level || 'Not specified'}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Internal AI Expertise</h3>
            <div className="flex items-center gap-2">
              <Progress
                value={(assessment.internal_ai_expertise || 0) * 20}
                className="h-3 flex-1"
              />
              <span className="text-sm">{assessment.internal_ai_expertise}/5</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Data Availability</h3>
            <div className="flex items-center gap-2">
              <Progress
                value={(assessment.data_availability_rating || 0) * 20}
                className="h-3 flex-1"
              />
              <span className="text-sm">{assessment.data_availability_rating}/5</span>
            </div>
          </div>
        </div>

        {assessment.additional_ai_capabilities && (
          <div>
            <h3 className="font-semibold mb-2">Additional Capabilities Required</h3>
            <p className="text-muted-foreground">{assessment.additional_ai_capabilities}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
