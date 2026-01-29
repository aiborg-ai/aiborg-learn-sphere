/**
 * Provider Badge Component
 * Displays course provider logo and name
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CourseProviderSlug, CourseProviderCategory } from '@/types/marketplace';
import { PROVIDER_INFO } from '@/types/marketplace';

interface ProviderBadgeProps {
  provider: CourseProviderSlug;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
  showName?: boolean;
  className?: string;
}

const CATEGORY_COLORS: Record<CourseProviderCategory, string> = {
  mooc: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  regional: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const SIZE_CLASSES = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    logo: 'h-3 w-3',
    gap: 'gap-1',
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    logo: 'h-4 w-4',
    gap: 'gap-1.5',
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    logo: 'h-5 w-5',
    gap: 'gap-2',
  },
};

export function ProviderBadge({
  provider,
  logoUrl,
  size = 'md',
  showLogo = true,
  showName = true,
  className,
}: ProviderBadgeProps) {
  const info = PROVIDER_INFO[provider];
  const sizeClasses = SIZE_CLASSES[size];
  const categoryColor = CATEGORY_COLORS[info.category];

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center font-medium',
        sizeClasses.badge,
        sizeClasses.gap,
        categoryColor,
        className
      )}
    >
      {showLogo && logoUrl && (
        <img
          src={logoUrl}
          alt={`${info.name} logo`}
          className={cn('object-contain rounded-sm', sizeClasses.logo)}
          onError={e => {
            // Hide broken images
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      {showName && <span>{info.name}</span>}
    </Badge>
  );
}

/**
 * Provider Logo Only
 */
interface ProviderLogoProps {
  provider: CourseProviderSlug;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LOGO_SIZES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export function ProviderLogo({ provider, logoUrl, size = 'md', className }: ProviderLogoProps) {
  const info = PROVIDER_INFO[provider];

  if (!logoUrl) {
    // Fallback to initials
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded bg-muted text-muted-foreground font-semibold',
          LOGO_SIZES[size],
          className
        )}
        title={info.name}
      >
        {info.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${info.name} logo`}
      className={cn('object-contain rounded', LOGO_SIZES[size], className)}
      title={info.name}
      onError={e => {
        // Replace with initials on error
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

export default ProviderBadge;
