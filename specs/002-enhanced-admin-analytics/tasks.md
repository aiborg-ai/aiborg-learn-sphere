# Tasks: Enhanced Admin Analytics Dashboard

**Input**: Design documents from `/specs/002-enhanced-admin-analytics/`
**Prerequisites**: plan.md ✅, spec.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript + React + Supabase
   → Structure: Existing web app (extend current structure)
2. Extract components: 40+ files to create/modify
3. Generate tasks by category ✓
4. Apply task rules ✓
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially ✓
6. Dependencies identified ✓
7. Parallel execution examples created ✓
8. SUCCESS - tasks ready for execution ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Estimated effort: S (small <1hr), M (medium 1-3hr), L (large 3-6hr), XL (very large >6hr)

## Path Conventions
This is an existing web application. Paths are relative to repository root:
- `src/` - React source code
- `supabase/` - Database migrations and functions
- `tests/` - Test files

---

## Phase 3.1: Setup & Prerequisites

- [ ] **T001** [S] Review existing codebase structure for analytics components
  - Files: `src/components/admin/EnhancedAnalyticsDashboard.tsx`, `src/services/analytics/AdminAnalyticsService.ts`
  - Verify: Existing analytics infrastructure, data fetching patterns

- [ ] **T002** [S] Verify dependencies are installed
  - Check: jsPDF 3.0, html2canvas 1.4, date-fns 3.6, recharts 2.12
  - Action: Run `npm install` if needed

- [ ] **T003** [S] Configure TypeScript for new modules
  - Ensure: Strict mode enabled, path aliases configured for new utils/

---

## Phase 3.2: Database Layer (Sequential)

⚠️ **CRITICAL**: Complete in order - each migration builds on previous

- [ ] **T004** [M] Create chatbot analytics database views migration
  - File: `supabase/migrations/YYYYMMDD_chatbot_analytics_views.sql`
  - Create: `chatbot_analytics_daily` view aggregating conversation metrics
  - Indexes: Add on `chatbot_conversations(created_at, user_id, satisfaction_rating)`

- [ ] **T005** [M] Create team analytics enhancements migration
  - File: `supabase/migrations/YYYYMMDD_team_analytics_enhancements.sql`
  - Create: `team_analytics_summary` view with engagement calculations
  - Indexes: Add on `teams(created_at)`, `team_members(team_id, user_id)`

- [ ] **T006** [M] Create custom dashboard views table migration
  - File: `supabase/migrations/YYYYMMDD_custom_dashboard_views.sql`
  - Create table: `custom_dashboard_views` (id, user_id, name, config jsonb, created_at, updated_at)
  - RLS policies: Users can only CRUD their own views
  - Index: `(user_id, created_at DESC)`
  - Constraint: Max 10 views per user

- [ ] **T007** [S] Run migrations and verify
  - Command: `npx supabase db push`
  - Verify: All views and tables created, RLS policies active

---

## Phase 3.3: Utilities & Algorithms (Parallel)

✅ **All tasks in this phase can run in parallel**

- [ ] **T008** [P] [M] Implement linear regression utility
  - File: `src/utils/forecasting/linearRegression.ts`
  - Function: `linearRegression(data: {x: number, y: number}[]): {slope: number, intercept: number, r2: number}`
  - Algorithm: Least squares regression
  - Return: Slope, intercept, R² (confidence measure)

- [ ] **T009** [P] [M] Implement trend analysis utility
  - File: `src/utils/forecasting/trendAnalysis.ts`
  - Functions: `movingAverage(data: number[], window: number)`, `detectTrend(data: number[]): 'up' | 'down' | 'stable'`
  - Use: For smoothing data before forecasting

- [ ] **T010** [P] [M] Implement CSV export utility
  - File: `src/utils/export/csvExport.ts`
  - Function: `exportToCSV(data: any[], filename: string, headers?: string[]): void`
  - Format: RFC 4180 compliant with UTF-8 BOM
  - Handle: Special characters, quotes, line breaks

- [ ] **T011** [P] [L] Extend PDF export utility
  - File: `src/utils/pdfExport.ts` (EXISTING - extend)
  - New function: `exportAnalyticsToPDF(sections: AnalyticsSection[], dateRange: DateRange, filename: string)`
  - Capture: Charts using html2canvas, data tables
  - Include: Branding, timestamp, applied filters
  - Handle: Multi-page layouts, page breaks

