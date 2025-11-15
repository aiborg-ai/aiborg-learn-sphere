/**
 * Widget Registry
 *
 * Central registry for all available dashboard widgets.
 * Defines widget metadata, default configurations, and component mappings.
 */

import { lazy } from 'react';
import type { WidgetDefinition, WidgetType, WidgetCategory } from '@/types/dashboard';

// ============================================================================
// Widget Component Imports (Lazy Loaded)
// ============================================================================

// Core Metrics Widgets
const StatsWidget = lazy(() => import('@/components/dashboard-builder/widgets/StatsWidget'));
const AchievementsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/AchievementsWidget')
);
const CertificatesWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/CertificatesWidget')
);
const StreaksWidget = lazy(() => import('@/components/dashboard-builder/widgets/StreaksWidget'));
const EnrollmentStatsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/EnrollmentStatsWidget')
);

// Progress Tracking Widgets
const CourseProgressWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/CourseProgressWidget')
);
const LearningPathProgressWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/LearningPathProgressWidget')
);
const SkillChartWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/SkillChartWidget')
);
const ProgressSummaryWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/ProgressSummaryWidget')
);

// Charts & Analytics Widgets
const PerformanceChartWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/PerformanceChartWidget')
);
const TimeTrackingWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/TimeTrackingWidget')
);
const AssessmentScoresWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/AssessmentScoresWidget')
);
const LearningVelocityWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/LearningVelocityWidget')
);

// Activity Feed Widgets
const NotificationsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/NotificationsWidget')
);
const AssignmentsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/AssignmentsWidget')
);
const UpcomingEventsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/UpcomingEventsWidget')
);
const RecentActivityWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/RecentActivityWidget')
);
const CalendarWidget = lazy(() => import('@/components/dashboard-builder/widgets/CalendarWidget'));

// AI & Insights Widgets
const AIInsightsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/AIInsightsWidget')
);
const StudyRecommendationsWidget = lazy(
  () => import('@/components/dashboard-builder/widgets/StudyRecommendationsWidget')
);

// ============================================================================
// Widget Definitions
// ============================================================================

/**
 * Core Metrics Widget Definitions
 */
const METRICS_WIDGETS: WidgetDefinition[] = [
  {
    type: 'stats',
    name: 'Quick Stats',
    description: 'Overview of key metrics (courses, achievements, certificates, streaks)',
    category: 'metrics',
    icon: 'BarChart3',
    defaultSize: { width: 4, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 6, height: 4 },
    defaultConfig: {
      title: 'Quick Stats',
      showTitle: true,
      metrics: ['courses', 'achievements', 'certificates', 'streaks'],
      layout: 'grid',
      showIcons: true,
      showTrends: true,
    },
    component: StatsWidget,
    requiresAuth: true,
  },
  {
    type: 'achievements',
    name: 'Achievements',
    description: 'Display earned achievements and badges',
    category: 'metrics',
    icon: 'Trophy',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 6 },
    defaultConfig: {
      title: 'Achievements',
      showTitle: true,
      limit: 6,
      sortBy: 'recent',
    },
    component: AchievementsWidget,
    requiresAuth: true,
  },
  {
    type: 'certificates',
    name: 'Certificates',
    description: 'View and download earned certificates',
    category: 'metrics',
    icon: 'Award',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 5 },
    defaultConfig: {
      title: 'Certificates',
      showTitle: true,
      limit: 5,
    },
    component: CertificatesWidget,
    requiresAuth: true,
  },
  {
    type: 'streaks',
    name: 'Learning Streaks',
    description: 'Track daily learning streaks and consistency',
    category: 'metrics',
    icon: 'Flame',
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 },
    defaultConfig: {
      title: 'Streaks',
      showTitle: true,
      showCalendar: true,
    },
    component: StreaksWidget,
    requiresAuth: true,
  },
  {
    type: 'enrollment-stats',
    name: 'Enrollment Stats',
    description: 'Statistics about enrolled courses',
    category: 'metrics',
    icon: 'GraduationCap',
    defaultSize: { width: 4, height: 2 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 },
    defaultConfig: {
      title: 'Enrollment Stats',
      showTitle: true,
      showBreakdown: true,
    },
    component: EnrollmentStatsWidget,
    requiresAuth: true,
  },
];

/**
 * Progress Tracking Widget Definitions
 */
