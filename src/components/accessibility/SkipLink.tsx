/**
 * SkipLink Component
 * Provides keyboard-only users a way to skip navigation
 * WCAG 2.1 AA - 2.4.1 Bypass Blocks
 */

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip link that appears on focus for keyboard navigation.
 * Should be the first focusable element on the page.
 *
 * @example
 * // In your App.tsx or Layout component
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default, visible on focus
        'absolute left-0 top-0 z-[9999]',
        'bg-background text-foreground',
        'px-4 py-2 font-medium',
        'rounded-br-md shadow-lg',
        'transform -translate-y-full',
        'focus:translate-y-0',
        'transition-transform duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Multiple skip links for complex pages
 */
export function SkipLinks({
  links,
  className,
}: {
  links: Array<{ href: string; label: string }>;
  className?: string;
}) {
  return (
    <nav
      aria-label="Skip links"
      className={cn(
        'absolute left-0 top-0 z-[9999]',
        'transform -translate-y-full',
        'focus-within:translate-y-0',
        'transition-transform duration-200',
        'bg-background shadow-lg rounded-br-md',
        className
      )}
    >
      <ul className="flex flex-col">
        {links.map((link, index) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={cn(
                'block px-4 py-2 text-sm font-medium',
                'text-foreground hover:bg-accent',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring',
                index === 0 && 'rounded-tr-md',
                index === links.length - 1 && 'rounded-br-md'
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
