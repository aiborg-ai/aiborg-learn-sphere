/**
 * Route Configuration Types
 * Defines the structure for route modules
 */

import { ReactNode, ComponentType } from 'react';

/**
 * Skeleton component types available for loading states
 */
export type SkeletonType =
  | 'dashboard'
  | 'profile'
  | 'analytics'
  | 'course'
  | 'studio'
  | 'admin'
  | 'calendar'
  | 'session'
  | 'dashboardBuilder'
  | 'smeAssessment'
  | 'workshopSession'
  | 'instructorDashboard'
  | null;

/**
 * Route configuration object
 */
export interface RouteConfig {
  /** Route path */
  path: string;
  /** Component to render */
  element: ReactNode;
  /** Display name for RouteWrapper */
  routeName?: string;
  /** Skeleton component to show while loading */
  skeleton?: SkeletonType;
  /** Whether to wrap in Suspense (default: true for lazy components) */
  suspense?: boolean;
  /** Children routes (for nested routing) */
  children?: RouteConfig[];
}

/**
 * Route module export
 */
export interface RouteModule {
  /** Routes defined in this module */
  routes: RouteConfig[];
  /** Module description */
  description?: string;
}
