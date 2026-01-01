/**
 * Authentication Routes
 * Routes for login, signup, password reset, and OAuth callbacks
 */

import { lazy } from 'react';
import type { RouteConfig } from './types';

const Auth = lazy(() => import('@/pages/Auth'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

export const authRoutes: RouteConfig[] = [
  {
    path: '/auth',
    element: <Auth />,
    suspense: false, // Handled by parent
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
    suspense: false,
  },
  {
    path: '/auth/reset-password',
    element: <ResetPassword />,
    suspense: false,
  },
];