---

## Phase 3.4: Services Layer (Parallel After DB)

✅ **All tasks in this phase can run in parallel** (depends on T004-T007)

- [ ] **T012** [P] [L] Extend AdminAnalyticsService with chatbot methods
  - File: `src/services/analytics/AdminAnalyticsService.ts` (EXISTING - extend)
  - Methods:
    - `getChatbotAnalytics(dateRange: DateRange): Promise<ChatbotMetrics>`
    - `getChatbotTrends(dateRange: DateRange): Promise<TrendData[]>`
    - `getTopQueries(dateRange: DateRange, limit: number): Promise<QueryData[]>`
  - Query: `chatbot_analytics_daily` view
  - TypeScript: Add interfaces for return types

- [ ] **T013** [P] [M] Extend AdminAnalyticsService with team methods
  - File: `src/services/analytics/AdminAnalyticsService.ts` (EXISTING - extend)
  - Methods:
    - `getTeamAnalytics(dateRange: DateRange): Promise<TeamMetrics>`
    - `getTeamPerformance(dateRange: DateRange): Promise<TeamPerformanceData[]>`
  - Query: `team_analytics_summary` view
  - TypeScript: Add interfaces

- [ ] **T014** [P] [L] Create ForecastingService
  - File: `src/services/analytics/ForecastingService.ts` (NEW)
  - Methods:
    - `forecastRevenue(historicalData: RevenueData[], days: 30 | 60 | 90): Promise<ForecastResult>`
    - `forecastUserGrowth(historicalData: UserData[], days: 30 | 60 | 90): Promise<ForecastResult>`
    - `forecastEnrollments(historicalData: EnrollmentData[], days: 30 | 60 | 90): Promise<ForecastResult>`
  - Use: linearRegression.ts and trendAnalysis.ts utilities
  - Validation: Require 60+ days of data, return error if insufficient
  - Return: Forecasted values with confidence interval

- [ ] **T015** [P] [M] Create ExportService
  - File: `src/services/analytics/ExportService.ts` (NEW)
  - Methods:
    - `exportToPDF(sections: AnalyticsSection[], config: ExportConfig): Promise<void>`
    - `exportToCSV(data: any[], config: ExportConfig): Promise<void>`
    - `validateExportSize(data: any[]): {valid: boolean, rowCount: number}`
  - Validation: Check 50k row limit, prompt user if exceeded
  - Use: pdfExport.ts and csvExport.ts utilities

- [ ] **T016** [P] [M] Create CustomViewsService
  - File: `src/services/analytics/CustomViewsService.ts` (NEW)
  - Methods:
    - `getViews(userId: string): Promise<CustomView[]>`
    - `createView(userId: string, name: string, config: ViewConfig): Promise<CustomView>`
    - `updateView(viewId: string, name?: string, config?: ViewConfig): Promise<CustomView>`
    - `deleteView(viewId: string): Promise<void>`
  - Validation: Check 10 view limit before create
  - Query: `custom_dashboard_views` table

---

## Phase 3.5: React Contexts (Sequential)

- [ ] **T017** [M] Create DateRangeContext
  - File: `src/contexts/DateRangeContext.tsx` (NEW)
  - State: `{ startDate: Date | null, endDate: Date | null, preset: PresetOption | null }`
  - Functions: `setDateRange`, `setPreset`, `clearDateRange`
  - Persistence: Save to sessionStorage on changes
  - Restore: Load from sessionStorage on mount

---

## Phase 3.6: Custom Hooks (Parallel After Services)

✅ **All tasks in this phase can run in parallel** (depends on T012-T017)

- [ ] **T018** [P] [S] Create useDateRange hook
  - File: `src/hooks/useDateRange.ts` (NEW)
  - Use: DateRangeContext
  - Return: `{ dateRange, setDateRange, setPreset, clearDateRange }`
  - Helper: `getPresetDates(preset: PresetOption): {start: Date, end: Date}`

