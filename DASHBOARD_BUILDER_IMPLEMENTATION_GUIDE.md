# Custom Dashboard Builder - Implementation Guide

## 🎉 Phase 1 Complete! (Foundation - 100%)

You've successfully completed the foundation of the Custom Dashboard Builder system!

### ✅ What's Been Built

1. **Database Schema** (`supabase/migrations/20251115100000_custom_dashboard_builder.sql`)
   - Extended `custom_dashboard_views` table with builder fields
   - Created `shared_dashboard_templates` for template gallery
   - Created `dashboard_template_ratings` for ratings/favorites
   - Created `dashboard_share_links` for private sharing
   - Added RLS policies, indexes, triggers, and helper functions
   - Sample template seed data

2. **Type System** (`src/types/dashboard.ts`)
   - 20+ comprehensive TypeScript interfaces
   - Widget types, configurations, and definitions
   - Dashboard layouts and themes
   - Template gallery types
   - Share link types
   - Builder state management types
   - Validation and event types

3. **Widget Registry** (`src/services/dashboard/WidgetRegistry.ts`)
   - Centralized registry for 17 widget types across 5 categories:
     - **Metrics**: Stats, Achievements, Certificates, Streaks, Enrollment
     - **Progress**: Course Progress, Learning Paths, Skills, Summary
     - **Charts**: Performance, Time Tracking, Assessments, Velocity
     - **Activity**: Notifications, Assignments, Events, Recent Activity, Calendar
     - **Insights**: AI Insights, Study Recommendations
   - Lazy-loaded widget components
   - Widget metadata (sizes, icons, defaults)
   - Search and filter capabilities

4. **Service Layer**
   - `DashboardConfigService.ts` - Complete CRUD for dashboard views
   - `TemplateGalleryService.ts` - Template publishing, browsing, rating, cloning
   - `ShareLinkService.ts` - Private sharing with expiration and usage limits

5. **React Hook** (`hooks/useDashboardBuilder.ts`)
   - Complete state management for builder
   - Undo/redo functionality
   - Auto-save support
   - Widget operations (add, remove, update, move, resize)
   - View management (load, save, delete, set default)
   - Mode switching (view, edit, preview)

6. **Example Widget Components**
   - `WidgetWrapper.tsx` - Reusable wrapper with edit controls
   - `StatsWidget.tsx` - Metrics display widget
   - `CourseProgressWidget.tsx` - Progress tracking widget

---

## 📋 Phase 2: Widget Components (Estimated: 2-3 days)

### Status: 3 of 17 widgets complete (18%)

### Remaining Widgets to Build

Follow the pattern established in `StatsWidget.tsx` and `CourseProgressWidget.tsx`:

#### Core Metrics (2 remaining)

- [ ] `AchievementsWidget.tsx` - Display achievements grid
- [ ] `CertificatesWidget.tsx` - List certificates with download
- [ ] `StreaksWidget.tsx` - Streak calendar/tracker
- [ ] `EnrollmentStatsWidget.tsx` - Enrollment breakdown

#### Progress Tracking (3 remaining)

- [ ] `LearningPathProgressWidget.tsx` - Learning path progress
- [ ] `SkillChartWidget.tsx` - Radar chart for skills
- [ ] `ProgressSummaryWidget.tsx` - Overall progress summary

#### Charts & Analytics (4 remaining)

- [ ] `PerformanceChartWidget.tsx` - Line/bar chart for performance
- [ ] `TimeTrackingWidget.tsx` - Time spent learning
- [ ] `AssessmentScoresWidget.tsx` - Assessment scores chart
- [ ] `LearningVelocityWidget.tsx` - Learning pace chart

#### Activity Feeds (5 remaining)

- [ ] `NotificationsWidget.tsx` - Recent notifications
- [ ] `AssignmentsWidget.tsx` - Pending assignments
- [ ] `UpcomingEventsWidget.tsx` - Event list
- [ ] `RecentActivityWidget.tsx` - Activity timeline
- [ ] `CalendarWidget.tsx` - Mini calendar

#### Insights (2 remaining)

- [ ] `AIInsightsWidget.tsx` - AI-powered insights
- [ ] `StudyRecommendationsWidget.tsx` - Personalized recommendations

### Widget Component Pattern

```typescript
// Template for creating new widgets
import { useQuery } from '@tanstack/react-query';
import type { WidgetComponentProps } from '@/types/dashboard';

export function [WidgetName]Widget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as [SpecificConfig];

  const { data, isLoading } = useQuery({
    queryKey: ['widget-data', widget.id],
    queryFn: async () => {
      // Fetch data from Supabase
      return data;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <div>
      {/* Widget content */}
    </div>
  );
}
```

