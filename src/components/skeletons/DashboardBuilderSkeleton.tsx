/**
 * Dashboard Builder Skeleton Component
 * Shows skeleton layout matching the Dashboard Builder page structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function DashboardBuilderSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/10 bg-white/5 p-4">
          {/* Sidebar Header */}
          <div className="mb-6">
            <Skeleton className="h-6 w-32 mb-2 bg-white/10" />
            <Skeleton className="h-4 w-48 bg-white/10" />
          </div>

          {/* Widget Categories */}
          <div className="space-y-4">
            {['Stats', 'Charts', 'Tables', 'Cards'].map(category => (
              <div key={category}>
                <Skeleton className="h-4 w-20 mb-2 bg-white/10" />
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-md border border-white/10 bg-white/5"
                    >
                      <Skeleton className="h-8 w-8 rounded bg-white/10" />
                      <Skeleton className="h-4 w-24 bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Canvas Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-md bg-white/10" />
              <Skeleton className="h-7 w-48 bg-white/10" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-md bg-white/10" />
              <Skeleton className="h-9 w-24 rounded-md bg-white/10" />
              <Skeleton className="h-9 w-32 rounded-md bg-white/10" />
            </div>
          </div>

          {/* Dashboard Grid Preview */}
          <div className="grid grid-cols-4 gap-4">
            {/* Stats Row */}
            {[1, 2, 3, 4].map(i => (
              <div
                key={`stat-${i}`}
                className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16 bg-white/10" />
                    <Skeleton className="h-6 w-12 bg-white/10" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded bg-white/10" />
                </div>
              </div>
            ))}

            {/* Chart Widgets */}
            <div className="col-span-2 rounded-lg border border-dashed border-white/20 bg-white/5 p-4">
              <Skeleton className="h-4 w-24 mb-4 bg-white/10" />
              <Skeleton className="h-48 w-full rounded bg-white/10" />
            </div>
            <div className="col-span-2 rounded-lg border border-dashed border-white/20 bg-white/5 p-4">
              <Skeleton className="h-4 w-24 mb-4 bg-white/10" />
              <Skeleton className="h-48 w-full rounded bg-white/10" />
            </div>

            {/* Table Widget */}
            <div className="col-span-4 rounded-lg border border-dashed border-white/20 bg-white/5 p-4">
              <Skeleton className="h-4 w-32 mb-4 bg-white/10" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-2 bg-white/5 rounded">
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
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

export default DashboardBuilderSkeleton;