- [ ] **T019** [P] [M] Create useAutoRefresh hook
  - File: `src/hooks/useAutoRefresh.ts` (NEW)
  - Props: `interval: number, onRefresh: () => Promise<void>`
  - Features:
    - setInterval for refresh
    - Page Visibility API to pause when tab inactive
    - Cleanup on unmount
  - State: `{ isEnabled, lastRefresh, isRefreshing }`

- [ ] **T020** [P] [M] Create useExport hook
  - File: `src/hooks/useExport.ts` (NEW)
  - Use: ExportService
  - Functions:
    - `exportPDF(sections, filename)`
    - `exportCSV(data, filename)`
  - State: `{ isExporting, progress, error }`
  - Handle: Loading states, errors, progress for large datasets

- [ ] **T021** [P] [M] Create usePredictiveAnalytics hook
  - File: `src/hooks/usePredictiveAnalytics.ts` (NEW)
  - Use: ForecastingService
  - Functions:
    - `forecastRevenue(days)`
    - `forecastUserGrowth(days)`
    - `forecastEnrollments(days)`
  - State: `{ data, loading, error, confidence }`
  - Validation: Show warning if <60 days historical data

- [ ] **T022** [P] [M] Create useCustomViews hook
  - File: `src/hooks/useCustomViews.ts` (NEW)
  - Use: CustomViewsService
  - Functions: `{ views, createView, updateView, deleteView, loadView, saveCurrentView }`
  - State: `{ views, currentView, loading, error }`
  - Validation: Check 10 view limit, handle duplicates

- [ ] **T023** [P] [M] Extend useChatbotAnalytics hook
  - File: `src/hooks/admin/useChatbotAnalytics.ts` (EXISTING - extend if needed)
  - Or integrate into new hook if doesn't exist
  - Use: AdminAnalyticsService chatbot methods
  - Props: `dateRange: DateRange`

- [ ] **T024** [P] [M] Extend useTeamAnalytics hook
  - File: `src/hooks/useTeamAnalytics.ts` (may exist)
  - Use: AdminAnalyticsService team methods
  - Props: `dateRange: DateRange`

---

## Phase 3.7: UI Components - Filters & Controls (Parallel)

✅ **All tasks in this phase can run in parallel** (depends on T018-T022)

- [ ] **T025** [P] [L] Create DateRangeFilter component
  - File: `src/components/admin/DateRangeFilter.tsx` (NEW)
  - Features:
    - Preset buttons: Today, Last 7/30/90 Days, This Quarter, etc.
    - Custom date picker (using react-day-picker)
    - Validation: End date >= start date
    - Apply button with loading state
  - Use: useDateRange hook
  - Styling: shadcn/ui components, responsive

- [ ] **T026** [P] [M] Create AutoRefreshControl component
  - File: `src/components/admin/AutoRefreshControl.tsx` (NEW)
  - Features:
    - Toggle switch to enable/disable
    - Interval selector: 1, 5, 15, 30 minutes
    - Last refresh timestamp display
    - Loading indicator during refresh
  - Use: useAutoRefresh hook
  - Styling: shadcn/ui Switch + Select

- [ ] **T027** [P] [L] Create CustomViewSelector component
  - File: `src/components/admin/CustomViewSelector.tsx` (NEW)
  - Features:
    - Dropdown to select saved views
    - "Save Current View" button with name input dialog
    - Rename/Delete actions for each view
    - "Default View" always available
  - Use: useCustomViews hook
  - Validation: Max 10 views, duplicate names
  - Styling: shadcn/ui Select + Dialog

- [ ] **T028** [P] [M] Create ExportButton component
  - File: `src/components/admin/ExportButton.tsx` (NEW)
  - Features:
    - Dropdown: "Export to PDF" / "Export to CSV"
    - Progress indicator for large exports
    - Error handling with toast notifications
  - Props: `section: string, data: any[]`
  - Use: useExport hook
  - Styling: shadcn/ui DropdownMenu + Button

---

## Phase 3.8: Analytics Components - New Tabs (Parallel)

✅ **All tasks in this phase can run in parallel** (depends on T012-T014, T023-T024)

