# Aiborg Learn Sphere Admin Portal Refactoring Plan

**Inspired by oppspot | Enhanced for Aiborg's unique strengths**

**Date**: 2025-12-31 **Status**: Planning Phase

---

## 🎯 Executive Summary

**Goal**: Transform the admin portal from a 33-tab horizontal interface into a **modern,
hierarchical sidebar-based system** inspired by oppspot while **preserving and enhancing Aiborg's
unique AI-powered features** (RAG, Knowledge Graph, Predictive Analytics).

**Current State**:

- ✅ **129 admin components**, comprehensive feature coverage
- ✅ Unique competitive advantages (RAG, AI Content, Knowledge Graph)
- ❌ **33 horizontal tabs** creating navigation overload
- ❌ No hierarchical organization
- ❌ Limited dashboard customization

**Target State**:

- ✅ Collapsible sidebar with **8 primary categories**
- ✅ Sub-navigation preserves existing tabs where appropriate
- ✅ Customizable widget-based dashboards
- ✅ Advanced filtering and search
- ✅ Real-time updates and collaboration
- ✅ Mobile-optimized admin experience

**Timeline**: 3-4 weeks (phased rollout) **Effort**: High (major architectural refactor) **Impact**:
Very High (significantly improved UX)

---

## 🏗️ Architecture Changes

### Phase 1: Navigation Refactor (Week 1)

#### 1.1 Create Sidebar Navigation Component

**New file**: `src/components/admin/AdminSidebar.tsx`

**Inspired by**: `/home/vik/oppspot/components/admin/admin-sidebar.tsx` (347 lines)

**Features**:

- **Dark theme sidebar** (gray-900 background)
- **Collapsible menu** with expand/collapse icon
- **8 primary categories** with nested children
- **Active state tracking** (blue accent for current route)
- **Badge system** for new features
- **Auto-expand** parent when child route active
- **Footer section** with quick links

**Navigation Structure**:

```typescript
const navigationStructure = [
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
    icon: Sparkles,
    badge: 'AIBORG',
    children: [
      { name: 'RAG Management', href: '/admin/rag', icon: Database },
      { name: 'Knowledge Graph', href: '/admin/knowledge-graph', icon: Network },
      { name: 'AI Content', href: '/admin/ai-content', icon: Brain },
      { name: 'Chatbot Analytics', href: '/admin/chatbot', icon: MessageSquare },
      { name: 'AI Blog Workflow', href: '/admin/ai-blog', icon: FileText, badge: 'NEW' },
    ],
  },
  {
    name: 'Users & Access',
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
    icon: ClipboardList,
    children: [
      { name: 'Question Bank', href: '/admin/questions', icon: HelpCircle },
      { name: 'AI Readiness', href: '/admin/ai-readiness', icon: Cpu },
      { name: 'SME Assessments', href: '/admin/sme', icon: UserCog },
      { name: 'AIBORGLingo', href: '/admin/lingo', icon: Languages },
    ],
  },
  {
    name: 'Operations',
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
    icon: Workflow,
    children: [
      { name: 'API Keys', href: '/admin/api-keys', icon: Key },
      { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
      { name: 'Email Campaigns', href: '/admin/email', icon: Mail },
      { name: 'Surveys', href: '/admin/surveys', icon: FileQuestion },
    ],
  },
];
```

**Pattern** (from oppspot):

