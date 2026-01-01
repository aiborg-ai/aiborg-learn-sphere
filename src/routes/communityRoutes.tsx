/**
 * Community Routes
 * Forums, workshops, memberships, surveys
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import { WorkshopSessionSkeleton } from '@/components/skeletons';
import type { RouteConfig } from './types';

const ForumPage = lazy(() => import('@/pages/ForumPage'));
const ForumCategoryPage = lazy(() => import('@/pages/ForumCategoryPage'));
const ForumThreadPage = lazy(() => import('@/pages/ForumThreadPage'));
const WorkshopsPage = lazy(() => import('@/pages/WorkshopsPage'));
const WorkshopSessionPage = lazy(() => import('@/pages/WorkshopSessionPage'));
const FamilyMembershipPage = lazy(() => import('@/pages/FamilyMembershipPage'));
const FamilyMembershipEnrollment = lazy(() => import('@/pages/FamilyMembershipEnrollment'));
const SurveysPage = lazy(() => import('@/pages/surveys/SurveysPage'));
const PublicSurvey = lazy(() => import('@/pages/surveys/PublicSurvey'));

export const communityRoutes: RouteConfig[] = [
  // Forum routes
  {
    path: '/forum',
    element: <ForumPage />,
  },
  {
    path: '/forum/:categorySlug',
    element: <ForumCategoryPage />,
  },
  {
    path: '/forum/:categorySlug/:threadSlug',
    element: <ForumThreadPage />,
  },
  // Workshop routes
  {
    path: '/workshops',
    element: <WorkshopsPage />,
  },
  {
    path: '/workshop/:workshopId',
    element: <WorkshopsPage />,
  },
  {
    path: '/workshop/session/:sessionId',
    element: (
      <Suspense fallback={<WorkshopSessionSkeleton />}>
        <RouteWrapper routeName="Workshop Session">
          <WorkshopSessionPage />
        </RouteWrapper>
      </Suspense>
    ),
  },
  // Membership routes
  {
    path: '/family-membership',
    element: <FamilyMembershipPage />,
  },
  {
    path: '/family-membership/enroll',
    element: <FamilyMembershipEnrollment />,
  },
  // Survey routes
  {
    path: '/surveys',
    element: <SurveysPage />,
  },
  {
    path: '/surveys/:surveyId',
    element: <PublicSurvey />,
  },
];
