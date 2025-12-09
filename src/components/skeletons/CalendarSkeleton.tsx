/**
 * Calendar Skeleton Component
 * Shows skeleton layout matching the Calendar page structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-36 rounded-md bg-white/10" />
        </div>

        {/* Calendar Container */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md bg-white/10" />
              <Skeleton className="h-7 w-40 bg-white/10" />
              <Skeleton className="h-9 w-9 rounded-md bg-white/10" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-md bg-white/10" />
              <Skeleton className="h-9 w-20 rounded-md bg-white/10" />
              <Skeleton className="h-9 w-20 rounded-md bg-white/10" />
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center py-2">
                <Skeleton className="h-4 w-8 mx-auto bg-white/10" />
              </div>
            ))}
          </div>

          {/* Calendar Grid - 5 weeks */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square p-2 rounded-md border border-white/5 bg-white/5"
              >
                <Skeleton className="h-5 w-5 mb-1 bg-white/10" />
                {/* Random events on some days */}
                {i % 5 === 0 && <Skeleton className="h-4 w-full rounded bg-secondary/20" />}
                {i % 7 === 3 && (
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full rounded bg-primary/20" />
                    <Skeleton className="h-4 w-3/4 rounded bg-blue-500/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <Skeleton className="h-5 w-32 mb-4 bg-white/10" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-white/5">
                <Skeleton className="h-10 w-10 rounded-md bg-white/10" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                  <Skeleton className="h-3 w-1/3 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarSkeleton;
