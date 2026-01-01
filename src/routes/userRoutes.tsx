/**
 * User Routes
 * Dashboard, profile, bookmarks, downloads, analytics, gamification
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import {
  DashboardSkeleton,
  ProfileSkeleton,
  AnalyticsSkeleton,
  DashboardBuilderSkeleton,
} from '@/components/skeletons';
import type { RouteConfig } from './types';

const Dashboard = lazy(() => import('@/pages/DashboardRefactored'));
const Profile = lazy(() => import('@/pages/Profile'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile'));
const BookmarksPage = lazy(() => import('@/pages/BookmarksPage'));
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage'));
const WatchLaterPage = lazy(() => import('@/pages/WatchLaterPage'));
const PlaylistsPage = lazy(() => import('@/pages/PlaylistsPage'));
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const AdvancedAnalyticsDashboard = lazy(() => import('@/pages/AdvancedAnalyticsDashboard'));
const GamificationPage = lazy(() => import('@/pages/GamificationPage'));
const DashboardBuilderPage = lazy(() => import('@/pages/DashboardBuilderPage'));
const TemplateGalleryPage = lazy(() => import('@/pages/TemplateGalleryPage'));
const OfflineContentPage = lazy(() => import('@/pages/OfflineContent'));
const OnboardingDemo = lazy(() => import('@/components/onboarding/OnboardingDemo'));

export const userRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<DashboardSkeleton />}>
        <RouteWrapper routeName="Dashboard">
          <Dashboard />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/profile',
    element: (
      <Suspense fallback={<ProfileSkeleton />}>
        <RouteWrapper routeName="Profile">
          <Profile />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/user/:userId',
    element: <PublicProfile />,
  },
  {
    path: '/bookmarks',
    element: <BookmarksPage />,
  },
  {
    path: '/downloads',
    element: <DownloadsPage />,
  },
  {
    path: '/offline-content',
    element: (
      <RouteWrapper routeName="Offline Content">
        <OfflineContentPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/watch-later',
    element: <WatchLaterPage />,
  },
  {
    path: '/playlists',
    element: <PlaylistsPage />,
  },
  {
    path: '/achievements',
    element: <AchievementsPage />,
  },
  {
    path: '/analytics',
    element: (
      <Suspense fallback={<AnalyticsSkeleton />}>
        <RouteWrapper routeName="Analytics">
          <AnalyticsPage />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/analytics/advanced',
    element: (
      <RouteWrapper routeName="Advanced Analytics">
        <AdvancedAnalyticsDashboard />
      </RouteWrapper>
    ),
  },
  {
    path: '/gamification',
    element: (
      <RouteWrapper routeName="Gamification">
        <GamificationPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/dashboard-builder',
    element: (
      <Suspense fallback={<DashboardBuilderSkeleton />}>
        <RouteWrapper routeName="Dashboard Builder">
          <DashboardBuilderPage />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/template-gallery',
    element: (
      <RouteWrapper routeName="Template Gallery">
        <TemplateGalleryPage />
      </RouteWrapper>
    ),
  },
  {
    path: '/onboarding-demo',
    element: (
      <RouteWrapper routeName="Onboarding Demo">
        <OnboardingDemo />
      </RouteWrapper>
    ),
  },
];
