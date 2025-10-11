import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionButtonState {
  isActive: boolean;
  isLoading?: boolean;
}

export interface ActionButtonConfig {
  /** Icon to show in default state */
  defaultIcon: LucideIcon;
  /** Icon to show when active */
  activeIcon: LucideIcon;
  /** Optional icon to show when loading */
  loadingIcon?: LucideIcon;
  /** Label text in default state */
  defaultLabel: string;
  /** Label text when active */
  activeLabel: string;
  /** Optional label text when loading */
  loadingLabel?: string;
  /** Title/tooltip in default state */
  defaultTitle: string;
  /** Title/tooltip when active */
  activeTitle: string;
  /** Color class to apply when active (e.g., 'text-yellow-500') */
  activeColorClass?: string;
}

export interface ActionButtonProps extends ActionButtonState {
  config: ActionButtonConfig;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

/**
 * Base action button component that handles toggle states (active/inactive/loading)
 * with configurable icons, labels, and colors.
 *
 * Use this for buttons like Bookmark, Download, Watch Later that have:
 * - Toggle behavior (on/off states)
 * - Different icons for each state
 * - Optional loading state
 * - State-based color changes
 */
export function ActionButton({
  config,
  isActive,
  isLoading = false,
  onClick,
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false,
  disabled = false,
}: ActionButtonProps) {
  // Determine which icon to show
  const IconComponent = isLoading && config.loadingIcon
    ? config.loadingIcon
    : isActive
    ? config.activeIcon
    : config.defaultIcon;

  // Determine label text
  const label = isLoading && config.loadingLabel
    ? config.loadingLabel
    : isActive
    ? config.activeLabel
    : config.defaultLabel;

  // Determine title/tooltip
  const title = isActive ? config.activeTitle : config.defaultTitle;

  // Build icon classes
  const iconClasses = cn(
    'h-4 w-4',
    showLabel && 'mr-2',
    isLoading && 'animate-spin'
  );

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'transition-colors',
        isActive && config.activeColorClass,
        className
      )}
      title={title}
    >
      <IconComponent className={iconClasses} />
      {showLabel && label}
    </Button>
  );
}