```tsx
{
  navItem.children && (
    <Collapsible open={isOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <navItem.icon className="h-5 w-5" />
          <span>{navItem.name}</span>
          {navItem.badge && (
            <Badge variant="secondary" className="text-xs">
              {navItem.badge}
            </Badge>
          )}
        </div>
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {navItem.children.map(child => (
          <Link
            key={child.href}
            href={child.href}
            className={cn(
              'flex items-center gap-3 px-12 py-2 text-sm',
              isActive(child.href) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
            )}
          >
            <child.icon className="h-4 w-4" />
            <span>{child.name}</span>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

#### 1.2 Create Admin Layout Wrapper

**New file**: `src/components/admin/AdminLayout.tsx`

**Features**:

- Two-column layout (sidebar + main content)
- Sidebar toggle button (mobile/desktop)
- Breadcrumb navigation
- Impersonation banner (if applicable)
- Error boundary wrapper
- RBAC gate (AdminGate component)

**Pattern**:

```tsx
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AdminGate>
      <ErrorBoundary>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
          <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with breadcrumbs */}
            <AdminHeader />

            {/* Impersonation Banner */}
            <ImpersonationBanner />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </ErrorBoundary>
    </AdminGate>
  );
}
```

---

#### 1.3 Add Breadcrumb Navigation

**New file**: `src/components/admin/AdminBreadcrumbs.tsx`

**Features**:

- Auto-generate from route path
- Clickable navigation to parent routes
- Current page indicator
- Icon support for each crumb

**Example Output**:

```
Home > AI & Intelligence > RAG Management
```

---

### Phase 2: Dashboard Refactor (Week 2)

#### 2.1 Create Widget-Based Dashboard

**New file**: `src/components/admin/dashboard/DashboardWidgets.tsx`

**Inspired by**: oppspot's card-based metrics system

**Widget Types**:

1. **MetricCard** - Single stat with trend
2. **ChartWidget** - Embedded chart (line, bar, pie)
3. **TableWidget** - Mini table with top N items
4. **ActivityFeed** - Recent activity stream
5. **QuickActions** - Action shortcuts grid
6. **SystemHealth** - Health indicators
7. **AlertList** - Active alerts
8. **RAGStatus** - RAG system status (unique to Aiborg)

**Implementation**:

```tsx
interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'activity' | 'health' | 'rag';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  data: any;
  refreshInterval?: number;
}

export function DashboardGrid({ widgets }: { widgets: Widget[] }) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {widgets.map(widget => (
        <div
          key={widget.id}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg border p-6',
            widgetSizeClasses[widget.size]
          )}
        >
          {renderWidget(widget)}
        </div>
      ))}
    </div>
  );
}
```

---

#### 2.2 Default Dashboard Layout

**File**: `src/pages/admin/index.tsx` (refactored)

**Layout** (inspired by oppspot Dashboard):

**Row 1**: Key Metrics (4 cards)

- Total Users | Active This Week | Total Courses | AI Chat Sessions

**Row 2**: System & RAG Status (2 columns)

- System Performance | RAG Knowledge Base Status

**Row 3**: Charts (2 columns)

- User Growth Chart (6 months) | Revenue Trend (6 months)

**Row 4**: Activity (3 columns)

- Recent Enrollments | Recent Blog Posts | Active Jobs

**Row 5**: Quick Actions Grid

- 8 action shortcuts (Create Course, Batch Blog, Import Template, etc.)

**Pattern** (from oppspot lines 337-398):

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MetricCard
    title="Total Users"
    value={stats.totalUsers}
    delta="+12%"
    trend="up"
    icon={Users}
    color="blue"
  />
  <MetricCard
    title="Active This Week"
    value={stats.activeUsers}
    delta="+8%"
    trend="up"
    icon={TrendingUp}
    color="green"
  />
  {/* ... */}
</div>
```

---

#### 2.3 Customizable Dashboard

**New file**: `src/components/admin/dashboard/DashboardCustomizer.tsx`

**Features**:

- Drag-and-drop widget reordering (react-beautiful-dnd)
- Widget library (add/remove widgets)
- Save custom layouts per admin user
- Reset to default layout
- Export/import dashboard configs

**Storage**: Supabase `admin_dashboard_preferences` table

---

### Phase 3: Enhanced Analytics (Week 2)

#### 3.1 Unified Analytics Hub

**File**: `src/pages/admin/analytics/index.tsx` (new route structure)

**Sub-routes**:

- `/admin/analytics` - Overview dashboard
- `/admin/analytics/users` - User analytics
- `/admin/analytics/courses` - Course analytics
- `/admin/analytics/revenue` - Revenue analytics
- `/admin/analytics/chatbot` - Chatbot analytics
- `/admin/analytics/rag` - RAG analytics (NEW)
- `/admin/analytics/predictive` - Predictive analytics
- `/admin/analytics/live` - Real-time analytics (NEW, inspired by oppspot)

