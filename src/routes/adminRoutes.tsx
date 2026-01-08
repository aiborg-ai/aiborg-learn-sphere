/**
 * Admin Routes
 * Administrative dashboard, management, and configuration routes
 */

import { lazy, Suspense } from 'react';
import { RouteWrapper } from '@/components/RouteWrapper';
import { AdminSkeleton, StudioSkeleton } from '@/components/skeletons';
import type { RouteConfig } from './types';

const Admin = lazy(() => import('@/pages/AdminRefactored'));
const DashboardTest = lazy(() => import('@/pages/admin/DashboardTest'));
const Studio = lazy(() => import('@/pages/Studio'));
const TemplateImport = lazy(() => import('@/pages/admin/TemplateImport'));
const AIBlogWorkflow = lazy(() => import('@/pages/Admin/AIBlogWorkflow'));
const BatchBlogScheduler = lazy(() => import('@/pages/Admin/BatchBlogScheduler'));
const SMEAdminDashboard = lazy(() => import('@/pages/admin/SMEAdminDashboard'));
const AssessmentQuestionsManagement = lazy(() => import('@/pages/AssessmentQuestionsManagement'));
const RAGManagement = lazy(() => import('@/pages/admin/RAGManagement'));
const KBArticleGenerator = lazy(() => import('@/pages/admin/KBArticleGenerator'));
const TenantManagement = lazy(() => import('@/pages/admin/TenantManagement'));
const LingoAdmin = lazy(() => import('@/pages/admin/lingo/LingoAdmin'));
const AdminSurveys = lazy(() => import('@/pages/admin/AdminSurveys'));
const AIReadinessAdminDashboard = lazy(() => import('@/pages/admin/AIReadinessAdminDashboard'));
const PredictiveAnalytics = lazy(() => import('@/pages/admin/PredictiveAnalytics'));

export const adminRoutes: RouteConfig[] = [
  {
    path: '/admin',
    element: (
      <Suspense fallback={<AdminSkeleton />}>
        <RouteWrapper routeName="Admin Dashboard">
          <DashboardTest />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/admin/legacy',
    element: (
      <Suspense fallback={<AdminSkeleton />}>
        <RouteWrapper routeName="Admin Legacy">
          <Admin />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/admin/studio',
    element: (
      <Suspense fallback={<StudioSkeleton />}>
        <RouteWrapper routeName="Studio">
          <Studio />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/admin/template-import',
    element: (
      <RouteWrapper routeName="Template Import">
        <TemplateImport />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/ai-blog-workflow',
    element: (
      <RouteWrapper routeName="AI Blog Generator">
        <AIBlogWorkflow />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/batch-blog-scheduler',
    element: (
      <RouteWrapper routeName="Batch Blog Scheduler">
        <Suspense fallback={<AdminSkeleton />}>
          <BatchBlogScheduler />
        </Suspense>
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/sme',
    element: (
      <Suspense fallback={<AdminSkeleton />}>
        <RouteWrapper routeName="SME Admin Dashboard">
          <SMEAdminDashboard />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/admin/assessment-questions',
    element: (
      <RouteWrapper routeName="Assessment Questions">
        <AssessmentQuestionsManagement />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/rag-management',
    element: (
      <RouteWrapper routeName="RAG System">
        <RAGManagement />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/dashboard-test',
    element: (
      <Suspense fallback={<AdminSkeleton />}>
        <RouteWrapper routeName="Admin Dashboard Test">
          <DashboardTest />
        </RouteWrapper>
      </Suspense>
    ),
  },
  {
    path: '/admin/kb/generate',
    element: (
      <RouteWrapper routeName="KB Article Generator">
        <KBArticleGenerator />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/tenants',
    element: (
      <RouteWrapper routeName="Tenant Management">
        <TenantManagement />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/lingo',
    element: (
      <RouteWrapper routeName="AIBORGLingo Admin">
        <LingoAdmin />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/surveys',
    element: (
      <RouteWrapper routeName="Surveys Admin">
        <AdminSurveys />
      </RouteWrapper>
    ),
  },
  {
    path: '/admin/ai-readiness-dashboard',
    element: <AIReadinessAdminDashboard />,
  },
  {
    path: '/admin/predictions',
    element: (
      <Suspense fallback={<AdminSkeleton />}>
        <RouteWrapper routeName="Predictive Analytics">
          <PredictiveAnalytics />
        </RouteWrapper>
      </Suspense>
    ),
  },
];
