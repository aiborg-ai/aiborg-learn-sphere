/**
 * Analytics Loading Skeleton
 * Displays skeleton UI while analytics data is loading
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Stats Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-500 to-gray-600 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20 bg-white/20" />
                  <Skeleton className="h-8 w-16 bg-white/30" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Buttons Skeleton */}
      <div className="flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Content Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-secondary/20 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ChartLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
