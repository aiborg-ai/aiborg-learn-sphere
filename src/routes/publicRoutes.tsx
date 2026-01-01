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
    path: '*',
    element: <NotFound />,
  },
];
