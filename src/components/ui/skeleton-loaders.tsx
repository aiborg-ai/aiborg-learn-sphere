import { cn } from '@/lib/utils';

// Base Skeleton
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/50',
        'relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:-translate-x-full',
        'before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

// Card Skeleton
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// List Item Skeleton
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// Course Card Skeleton (matches TrainingPrograms cards)
export function SkeletonCourseCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" /> {/* Badge */}
          <Skeleton className="h-5 w-20" /> {/* Badge */}
        </div>
        <Skeleton className="h-6 w-full" /> {/* Title */}
        <Skeleton className="h-4 w-5/6" /> {/* Description line 1 */}
        <Skeleton className="h-4 w-4/6" /> {/* Description line 2 */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-9 w-24" /> {/* Button */}
        </div>
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4', className)}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// Table Skeleton
export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-border">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

// Mobile List Skeleton (optimized for mobile screens)
export function SkeletonMobileList({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

// Hero Section Skeleton
export function SkeletonHero({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8 py-12', className)}>
      {/* Title */}
      <div className="space-y-3 text-center">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    </div>
  );
}

// Form Skeleton
export function SkeletonForm({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Form fields */}
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-12 w-full" /> {/* Input */}
        </div>
      ))}

      {/* Button */}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

// Navigation Skeleton
export function SkeletonNav({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between p-4', className)}>
      <Skeleton className="h-10 w-32" /> {/* Logo */}
      <div className="hidden md:flex items-center gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      <Skeleton className="h-10 w-24" /> {/* Button */}
    </div>
  );
}

// Add shimmer animation to global CSS or tailwind config
// @keyframes shimmer {
//   100% {
//     transform: translateX(100%);
//   }
// }
