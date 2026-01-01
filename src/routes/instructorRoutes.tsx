/**
 * Instructor Routes
 * Instructor dashboard, classroom, sessions
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import { InstructorDashboardSkeleton } from '@/components/skeletons';
import type { RouteConfig } from './types';

const InstructorDashboard = lazy(() => import('@/pages/InstructorDashboard'));
const ClassroomPage = lazy(() => import('@/pages/instructor/ClassroomPage'));
const InstructorSessionsPage = lazy(() => import('@/pages/InstructorSessionsPage'));

export const instructorRoutes: RouteConfig[] = [
  {
    path: '/instructor',
    element: (
      <Suspense fallback={<InstructorDashboardSkeleton />}>
        <RouteWrapper routeName="Instructor Dashboard">
          <InstructorDashboard />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/instructor/classroom/:courseId',
    element: (
      <RouteWrapper routeName="Classroom">
        <ClassroomPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/instructor/sessions',
    element: <InstructorSessionsPage />,
  },
];
