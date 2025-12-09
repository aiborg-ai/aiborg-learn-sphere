/**
 * Course Skeleton Component
 * Shows skeleton layout matching the course page structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function CourseSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Course Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />

              <div className="flex items-center gap-4 pt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Course Card */}
            <div className="rounded-lg border bg-card p-6 shadow-lg">
              <Skeleton className="h-48 w-full rounded-lg mb-4" />
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid md:grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-5 w-5 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="border rounded p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Includes */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-28 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseSkeleton;
