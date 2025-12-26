/**
 * ROISkeleton Component
 *
 * Loading skeleton for ROISection
 * Shows placeholder UI while ROI data is loading
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ROISkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading ROI analysis">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-32" />
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-56 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
      </Card>

      {/* Cost Breakdown Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Benefit Breakdown Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      </Card>

      {/* Risk-Adjusted ROI Skeleton */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </Card>
    </section>
  );
}