**Navigation**: Sidebar + tabs (hybrid approach)

---

#### 3.2 RAG Analytics Dashboard (NEW)

**File**: `src/pages/admin/analytics/rag.tsx`

**Metrics**:

1. **Performance**
   - Search latency (p50, p95, p99)
   - Embedding generation time
   - Vector search performance
   - Cache hit rate

2. **Quality**
   - Helpful rate (% of helpful responses)
   - Average similarity score
   - Fallback rate (% of queries with no results)
   - Abstention rate (AI says "I don't know")

3. **Coverage**
   - Embeddings by content type (chart)
   - Content freshness (avg days since update)
   - Missing embeddings (count)
   - Index health status

4. **Usage**
   - Queries per day/week/month
   - Top query categories
   - Most retrieved content
   - Search vs. AI chat breakdown

5. **Cost**
   - Embedding generation cost (monthly)
   - GPT-4 chat cost (monthly)
   - Storage cost (vector DB)
   - Projected monthly spend

**Charts**:

- Search latency trend (line chart)
- Helpful rate trend (line chart)
- Queries by category (pie chart)
- Embeddings by type (bar chart)
- Cost breakdown (stacked area chart)

---

#### 3.3 Live Analytics Feed (NEW)

**File**: `src/pages/admin/analytics/live.tsx`

**Inspired by**: oppspot's live monitoring dashboard

**Features**:

- **Real-time activity stream** (WebSocket-powered)
- **Live user count** (currently active)
- **Active sessions** (user → course/page)
- **Recent API calls** (endpoint, latency, status)
- **Error stream** (real-time errors)
- **Background jobs** (running jobs status)

**Implementation**:

```tsx
// Use existing Supabase Realtime
const { data: liveActivity } = useSubscription('realtime:public:analytics', {
  event: '*',
  schema: 'public',
  table: 'analytics_events',
});

// Or WebSocket for custom events
const ws = useWebSocket('wss://api.aiborg.ai/admin/live');
```

---

### Phase 4: Advanced Features (Week 3)

#### 4.1 Advanced Filtering System

**New file**: `src/components/admin/filters/AdvancedFilterBuilder.tsx`

**Inspired by**: Notion's filter builder

**Features**:

- Multi-condition filters (AND/OR logic)
- Field selectors (dropdown)
- Operator selectors (equals, contains, greater than, etc.)
- Value inputs (text, number, date, select)
- Save filter presets
- Filter templates

**Example UI**:

```
[Field: Role] [Operator: equals] [Value: admin]
AND
[Field: Last Active] [Operator: less than] [Value: 30 days ago]
```

**Storage**: Save to `admin_filter_presets` table

---

#### 4.2 Bulk Operations Center

**File**: `src/pages/admin/bulk-operations/index.tsx` (enhanced)

**Current**: BulkOperationsDashboard exists **Enhancement**: Add automation rules

**New Features**:

1. **Scheduled Bulk Actions**
   - Schedule bulk enrollment (e.g., "Enroll all premium users in Course X on Jan 1")
   - Scheduled email campaigns
   - Scheduled role changes

2. **Conditional Bulk Actions**
   - "Enroll users who completed Course A into Course B"
   - "Send email to users inactive for 30 days"
   - "Award achievement to users with 5+ courses completed"

3. **Import/Export**
   - CSV import with validation
   - Bulk data export
   - Template download

---

#### 4.3 Automation Rules Engine (NEW)

**New file**: `src/pages/admin/automation/index.tsx`

**Inspired by**: Zapier/Make.com internal automation

**Features**:

- **Trigger selection** (user enrolled, course completed, etc.)
- **Condition builder** (if user has badge X, if course is Y)
- **Action builder** (send email, assign badge, enroll in course)
- **Rule templates** (pre-built common automations)
- **Activity log** (track automation executions)

**Example Rule**:

```
Trigger: User completes course
Condition: Course = "AI Fundamentals"
Action: Enroll user in "Advanced AI"
```

**Database Tables** (new):

- `automation_rules` (id, name, trigger, conditions, actions, enabled)
- `automation_executions` (id, rule_id, trigger_data, result, timestamp)

---

