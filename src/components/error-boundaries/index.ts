/**
 * Error Boundary Components
 *
 * This module provides various error boundary components for different use cases:
 *
 * - ErrorBoundary: Root-level error boundary for catching all errors
 * - RouteErrorBoundary: Route-specific error boundary to prevent route errors from crashing the app
 * - AsyncErrorBoundary: Lightweight boundary for async operations and data fetching
 */

export { ErrorBoundary } from '../ErrorBoundary';
export { RouteErrorBoundary } from './RouteErrorBoundary';
export { AsyncErrorBoundary } from './AsyncErrorBoundary';
