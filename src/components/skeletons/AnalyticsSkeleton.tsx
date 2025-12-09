/**
 * Analytics Skeleton Component
 * Shows skeleton layout matching the analytics page with charts
 */

import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-8 w-16 rounded" />
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Line Chart */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>

          {/* Bar Chart */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Full Width Chart */}
        <div className="rounded-lg border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-80 w-full" />
        </div>

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="flex justify-center">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="flex justify-center">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsSkeleton;
