/**
 * Dashboard Skeleton Component
 * Shows skeleton layout matching the dashboard structure
 */

import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton } from './CardSkeleton';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Progress Section */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-24 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Recommendations */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <CardSkeleton key={i} showHeader={false} contentLines={2} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Calendar Widget */}
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>

            {/* Achievements */}
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-12 w-12 rounded-full mx-auto" />
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