#### 4.4 User Segmentation Builder (NEW)

**New file**: `src/pages/admin/segments/index.tsx`

**Features**:

- **Segment builder UI** (visual query builder)
- **Segment preview** (real-time user count)
- **Segment export** (CSV, email)
- **Segment-based actions** (send email, bulk enroll)
- **Dynamic segments** (auto-update based on criteria)

**Example Segments**:

- "Power Users" (5+ courses, 80%+ completion rate)
- "At-Risk Learners" (enrolled but <20% progress in 30 days)
- "Premium Upsell Targets" (free users, 3+ courses completed)

**Storage**: `user_segments` table

---

### Phase 5: Content Workflow (Week 3)

#### 5.1 Content Calendar View (NEW)

**New file**: `src/pages/admin/content/calendar.tsx`

**Inspired by**: Editorial calendar tools

**Features**:

- **Visual calendar** (month/week view)
- **Drag-and-drop scheduling**
- **Color-coded content types** (blog, event, course launch)
- **Multi-select for bulk actions**
- **Filter by type, status, author**

**Implementation**: FullCalendar or react-big-calendar

**Data Sources**:

- Blog posts (published_at)
- Events (event_date)
- Course launches (launch_date)
- Announcements (scheduled_at)

---

#### 5.2 Content Approval Workflow (NEW)

**New file**: `src/components/admin/content/ApprovalWorkflow.tsx`

**Features**:

- **Multi-stage workflow** (Draft → Review → Approved → Published)
- **Reviewer assignment**
- **Approval comments**
- **Version history** (track changes)
- **Rollback capability**

**Database Tables** (new):

- `content_workflow_stages` (id, content_type, content_id, stage, reviewer_id)
- `content_versions` (id, content_type, content_id, version, data, created_at)

---

### Phase 6: Collaboration & Real-time (Week 4)

#### 6.1 Admin Activity Log (Enhanced)

**File**: `src/pages/admin/audit/index.tsx` (enhanced)

**Current**: AuditLogViewer exists **Enhancement**: Real-time updates + filtering

**New Features**:

- **Live updates** (WebSocket for new audit entries)
- **Admin attribution** (who did what)
- **Action filtering** (by action type, user, date range)
- **Change diff viewer** (before/after comparison)
- **Export audit log** (compliance reports)

---

#### 6.2 Admin Comments System (NEW)

**New file**: `src/components/admin/comments/AdminComments.tsx`

**Inspired by**: CRM comment threads

**Features**:

- **Comment on any entity** (user, course, enrollment, etc.)
- **@mentions** (tag other admins)
- **Thread view** (reply to comments)
- **Notifications** (bell icon in admin header)
- **Markdown support**

**Database Table** (new):

- `admin_comments` (id, entity_type, entity_id, admin_id, comment, parent_id, created_at)

---

#### 6.3 Real-time Notifications (NEW)

**New file**: `src/components/admin/notifications/NotificationCenter.tsx`

**Features**:

- **Bell icon** in admin header
- **Notification dropdown** (recent 10)
- **Notification types**: System alerts, Admin mentions, Background job completions, User actions
  requiring attention
- **Mark as read/unread**
- **Notification preferences** (email, in-app, push)

**Implementation**: Supabase Realtime + Browser Notifications API

---

## 🎨 UI/UX Enhancements

### Design System Alignment

#### Color Palette

**Current**: Purple/blue gradients **Keep**: Aiborg's signature purple brand **Add**: Status colors
from oppspot

```css
/* Status Colors (from oppspot) */
--status-healthy: #10b981; /* green-500 */
--status-warning: #f59e0b; /* yellow-500 */
--status-error: #ef4444; /* red-500 */
--status-info: #3b82f6; /* blue-500 */

/* Aiborg Brand */
--brand-purple: #9333ea; /* purple-600 */
--brand-blue: #3b82f6; /* blue-500 */
--brand-gradient: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
```

#### Dark Mode

**Current**: Has dark mode support **Enhance**: Consistent dark theme for admin sidebar (like
oppspot)

