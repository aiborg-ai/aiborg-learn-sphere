/**
 * Public & Miscellaneous Routes
 * Legal pages, examples, test pages, 404
 */

import { lazy } from 'react';
import type { RouteConfig } from './types';

const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const ErrorHandlingExample = lazy(() =>
  import('@/examples/ErrorHandlingExample').then(m => ({ default: m.ErrorHandlingExample }))
);
const IconTest = lazy(() =>
  import('@/components/shared/IconTest').then(m => ({ default: m.IconTest }))
);
const OnboardingDemo = lazy(() => import('@/components/onboarding/OnboardingDemo'));
const SMELandingPage = lazy(() => import('@/pages/SMELandingPage'));
const Season2Page = lazy(() => import('@/pages/Season2Page'));
const Season2StatusPage = lazy(() => import('@/pages/Season2StatusPage'));
const Season2ReviewPage = lazy(() => import('@/pages/Season2ReviewPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const publicRoutes: RouteConfig[] = [
  {
    path: '/privacy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/examples/error-handling',
    element: <ErrorHandlingExample />,
  },
  {
    path: '/test-icons',
    element: <IconTest />,
  },
  {
    path: '/onboarding-demo',
    element: <OnboardingDemo />,
  },
  {
    path: '/for-sme',
    element: <SMELandingPage />,
  },
  {
    path: '/sme',
    element: <SMELandingPage />,
  },
  {
    path: '/season2',
    element: <Season2Page />,
  },
  {
    path: '/season2/status',
    element: <Season2StatusPage />,
  },
  {
    path: '/season2/review',
    element: <Season2ReviewPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
