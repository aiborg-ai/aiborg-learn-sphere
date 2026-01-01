/**
 * Assessment Routes
 * AI readiness, awareness, fluency, SME, and skills assessments
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import { SMEAssessmentSkeleton } from '@/components/skeletons';
import type { RouteConfig } from './types';

const AIAssessment = lazy(() => import('@/pages/AIAssessment'));
const AIAssessmentResults = lazy(() => import('@/pages/AIAssessmentResults'));
const SMEAssessment = lazy(() => import('@/pages/SMEAssessment'));
const SMEAssessmentReport = lazy(() => import('@/pages/SMEAssessmentReport'));
const AIReadinessAssessment = lazy(() => import('@/pages/AIReadinessAssessment'));
const AIReadinessResults = lazy(() => import('@/pages/AIReadinessResults'));
const AIAwarenessAssessment = lazy(() => import('@/pages/AIAwarenessAssessment'));
const AIFluencyAssessment = lazy(() => import('@/pages/AIFluencyAssessment'));
const AssessmentResultsPage = lazy(() => import('@/pages/AssessmentResultsPage'));
const SkillsAssessmentResultsPage = lazy(() => import('@/pages/SkillsAssessmentResultsPage'));
const AssessmentHistoryPanel = lazy(() =>
  import('@/components/assessment-tools').then(m => ({ default: m.AssessmentHistoryPanel }))
);

export const assessmentRoutes: RouteConfig[] = [
  {
    path: '/ai-assessment',
    element: <AIAssessment />,
  },
  {
    path: '/ai-assessment/results/:assessmentId',
    element: <AIAssessmentResults />,
  },
  {
    path: '/sme-assessment',
    element: (
      <Suspense fallback={<SMEAssessmentSkeleton />}>
        <RouteWrapper routeName="SME Assessment">
          <SMEAssessment />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/sme-assessment-report/:assessmentId',
    element: <SMEAssessmentReport />,
  },
  {
    path: '/assessment/ai-readiness',
    element: <AIReadinessAssessment />,
  },
  {
    path: '/assessment/ai-readiness/results/:assessmentId',
    element: <AIReadinessResults />,
  },
  {
    path: '/assessment/ai-awareness',
    element: <AIAwarenessAssessment />,
  },
  {
    path: '/assessment/ai-fluency',
    element: <AIFluencyAssessment />,
  },
  {
    path: '/assessment/:toolSlug/results/:attemptId',
    element: <AssessmentResultsPage />,
  },
  {
    path: '/skills/assessment/:assessmentId/results',
    element: <SkillsAssessmentResultsPage />,
  },
  {
    path: '/assessment/:toolSlug/history',
    element: <AssessmentHistoryPanel />,
  },
];
