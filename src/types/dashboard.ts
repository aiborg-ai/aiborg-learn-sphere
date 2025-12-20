/**
 * Custom Dashboard Builder - Type Definitions
 *
 * Comprehensive type system for:
 * - Widget system (definitions, configurations, instances)
 * - Dashboard layouts
 * - Template gallery
 * - Sharing system
 */

// ============================================================================
// Widget System Types
// ============================================================================

/**
 * Available widget types
 */
export type WidgetType =
  // Core Metrics
  | 'stats'
  | 'achievements'
  | 'certificates'
  | 'streaks'
  | 'enrollment-stats'
  // Progress Tracking
  | 'course-progress'
  | 'learning-path-progress'
  | 'skill-chart'
  | 'progress-summary'
  // Charts & Analytics
  | 'performance-chart'
  | 'time-tracking'
  | 'assessment-scores'
  | 'learning-velocity'
  // Activity Feeds
  | 'notifications'
  | 'assignments'
  | 'upcoming-events'
  | 'recent-activity'
  | 'calendar'
  // AI & Insights
  | 'ai-insights'
  | 'study-recommendations'
  // Custom
  | 'custom-text'
  | 'custom-embed';

/**
 * Widget category for organization
 */
export type WidgetCategory = 'metrics' | 'progress' | 'charts' | 'activity' | 'insights' | 'custom';

/**
 * Widget size constraints
 */
export interface WidgetSize {
  width: number; // Grid units (1-12)
  height: number; // Grid units (1-8)
}

/**
 * Widget position in grid
 */
export interface WidgetPosition {
  row: number; // Starting row (0-indexed)
  col: number; // Starting column (0-indexed)
}

/**
 * Widget appearance settings
 */
export interface WidgetAppearance {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  showHeader?: boolean;
  showBorder?: boolean;
  headerColor?: string;
  textColor?: string;
}

/**
 * Base widget configuration (type-specific settings)
 */
export interface BaseWidgetConfig {
  // Data settings
  dataSource?: string;
  refreshInterval?: number; // seconds, 0 = manual only
  dateRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';

  // Display settings
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;

  // Appearance
  appearance?: WidgetAppearance;

  // Filters
  filters?: Record<string, unknown>;
}

/**
 * Stats widget specific configuration
 */
export interface StatsWidgetConfig extends BaseWidgetConfig {
  metrics: Array<'courses' | 'achievements' | 'certificates' | 'streaks'>;
  layout: 'grid' | 'horizontal' | 'vertical';
  showIcons: boolean;
  showTrends: boolean;
}

/**
 * Chart widget specific configuration
 */
export interface ChartWidgetConfig extends BaseWidgetConfig {
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  dataKey: string;
  xAxis?: string;
  yAxis?: string;
  showLegend: boolean;
  showGrid: boolean;
  colors?: string[];
}

/**
 * Progress widget specific configuration
 */
export interface ProgressWidgetConfig extends BaseWidgetConfig {
  showPercentage: boolean;
  showDetails: boolean;
  sortBy: 'progress' | 'name' | 'recent';
  limit?: number;
}

/**
 * Activity widget specific configuration
 */
export interface ActivityWidgetConfig extends BaseWidgetConfig {
  feedType: 'all' | 'assignments' | 'notifications' | 'events';
  limit: number;
  showAvatars: boolean;
  showTimestamps: boolean;
  groupByDate: boolean;
}

/**
 * Union type of all widget configurations
 */
export type WidgetConfig =
  | StatsWidgetConfig
  | ChartWidgetConfig
  | ProgressWidgetConfig
  | ActivityWidgetConfig
  | BaseWidgetConfig;

/**
 * Widget instance (placed on a dashboard)
 */
export interface DashboardWidget {
  id: string; // Unique widget instance ID
  type: WidgetType;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  locked?: boolean; // Prevent moving/resizing
  hidden?: boolean; // Temporarily hidden
}

/**
 * Widget definition (in registry)
 */
export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string; // Lucide icon name
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  defaultConfig: WidgetConfig;
  configSchema?: unknown; // Zod schema for validation
  component: React.ComponentType<WidgetComponentProps>;
  previewComponent?: React.ComponentType<WidgetPreviewProps>;
  requiresAuth?: boolean;
  requiredRoles?: Array<'student' | 'instructor' | 'admin'>;
}

/**
 * Props passed to widget components
 */
export interface WidgetComponentProps {
  widget: DashboardWidget;
  isEditing?: boolean;
  onConfigChange?: (config: WidgetConfig) => void;
  onRemove?: () => void;
}

/**
 * Props for widget preview (in palette)
 */
export interface WidgetPreviewProps {
  definition: WidgetDefinition;
}

// ============================================================================
// Dashboard Layout Types
// ============================================================================

/**
 * Layout algorithm
 */
export type LayoutType = 'grid' | 'masonry';

/**
 * Responsive breakpoint settings
 */
export interface ResponsiveSettings {
  mobile: {
    columns: number;
  };
  tablet: {
    columns: number;
  };
  desktop: {
    columns: number;
  };
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  backgroundColor?: string;
  cardBackground?: string;
  textColor?: string;
  accentColor?: string;
  spacing?: 'compact' | 'normal' | 'comfortable';
  cardStyle?: 'elevated' | 'bordered' | 'flat';
}

