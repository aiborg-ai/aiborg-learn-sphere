/**
 * Content Routes
 * Blog, Knowledge Base, CMS, search, payment
 */

import { lazy } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import type { RouteConfig } from './types';

const BlogPage = lazy(() => import('@/pages/Blog'));
const BlogPostPage = lazy(() => import('@/pages/Blog/BlogPost'));
const KnowledgeBase = lazy(() => import('@/pages/KnowledgeBase'));
const KBArticle = lazy(() => import('@/pages/KBArticle'));
const CMS = lazy(() => import('@/pages/CMS'));
const BlogCMS = lazy(() => import('@/pages/CMS/BlogCMS'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const ClaimFreePass = lazy(() => import('@/pages/ClaimFreePass'));

export const contentRoutes: RouteConfig[] = [
  {
    path: '/blog',
    element: <BlogPage />,
  },
  {
    path: '/blog/:slug',
    element: <BlogPostPage />,
  },
  {
    path: '/kb',
    element: <KnowledgeBase />,
  },
  {
    path: '/kb/:slug',
    element: <KBArticle />,
  },
  {
    path: '/cms',
    element: (
      <RouteWrapper routeName="CMS">
        <CMS />
      </RouteWrapper>
    ),
  },
  {
    path: '/cms/blog',
    element: (
      <RouteWrapper routeName="Blog CMS">
        <BlogCMS />
      </RouteWrapper>
    ),
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/payment-success',
    element: <PaymentSuccess />,
  },
  {
    path: '/claim-free-pass',
    element: <ClaimFreePass />,
  },
];
