/**
 * Settings Routes
 * Application settings and configuration
 */

import { lazy } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import type { RouteConfig } from './types';

const WhiteLabelSettings = lazy(() => import('@/pages/settings/WhiteLabelSettings'));
const DomainManagement = lazy(() => import('@/pages/settings/DomainManagement'));

export const settingsRoutes: RouteConfig[] = [
  {
    path: '/settings/white-label',
    element: (
      <RouteWrapper routeName="White-Label Settings">
        <WhiteLabelSettings />
      </RouteWrapper>
    ),
  },
  {
    path: '/settings/domains',
    element: (
      <RouteWrapper routeName="Domain Management">
        <DomainManagement />
      </RouteWrapper>
    ),
  },
];