- [ ] **T029** [P] [XL] Create ChatbotAnalyticsTab component
  - File: `src/components/admin/analytics/ChatbotAnalyticsTab.tsx` (NEW)
  - Sections:
    - Metrics cards: Total conversations, satisfaction, resolution rate
    - Conversation trend chart (line chart - time series)
    - Query distribution chart (bar chart - top 10 queries)
    - Export button
  - Use: useChatbotAnalytics hook, useDateRange hook
  - Styling: Match existing analytics tab style
  - Charts: Recharts (LineChart, BarChart)

- [ ] **T030** [P] [XL] Create TeamAnalyticsTab component
  - File: `src/components/admin/analytics/TeamAnalyticsTab.tsx` (NEW)
  - Sections:
    - Metrics cards: Total teams, enrollment count, completion rate
    - Team performance chart (bar chart - team comparison)
    - Engagement trend chart (line chart - over time)
    - Export button
  - Use: useTeamAnalytics hook, useDateRange hook
  - Styling: Match existing tabs
  - Charts: Recharts

- [ ] **T031** [P] [XL] Create PredictiveAnalyticsSection component
  - File: `src/components/admin/analytics/PredictiveAnalyticsSection.tsx` (NEW)
  - Sections:
    - Revenue forecast chart (30/60/90 day tabs)
    - User growth forecast chart
    - Enrollment forecast chart
    - Confidence indicator for each forecast
    - Warning if insufficient historical data
  - Use: usePredictiveAnalytics hook
  - Charts: Recharts ComposedChart (line for historical, dashed for forecast)
  - Visual: Different colors/styles for actual vs predicted

---

## Phase 3.9: Integration - Dashboard Enhancement (Sequential)

⚠️ **CRITICAL**: Complete in order - each builds on previous

- [ ] **T032** [L] Extend useAnalyticsData hook
  - File: `src/components/admin/analytics/useAnalyticsData.ts` (EXISTING - extend)
  - Add: Date range parameter to all data fetching methods
  - Add: Chatbot and team analytics data
  - Add: Forecasting data
  - Update: Parallel fetching with Promise.all()
  - Optimize: Respect 3-second load target

- [ ] **T033** [XL] Integrate all new components into EnhancedAnalyticsDashboard
  - File: `src/components/admin/EnhancedAnalyticsDashboard.tsx` (EXISTING - major update)
  - Header additions:
    - Add DateRangeFilter (left side)
    - Add AutoRefreshControl (top right)
    - Add CustomViewSelector (top right)
  - New tabs:
    - Add "Chatbot Analytics" tab with ChatbotAnalyticsTab
    - Add "Team Analytics" tab with TeamAnalyticsTab
  - Overview tab:
    - Add PredictiveAnalyticsSection below existing content
  - All tabs:
    - Add ExportButton to each tab
  - Wire up:
    - DateRangeContext provider wrapping entire dashboard
    - Auto-refresh triggering data refetch
    - Custom views loading/saving full dashboard state
  - Performance:
    - Lazy load tab contents (React.lazy)
    - Memoize expensive calculations
    - Add loading skeletons

---

## Phase 3.10: Testing (Parallel After Implementation)

✅ **All tasks in this phase can run in parallel** (depends on implementation)

- [ ] **T034** [P] [M] Unit test ForecastingService
  - File: `src/services/analytics/__tests__/ForecastingService.test.ts` (NEW)
  - Tests:
    - Revenue forecasting with valid data
    - User growth forecasting
    - Enrollment forecasting
    - Insufficient data error handling
    - Confidence interval calculations

- [ ] **T035** [P] [M] Unit test ExportService
  - File: `src/services/analytics/__tests__/ExportService.test.ts` (NEW)
  - Tests:
    - PDF export generation
    - CSV export generation
    - 50k row limit validation
    - File naming

- [ ] **T036** [P] [M] Unit test forecasting utilities
  - File: `src/utils/forecasting/__tests__/linearRegression.test.ts` (NEW)
  - File: `src/utils/forecasting/__tests__/trendAnalysis.test.ts` (NEW)
  - Tests:
    - Linear regression calculations
    - Moving average calculations
    - Trend detection accuracy

- [ ] **T037** [P] [M] Component test DateRangeFilter
  - File: `src/components/admin/__tests__/DateRangeFilter.test.tsx` (NEW)
  - Tests:
    - Preset selection
    - Custom date selection
    - Validation (end >= start)
    - Apply button interaction