**Key Points:**

1. Use `useQuery` for data fetching
2. Disable queries when `isEditing` is true
3. Support `refreshInterval` from config
4. Show loading skeleton
5. Handle empty states gracefully
6. Make configurable based on widget config

---

## 📋 Phase 3: Drag-Drop Canvas (Estimated: 2-3 days)

### Files to Create

#### 1. `components/dashboard-builder/DashboardCanvas.tsx`

Main drag-drop grid canvas.

**Requirements:**

- Use `@dnd-kit/core` and `@dnd-kit/sortable`
- Grid layout with 12 columns (responsive)
- Support widget dragging from palette
- Support widget reordering
- Collision detection
- Grid snap behavior
- Responsive breakpoints (mobile, tablet, desktop)

**Reference:** `/src/components/studio/shared/DragDropTagManager.tsx` for dnd-kit patterns

**Key Features:**

```typescript
- DndContext with collision detection
- SortableContext for widget grid
- Drag overlay for visual feedback
- Grid cell highlighting
- Auto-scroll during drag
- Touch support for mobile
```

#### 2. `components/dashboard-builder/DraggableWidget.tsx`

Wrapper for widgets in canvas with resize capability.

**Requirements:**

- Use `useSortable` from @dnd-kit/sortable
- Add resize handles (corner and edge)
- Implement resize logic with grid snapping
- Show widget outline during drag
- Handle click vs drag distinction

**Libraries to Consider:**

- `react-resizable-panels` (already in deps) OR
- Custom resize implementation with mouse/touch events

#### 3. `components/dashboard-builder/WidgetPalette.tsx`

Sidebar with available widgets to drag onto canvas.

**Requirements:**

- Group widgets by category (Metrics, Progress, Charts, Activity, Insights)
- Collapsible sections
- Draggable widget previews
- Search/filter functionality
- Widget descriptions and icons

---

## 📋 Phase 4: Builder Interface (Estimated: 2-3 days)

### Files to Create

#### 1. `components/dashboard-builder/DashboardBuilder.tsx`

Main component orchestrating the entire builder.

**Structure:**

```
┌─────────────────────────────────────┐
│  Header (Mode switcher, Save, etc) │
├─────────┬───────────────────────────┤
│ Widget  │                           │
│ Palette │   Dashboard Canvas        │
│         │   (Drag-Drop Grid)        │
│         │                           │
│         │                           │
└─────────┴───────────────────────────┘
```

**Requirements:**

- Use `useDashboardBuilder` hook
- Mode switcher (View/Edit/Preview)
- Save/Save As buttons
- View selector dropdown
- Undo/Redo buttons
- Widget palette toggle
- Canvas with proper grid
- Widget configuration panel (right sidebar)

#### 2. `components/dashboard-builder/WidgetEditor.tsx`

Configuration panel for selected widget.

**Requirements:**

- Form fields based on widget type
- React Hook Form + Zod validation
- Live preview of changes
- Appearance customization:
  - Colors (background, border, text)
  - Spacing and padding
  - Border radius
  - Show/hide title
- Data source options
- Refresh interval setting

#### 3. `components/dashboard-builder/ViewManager.tsx`

Dialog for managing dashboard views.

**Requirements:**

- List all user views
- Create new view
- Rename view
- Duplicate view
- Delete view (with confirmation)
- Set as default
- View sharing options

---

## 📋 Phase 5: Sharing System UI (Estimated: 2 days)

### Files to Create

#### 1. `components/dashboard-builder/ShareDialog.tsx`

Dialog for creating and managing share links.

**Requirements:**

- Generate share link button
- Copy link to clipboard
- QR code generation (optional)
- Expiration date picker
- Max uses input
- Allow editing toggle
- List of existing links
- Deactivate/delete links

#### 2. `components/dashboard-builder/TemplateGallery.tsx`

Public template gallery page.

**Requirements:**

- Grid layout of template cards
- Search bar
- Category filter (Student, Instructor, Professional, etc.)
- Tag filter
- Sort options (Popular, Rating, Recent, Featured)
- Pagination
- Featured templates section
- Trending templates section

#### 3. `components/dashboard-builder/TemplateCard.tsx`

Individual template card component.

**Requirements:**

- Template preview image
- Name and description
- Creator info (name, avatar)
- Rating stars (average)
- Clone count
- View count
- Clone button
- Preview button
- Favorite button

#### 4. `components/dashboard-builder/PublishTemplateDialog.tsx`

