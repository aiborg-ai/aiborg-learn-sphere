# Bundle Size Monitoring

Comprehensive bundle size monitoring and optimization guide for the aiborg-learn-sphere project.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Monitoring System](#monitoring-system)
- [CI/CD Integration](#cicd-integration)
- [Understanding Reports](#understanding-reports)
- [Optimization Guidelines](#optimization-guidelines)
- [Thresholds](#thresholds)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses a comprehensive bundle size monitoring system to:

- Track bundle sizes across builds
- Prevent bundle size regressions
- Identify optimization opportunities
- Maintain performance budgets
- Generate historical trends

### Key Features

✅ **Automated Monitoring**: Runs on every build
✅ **Historical Tracking**: Stores size history for trend analysis
✅ **Size Comparison**: Compare current vs previous builds
✅ **CI/CD Integration**: GitHub Actions workflow for PRs
✅ **Visual Reports**: Bundle visualization with `vite-bundle-visualizer`
✅ **Configurable Thresholds**: Customizable size limits

## Quick Start

### Monitor Current Build

```bash
# Build and check bundle sizes
npm run check:bundle

# Or step by step
npm run build
npm run monitor:bundle
```

### Analyze Bundle Composition

```bash
# Visual bundle analyzer (opens in browser)
npm run analyze

# Terminal-based analysis
npm run analyze:bundle
```

### Track History

```bash
# Build, monitor, and track history
npm run bundle:full

# Or manually
npm run build
npm run monitor:bundle
npm run bundle:history
```

### Compare with Previous Build

```bash
npm run bundle:compare

# Or with custom baseline
npx tsx scripts/compare-bundle-sizes.ts --baseline path/to/baseline.json
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build project for production |
| `npm run analyze` | Open visual bundle analyzer |
| `npm run analyze:bundle` | Terminal-based bundle analysis |
| `npm run monitor:bundle` | Check bundle sizes against thresholds |
| `npm run bundle:history` | Track bundle size history |
| `npm run bundle:compare` | Compare with previous build |
| `npm run bundle:full` | Full bundle analysis workflow |
| `npm run check:bundle` | Build + monitor + compare |

## Monitoring System

### 1. Bundle Size Monitor (`monitor-bundle-size.ts`)

Analyzes built bundles and checks against thresholds.

**Features:**
- Scans all JS and CSS files in `dist/`
- Calculates total size and per-bundle sizes
- Validates against configurable thresholds
- Generates `bundle-size-report.json`
- Color-coded terminal output

**Output:**
```
📦 Bundle Size Report
═══════════════════════════════════════════════════════

JavaScript Bundles:
  vendor-misc-chunk.js                               145.23 KB
  ui-vendor-chunk.js                                  89.45 KB
  ...

Total JS                                             1.85 MB

CSS Bundles:
  index-BZeL3YPf.css                                170.59 KB

Total CSS                                           170.59 KB

═══════════════════════════════════════════════════════
TOTAL SIZE                                           2.02 MB
═══════════════════════════════════════════════════════

✅ All bundle sizes are within acceptable limits!
```

### 2. History Tracker (`track-bundle-history.ts`)

Maintains historical record of bundle sizes.

**Features:**
- Stores last 50 builds
- Tracks git commit and branch info
- Calculates trends (increasing/decreasing/stable)
- Provides statistics (min/max/average)
- Generates `bundle-size-history.json`

**Output:**
```
📈 Bundle Size History

Total Entries: 25
Average Size: 2.01 MB
Min Size: 1.95 MB
Max Size: 2.15 MB
Trend: ➡️ stable

📊 Recent History (Last 10):
| Date/Time           | Branch     | Commit  | Total Size | Bundles |
|---------------------|------------|---------|------------|---------|
| Oct 30, 08:30 PM    | main       | a1b2c3d | 2.02 MB    | 127     |
...
```

### 3. Size Comparison (`compare-bundle-sizes.ts`)

Compares current build with previous or baseline.

**Features:**
- Bundle-by-bundle comparison
- Identifies new/removed bundles
- Highlights significant changes (>10KB or >10%)
- Percentage change calculations
- Color-coded diff output

**Output:**
```
📊 Bundle Size Comparison

Total Size:
  Previous: 2.00 MB
  Current:  2.02 MB
  Change:   +20.00 KB (+1.00%)

⚠️  Significant Changes (> 10 KB or > 10%):
| Bundle                | Previous | Current  | Change      | % Change |
|-----------------------|----------|----------|-------------|----------|
| ui-vendor-chunk.js    | 78.50 KB | 89.45 KB | +10.95 KB   | +13.9%  |
...
```

## CI/CD Integration

### GitHub Actions Workflow

The project includes `.github/workflows/bundle-size.yml` that automatically:

1. ✅ Runs on every PR and push to main
2. ✅ Builds the project
3. ✅ Monitors bundle sizes
4. ✅ Compares with main branch
5. ✅ Posts PR comment with results
6. ✅ Uploads artifacts
7. ✅ Fails PR if thresholds exceeded

### PR Comment Example

```markdown
## ✅ Bundle Size Report

**Total Size:** 2.02 MB
**Timestamp:** Oct 30, 2025, 8:30 PM

### Top 10 Largest Bundles

| Bundle | Size | Type |
|--------|------|------|
| vendor-misc-chunk.js | 145.23 KB | JS |
| index-BZeL3YPf.css | 170.59 KB | CSS |
...

### Thresholds
- Max JS per bundle: 500 KB
- Max CSS per bundle: 100 KB  ⚠️ EXCEEDED
- Max total size: 2000 KB
```

### Setting Up CI/CD

The workflow is already configured in `.github/workflows/bundle-size.yml`. No additional setup required!

**Required permissions:**
- ✅ `GITHUB_TOKEN` (automatically provided)
- ✅ Read/write access to PR comments

## Understanding Reports

### Bundle Size Report (`bundle-size-report.json`)

```json
{
  "timestamp": "2025-10-30T20:30:00.000Z",
  "totalSize": 2117632,
  "totalSizeFormatted": "2.02 MB",
  "bundles": [
    {
      "name": "js/vendor-misc-chunk.js",
      "size": 148715,
      "sizeFormatted": "145.23 KB",
      "type": "js"
    }
  ],
  "thresholds": {
    "maxJsSize": 500,
    "maxCssSize": 100,
    "maxTotalSize": 2000,
    "warnThreshold": 80
  }
}
```

### Bundle History (`bundle-size-history.json`)

```json
{
  "entries": [
    {
      "timestamp": "2025-10-30T20:30:00.000Z",
      "commit": "a1b2c3d",
      "branch": "main",
      "totalSize": 2117632,
      "totalSizeFormatted": "2.02 MB",
      "bundleCount": 127,
      "largestBundle": {
        "name": "vendor-misc-chunk.js",
        "size": 148715,
        "sizeFormatted": "145.23 KB"
      }
    }
  ],
  "stats": {
    "averageSize": 2107845,
    "minSize": 2050000,
    "maxSize": 2250000,
    "trend": "stable"
  }
}
```

## Optimization Guidelines

### When Bundles Exceed Thresholds

#### 1. Code Splitting

Use dynamic imports for large features:

```typescript
// Before
import { HeavyComponent } from './HeavyComponent';

// After
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### 2. Lazy Loading Routes

```typescript
// Router setup
const AdminPage = lazy(() => import('./pages/Admin'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
```

#### 3. Library Optimization

```typescript
// Import only what you need
import { format } from 'date-fns';
// Instead of
import * as dateFns from 'date-fns';
```

#### 4. Check for Duplicates

```bash
# Analyze bundle composition
npm run analyze
```

Look for:
- ❌ Duplicate dependencies
- ❌ Multiple versions of same library
- ❌ Unused exports

#### 5. Tree Shaking

Ensure your imports support tree shaking:

```typescript
// Good - tree-shakeable
import { Button } from '@/components/ui/button';

// Bad - imports everything
import * as UI from '@/components/ui';
```

### Vite Configuration

The project's `vite.config.ts` already includes extensive optimizations:

- ✅ Manual chunk splitting
- ✅ Terser minification with aggressive settings
- ✅ Module preload optimization
- ✅ Tree shaking enabled
- ✅ CSS optimization

### Specific Optimizations Applied

```typescript
// Large libraries are split into separate chunks
if (id.includes('recharts')) return 'charts';
if (id.includes('pdfjs-dist')) return 'pdf';
if (id.includes('@tiptap')) return 'tiptap-editor';

// Admin features are split for lazy loading
if (id.includes('/src/components/admin/')) return 'admin-components';
```

## Thresholds

Current thresholds in `scripts/monitor-bundle-size.ts`:

```typescript
const THRESHOLDS: BundleThresholds = {
  maxJsSize: 500,      // 500 KB per JS bundle
  maxCssSize: 100,     // 100 KB per CSS bundle
  maxTotalSize: 2000,  // 2 MB total
  warnThreshold: 80,   // Warn at 80% of max
};
```

### Adjusting Thresholds

Edit `scripts/monitor-bundle-size.ts`:

```typescript
const THRESHOLDS: BundleThresholds = {
  maxJsSize: 600,      // Increase JS limit
  maxCssSize: 150,     // Increase CSS limit
  maxTotalSize: 2500,  // Increase total limit
  warnThreshold: 75,   // Warn earlier
};
```

**Note:** Only increase thresholds if absolutely necessary. Always try to optimize bundles first.

## Troubleshooting

### Build Fails in CI

**Issue:** CI fails with bundle size errors

**Solution:**
1. Run locally: `npm run check:bundle`
2. Identify oversized bundles
3. Apply optimizations (see [Optimization Guidelines](#optimization-guidelines))
4. Verify: `npm run check:bundle`

### Missing History

**Issue:** `bundle:compare` reports no history

**Solution:**
```bash
# Initialize history
npm run bundle:full

# Subsequent builds will now have comparison baseline
```

### Inaccurate Sizes

**Issue:** Reported sizes don't match production

**Solution:**
```bash
# Ensure production build
npm run build:production

# Check gzipped sizes (actual transfer size)
find dist -name "*.js" -exec gzip -c {} \; | wc -c
```

### Large Vendor Chunks

**Issue:** `vendor-misc` chunk is too large

**Solution:**
1. Analyze with: `npm run analyze`
2. Identify large dependencies
3. Split in `vite.config.ts`:
```typescript
if (id.includes('large-library')) {
  return 'large-library-chunk';
}
```

## Best Practices

### 1. Monitor Regularly

```bash
# Before committing
npm run check:bundle

# Establish baseline
npm run bundle:full
```

### 2. Review PR Comments

Always check the bundle size comment on PRs. Look for:
- 🔴 Red flags: Increases > 50KB
- 🟡 Yellow flags: Increases > 10KB
- 🟢 Green flags: Decreases

### 3. Set Performance Budgets

Customize thresholds based on your requirements:
- Mobile-first: Lower limits
- Admin-heavy: Separate limits for admin routes
- Media-rich: Higher limits, but use lazy loading

### 4. Regular Audits

```bash
# Monthly bundle audit
npm run analyze
npm run bundle:history
```

Review trends and identify opportunities for optimization.

### 5. Dependencies Management

```bash
# Check outdated packages (may have size improvements)
npm outdated

# Audit bundle impact before adding new dependencies
npm run analyze
```

## Additional Resources

- [Vite Bundle Optimization](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Web.dev Bundle Size Guide](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

## Support

For issues or questions:
1. Check this documentation
2. Review [Troubleshooting](#troubleshooting)
3. Check GitHub issues
4. Contact the development team

---

**Last Updated:** October 30, 2025
**Maintained by:** Development Team
