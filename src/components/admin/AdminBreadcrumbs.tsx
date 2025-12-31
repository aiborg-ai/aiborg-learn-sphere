/**
 * Admin Breadcrumbs Navigation
 *
 * Auto-generates breadcrumbs from current route
 * Provides contextual navigation
 */

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href: string;
  current: boolean;
}

// Route label mapping
const routeLabels: Record<string, string> = {
  admin: 'Admin',
  analytics: 'Analytics',
  'rag-management': 'RAG Management',
  'knowledge-graph': 'Knowledge Graph',
  'ai-content': 'AI Content',
  'chatbot-analytics': 'Chatbot Analytics',
  'ai-blog-workflow': 'AI Blog Workflow',
  users: 'Users',
  roles: 'Roles',
  'family-passes': 'Family Passes',
  registrants: 'Registrants',
  'bulk-ops': 'Bulk Operations',
  courses: 'Courses',
  blog: 'Blog',
  events: 'Events',
  resources: 'Resources',
  announcements: 'Announcements',
  reviews: 'Reviews',
  enrollments: 'Enrollments',
  assignments: 'Assignments',
  progress: 'Progress Tracking',
  achievements: 'Achievements',
  attendance: 'Attendance',
  'assessment-questions': 'Question Bank',
  'ai-readiness': 'AI Readiness',
  sme: 'SME Assessments',
  lingo: 'AIBORGLingo',
  jobs: 'Background Jobs',
  compliance: 'Compliance',
  audit: 'Audit Logs',
  moderation: 'Moderation',
  refunds: 'Refunds',
  vault: 'Vault Claims',
  'api-keys': 'API Keys',
  webhooks: 'Webhooks',
  email: 'Email Campaigns',
  surveys: 'Surveys',
  'system-health': 'System Health',
  'live-feed': 'Live Feed',
};

export function AdminBreadcrumbs() {
  const location = useLocation();

  const generateBreadcrumbs = (): Breadcrumb[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0 || pathSegments[0] !== 'admin') {
      return [];
    }

    const breadcrumbs: Breadcrumb[] = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Get label from mapping or use segment
      const label =
        routeLabels[segment] ||
        segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      <Link
        to="/admin"
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 mx-1" />
          {breadcrumb.current ? (
            <span className="font-medium text-gray-900 dark:text-white">{breadcrumb.label}</span>
          ) : (
            <Link
              to={breadcrumb.href}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