- [ ] **T038** [P] [M] Component test AutoRefreshControl
  - File: `src/components/admin/__tests__/AutoRefreshControl.test.tsx` (NEW)
  - Tests:
    - Enable/disable toggle
    - Interval selection
    - Refresh triggering
    - Pause on visibility change

- [ ] **T039** [P] [M] Component test CustomViewSelector
  - File: `src/components/admin/__tests__/CustomViewSelector.test.tsx` (NEW)
  - Tests:
    - View selection
    - Save current view
    - Rename view
    - Delete view
    - 10 view limit enforcement

- [ ] **T040** [P] [L] Integration test custom views CRUD
  - File: `tests/integration/analytics/custom-views.test.ts` (NEW)
  - Tests:
    - Create view end-to-end
    - Load view restores state
    - Update view
    - Delete view
    - RLS policies enforce user isolation

- [ ] **T041** [P] [L] Integration test export functionality
  - File: `tests/integration/analytics/export.test.ts` (NEW)
  - Tests:
    - PDF export completes successfully
    - CSV export with large dataset
    - Export with applied filters
    - Row limit validation

- [ ] **T042** [P] [XL] E2E test complete analytics workflow
  - File: `tests/e2e/admin-analytics-enhanced.spec.ts` (NEW)
  - Scenarios:
    - Admin navigates to analytics, applies date filter, views chatbot analytics, exports to PDF
    - Admin creates custom view, switches views, loads saved view
    - Admin enables auto-refresh, waits for refresh, verifies updated data
    - Admin views predictive analytics, checks forecast charts
    - Admin exports team analytics to CSV

---

## Phase 3.11: Performance Optimization (Sequential After Integration)

⚠️ **Complete in order - measure before optimizing**

- [ ] **T043** [M] Add database indexes for performance
  - Action: Verify indexes from T004-T006 are optimal
  - Analyze: Query plans for slow queries
  - Add: Additional indexes if needed
  - Target: All analytics queries <500ms

- [ ] **T044** [M] Implement query memoization
  - Files: All service methods in AdminAnalyticsService
  - Use: React Query caching (5min stale, 10min cache)
  - Optimize: Parallel data fetching with Promise.all()

- [ ] **T045** [M] Optimize chart rendering
  - Files: All chart components (ChatbotAnalyticsTab, TeamAnalyticsTab, PredictiveAnalyticsSection)
  - Use: React.memo for chart components
  - Lazy: Load Recharts components only when needed
  - Debounce: Data updates to prevent excessive re-renders

- [ ] **T046** [M] Add loading states and skeletons
  - Files: EnhancedAnalyticsDashboard, all tab components
  - Add: Loading skeletons for charts and cards (shadcn/ui Skeleton)
  - Add: Progressive loading (show cached data while fetching new)

- [ ] **T047** [L] Performance test against 3-second target
  - Tool: Chrome DevTools Performance tab, Lighthouse
  - Measure: Dashboard initial load time
  - Test: With real data volumes (thousands of records)
  - Target: <3 seconds from navigation to interactive
  - Document: Performance metrics and optimizations applied

---

## Phase 3.12: Polish & Accessibility (Parallel)

✅ **All tasks in this phase can run in parallel** (depends on all features complete)

- [ ] **T048** [P] [M] Add error boundaries
  - Files: EnhancedAnalyticsDashboard, each major tab component
  - Use: React error boundaries with fallback UI
  - Log: Errors to monitoring service
  - UX: Graceful degradation per section

- [ ] **T049** [P] [S] Add empty states
  - Files: All chart and data components
  - Show: Helpful message when no data available
  - Suggest: Actions to take (adjust date range, wait for data)

- [ ] **T050** [P] [M] Add tooltips and help text
  - Files: All new components
  - Add: Tooltips for icons and actions
  - Add: Help text explaining metrics
  - Add: Info icons with explanations

- [ ] **T051** [P] [L] Accessibility audit and fixes
  - Test: Keyboard navigation through all controls
  - Test: Screen reader compatibility (ARIA labels)
  - Test: Color contrast (WCAG AA standard)
  - Fix: Any accessibility issues found
  - Test: With axe DevTools