Dialog for publishing a dashboard as a template.

**Requirements:**

- Template name input
- Description textarea
- Category select
- Tags input (multi-select)
- Preview image upload
- Publish button

#### 5. `pages/TemplateGallery.tsx`

Standalone page for browsing templates (public access).

---

## 📋 Phase 6: Polish & Optimization (Estimated: 2 days)

### Tasks

1. **Animations**
   - Smooth widget drag/drop with `framer-motion`
   - Fade in/out for modals
   - Skeleton loading animations
   - Hover effects

2. **Accessibility**
   - Keyboard navigation (Tab, Arrow keys)
   - ARIA labels for all interactive elements
   - Focus management in modals
   - Screen reader announcements
   - Keyboard shortcuts (Ctrl+Z for undo, etc.)

3. **Performance**
   - Lazy load widget components
   - Virtualize large widget lists
   - Memoize widget components
   - Debounce auto-save
   - Optimize re-renders with React.memo

4. **Error Handling**
   - Error boundaries per widget
   - Toast notifications for errors
   - Retry mechanisms for failed API calls
   - Graceful degradation

5. **Responsive Design**
   - Mobile: Single column, no drag-drop (static order)
   - Tablet: 6-column grid, touch-friendly drag
   - Desktop: 12-column grid, full features

6. **User Onboarding**
   - First-time user tour (using `react-joyride` or similar)
   - Empty states with helpful CTAs
   - Tooltips for complex features
   - Video tutorials

---

## 📋 Phase 7: Deployment (Estimated: 1 day)

### Checklist

1. **Database Migration**

   ```bash
   # Apply migration via Supabase Dashboard SQL Editor
   # Copy contents of: supabase/migrations/20251115100000_custom_dashboard_builder.sql
   # Run in SQL Editor
   ```

2. **Build & Test**

   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

3. **Git Commit & Push**

   ```bash
   git add .
   git commit -m "Add Custom Dashboard Builder feature"
   git push origin main
   ```

4. **Deploy to Vercel**

   ```bash
   npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
   ```

5. **Post-Deployment Testing**
   - Create a new dashboard view
   - Add widgets to canvas
   - Drag and resize widgets
   - Save and load views
   - Publish a template
   - Browse template gallery
   - Clone a template
   - Create a share link
   - Test mobile responsiveness

6. **Monitor**
   - Check Sentry for errors
   - Monitor Supabase logs
   - Check performance metrics

---

## 🎯 Quick Start Guide for Continuing

### Step 1: Build Remaining Widgets (2-3 days)

Pick a widget category and complete all widgets in that category:

1. **Start with Metrics** (easier):
   - `AchievementsWidget.tsx`
   - `CertificatesWidget.tsx`
   - `StreaksWidget.tsx`
   - `EnrollmentStatsWidget.tsx`

2. **Then Progress Widgets**:
   - Copy pattern from `CourseProgressWidget.tsx`
   - Adapt for learning paths, skills, summary

3. **Charts** (use `recharts`):
   - Reference: `src/components/admin/analytics/` for chart patterns
   - Reuse existing chart components where possible

4. **Activity Feeds**:
   - Use existing components: `NotificationsSection.tsx`, `AssignmentsSection.tsx`
   - Wrap in widget format

5. **Insights**:
   - Reuse `AIInsightsWidget.tsx` from existing dashboard
   - Adapt `StudyRecommendations.tsx`

### Step 2: Build Drag-Drop Canvas (2-3 days)

1. Study `DragDropTagManager.tsx` for dnd-kit patterns
2. Create `DashboardCanvas.tsx` with grid layout
3. Create `DraggableWidget.tsx` with resize
4. Create `WidgetPalette.tsx` sidebar
5. Test drag-drop interactions

### Step 3: Build Main Interface (2-3 days)

1. Create `DashboardBuilder.tsx` main component
2. Integrate `useDashboardBuilder` hook
3. Add `WidgetEditor.tsx` config panel
4. Add `ViewManager.tsx` for view management
5. Add toolbar with mode switcher, save buttons

### Step 4: Build Sharing UI (2 days)

1. `ShareDialog.tsx` for link generation
2. `TemplateGallery.tsx` page
3. `TemplateCard.tsx` component
4. `PublishTemplateDialog.tsx`
5. Integration with services

### Step 5: Polish (2 days)

1. Add animations
2. Improve accessibility
3. Optimize performance
4. Add onboarding
5. Test mobile

### Step 6: Deploy (1 day)

