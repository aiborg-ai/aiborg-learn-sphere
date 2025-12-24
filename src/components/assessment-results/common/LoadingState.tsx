/**
 * LoadingState Component
 * Skeleton loading states for charts and content
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'card' | 'chart' | 'table' | 'stats';
  rows?: number;
  className?: string;
  title?: string;
  description?: string;
}

export function LoadingState({
  variant = 'card',
  rows = 3,
  className,
  title,
  description,
}: LoadingStateProps) {
  if (variant === 'chart') {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && (
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            )}
            {description && (
              <CardDescription>
                <Skeleton className="h-4 w-64 mt-2" />
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && (
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            )}
            {description && (
              <CardDescription>
                <Skeleton className="h-4 w-64 mt-2" />
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default card variant
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
