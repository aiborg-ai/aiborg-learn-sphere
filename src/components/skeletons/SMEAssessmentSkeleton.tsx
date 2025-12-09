/**
 * SME Assessment Skeleton Component
 * Shows skeleton layout matching the SME Assessment page structure
 */

import { Skeleton } from '@/components/ui/skeleton';

export function SMEAssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navbar placeholder */}
      <div className="h-16 border-b bg-background/50" />

      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          {/* Back button */}
          <Skeleton className="h-9 w-32 mb-4 bg-white/10" />

          {/* Title with icon */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-72 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 bg-blue-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full bg-blue-200" />
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-3 w-3/4 bg-blue-200" />
                  <Skeleton className="h-3 w-2/3 bg-blue-200" />
                  <Skeleton className="h-3 w-1/2 bg-blue-200" />
                  <Skeleton className="h-3 w-2/3 bg-blue-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress card */}
        <div className="rounded-lg border bg-card p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full bg-white/10" />
        </div>

        {/* Main form card */}
        <div className="rounded-lg border bg-card mb-6">
          {/* Card header */}
          <div className="p-6 border-b">
            <Skeleton className="h-6 w-64 mb-2 bg-white/10" />
            <Skeleton className="h-4 w-48 bg-white/10" />
          </div>
          {/* Card content - form fields */}
          <div className="p-6 space-y-6">
            {/* Text input field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-10 w-full rounded-md bg-white/10" />
            </div>
            {/* Textarea field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-white/10" />
              <Skeleton className="h-24 w-full rounded-md bg-white/10" />
            </div>
            {/* Rating/slider field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 bg-white/10" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-10 rounded-md bg-white/10" />
                ))}
              </div>
            </div>
            {/* Select field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 bg-white/10" />
              <Skeleton className="h-10 w-full rounded-md bg-white/10" />
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-10 w-28 rounded-md bg-white/10" />
          <Skeleton className="h-10 w-28 rounded-md bg-white/10" />
          <Skeleton className="h-10 w-24 rounded-md bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default SMEAssessmentSkeleton;
