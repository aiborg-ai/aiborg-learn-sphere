/**
 * Admin Sidebar Navigation
 *
 * Modern collapsible sidebar with hierarchical navigation
 * Inspired by oppspot's admin-sidebar.tsx
 * Customized for Aiborg's unique AI-powered features
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Home,
  BarChart3,
  Activity,
  Radio,
  Sparkles,
  Database,
  Network,
  Brain,
  MessageSquare,
  FileText,
  Users,
  User,
  Shield,
  UserCheck,
  FileInput,
  BookOpen,
  Newspaper,
  Calendar,
  FolderOpen,
  Megaphone,
  Star,
  GraduationCap,
  UserPlus,
  ClipboardCheck,
  TrendingUp,
  Award,
  CheckSquare,
  ClipboardList,
  HelpCircle,
  Cpu,
  UserCog,
  Languages,
  Settings,
  Loader,
  FileCheck,
  FileSearch,
  DollarSign,
  Lock,
  Workflow,
  Key,
  Webhook,
  Mail,
  FileQuestion,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
}

const navigationStructure: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    children: [
      { name: 'Overview', href: '/admin', icon: Home },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'System Health', href: '/admin/system-health', icon: Activity },
      { name: 'Live Feed', href: '/admin/live-feed', icon: Radio, badge: 'NEW' },
    ],
  },
  {
    name: 'AI & Intelligence',
    href: '/admin/ai',
    icon: Sparkles,
    badge: 'AIBORG',
    children: [
      { name: 'RAG Management', href: '/admin/rag-management', icon: Database },
      { name: 'Knowledge Graph', href: '/admin/knowledge-graph', icon: Network },
      { name: 'AI Content', href: '/admin/ai-content', icon: Brain },
      { name: 'Chatbot Analytics', href: '/admin/chatbot-analytics', icon: MessageSquare },
      { name: 'AI Blog Workflow', href: '/admin/ai-blog-workflow', icon: FileText, badge: 'NEW' },
    ],
  },
  {
    name: 'Users & Access',
    href: '/admin/users',
    icon: Users,
    children: [
      { name: 'User Management', href: '/admin/users', icon: User },
      { name: 'Role Management', href: '/admin/roles', icon: Shield },
      { name: 'Family Passes', href: '/admin/family-passes', icon: Home },
      { name: 'Registrants', href: '/admin/registrants', icon: UserCheck },
      { name: 'Bulk Operations', href: '/admin/bulk-ops', icon: FileInput },
    ],
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
    children: [
      { name: 'Courses', href: '/admin/courses', icon: BookOpen },
      { name: 'Blog', href: '/admin/blog', icon: Newspaper },
      { name: 'Events', href: '/admin/events', icon: Calendar },
      { name: 'Resources', href: '/admin/resources', icon: FolderOpen },
      { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    name: 'Learning & Progress',
    href: '/admin/learning',
    icon: GraduationCap,
    children: [
      { name: 'Enrollments', href: '/admin/enrollments', icon: UserPlus },
      { name: 'Assignments', href: '/admin/assignments', icon: ClipboardCheck },
      { name: 'Progress Tracking', href: '/admin/progress', icon: TrendingUp },
      { name: 'Achievements', href: '/admin/achievements', icon: Award },
      { name: 'Attendance', href: '/admin/attendance', icon: CheckSquare },
    ],
  },
  {
    name: 'Assessments',
    href: '/admin/assessments',
    icon: ClipboardList,
    children: [
      { name: 'Question Bank', href: '/admin/assessment-questions', icon: HelpCircle },
      { name: 'AI Readiness', href: '/admin/ai-readiness', icon: Cpu },
      { name: 'SME Assessments', href: '/admin/sme', icon: UserCog },
      { name: 'AIBORGLingo', href: '/admin/lingo', icon: Languages },
    ],
  },
  {
    name: 'Operations',
    href: '/admin/operations',
    icon: Settings,
    children: [
      { name: 'Background Jobs', href: '/admin/jobs', icon: Loader },
      { name: 'Compliance', href: '/admin/compliance', icon: FileCheck },
      { name: 'Audit Logs', href: '/admin/audit', icon: FileSearch },
      { name: 'Moderation', href: '/admin/moderation', icon: Shield },
      { name: 'Refunds', href: '/admin/refunds', icon: DollarSign },
      { name: 'Vault Claims', href: '/admin/vault', icon: Lock },
    ],
  },
  {
    name: 'Integrations',
    href: '/admin/integrations',
    icon: Workflow,
    children: [
      { name: 'API Keys', href: '/admin/api-keys', icon: Key },
      { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
      { name: 'Email Campaigns', href: '/admin/email', icon: Mail },
      { name: 'Surveys', href: '/admin/surveys', icon: FileQuestion },
    ],
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ open = true, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand parent when child route is active
  useEffect(() => {
    const newExpanded = new Set<string>();
    navigationStructure.forEach(section => {
      if (section.children) {
        const hasActiveChild = section.children.some(child => isActive(child.href));
        if (hasActiveChild) {
          newExpanded.add(section.name);
        }
      }
    });
    setExpandedSections(newExpanded);
  }, [location.pathname]);

  const isActive = (href: string) => {
    // Exact match for root
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    // Prefix match for other routes
    return location.pathname.startsWith(href);
  };

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col h-full bg-gray-900 border-r border-gray-800 transition-all duration-300',
        open ? 'w-64' : 'w-20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {open && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" />
            <span className="font-bold text-white text-lg">Admin</span>
          </div>
        )}
        {!open && <Shield className="h-6 w-6 text-purple-500 mx-auto" />}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigationStructure.map(section => {
          const isExpanded = expandedSections.has(section.name);
          const hasSectionActive = section.children?.some(child => isActive(child.href));

          if (section.children) {
            return (
              <Collapsible
                key={section.name}
                open={isExpanded}
                onOpenChange={() => toggleSection(section.name)}
              >
                <CollapsibleTrigger
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    hasSectionActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 flex-shrink-0" />
                    {open && (
                      <>
                        <span>{section.name}</span>
                        {section.badge && (
                          <Badge
                            variant={section.badge === 'AIBORG' ? 'default' : 'secondary'}
                            className={cn(
                              'text-xs px-1.5 py-0',
                              section.badge === 'AIBORG'
                                ? 'bg-purple-600 text-white'
                                : 'bg-blue-600 text-white'
                            )}
                          >
                            {section.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  {open && (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform flex-shrink-0',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  )}
                </CollapsibleTrigger>

                {open && (
                  <CollapsibleContent className="space-y-1 mt-1">
                    {section.children.map(child => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center gap-3 pl-11 pr-3 py-2 rounded-lg text-sm transition-colors',
                            childActive
                              ? 'bg-blue-600 text-white font-medium'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          )}
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{child.name}</span>
                          {child.badge && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 bg-blue-600 text-white"
                            >
                              {child.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          }

          // Single item without children
          return (
            <Link
              key={section.href}
              to={section.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(section.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <section.icon className="h-5 w-5 flex-shrink-0" />
              {open && <span>{section.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {open && (
        <div className="p-4 border-t border-gray-800">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to Main App</span>
          </Link>
        </div>
      )}
    </div>
  );
}
