/**
 * Course Routes
 * Course browsing, detail pages, enrollment, homework, quizzes, exercises
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import { CourseSkeleton } from '@/components/skeletons';
import type { RouteConfig } from './types';

const CoursesListPage = lazy(() => import('@/pages/CoursesListPage'));
const CoursePage = lazy(() => import('@/pages/CoursePage'));
const MyCoursesPage = lazy(() => import('@/pages/MyCoursesPage'));
const HomeworkSubmission = lazy(() => import('@/pages/HomeworkSubmissionRefactored'));
const QuizTaker = lazy(() => import('@/components/quiz').then(m => ({ default: m.QuizTaker })));
const QuizResults = lazy(() => import('@/components/quiz').then(m => ({ default: m.QuizResults })));
const QuizReview = lazy(() => import('@/components/quiz').then(m => ({ default: m.QuizReview })));
const ExerciseSubmissionPage = lazy(() => import('@/pages/ExerciseSubmissionPage'));
const ExerciseResultsPage = lazy(() => import('@/pages/ExerciseResultsPage'));
const ReviewSubmissionPage = lazy(() => import('@/pages/ReviewSubmissionPage'));

export const courseRoutes: RouteConfig[] = [
  {
    path: '/courses',
    element: (
      <RouteWrapper routeName="Courses">
        <CoursesListPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/course/:courseId',
    element: (
      <Suspense fallback={<CourseSkeleton />}>
        <RouteWrapper routeName="Course">
          <CoursePage />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/my-courses',
    element: <MyCoursesPage />,
  },
  {
    path: '/assignment/:assignmentId',
    element: (
      <RouteWrapper routeName="Assignment">
        <HomeworkSubmission />
      </RouteWrapper>
    ),
  },
  {
    path: '/quiz/:quizId',
    element: <QuizTaker />,
  },
  {
    path: '/quiz/:quizId/results/:attemptId',
    element: <QuizResults />,
  },
  {
    path: '/quiz/:quizId/review/:attemptId',
    element: <QuizReview />,
  },
  {
    path: '/exercise/:exerciseId/submit',
    element: <ExerciseSubmissionPage />,
  },
  {
    path: '/exercise/:exerciseId/results/:submissionId',
    element: <ExerciseResultsPage />,
  },
  {
    path: '/review/submit',
    element: <ReviewSubmissionPage />,
  },
];