```css
/* Admin Sidebar Dark Theme */
.admin-sidebar {
  background: #111827; /* gray-900 */
  border-right: 1px solid #1f2937; /* gray-800 */
}

.admin-sidebar-item-active {
  background: #3b82f6; /* blue-600 */
  color: #ffffff;
}

.admin-sidebar-item-hover {
  background: #1f2937; /* gray-800 */
}
```

---

### Component Library Additions

**New shadcn/ui components to add**:

1. **Collapsible** - For sidebar menu
2. **Command** - For command palette (⌘K)
3. **Calendar** - For content calendar
4. **Popover** - For notifications
5. **Separator** - For sidebar sections
6. **Progress** - For progress indicators
7. **Skeleton** - For loading states

---

## 📊 Data & API Changes

### New Database Tables

```sql
-- Admin Dashboard Preferences
CREATE TABLE admin_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  layout JSONB NOT NULL, -- Widget layout config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'user_enrolled', 'course_completed', etc.
  trigger_config JSONB, -- Trigger-specific config
  conditions JSONB, -- Array of condition objects
  actions JSONB, -- Array of action objects
  enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Executions (audit log)
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB, -- Data that triggered the rule
  result TEXT, -- 'success', 'error', 'skipped'
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Segments
CREATE TABLE user_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Segment filter criteria
  is_dynamic BOOLEAN DEFAULT false, -- Auto-update membership
  member_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Comments
CREATE TABLE admin_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'user', 'course', 'enrollment', etc.
  entity_id UUID NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES admin_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Filter Presets
CREATE TABLE admin_filter_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'users', 'courses', 'enrollments'
  filters JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT false, -- Share with other admins
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Workflow Stages
CREATE TABLE content_workflow_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  stage TEXT NOT NULL, -- 'draft', 'review', 'approved', 'published'
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  transitioned_at TIMESTAMPTZ DEFAULT NOW(),
  transitioned_by UUID REFERENCES auth.users(id)
);

-- Content Versions (for rollback)
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  version INT NOT NULL,
  data JSONB NOT NULL, -- Full content snapshot
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Notifications
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'mention', 'system_alert', 'job_completed'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL to navigate to
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG Analytics (granular tracking)
CREATE TABLE rag_analytics_detailed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  query_embedding VECTOR(1536),
  search_latency_ms INT,
  results_count INT,
  avg_similarity FLOAT,
  gpt_latency_ms INT,
  total_tokens INT,
  cost_usd DECIMAL(10, 6),
  helpful BOOLEAN,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### New API Endpoints

**Admin API Routes** (`src/pages/api/admin/`):

```typescript
// Dashboard
GET    /api/admin/dashboard/widgets          // Get user's widget layout
POST   /api/admin/dashboard/widgets          // Save widget layout
GET    /api/admin/dashboard/metrics          // Get dashboard metrics

// Automation
GET    /api/admin/automation/rules           // List automation rules
POST   /api/admin/automation/rules           // Create rule
PUT    /api/admin/automation/rules/:id       // Update rule
DELETE /api/admin/automation/rules/:id       // Delete rule
POST   /api/admin/automation/rules/:id/test  // Test rule execution
GET    /api/admin/automation/executions      // Rule execution history

// Segmentation
GET    /api/admin/segments                   // List segments
POST   /api/admin/segments                   // Create segment
GET    /api/admin/segments/:id/preview       // Preview segment members
POST   /api/admin/segments/:id/export        // Export segment

// Comments
GET    /api/admin/comments/:entityType/:id   // Get comments for entity
POST   /api/admin/comments                   // Create comment
PUT    /api/admin/comments/:id               // Update comment
DELETE /api/admin/comments/:id               // Delete comment

// Filters
GET    /api/admin/filters                    // Get saved filters
POST   /api/admin/filters                    // Save filter preset
DELETE /api/admin/filters/:id                // Delete filter

// Notifications
GET    /api/admin/notifications              // Get notifications
PUT    /api/admin/notifications/:id/read     // Mark as read
POST   /api/admin/notifications/mark-all-read // Mark all read

