import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Activity, BookOpen, ArrowUp } from '@/components/ui/icons';
import { formatCurrency, formatNumber } from './utils';
import type { PlatformMetrics, RevenueMetrics } from './types';

interface PlatformMetricsCardsProps {
  platformMetrics: PlatformMetrics | null;
  revenueMetrics: RevenueMetrics | null;
}

export function PlatformMetricsCards({
  platformMetrics,
  revenueMetrics,
}: PlatformMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(platformMetrics?.totalUsers || 0)}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {platformMetrics?.totalStudents || 0} Students
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {platformMetrics?.totalInstructors || 0} Instructors
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(platformMetrics?.totalRevenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {revenueMetrics?.successfulTransactions || 0} successful transactions
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
          <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(platformMetrics?.activeUsersMonth || 0)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <ArrowUp className="h-3 w-3 text-green-600" />
            <span>Today: {platformMetrics?.activeUsersToday || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
          <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(platformMetrics?.totalEnrollments || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {platformMetrics?.totalCourses || 0} active courses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
