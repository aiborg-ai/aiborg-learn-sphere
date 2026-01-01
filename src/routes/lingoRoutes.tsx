/**
 * AIBORGLingo Routes
 * Language learning game routes
 */

import { lazy } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import type { RouteConfig } from './types';

const LingoHome = lazy(() => import('@/pages/lingo/LingoHome'));
const LingoLessonPlayer = lazy(() => import('@/pages/lingo/LingoLessonPlayer'));
const LingoLessonComplete = lazy(() => import('@/pages/lingo/LingoLessonComplete'));
const LingoLeaderboard = lazy(() => import('@/pages/lingo/LingoLeaderboard'));
const LingoAchievements = lazy(() => import('@/pages/lingo/LingoAchievements'));

export const lingoRoutes: RouteConfig[] = [
  {
    path: '/lingo',
    element: (
      <RouteWrapper routeName="AIBORGLingo">
        <LingoHome />
      </RouteWrapper>
    ),
  },
  {
    path: '/lingo/lesson/:lessonId',
    element: (
      <RouteWrapper routeName="Lingo Lesson">
        <LingoLessonPlayer />
      </RouteWrapper>
    ),
  },
  {
    path: '/lingo/lesson/:lessonId/complete',
    element: (
      <RouteWrapper routeName="Lesson Complete">
        <LingoLessonComplete />
      </RouteWrapper>
    ),
  },
  {
    path: '/lingo/leaderboard',
    element: (
      <RouteWrapper routeName="Lingo Leaderboard">
        <LingoLeaderboard />
      </RouteWrapper>
    ),
  },
  {
    path: '/lingo/achievements',
    element: (
      <RouteWrapper routeName="Lingo Achievements">
        <LingoAchievements />
      </RouteWrapper>
    ),
  },
];