1. Run migration
2. Build and test
3. Deploy to Vercel
4. Monitor and fix issues

---

## 📊 Progress Tracker

| Phase             | Tasks                            | Status        | Days           |
| ----------------- | -------------------------------- | ------------- | -------------- |
| **1. Foundation** | Database, Types, Services, Hooks | ✅ 100%       | 1              |
| **2. Widgets**    | 17 widget components             | 🟡 18% (3/17) | 2-3            |
| **3. Canvas**     | Drag-drop grid with resize       | ⏳ 0%         | 2-3            |
| **4. Builder UI** | Main interface, editor, manager  | ⏳ 0%         | 2-3            |
| **5. Sharing**    | Link dialog, template gallery    | ⏳ 0%         | 2              |
| **6. Polish**     | Animations, A11y, performance    | ⏳ 0%         | 2              |
| **7. Deploy**     | Migration, build, deploy         | ⏳ 0%         | 1              |
| **TOTAL**         |                                  | **8%**        | **11-15 days** |

---

## 🚀 What Makes This Feature Special

1. **Flexible Resizing** - Unlike competitors with fixed widget sizes
2. **Full Sharing** - Both private links AND public gallery
3. **Template Ratings** - Community-driven template quality
4. **17+ Widgets** - Most comprehensive widget library
5. **Responsive** - Works on mobile, tablet, desktop
6. **Role-Agnostic** - All users can customize
7. **Auto-Save** - Never lose work
8. **Undo/Redo** - Mistake-proof editing

---

## 💡 Tips & Best Practices

### Widget Development

- Keep widgets independent and self-contained
- Use React Query for all data fetching
- Handle loading and error states
- Support all config options from WidgetRegistry
- Test with different sizes (small, medium, large)

### Performance

- Lazy load all widget components
- Memoize widgets that don't change often
- Use virtual scrolling for long lists
- Debounce auto-save (2s default)
- Optimize re-renders with React.memo

### Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML (button, nav, main, aside)
- Provide ARIA labels for icons
- Ensure 4.5:1 color contrast ratio
- Test with screen reader (NVDA/JAWS)

### Mobile Considerations

- Disable drag-drop on mobile (too difficult)
- Use fixed single-column layout
- Larger touch targets (min 44x44px)
- Simplified edit mode
- Bottom sheet for widget config

---

## 📚 Reference Files

### Existing Code to Study

- `src/components/studio/shared/DragDropTagManager.tsx` - dnd-kit implementation
- `src/components/dashboard/` - Existing dashboard components to adapt
- `src/components/admin/analytics/` - Chart components
- `src/hooks/useCustomViews.ts` - TanStack Query patterns
- `src/pages/DashboardRefactored.tsx` - Current dashboard structure

### Dependencies Already Installed

- `@dnd-kit/core` ^6.3.1
- `@dnd-kit/sortable` ^10.0.0
- `@dnd-kit/utilities` ^3.2.2
- `recharts` ^2.12.7
- `react-hook-form` ^7.53.0
- `@tanstack/react-query` ^5.59.16

---

## 🐛 Troubleshooting

### Common Issues

**Widgets not appearing in palette**

- Check WidgetRegistry includes the widget
- Verify lazy import path is correct
- Check for TypeScript errors in widget component

**Drag-drop not working**

- Ensure DndContext wraps canvas
- Check collision detection config
- Verify useSortable is called correctly
- Check for CSS conflicts (transform, position)

**Save not persisting**

- Check RLS policies allow user to update views
- Verify config structure matches DashboardConfig type
- Check for validation errors
- Look at Supabase logs for errors

**Overlapping widgets**

- Use collision detection in DashboardConfigService
- Implement auto-layout suggestions
- Add visual feedback for overlaps

---

## 🎓 Learning Resources

- **dnd-kit docs**: https://docs.dndkit.com/
- **Recharts**: https://recharts.org/
- **React Query**: https://tanstack.com/query/latest
- **Supabase**: https://supabase.com/docs

---

## ✅ Next Immediate Steps

1. **Run the database migration** in Supabase SQL Editor
2. **Complete remaining widgets** following the pattern
3. **Build the drag-drop canvas** with DndContext
4. **Create DashboardBuilder main component**
5. **Test end-to-end** functionality
6. **Deploy** to production

---

**Total Estimated Time:** 11-15 days (including buffer) **Current Progress:** ~8% complete
(Foundation done!) **Next Milestone:** Complete all 17 widgets (Target: 3 days)

Good luck! The foundation is solid, and the patterns are established. The remaining work is
primarily repetitive widget creation and UI assembly. 🚀
