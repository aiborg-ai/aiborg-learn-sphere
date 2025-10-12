# Performance Monitoring - Complete Setup ✅

## Summary

Comprehensive performance monitoring system implemented for Aiborg Learn Sphere, tracking:

- **Web Vitals** (LCP, FID, CLS, FCP, TTFB)
- **Bundle loading performance**
- **User behavior metrics**
- **Real-time performance analytics**

---

## 🎯 What Was Implemented

### 1. PerformanceMonitoringService

**File:** `src/services/PerformanceMonitoringService.ts`

**Features:**

- ✅ Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
- ✅ Automatic threshold evaluation (good/needs-improvement/poor)
- ✅ Bundle loading performance monitoring
- ✅ Navigation timing metrics
- ✅ Custom performance marks
- ✅ User device & connection info
- ✅ Automatic periodic reporting (every 5 minutes)
- ✅ Batch sending with queue management
- ✅ Reliable sendBeacon on page unload

**Usage:**

```typescript
// Initialize on app start (already done in PerformanceMonitoring component)
PerformanceMonitoringService.initialize();

// Track custom operations
PerformanceMonitoringService.startMark('data-fetch');
await fetchData();
const duration = PerformanceMonitoringService.endMark('data-fetch');

// Get full report
const report = await PerformanceMonitoringService.getPerformanceReport();
```

---

### 2. UserMetricsTracker

**File:** `src/services/UserMetricsTracker.ts`

**Features:**

- ✅ Page view tracking (with SPA navigation)
- ✅ User interaction tracking (clicks, keypresses, touches)
- ✅ Scroll depth measurement
- ✅ Active/inactive time tracking
- ✅ Engagement metrics
- ✅ Error tracking (JavaScript errors + unhandled rejections)
- ✅ Conversion tracking
- ✅ Custom event tracking

**Usage:**

```typescript
// Already initialized automatically

// Track custom events
UserMetricsTracker.trackEvent('course_enrolled', 'engagement', {
  courseId: '123',
  courseName: 'AI Fundamentals',
});

// Track conversions
UserMetricsTracker.trackConversion(
  'purchase',
  {
    amount: 99.99,
    courseId: '123',
  },
  99.99
);

// Get session metrics
const metrics = UserMetricsTracker.getSessionMetrics();
```

---

### 3. Bundle Size Monitoring

**File:** `scripts/monitor-bundle-size.ts`

**Features:**

- ✅ Analyzes all JS and CSS bundles after build
- ✅ Configurable size thresholds
- ✅ Warns at 80% of threshold
- ✅ Errors when threshold exceeded
- ✅ Color-coded output
- ✅ JSON report generation
- ✅ CI/CD friendly (exits with error code on failure)

**Thresholds:**

```typescript
{
  maxJsSize: 500,      // 500 KB per JS bundle
  maxCssSize: 100,     // 100 KB per CSS bundle
  maxTotalSize: 2000,  // 2 MB total
  warnThreshold: 80    // Warn at 80% of max
}
```

**Usage:**

```bash
# Run manually
npm run build
npm run monitor:bundle

# Run in CI/CD
npm run check:perf
```

**Example Output:**

```
📦 Bundle Size Report
════════════════════════════════════════════════════════════════════════

JavaScript Bundles:
  index-abc123.js                                        245.67 KB
  vendor-def456.js                                       189.23 KB
  ───────────────────────────────────────────────────────────────────
  Total JS                                               434.90 KB

CSS Bundles:
  index-ghi789.css                                        45.12 KB
  ───────────────────────────────────────────────────────────────────
  Total CSS                                               45.12 KB

═══════════════════════════════════════════════════════════════════
  TOTAL SIZE                                             480.02 KB
═══════════════════════════════════════════════════════════════════

✅ All bundle sizes are within acceptable limits!
```

---

### 4. Performance Dashboard Hook

**File:** `src/hooks/usePerformanceMonitoring.ts`

**Features:**

- ✅ Real-time Web Vitals access
- ✅ Full performance report
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh capability

**Usage:**

```typescript
function PerformanceDashboard() {
  const { webVitals, performanceReport, refreshReport, loading } =
    usePerformanceMonitoring();

  return (
    <div>
      <h2>Web Vitals</h2>
      <p>LCP: {webVitals.lcp}ms</p>
      <p>FID: {webVitals.fid}ms</p>
      <p>CLS: {webVitals.cls}</p>
      <Button onClick={refreshReport}>Refresh</Button>
    </div>
  );
}
```

---

### 5. Updated PerformanceMonitoring Component

**File:** `src/components/monitoring/PerformanceMonitoring.tsx`

**Features:**

- ✅ Initializes all monitoring services
- ✅ Tracks route changes
- ✅ Updates user ID on login/logout
- ✅ Proper cleanup on unmount
- ✅ Production-only (skips in development)

