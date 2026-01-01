/**
 * Learning Routes
 * Learning paths, flashcards, calendar, sessions, tickets
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import { CalendarSkeleton, SessionSkeleton } from '@/components/skeletons';
import type { RouteConfig } from './types';

const LearningPathsPage = lazy(() => import('@/pages/LearningPathsPage'));
const LearningPathWizard = lazy(() => import('@/components/learning-path/LearningPathWizard'));
const AILearningPathDetail = lazy(() => import('@/pages/AILearningPathDetail'));
const FlashcardsPage = lazy(() => import('@/pages/flashcards/FlashcardsPage'));
const DeckPage = lazy(() => import('@/pages/flashcards/DeckPage'));
const ReviewSessionPage = lazy(() => import('@/pages/flashcards/ReviewSessionPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const SessionsPage = lazy(() => import('@/pages/SessionsPage'));
const MyTicketsPage = lazy(() => import('@/pages/MyTicketsPage'));
const MyEventTicketsPage = lazy(() => import('@/pages/MyEventTicketsPage'));

export const learningRoutes: RouteConfig[] = [
  {
    path: '/learning-paths',
    element: <LearningPathsPage />,
  },
  {
    path: '/learning-path/generate',
    element: <LearningPathWizard />,
  },
  {
    path: '/learning-path/ai/:pathId',
    element: <AILearningPathDetail />,
  },
  {
    path: '/flashcards',
    element: (
      <RouteWrapper routeName="Flashcards">
        <FlashcardsPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/flashcards/:deckId',
    element: (
      <RouteWrapper routeName="Deck">
        <DeckPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/flashcards/:deckId/review',
    element: (
      <RouteWrapper routeName="Review Session">
        <ReviewSessionPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/calendar',
    element: (
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarPage />
      </Suspense>
    ),
  },
  {
    path: '/sessions',
    element: (
      <Suspense fallback={<SessionSkeleton />}>
        <SessionsPage />
      </Suspense>
    ),
  },
  {
    path: '/my-tickets',
    element: <MyTicketsPage />,
  },
  {
    path: '/my-event-tickets',
    element: <MyEventTicketsPage />,
  },
];
