import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercentage } from './utils';
import type { EngagementMetrics } from './types';

interface EngagementMetricsCardProps {
  data: EngagementMetrics | null;
}

export function EngagementMetricsCard({ data }: EngagementMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Overview</CardTitle>
        <CardDescription>Platform engagement statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Daily Active Users</span>
          <span className="font-bold">{data?.dailyActiveUsers || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Weekly Active Users</span>
          <span className="font-bold">{data?.weeklyActiveUsers || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Avg Session Duration</span>
          <span className="font-bold">{Math.round(data?.averageSessionDuration || 0)} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Content Completion Rate</span>
          <span className="font-bold">{formatPercentage(data?.contentCompletionRate || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Assessment Take Rate</span>
          <span className="font-bold">{formatPercentage(data?.assessmentTakeRate || 0)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Avg Courses per User</span>
          <span className="font-bold text-purple-600">
            {data?.averageCoursesPerUser.toFixed(1) || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