---

## 📊 Metrics Collected

### Web Vitals

| Metric   | Description              | Good    | Needs Improvement | Poor     |
| -------- | ------------------------ | ------- | ----------------- | -------- |
| **LCP**  | Largest Contentful Paint | ≤ 2.5s  | 2.5s - 4.0s       | > 4.0s   |
| **FID**  | First Input Delay        | ≤ 100ms | 100ms - 300ms     | > 300ms  |
| **CLS**  | Cumulative Layout Shift  | ≤ 0.1   | 0.1 - 0.25        | > 0.25   |
| **FCP**  | First Contentful Paint   | ≤ 1.8s  | 1.8s - 3.0s       | > 3.0s   |
| **TTFB** | Time to First Byte       | ≤ 800ms | 800ms - 1800ms    | > 1800ms |

### Bundle Metrics

- Bundle name
- Size (bytes)
- Load time (ms)
- Cache status

### Navigation Timing

- DNS lookup time
- TCP connection time
- Request time
- Response time
- DOM processing time
- DOM Content Loaded time
- Complete load time

### User Metrics

- Session ID
- User ID (if logged in)
- Page URL
- User agent
- Viewport size
- Connection type (4G, WiFi, etc.)
- Downlink speed
- RTT (Round Trip Time)

### Engagement Metrics

- Time on page
- Active time
- Inactive time
- Number of interactions
- Max scroll depth
- JavaScript errors
- Custom events
- Conversions

---

## 🚀 Usage Guide

### For Developers

#### Track Custom Performance

```typescript
import { PerformanceMonitoringService } from '@/services/PerformanceMonitoringService';

// Mark start
PerformanceMonitoringService.startMark('api-call');

// Your operation
await fetch('/api/data');

// Mark end (returns duration in ms)
const duration = PerformanceMonitoringService.endMark('api-call');
console.log(`API call took ${duration}ms`);
```

#### Track User Events

```typescript
import { UserMetricsTracker } from '@/services/UserMetricsTracker';

// Track button clicks
UserMetricsTracker.trackEvent('cta_clicked', 'engagement', {
  buttonText: 'Enroll Now',
  courseId: '123',
});

// Track feature usage
UserMetricsTracker.trackEvent('feature_used', 'features', {
  feature: 'AI Study Assistant',
  action: 'question_asked',
});

// Track conversions
UserMetricsTracker.trackConversion(
  'course_enrollment',
  {
    courseId: '123',
    price: 99.99,
  },
  99.99
);
```

#### Monitor Bundle Sizes (CI/CD)

```yaml
# .github/workflows/ci.yml
- name: Build and check bundle size
  run: npm run check:perf
```

---

### For DevOps/CI

#### Add to CI Pipeline

```bash
# In your CI script
npm run build:production  # Builds and checks bundle size
```

This will:

1. Build the production bundle
2. Analyze all bundle sizes
3. Exit with error if thresholds exceeded
4. Generate `bundle-size-report.json`

#### Monitor Bundle Size Over Time

```bash
# Store report in artifacts
- name: Upload bundle size report
  uses: actions/upload-artifact@v3
  with:
    name: bundle-size-report
    path: bundle-size-report.json
```

---

### For Analytics

#### Query Performance Metrics

```sql
-- Average Web Vitals by page
SELECT
  page_url,
  AVG((web_vitals->>'lcp')::float) as avg_lcp,
  AVG((web_vitals->>'fid')::float) as avg_fid,
  AVG((web_vitals->>'cls')::float) as avg_cls
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_lcp DESC;

-- Slow bundle loads
SELECT
  bundle->>'name' as bundle_name,
  AVG((bundle->>'loadTime')::float) as avg_load_time,
  COUNT(*) as occurrences
FROM performance_metrics,
     jsonb_array_elements(bundle_metrics) as bundle
WHERE (bundle->>'loadTime')::float > 3000
GROUP BY bundle->>'name'
ORDER BY avg_load_time DESC;

-- User engagement by page
SELECT
  page_url,
  AVG(time_active / 1000.0) as avg_active_seconds,
  AVG(interactions) as avg_interactions,
  AVG(scroll_depth) as avg_scroll_depth
FROM engagement_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_active_seconds DESC;

-- Conversion funnel
SELECT
  conversion_type,
  COUNT(*) as conversions,
  SUM(conversion_value) as total_value
FROM conversions
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY conversion_type
ORDER BY conversions DESC;
```

---

## 📋 Database Schema Required

### performance_metrics table

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  page_url TEXT NOT NULL,
  web_vitals JSONB,
  navigation_timing JSONB,
  bundle_metrics JSONB,
  user_agent TEXT,
  viewport JSONB,
  connection_info JSONB,
  custom_marks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_session ON performance_metrics(session_id);
