/**
 * Instructor Dashboard Skeleton Component
 * Shows skeleton layout matching the Instructor Dashboard structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function InstructorDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back button */}
          <Skeleton className="h-10 w-40 rounded-md mb-4 bg-white/10" />

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48 bg-white/10" />
              <Skeleton className="h-5 w-72 bg-white/10" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md bg-white/10" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {['Total Courses', 'Total Students', 'Pending Grading', 'Course Materials'].map(
            (_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-4 w-4 bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
                <Skeleton className="h-9 w-12 bg-white/10" />
              </div>
            )
          )}
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          {/* Tab list */}
          <div className="flex gap-1 p-1 rounded-md bg-white/10 w-fit">
            {['Overview', 'Materials', 'Students', 'Assignments'].map((_, i) => (
              <Skeleton
                key={i}
                className={`h-9 w-32 rounded-md ${i === 0 ? 'bg-white/20' : 'bg-transparent'}`}
              />
            ))}
          </div>

          {/* Tab content - Overview */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 bg-white/10" />
                <Skeleton className="h-6 w-32 bg-white/10" />
              </div>
              <Skeleton className="h-4 w-48 bg-white/10" />
            </div>
            <div className="p-6 space-y-3">
              {/* Course list items */}
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white/5"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 bg-white/10" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
                      <Skeleton className="h-4 w-20 bg-white/10" />
                      <Skeleton className="h-4 w-16 bg-white/10" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-28 rounded-md bg-white/10" />
                    <Skeleton className="h-8 w-24 rounded-md bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboardSkeleton;
