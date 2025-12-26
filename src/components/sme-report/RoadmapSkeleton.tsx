/**
 * RoadmapSkeleton Component
 *
 * Loading skeleton for RoadmapSection
 * Shows placeholder UI while roadmap data is loading
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RoadmapSkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading roadmap">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Statistics Card */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </Card>

      {/* Visual Timeline Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-6 w-full" />
          <div className="pt-4 border-t">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </Card>

      {/* Phase Accordion Skeletons */}
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        </Card>
      ))}

      {/* Milestones Skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
