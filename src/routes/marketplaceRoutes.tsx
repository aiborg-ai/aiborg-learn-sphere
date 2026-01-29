/**
 * Marketplace Routes
 * External AI course marketplace pages
 */

import { lazy } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import type { RouteConfig } from './types';

const MarketplacePage = lazy(() => import('@/pages/marketplace/MarketplacePage'));
const CourseDetailPage = lazy(() => import('@/pages/marketplace/CourseDetailPage'));
const FavoritesPage = lazy(() => import('@/pages/marketplace/FavoritesPage'));
const PriceAlertsPage = lazy(() => import('@/pages/marketplace/PriceAlertsPage'));

export const marketplaceRoutes: RouteConfig[] = [
  {
    path: '/marketplace',
    element: (
      <RouteWrapper routeName="AI Course Marketplace">
        <MarketplacePage />
      </RouteWrapper>
    ),
  },
  {
    path: '/marketplace/course/:slug',
    element: (
      <RouteWrapper routeName="Course Details">
        <CourseDetailPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/marketplace/favorites',
    element: (
      <RouteWrapper routeName="My Favorite Courses">
        <FavoritesPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/marketplace/alerts',
    element: (
      <RouteWrapper routeName="Price Alerts">
        <PriceAlertsPage />
      </RouteWrapper>
    ),
  },
];