/**
 * Complete dashboard configuration
 */
export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: LayoutType;
  responsiveSettings: ResponsiveSettings;
  theme?: ThemeConfig;
  metadata?: {
    lastModified?: string;
    version?: number;
    description?: string;
  };
}

/**
 * Dashboard view (saved configuration)
 */
export interface DashboardView {
  id: string;
  user_id: string;
  name: string;
  config: DashboardConfig;
  is_default: boolean;
  is_public: boolean;
  layout_type: LayoutType;
  theme_config: ThemeConfig;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Template Gallery Types
// ============================================================================

/**
 * Template category
 */
export type TemplateCategory =
  | 'student'
  | 'instructor'
  | 'professional'
  | 'analytics'
  | 'productivity'
  | 'general';

/**
 * Dashboard template (for gallery)
 */
export interface DashboardTemplate {
  id: string;
  dashboard_view_id: string;
  creator_id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  tags: string[];
  preview_image_url: string | null;
  view_count: number;
  clone_count: number;
  average_rating: number;
  total_ratings: number;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;

  // Joined data
  creator_name?: string;
  creator_avatar?: string;
  dashboard_config?: DashboardConfig;
  user_rating?: number;
  is_favorited?: boolean;
}

/**
 * Template rating
 */
export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number; // 1-5
  review: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Template filter options
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  tags?: string[];
  search?: string;
  minRating?: number;
  sortBy?: 'popular' | 'rating' | 'recent' | 'featured';
  showOnlyFavorites?: boolean;
}

/**
 * Template gallery pagination
 */
export interface TemplatePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// Sharing Types
// ============================================================================

/**
 * Share link for private sharing
 */
export interface DashboardShareLink {
  id: string;
  dashboard_view_id: string;
  creator_id: string;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  allow_editing: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Share link creation options
 */
export interface ShareLinkOptions {
  expiresIn?: number; // days
  maxUses?: number;
  allowEditing?: boolean;
}

/**
 * Share link info (public)
 */
export interface ShareLinkInfo {
  isValid: boolean;
  isExpired: boolean;
  isMaxedOut: boolean;
  dashboardConfig?: DashboardConfig;
  creatorName?: string;
  viewName?: string;
  allowEditing: boolean;
}

// ============================================================================
// Builder State Types
// ============================================================================

/**
 * Dashboard builder mode
 */
export type BuilderMode = 'view' | 'edit' | 'preview';

/**
 * Drag state
 */
export interface DragState {
  isDragging: boolean;
  draggedWidget: DashboardWidget | null;
  draggedDefinition: WidgetDefinition | null;
  dropPosition: WidgetPosition | null;
}

/**
 * Resize state
 */
export interface ResizeState {
  isResizing: boolean;
  resizingWidgetId: string | null;
  initialSize: WidgetSize | null;
  currentSize: WidgetSize | null;
}

/**
 * Selection state
 */
export interface SelectionState {
  selectedWidgetId: string | null;
  selectedWidget: DashboardWidget | null;
}

/**
 * Undo/Redo history
 */
export interface HistoryState {
  past: DashboardConfig[];
  present: DashboardConfig;
  future: DashboardConfig[];
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Complete builder state
 */
export interface DashboardBuilderState {
  mode: BuilderMode;
  currentView: DashboardView | null;
  config: DashboardConfig;
  drag: DragState;
  resize: ResizeState;
  selection: SelectionState;
  history: HistoryState;
  isDirty: boolean;
  isSaving: boolean;
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Generic API response
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Template gallery response
 */
export interface TemplateGalleryResponse {
  templates: DashboardTemplate[];
  pagination: TemplatePagination;
  filters: TemplateFilters;
}

/**
 * Clone template result
 */
export interface CloneTemplateResult {
  viewId: string;
  view: DashboardView;
  success: boolean;
  message?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Widget validation result
 */
export interface WidgetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Layout validation result
 */
export interface LayoutValidationResult {
  isValid: boolean;
  hasOverlaps: boolean;
  hasOutOfBounds: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Widget event types
 */
export type WidgetEventType =
  | 'widget-added'
  | 'widget-removed'
  | 'widget-moved'
  | 'widget-resized'
  | 'widget-configured'
  | 'widget-locked'
  | 'widget-unlocked';

/**
 * Widget event
 */
export interface WidgetEvent {
  type: WidgetEventType;
  widgetId: string;
  widget: DashboardWidget;
  timestamp: number;
}

/**
 * Dashboard event types
 */
export type DashboardEventType =
  | 'view-loaded'
  | 'view-saved'
  | 'view-deleted'
  | 'layout-changed'
  | 'theme-changed';

/**
 * Dashboard event
 */
export interface DashboardEvent {
  type: DashboardEventType;
  viewId?: string;
  timestamp: number;
  data?: unknown;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Grid cell
 */
export interface GridCell {
  row: number;
  col: number;
  occupied: boolean;
  widgetId?: string;
}

/**
 * Grid bounds
 */
export interface GridBounds {
  rows: number;
  cols: number;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  hasCollision: boolean;
  collidingWidgets: DashboardWidget[];
}

/**
 * Auto-layout suggestion
 */
export interface LayoutSuggestion {
  position: WidgetPosition;
  size: WidgetSize;
  score: number; // 0-1, higher is better
}