// Live Analytics
GET    /api/admin/analytics/live             // Real-time metrics (SSE)
```

---

## 🔧 Implementation Steps

### Week 1: Foundation

**Day 1-2**: Navigation Refactor

- [ ] Create `AdminSidebar.tsx` (347 lines, inspired by oppspot)
- [ ] Create `AdminLayout.tsx` wrapper
- [ ] Create `AdminBreadcrumbs.tsx`
- [ ] Add collapsible menu logic
- [ ] Test navigation on all existing routes

**Day 3-4**: Route Restructuring

- [ ] Create new route files for 8 main categories
- [ ] Move existing tab content to new routes
- [ ] Update all internal links
- [ ] Test navigation flow

**Day 5**: Testing & QA

- [ ] Test all routes load correctly
- [ ] Test breadcrumbs work
- [ ] Test sidebar expand/collapse
- [ ] Test active state tracking
- [ ] Mobile responsiveness

---

### Week 2: Dashboard & Analytics

**Day 1-2**: Widget System

- [ ] Create `DashboardWidgets.tsx` component
- [ ] Create 8 widget types (metric, chart, table, activity, etc.)
- [ ] Create widget library dialog
- [ ] Implement drag-and-drop (react-beautiful-dnd)
- [ ] Create default dashboard layout

**Day 3**: Dashboard Persistence

- [ ] Create `admin_dashboard_preferences` table
- [ ] Create API endpoints for save/load
- [ ] Implement dashboard customizer UI
- [ ] Test layout persistence

**Day 4-5**: RAG Analytics Dashboard

- [ ] Create `/admin/analytics/rag` route
- [ ] Create RAG metrics components
- [ ] Create RAG charts (latency, helpful rate, cost)
- [ ] Create `rag_analytics_detailed` table
- [ ] Integrate with existing RAG system

---

### Week 3: Advanced Features

**Day 1-2**: Advanced Filtering

- [ ] Create `AdvancedFilterBuilder.tsx` component
- [ ] Create `admin_filter_presets` table
- [ ] Implement filter logic (AND/OR conditions)
- [ ] Add filter presets UI
- [ ] Integrate with existing tables

**Day 3**: Automation Rules

- [ ] Create `automation_rules` and `automation_executions` tables
- [ ] Create `/admin/automation` route
- [ ] Create rule builder UI (trigger, condition, action)
- [ ] Create automation execution service
- [ ] Add rule templates

**Day 4**: User Segmentation

- [ ] Create `user_segments` table
- [ ] Create `/admin/segments` route
- [ ] Create segment builder UI
- [ ] Implement segment preview
- [ ] Add segment export

**Day 5**: Content Workflow

- [ ] Create `content_workflow_stages` and `content_versions` tables
- [ ] Create workflow stage UI
- [ ] Add version history viewer
- [ ] Implement rollback functionality

---

### Week 4: Collaboration & Polish

**Day 1**: Admin Comments

- [ ] Create `admin_comments` table
- [ ] Create `AdminComments.tsx` component
- [ ] Add comment threads to entities
- [ ] Implement @mentions
- [ ] Add comment notifications

**Day 2**: Notifications

- [ ] Create `admin_notifications` table
- [ ] Create `NotificationCenter.tsx` component
- [ ] Implement bell icon in header
- [ ] Add notification preferences
- [ ] Test real-time updates

**Day 3**: Live Analytics

- [ ] Create `/admin/analytics/live` route
- [ ] Implement WebSocket connection
- [ ] Create real-time activity feed
- [ ] Add live user count
- [ ] Add error stream

**Day 4**: Content Calendar

- [ ] Create `/admin/content/calendar` route
- [ ] Integrate FullCalendar
- [ ] Connect to blog/events data
- [ ] Add drag-and-drop scheduling
- [ ] Test calendar interactions

**Day 5**: QA & Polish

- [ ] Full admin portal testing
- [ ] Performance optimization
- [ ] Mobile responsiveness check
- [ ] Accessibility audit
- [ ] Documentation updates

---

## 🎯 Success Metrics

### Navigation Metrics

- **Tab count**: 33 → 8 primary categories
- **Clicks to reach content**: 3+ → 1-2 clicks
- **Time to find feature**: 30s+ → <10s
- **User feedback**: Improved navigation clarity

### Dashboard Metrics

- **Widget customization adoption**: >50% of admins customize
- **Dashboard load time**: <2s
- **Metric accuracy**: 100% (no stale data)

### Feature Adoption

- **Automation rules created**: >10 rules/month
- **Segments created**: >5 segments/month
- **Filter presets saved**: >20 presets
- **Comments per week**: >50 comments

### Performance

- **Page load time**: <3s for all admin pages
- **Real-time latency**: <500ms for live updates
- **API response time**: <300ms p95

---

## 🚀 Quick Wins (Week 1)

**Priority 1**: Sidebar Navigation

- **Impact**: High (solves main UX issue)
- **Effort**: Medium (2-3 days)
- **Dependencies**: None

**Priority 2**: Breadcrumbs

- **Impact**: Medium (improves context)
- **Effort**: Low (1 day)
- **Dependencies**: Sidebar

**Priority 3**: Dashboard Widgets

- **Impact**: High (modern UX)
- **Effort**: Medium (3-4 days)
- **Dependencies**: None

---

## 📁 File Structure (After Refactor)

```
src/
├── components/admin/
│   ├── AdminSidebar.tsx (NEW) - Sidebar navigation
│   ├── AdminLayout.tsx (NEW) - Layout wrapper
│   ├── AdminBreadcrumbs.tsx (NEW) - Breadcrumb nav
│   ├── AdminHeader.tsx (NEW) - Header with quick actions
│   ├── ImpersonationBanner.tsx (NEW) - User impersonation
│   ├── dashboard/
│   │   ├── DashboardWidgets.tsx (NEW) - Widget system
│   │   ├── MetricCard.tsx (NEW) - Metric widget
│   │   ├── ChartWidget.tsx (NEW) - Chart widget
│   │   ├── TableWidget.tsx (NEW) - Table widget
│   │   ├── ActivityFeed.tsx (NEW) - Activity widget
│   │   ├── RAGStatusWidget.tsx (NEW) - RAG status
│   │   └── DashboardCustomizer.tsx (NEW) - Layout editor
│   ├── filters/
│   │   ├── AdvancedFilterBuilder.tsx (NEW)
│   │   └── FilterPresets.tsx (NEW)
│   ├── automation/
│   │   ├── RuleBuilder.tsx (NEW)
│   │   ├── RuleTemplates.tsx (NEW)
│   │   └── ExecutionLog.tsx (NEW)
│   ├── segments/
│   │   ├── SegmentBuilder.tsx (NEW)
│   │   ├── SegmentPreview.tsx (NEW)
│   │   └── SegmentActions.tsx (NEW)
│   ├── comments/
│   │   ├── AdminComments.tsx (NEW)
│   │   ├── CommentThread.tsx (NEW)
│   │   └── MentionInput.tsx (NEW)
│   ├── notifications/
│   │   ├── NotificationCenter.tsx (NEW)
│   │   └── NotificationBell.tsx (NEW)
│   └── [existing 129 components]
├── pages/admin/
│   ├── index.tsx (refactored) - Dashboard
│   ├── analytics/
│   │   ├── index.tsx - Analytics overview
│   │   ├── rag.tsx (NEW) - RAG analytics
│   │   └── live.tsx (NEW) - Live analytics
│   ├── automation/
│   │   └── index.tsx (NEW) - Automation rules
│   ├── segments/
│   │   └── index.tsx (NEW) - User segments
│   ├── content/
│   │   └── calendar.tsx (NEW) - Content calendar
│   └── [existing 11 specialized pages]
├── lib/stores/
│   ├── admin-dashboard-store.ts (NEW) - Dashboard state
│   ├── admin-sidebar-store.ts (NEW) - Sidebar state
│   └── admin-notifications-store.ts (NEW) - Notifications
└── types/admin.ts (NEW) - Admin type definitions
```

---

## 🎓 Learning from Oppspot

### Architecture Patterns to Adopt

1. **Hierarchical Navigation** ✅
   - Oppspot: 11 sections with nested children
   - Aiborg: 8 sections with nested children

2. **Timeout Protection** ✅
   - Oppspot: 8s query timeout with AbortController
   - Aiborg: Apply to all admin API calls

3. **Silent Refresh** ✅
   - Oppspot: 30s auto-refresh without UI flash
   - Aiborg: Apply to dashboard metrics

4. **Badge System** ✅
   - Oppspot: "NEW" badges for features
   - Aiborg: Use for recent additions

5. **Activity Log** ✅
   - Oppspot: Admin attribution for all actions
   - Aiborg: Enhance existing audit log

6. **Impersonation** ⚠️
   - Oppspot: Full user impersonation
   - Aiborg: Consider for debugging (RBAC permitting)

7. **Live Feed** ✅
   - Oppspot: Real-time activity stream
   - Aiborg: Add WebSocket-based live feed

8. **Database Diagnostics** ✅
   - Oppspot: Search health, index status
   - Aiborg: Add RAG system health check

---

### Features Unique to Aiborg (Keep & Enhance)

1. **RAG System** 🌟
   - No competitor has this
   - Enhance with detailed analytics dashboard

2. **Knowledge Graph** 🌟
   - Unique content relationship mapping
   - Add visualization improvements

3. **AI Content Manager** 🌟
   - Prompt management without code
   - Add version control for prompts

4. **Chatbot Analytics** 🌟
   - Comprehensive AI monitoring
   - Add cost optimization insights

5. **Predictive Analytics** 🌟
   - Churn prediction, funnel analysis
   - Add more ML models

6. **Family Memberships** 🌟
   - B2C family plans
   - Enhance family analytics

---

## 🔒 RBAC Considerations

### Permission Model

**Admin Roles** (hierarchical):

1. **Super Admin** - Full access
2. **Admin** - Most features
3. **Content Manager** - Content only
4. **Support** - Users & enrollments
5. **Analyst** - Analytics only (read-only)

**New Permissions**:

- `admin.dashboard.customize` - Customize dashboard
- `admin.automation.manage` - Create automation rules
- `admin.segments.manage` - Create user segments
- `admin.comments.manage` - Admin comments
- `admin.impersonate` - Impersonate users
- `admin.workflow.approve` - Approve content

**Implementation**: Use existing `useHasPermission()` hook from RBAC system

---

## 📱 Mobile Admin Experience

### Responsive Breakpoints

- **Desktop**: Full sidebar + content (≥1024px)
- **Tablet**: Collapsible sidebar overlay (768px - 1023px)
- **Mobile**: Hamburger menu + bottom nav (≤767px)

### Mobile Optimizations

- Touch-friendly buttons (min 44x44px)
- Swipe gestures for sidebar
- Bottom navigation for key actions
- Simplified table views (cards on mobile)
- Collapsible filters
- Mobile-optimized charts

---

## 💡 Future Enhancements (Post-Launch)

### Phase 2 (Month 2)

- [ ] Mobile admin app (React Native)
- [ ] Push notifications for admins
- [ ] Voice commands (admin assistant)
- [ ] AI-powered insights ("X% of users churning in Y category")
- [ ] Scheduled reports (email delivery)

### Phase 3 (Month 3)

- [ ] Admin marketplace (plugin system for custom tools)
- [ ] Multi-language admin interface
- [ ] Admin onboarding wizard
- [ ] Role templates (predefined permission sets)
- [ ] Collaborative editing (real-time, like oppspot's OT)

---

## 🎉 Summary

**What We're Building**:

- Modern sidebar-based navigation (replacing 33 tabs)
- Widget-based customizable dashboards
- RAG analytics dashboard (unique to Aiborg)
- Advanced filtering and segmentation
- Automation rules engine
- Admin collaboration features

**Inspiration from Oppspot**:

- Navigation architecture (sidebar + breadcrumbs)
- Dashboard card patterns
- Real-time updates (live feed)
- Timeout protection
- Badge system

**Unique to Aiborg** (Competitive Advantages):

- RAG management and analytics
- AI content management
- Knowledge graph admin
- Chatbot analytics
- Predictive analytics

**Timeline**: 4 weeks (phased rollout) **Impact**: Massive UX improvement, sets Aiborg apart from
competitors

---

**Next Steps**: Review plan → Get approval → Start Week 1 implementation 🚀
