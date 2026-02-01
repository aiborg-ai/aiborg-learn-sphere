/**
 * Content Routes
 * Blog, Knowledge Base, Knowledgebase (new), CMS, search, payment
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

// New Knowledgebase pages (AI Pioneers, Events, Companies, Research)
const KnowledgebasePage = lazy(() => import('@/pages/Knowledgebase'));
const KnowledgebaseTopicPage = lazy(() => import('@/pages/Knowledgebase/TopicPage'));
const KnowledgebaseEntryPage = lazy(() => import('@/pages/Knowledgebase/EntryPage'));
const KnowledgebaseCMS = lazy(() => import('@/pages/CMS/KnowledgebaseCMS'));

// Summit Resource Hub (India AI Impact Summit 2026 - Seven Chakras)
const SummitPage = lazy(() => import('@/pages/Summit'));
const SummitThemePage = lazy(() => import('@/pages/Summit/ThemePage'));
const SummitCMS = lazy(() => import('@/pages/CMS/SummitCMS'));

// Demo page for password-free stakeholder demonstrations
const DemoPage = lazy(() => import('@/pages/Demo'));

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
  // New Knowledgebase routes (AI Pioneers, Events, Companies, Research)
  {
    path: '/knowledgebase',
    element: <KnowledgebasePage />,
  },
  {
    path: '/knowledgebase/:topic',
    element: <KnowledgebaseTopicPage />,
  },
  {
    path: '/knowledgebase/:topic/:slug',
    element: <KnowledgebaseEntryPage />,
  },
  {
    path: '/cms/knowledgebase',
    element: (
      <RouteWrapper routeName="Knowledgebase CMS">
        <KnowledgebaseCMS />
      </RouteWrapper>
    ),
  },
  // Summit Resource Hub routes (India AI Impact Summit 2026)
  {
    path: '/summit',
    element: <SummitPage />,
  },
  {
    path: '/summit/:themeSlug',
    element: <SummitThemePage />,
  },
  {
    path: '/cms/summit',
    element: (
      <RouteWrapper routeName="Summit CMS">
        <SummitCMS />
      </RouteWrapper>
    ),
  },

  // Demo page for stakeholder demonstrations
  {
    path: '/demo',
    element: <DemoPage />,
  },
];
