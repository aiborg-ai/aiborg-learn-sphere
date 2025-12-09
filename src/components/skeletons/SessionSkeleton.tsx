/**
 * Session Skeleton Component
 * Shows skeleton layout matching the Sessions page structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function SessionSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md bg-white/10" />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <Skeleton className="h-10 w-64 rounded-md bg-white/10" />
          <Skeleton className="h-10 w-40 rounded-md bg-white/10" />
          <Skeleton className="h-10 w-40 rounded-md bg-white/10" />
          <Skeleton className="h-10 w-32 rounded-md bg-white/10" />
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              {/* Session Image */}
              <Skeleton className="h-40 w-full bg-white/10" />
              {/* Session Content */}
              <div className="p-4 space-y-3">
                {/* Badge */}
                <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                {/* Title */}
                <Skeleton className="h-6 w-3/4 bg-white/10" />
                {/* Instructor */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
                {/* Date & Time */}
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24 bg-white/10" />
                  <Skeleton className="h-4 w-16 bg-white/10" />
                </div>
                {/* Action Button */}
                <Skeleton className="h-10 w-full rounded-md bg-white/10" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-10 rounded-md bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SessionSkeleton;
