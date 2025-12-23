import { ReactNode } from 'react';
import { RouteErrorBoundary } from './error-boundaries';

interface RouteWrapperProps {
  children: ReactNode;
  routeName: string;
}

/**
 * RouteWrapper - Wraps routes with error boundary for better error isolation
 *
 * This prevents errors in one route from crashing the entire application.
 * Each route gets its own error boundary with a user-friendly error UI.
 *
 * Accessibility: Includes main landmark with id for skip link navigation (WCAG 2.4.1)
 *
 * @example
 * <Route path="/dashboard" element={
 *   <RouteWrapper routeName="Dashboard">
 *     <Dashboard />
 *   </RouteWrapper>
 * } />
 */
export function RouteWrapper({ children, routeName }: RouteWrapperProps) {
  return (
    <RouteErrorBoundary routeName={routeName}>
      <main id="main-content" role="main" aria-label={routeName}>
        {children}
      </main>
    </RouteErrorBoundary>
  );
}