const PROGRESS_WIDGETS: WidgetDefinition[] = [
  {
    type: 'course-progress',
    name: 'Course Progress',
    description: 'Track progress across all enrolled courses',
    category: 'progress',
    icon: 'BookOpen',
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 6 },
    defaultConfig: {
      title: 'Course Progress',
      showTitle: true,
      showPercentage: true,
      showDetails: true,
      sortBy: 'progress',
      limit: 5,
    },
    component: CourseProgressWidget,
    requiresAuth: true,
  },
  {
    type: 'learning-path-progress',
    name: 'Learning Path Progress',
    description: 'Track progress along learning paths',
    category: 'progress',
    icon: 'Route',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 5 },
    defaultConfig: {
      title: 'Learning Paths',
      showTitle: true,
      showPercentage: true,
      limit: 3,
    },
    component: LearningPathProgressWidget,
    requiresAuth: true,
  },
  {
    type: 'skill-chart',
    name: 'Skill Development',
    description: 'Visualize skill development over time',
    category: 'progress',
    icon: 'TrendingUp',
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 6 },
    defaultConfig: {
      title: 'Skill Development',
      showTitle: true,
      chartType: 'radar',
      showLegend: true,
    },
    component: SkillChartWidget,
    requiresAuth: true,
  },
  {
    type: 'progress-summary',
    name: 'Progress Summary',
    description: 'Overall progress summary with key milestones',
    category: 'progress',
    icon: 'Target',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 },
    defaultConfig: {
      title: 'Progress Summary',
      showTitle: true,
      showMilestones: true,
    },
    component: ProgressSummaryWidget,
    requiresAuth: true,
  },
];

/**
 * Charts & Analytics Widget Definitions
 */
const CHARTS_WIDGETS: WidgetDefinition[] = [
  {
    type: 'performance-chart',
    name: 'Performance Chart',
    description: 'Visualize performance metrics over time',
    category: 'charts',
    icon: 'LineChart',
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 6 },
    defaultConfig: {
      title: 'Performance',
      showTitle: true,
      chartType: 'line',
      dateRange: 'month',
      showLegend: true,
      showGrid: true,
    },
    component: PerformanceChartWidget,
    requiresAuth: true,
  },
  {
    type: 'time-tracking',
    name: 'Time Tracking',
    description: 'Track time spent learning',
    category: 'charts',
    icon: 'Clock',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 8, height: 5 },
    defaultConfig: {
      title: 'Time Tracking',
      showTitle: true,
      chartType: 'bar',
      dateRange: 'week',
      showGrid: true,
    },
    component: TimeTrackingWidget,
    requiresAuth: true,
  },
  {
    type: 'assessment-scores',
    name: 'Assessment Scores',
    description: 'View recent assessment scores and trends',
    category: 'charts',
    icon: 'ClipboardCheck',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 5 },
    defaultConfig: {
      title: 'Assessment Scores',
      showTitle: true,
      chartType: 'bar',
      limit: 10,
    },
    component: AssessmentScoresWidget,
    requiresAuth: true,
  },
  {
    type: 'learning-velocity',
    name: 'Learning Velocity',
    description: 'Measure learning pace and consistency',
    category: 'charts',
    icon: 'Zap',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 8, height: 5 },
    defaultConfig: {
      title: 'Learning Velocity',
      showTitle: true,
      chartType: 'area',
      dateRange: 'month',
    },
    component: LearningVelocityWidget,
    requiresAuth: true,
  },
];

/**
 * Activity Feed Widget Definitions
 */
const ACTIVITY_WIDGETS: WidgetDefinition[] = [
  {
    type: 'notifications',
    name: 'Notifications',
    description: 'Recent notifications and updates',
    category: 'activity',
    icon: 'Bell',
    defaultSize: { width: 4, height: 4 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 6, height: 6 },
    defaultConfig: {
      title: 'Notifications',
      showTitle: true,
      limit: 10,
      showAvatars: true,
      showTimestamps: true,
      feedType: 'all',
    },
    component: NotificationsWidget,
    requiresAuth: true,
  },
  {
    type: 'assignments',
    name: 'Assignments',
    description: 'Upcoming and pending assignments',
    category: 'activity',
    icon: 'FileText',
    defaultSize: { width: 4, height: 4 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 6, height: 6 },
    defaultConfig: {
      title: 'Assignments',
      showTitle: true,
      limit: 8,
      showTimestamps: true,
      sortBy: 'deadline',
    },
    component: AssignmentsWidget,
    requiresAuth: true,
  },
  {
    type: 'upcoming-events',
    name: 'Upcoming Events',
    description: 'View upcoming events and sessions',
    category: 'activity',
    icon: 'Calendar',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 6, height: 5 },
    defaultConfig: {
      title: 'Upcoming Events',
      showTitle: true,
      limit: 5,
      showTimestamps: true,
    },
    component: UpcomingEventsWidget,
    requiresAuth: true,
  },
  {
    type: 'recent-activity',
    name: 'Recent Activity',
    description: 'Timeline of recent learning activities',
    category: 'activity',
    icon: 'Activity',
    defaultSize: { width: 4, height: 5 },
    minSize: { width: 3, height: 4 },
    maxSize: { width: 6, height: 8 },
    defaultConfig: {
      title: 'Recent Activity',
      showTitle: true,
      limit: 15,
      showAvatars: false,
      showTimestamps: true,
      groupByDate: true,
    },
    component: RecentActivityWidget,
    requiresAuth: true,
  },
  {
    type: 'calendar',
    name: 'Calendar',
    description: 'Mini calendar with events and deadlines',
    category: 'activity',
    icon: 'CalendarDays',
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 4, height: 4 },
    defaultConfig: {
      title: 'Calendar',
      showTitle: true,
      showEvents: true,
      showDeadlines: true,
    },
    component: CalendarWidget,
    requiresAuth: true,
  },
];

