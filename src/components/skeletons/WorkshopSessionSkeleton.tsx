/**
 * Workshop Session Skeleton Component
 * Shows skeleton layout matching the Workshop Session Room structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function WorkshopSessionSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar placeholder */}
      <div className="h-16 border-b bg-background/50" />

      <main className="flex-1 bg-gradient-hero">
        <div className="container mx-auto px-4 py-6">
          {/* Session Header */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                  <Skeleton className="h-5 w-5 rounded-full bg-green-500/30" />
                </div>
                <Skeleton className="h-8 w-64 bg-white/10" />
                <Skeleton className="h-4 w-96 bg-white/10" />
              </div>
              <Skeleton className="h-10 w-32 rounded-md bg-white/10" />
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-16 bg-white/10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full bg-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stage Content Card */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-64 bg-white/10" />
                  </div>
                </div>

                {/* Stage content placeholder */}
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg bg-white/10" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-lg bg-white/10" />
                    <Skeleton className="h-24 w-full rounded-lg bg-white/10" />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                  <Skeleton className="h-10 w-24 rounded-md bg-white/10" />
                  <Skeleton className="h-10 w-32 rounded-md bg-primary/30" />
                </div>
              </div>

              {/* Activities Timeline */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <Skeleton className="h-5 w-32 mb-4 bg-white/10" />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-48 bg-white/10" />
                        <Skeleton className="h-3 w-24 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Participants Card */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-24 bg-white/10" />
                  <Skeleton className="h-5 w-8 bg-white/10" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-3 w-16 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage Progress */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <Skeleton className="h-5 w-28 mb-4 bg-white/10" />
                <div className="space-y-3">
                  {['Setup', 'Problem', 'Solving', 'Report'].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full bg-white/10" />
                      <Skeleton className="h-4 w-20 bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default WorkshopSessionSkeleton;
