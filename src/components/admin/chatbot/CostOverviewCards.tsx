/**
 * Cost Overview Cards Component
 * Displays key cost metrics in card format
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Clock,
} from '@/components/ui/icons';
import {
  useRealTimeCost,
  useProjectedMonthlyCost,
  useTodayStats,
} from '@/hooks/admin/useChatbotAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CostOverviewCards() {
  const { data: realtimeCost, isLoading: loadingRealtime } = useRealTimeCost();
  const { data: _todayStats, isLoading: loadingToday } = useTodayStats();
  const projectedCost = useProjectedMonthlyCost();

  if (loadingRealtime || loadingToday) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const costToday = realtimeCost?.cost_today || 0;
  const messagesToday = realtimeCost?.messages_today || 0;
  const tokensToday = realtimeCost?.tokens_today || 0;
  const avgResponseTime = realtimeCost?.avg_response_time || 0;

  const projectedMonthly = projectedCost.projected;
  const monthlyBudget = 200; // $200 budget
  const budgetUsagePercent = (projectedMonthly / monthlyBudget) * 100;

  const costPerMessage = messagesToday > 0 ? costToday / messagesToday : 0;

  return (
    <div className="space-y-4">
      {/* Budget Alert */}
      {budgetUsagePercent > 80 && (
        <Alert variant={budgetUsagePercent > 100 ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {budgetUsagePercent > 100
              ? `⚠️ Projected monthly cost ($${projectedMonthly.toFixed(2)}) exceeds budget ($${monthlyBudget})`
              : `⚠️ On track to use ${budgetUsagePercent.toFixed(0)}% of monthly budget`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costToday.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {messagesToday} messages • {tokensToday.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>

        {/* Projected Monthly */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
            {budgetUsagePercent > 100 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${projectedMonthly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {budgetUsagePercent.toFixed(0)}% of ${monthlyBudget} budget
            </p>
          </CardContent>
        </Card>

        {/* Cost per Message */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Message</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costPerMessage.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt; $0.01
              {costPerMessage > 0.01 && <span className="text-red-500 ml-1">⚠️ Above target</span>}
            </p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResponseTime >= 1000
                ? `${(avgResponseTime / 1000).toFixed(1)}s`
                : `${avgResponseTime}ms`}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: &lt; 3s
              {avgResponseTime > 3000 && <span className="text-red-500 ml-1">⚠️ Slow</span>}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
