/**
 * Admin Skeleton Component
 * Shows skeleton layout matching the Admin Dashboard structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded bg-white/10" />
            <Skeleton className="h-8 w-48 bg-white/10" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-md bg-white/10" />
            <Skeleton className="h-10 w-28 rounded-md bg-white/10" />
          </div>
        </div>

        {/* Tabs List */}
        <div className="bg-white/10 rounded-lg p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <Skeleton
                key={i}
                className="h-9 rounded-md bg-white/10"
                style={{ width: `${60 + (i % 4) * 20}px` }}
              />
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-white/10" />
                  <Skeleton className="h-7 w-16 bg-white/10" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
              </div>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="rounded-lg border border-white/10 bg-white/5">
          {/* Table Header */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 bg-white/10" />
              <Skeleton className="h-9 w-24 rounded-md bg-white/10" />
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-white/10">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 bg-white/10" />
                  <Skeleton className="h-3 w-1/4 bg-white/10" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSkeleton;
