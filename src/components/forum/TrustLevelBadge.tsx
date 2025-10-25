/**
 * TrustLevelBadge Component
 * Display user's trust level with color and name
 */

import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrustLevelBadgeProps } from '@/types/forum';
import { TRUST_LEVEL_NAMES, TRUST_LEVEL_COLORS } from '@/types/forum';

export function TrustLevelBadge({ level, showLabel = true, size = 'md' }: TrustLevelBadgeProps) {
  const name = TRUST_LEVEL_NAMES[level];
  const color = TRUST_LEVEL_COLORS[level];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center gap-1 font-medium border-2', sizeClasses[size])}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}10`,
      }}
    >
      <Shield className={iconSizeClasses[size]} style={{ color }} />
      {showLabel && <span>{name}</span>}
    </Badge>
  );
}
