import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercentage } from './utils';
import type { AssessmentAnalytics } from './types';

interface AssessmentMetricsCardProps {
  data: AssessmentAnalytics | null;
}

export function AssessmentMetricsCard({ data }: AssessmentMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Metrics</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Assessments</p>
            <p className="text-2xl font-bold">{data?.totalAssessments || 0}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{data?.completedAssessments || 0}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-bold">{formatPercentage(data?.completionRate || 0)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatPercentage(data?.averageScore || 0)}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Avg Time</p>
            <p className="text-2xl font-bold">{Math.round(data?.averageTimeMinutes || 0)} min</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
