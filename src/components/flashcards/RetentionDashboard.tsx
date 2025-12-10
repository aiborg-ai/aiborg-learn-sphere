/**
 * RetentionDashboard Component
 *
 * Comprehensive dashboard for spaced repetition analytics.
 * Shows forgetting curves, retention stats, and due items.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Brain, Clock, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useRetentionDashboard } from '@/hooks/useRetentionPrediction';
import { ForgettingCurveChart } from './ForgettingCurveChart';
import { RetentionCard } from './RetentionCard';

export function RetentionDashboard() {
  const {
    stats,
    recallRate,
    predictionAccuracy,
    curve,
    curvePoints,
    halfLife,
    dueItems,
    urgencyBreakdown,
    schedule,
    isLoading,
    hasData,
  } = useRetentionDashboard();

  if (isLoading) {
    return <RetentionDashboardSkeleton />;
  }

  if (!hasData) {
    return <RetentionDashboardEmpty />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Brain className="h-5 w-5 text-primary" />}
          title="Recall Rate"
          value={recallRate !== null ? `${(recallRate * 100).toFixed(0)}%` : '--'}
          description="Overall memory retention"
          trend={recallRate !== null && recallRate >= 0.8 ? 'good' : 'warning'}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          title="Prediction Accuracy"
          value={predictionAccuracy !== null ? `${(predictionAccuracy * 100).toFixed(0)}%` : '--'}
          description="How accurate our predictions are"
          trend={predictionAccuracy !== null && predictionAccuracy >= 0.7 ? 'good' : 'neutral'}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          title="Memory Half-Life"
          value={halfLife !== null ? `${halfLife.toFixed(1)} days` : '--'}
          description="Time until 50% retention"
          trend={halfLife !== null && halfLife >= 3 ? 'good' : 'warning'}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          title="Cards Due"
          value={dueItems.length.toString()}
          description={`${urgencyBreakdown.overdue} overdue`}
          trend={urgencyBreakdown.overdue > 5 ? 'bad' : 'neutral'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forgetting Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Your Forgetting Curve
            </CardTitle>
            <CardDescription>
              Personalized memory decay model based on {curve?.dataPoints || 0} observations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {curvePoints.length > 0 ? (
              <ForgettingCurveChart data={curvePoints} halfLife={halfLife || 2.3} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Not enough data to build your forgetting curve yet.
                <br />
                Complete more reviews to generate personalized predictions.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Optimal Study Schedule
            </CardTitle>
            <CardDescription>
              {schedule?.recommendation || 'Complete more reviews for personalized recommendations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{schedule.optimalIntervalDays}</div>
                    <div className="text-sm text-muted-foreground">
                      Optimal review interval (days)
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{schedule.estimatedDailyCards}</div>
                    <div className="text-sm text-muted-foreground">Cards per day</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target Retention</span>
                    <span className="font-medium">
                      {(schedule.targetRetention * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={schedule.targetRetention * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Recall Rate</span>
                    <span className="font-medium">
                      {(schedule.currentRecallRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={schedule.currentRecallRate * 100} className="h-2" />
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Complete more reviews to unlock schedule optimization
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Due Items by Urgency */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cards Due for Review</CardTitle>
              <CardDescription>
                Sorted by retention urgency - review critical items first
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive">{urgencyBreakdown.overdue} Overdue</Badge>
              <Badge variant="secondary">{urgencyBreakdown.due_soon} Due Soon</Badge>
              <Badge variant="outline">{urgencyBreakdown.optimal} Optimal</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dueItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dueItems.slice(0, 9).map(item => (
                <RetentionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
              <span>All caught up! No cards due for review.</span>
            </div>
          )}
          {dueItems.length > 9 && (
            <div className="mt-4 text-center">
              <Button variant="outline">View All {dueItems.length} Cards</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  trend: 'good' | 'warning' | 'bad' | 'neutral';
}

function StatCard({ icon, title, value, description, trend }: StatCardProps) {
  const trendColors = {
    good: 'border-green-500/20 bg-green-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    bad: 'border-red-500/20 bg-red-500/5',
    neutral: 'border-muted',
  };

  return (
    <Card className={trendColors[trend]}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function RetentionDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RetentionDashboardEmpty() {
  return (
    <Card>
      <CardContent className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Retention Data Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Start reviewing flashcards to build your personalized forgetting curve and see retention
            predictions.
          </p>
          <Button className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Reviewing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RetentionDashboard;