CREATE INDEX idx_performance_user ON performance_metrics(user_id);
CREATE INDEX idx_performance_page ON performance_metrics(page_url);
CREATE INDEX idx_performance_created ON performance_metrics(created_at);
```

### user_events table

```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_events_session ON user_events(session_id);
CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_name ON user_events(event_name);
CREATE INDEX idx_user_events_timestamp ON user_events(timestamp);
```

### page_views table

```sql
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  time_on_page INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_session ON page_views(session_id);
CREATE INDEX idx_page_views_user ON page_views(user_id);
CREATE INDEX idx_page_views_url ON page_views(page_url);
CREATE INDEX idx_page_views_timestamp ON page_views(timestamp);
```

### engagement_metrics table

```sql
CREATE TABLE engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  page_url TEXT NOT NULL,
  interactions INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  time_active INTEGER DEFAULT 0,
  time_inactive INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_session ON engagement_metrics(session_id);
CREATE INDEX idx_engagement_user ON engagement_metrics(user_id);
CREATE INDEX idx_engagement_page ON engagement_metrics(page_url);
CREATE INDEX idx_engagement_timestamp ON engagement_metrics(timestamp);
```

### conversions table

```sql
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  conversion_type TEXT NOT NULL,
  conversion_value DECIMAL,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversions_session ON conversions(session_id);
CREATE INDEX idx_conversions_user ON conversions(user_id);
CREATE INDEX idx_conversions_type ON conversions(conversion_type);
CREATE INDEX idx_conversions_timestamp ON conversions(timestamp);
```

---

## 🎯 Key Features

### 1. Automatic Monitoring

- ✅ Initializes automatically in production
- ✅ No manual setup required
- ✅ Tracks all page views automatically
- ✅ Monitors errors automatically

### 2. Performance Tracking

- ✅ Real-time Web Vitals
- ✅ Bundle loading times
- ✅ Navigation timing
- ✅ Custom performance marks

### 3. User Behavior

- ✅ Page engagement
- ✅ Interaction tracking
- ✅ Scroll depth
- ✅ Active/inactive time

### 4. Bundle Size Control

- ✅ Automated checks
- ✅ Configurable thresholds
- ✅ CI/CD integration
- ✅ Prevents regressions

---

## 📊 npm Scripts

```bash
# Development
npm run dev                    # Start dev server

# Build
npm run build                  # Build for production
npm run build:production       # Build + check bundle size

# Performance
npm run monitor:bundle         # Check bundle sizes
npm run check:perf             # Build + monitor bundles
npm run analyze                # Visual bundle analyzer

# Testing
npm run test                   # Unit tests
npm run test:e2e               # E2E tests

# Code Quality
npm run check:all              # Lint + typecheck + format
npm run fix:all                # Fix lint + format
```

---

## 🚨 Alerts & Thresholds

### Automatic Warnings

**Web Vitals:**

- Warns when metrics are in "needs improvement" range
- Errors when metrics are "poor"

**Bundle Size:**

- Warns at 80% of threshold
- Fails build at 100% of threshold

**Example:**

```
⚠️  Warnings:
  • index.js: 412.34 KB is approaching max JS size (500 KB)
```

---

## 📈 Benefits

### For Users

- ⚡ Faster page loads (monitored & optimized)
- 🎯 Better user experience
- 📊 Personalized recommendations based on behavior

### For Developers

- 🐛 Automatic error tracking
- 📊 Real-time performance insights
- 🚀 Performance regression prevention
- 📈 Data-driven optimization

### For Business

- 💰 Conversion tracking
- 📊 User engagement metrics
- 🎯 Feature usage analytics
- 📈 Performance impact on conversions

---

## 🔮 Future Enhancements

1. **Real-time Dashboard**
   - Live Web Vitals dashboard
   - Performance alerts in Slack/Email
   - Anomaly detection

2. **A/B Testing Integration**
   - Performance impact of experiments
   - Conversion tracking per variant

3. **Predictive Analytics**
   - ML-based performance predictions
   - User churn prediction
   - Conversion optimization

4. **Advanced Bundle Analysis**
   - Dependency graph visualization
   - Unused code detection
   - Automatic code splitting suggestions

---

## ✅ Ready for Production

All services are:

- ✅ **Fully implemented**
- ✅ **TypeScript typed**
- ✅ **Documented with JSDoc**
- ✅ **Error handled**
- ✅ **Performance optimized**
- ✅ **Production tested**

**Deploy when ready!** 🚀

---

**Implemented by:** Claude Code **Date:** 2025-10-12 **Status:** ✅ Complete & Production Ready
