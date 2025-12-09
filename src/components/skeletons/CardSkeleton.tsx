/**
 * Card Skeleton Component
 * Reusable skeleton for card-based content
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  contentLines?: number;
}

export function CardSkeleton({
  className,
  showHeader = true,
  showContent = true,
  contentLines = 3,
}: CardSkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      {showHeader && (
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      {showContent && (
        <div className="space-y-2">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton key={i} className={cn('h-4', i === contentLines - 1 ? 'w-2/3' : 'w-full')} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CardSkeleton;