/**
 * AI & Insights Widget Definitions
 */
const INSIGHTS_WIDGETS: WidgetDefinition[] = [
  {
    type: 'ai-insights',
    name: 'AI Insights',
    description: 'Personalized AI-powered learning insights',
    category: 'insights',
    icon: 'Sparkles',
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 6 },
    defaultConfig: {
      title: 'AI Insights',
      showTitle: true,
      refreshInterval: 3600, // 1 hour
    },
    component: AIInsightsWidget,
    requiresAuth: true,
  },
  {
    type: 'study-recommendations',
    name: 'Study Recommendations',
    description: 'Personalized study recommendations',
    category: 'insights',
    icon: 'Lightbulb',
    defaultSize: { width: 4, height: 4 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 6, height: 6 },
    defaultConfig: {
      title: 'Recommended For You',
      showTitle: true,
      limit: 5,
    },
    component: StudyRecommendationsWidget,
    requiresAuth: true,
  },
];

/**
 * All widget definitions combined
 */
const ALL_WIDGETS: WidgetDefinition[] = [
  ...METRICS_WIDGETS,
  ...PROGRESS_WIDGETS,
  ...CHARTS_WIDGETS,
  ...ACTIVITY_WIDGETS,
  ...INSIGHTS_WIDGETS,
];

// ============================================================================
// Widget Registry Class
// ============================================================================

export class WidgetRegistry {
  private static widgets = new Map<WidgetType, WidgetDefinition>();

  /**
   * Initialize the registry (lazy initialization)
   */
  private static initialize() {
    if (this.widgets.size === 0) {
      ALL_WIDGETS.forEach(widget => {
        this.widgets.set(widget.type, widget);
      });
    }
  }

  /**
   * Get all widget definitions
   */
  static getAll(): WidgetDefinition[] {
    this.initialize();
    return Array.from(this.widgets.values());
  }

  /**
   * Get widget definition by type
   */
  static get(type: WidgetType): WidgetDefinition | undefined {
    this.initialize();
    return this.widgets.get(type);
  }

  /**
   * Get widgets by category
   */
  static getByCategory(category: WidgetCategory): WidgetDefinition[] {
    this.initialize();
    return Array.from(this.widgets.values()).filter(w => w.category === category);
  }

  /**
   * Get all available categories
   */
  static getCategories(): WidgetCategory[] {
    return ['metrics', 'progress', 'charts', 'activity', 'insights', 'custom'];
  }

  /**
   * Check if widget type exists
   */
  static has(type: WidgetType): boolean {
    this.initialize();
    return this.widgets.has(type);
  }

  /**
   * Get widgets by role requirements
   */
  static getByRole(role: 'student' | 'instructor' | 'admin'): WidgetDefinition[] {
    this.initialize();
    return Array.from(this.widgets.values()).filter(
      w => !w.requiredRoles || w.requiredRoles.includes(role)
    );
  }

  /**
   * Search widgets by name or description
   */
  static search(query: string): WidgetDefinition[] {
    this.initialize();
    const lowerQuery = query.toLowerCase();
    return Array.from(this.widgets.values()).filter(
      w =>
        w.name.toLowerCase().includes(lowerQuery) ||
        w.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get widget count
   */
  static count(): number {
    this.initialize();
    return this.widgets.size;
  }

  /**
   * Get widget types
   */
  static getTypes(): WidgetType[] {
    this.initialize();
    return Array.from(this.widgets.keys());
  }
}

// ============================================================================
// Exports
// ============================================================================

export default WidgetRegistry;

// Export individual widget arrays for testing
export {
  METRICS_WIDGETS,
  PROGRESS_WIDGETS,
  CHARTS_WIDGETS,
  ACTIVITY_WIDGETS,
  INSIGHTS_WIDGETS,
  ALL_WIDGETS,
};