- [ ] **T052** [P] [M] Browser compatibility testing
  - Test: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - Verify: All features work in each browser
  - Verify: Charts render correctly
  - Verify: Export functionality works
  - Fix: Any browser-specific issues

---

## Dependencies Graph

```
Setup (T001-T003)
  ↓
Database (T004-T007) [Sequential]
  ↓
├─→ Utilities (T008-T011) [Parallel]
├─→ Services (T012-T016) [Parallel]
├─→ Context (T017) [Sequential]
└─→ Hooks (T018-T024) [Parallel, depends on Services + Context]
      ↓
    ├─→ Filters/Controls Components (T025-T028) [Parallel]
    └─→ Analytics Components (T029-T031) [Parallel]
          ↓
        Integration (T032-T033) [Sequential]
          ↓
        Testing (T034-T042) [Parallel]
          ↓
        Performance (T043-T047) [Sequential]
          ↓
        Polish (T048-T052) [Parallel]
```

## Parallel Execution Examples

### Phase 3.3: Utilities (All Parallel)
```bash
# Run all utility tasks simultaneously
Task: "Implement linear regression in src/utils/forecasting/linearRegression.ts"
Task: "Implement trend analysis in src/utils/forecasting/trendAnalysis.ts"
Task: "Implement CSV export in src/utils/export/csvExport.ts"
Task: "Extend PDF export in src/utils/pdfExport.ts"
```

### Phase 3.4: Services (All Parallel)
```bash
# Run all service tasks simultaneously
Task: "Extend AdminAnalyticsService with chatbot methods"
Task: "Extend AdminAnalyticsService with team methods"
Task: "Create ForecastingService in src/services/analytics/ForecastingService.ts"
Task: "Create ExportService in src/services/analytics/ExportService.ts"
Task: "Create CustomViewsService in src/services/analytics/CustomViewsService.ts"
```

### Phase 3.10: Testing (All Parallel)
```bash
# Run all test tasks simultaneously
Task: "Unit test ForecastingService"
Task: "Unit test ExportService"
Task: "Component test DateRangeFilter"
Task: "Component test AutoRefreshControl"
Task: "Integration test custom views"
Task: "E2E test analytics workflow"
```

## Validation Checklist

- [x] All database migrations have sequential tasks (T004-T007)
- [x] All services have implementation tasks (T012-T016)
- [x] All utilities have implementation tasks (T008-T011)
- [x] All hooks have implementation tasks (T018-T024)
- [x] All major components have implementation tasks (T025-T031)
- [x] Integration tasks are sequential (T032-T033)
- [x] All features have tests (T034-T042)
- [x] Performance optimization is sequential and after integration (T043-T047)
- [x] Polish tasks are parallel and at the end (T048-T052)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] Dependencies clearly identified

## Effort Estimate

**Total Tasks**: 52
- **Small (S)**: 6 tasks × 1hr = 6 hours
- **Medium (M)**: 26 tasks × 2hr = 52 hours
- **Large (L)**: 14 tasks × 4hr = 56 hours
- **XLarge (XL)**: 6 tasks × 6hr = 36 hours

**Total Estimated Effort**: ~150 hours

**With Parallelization**: ~60-80 hours (multiple tasks running simultaneously)

**Recommended Timeline**: 2-3 weeks with 2-3 developers working in parallel

## Notes

- Tasks marked [P] can run in parallel with other [P] tasks in the same phase
- Database migrations (T004-T007) must run sequentially to avoid conflicts
- Integration tasks (T032-T033) must be sequential as they modify the same main component
- Performance optimization (T043-T047) should be done after all features work
- Commit after completing each task
- Run tests frequently to catch issues early
- Monitor performance continuously during development

## Success Criteria

✅ All 52 tasks completed
✅ All tests passing (unit, integration, E2E)
✅ Dashboard loads in <3 seconds
✅ All 6 major features working:
  1. Chatbot analytics tab displaying metrics
  2. Team analytics tab displaying metrics
  3. PDF and CSV export functional
  4. Date range filtering working globally
  5. Auto-refresh with configurable intervals
  6. Predictive analytics showing forecasts
  7. Custom views saving and loading state
✅ Accessibility audit passed
✅ Browser compatibility verified
✅ No TypeScript errors
✅ Performance targets met
