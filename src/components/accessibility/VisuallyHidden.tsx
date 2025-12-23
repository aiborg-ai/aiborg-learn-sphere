/**
 * VisuallyHidden Component
 * Hides content visually but keeps it accessible to screen readers
 * WCAG 2.1 AA - Provides text alternatives for icon-only elements
 */

import { cn } from '@/lib/utils';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Visually hides content while keeping it accessible to screen readers.
 *
 * @example
 * <button>
 *   <TrashIcon />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
  className,
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Standard visually hidden CSS
        'absolute w-px h-px p-0 -m-px overflow-hidden',
        'clip-[rect(0,0,0,0)] whitespace-nowrap border-0',
        className
      )}
    >
      {children}
    </Component>
  );
}

// For cases where we need the styles as a class
export const visuallyHiddenStyles =
  'absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0';
