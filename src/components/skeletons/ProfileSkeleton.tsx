/**
 * Profile Skeleton Component
 * Shows skeleton layout matching the profile page structure
 */

import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton } from './CardSkeleton';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="rounded-lg border bg-card mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <Skeleton className="h-24 w-24 rounded-full" />

              {/* Profile Info */}
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              {/* Edit Button */}
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b pb-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-md" />
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Skills/Interests */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-28 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="text-center p-3 rounded border">
                    <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificates */}
            <CardSkeleton contentLines={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
