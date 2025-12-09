/**
 * Studio Skeleton Component
 * Shows skeleton layout matching the Studio page structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function StudioSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
          </div>
        </div>

        {/* Asset Type Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              {/* Icon */}
              <Skeleton className="h-12 w-12 rounded-lg bg-white/10" />
              {/* Title */}
              <Skeleton className="h-6 w-32 bg-white/10" />
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-24 rounded-md bg-white/10" />
                <Skeleton className="h-9 w-24 rounded-md bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudioSkeleton;
