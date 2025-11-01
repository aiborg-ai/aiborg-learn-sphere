# Bundle Size Monitoring - Quick Start

Quick reference guide for bundle size monitoring.

## 🚀 Essential Commands

```bash
# Check bundle size (most common)
npm run check:bundle

# Visual analysis
npm run analyze

# Full monitoring workflow
npm run bundle:full
```

## 📊 What Gets Checked

- ✅ Individual JS bundle sizes (max 500 KB each)
- ✅ CSS bundle sizes (max 100 KB each)
- ✅ Total bundle size (max 2 MB)
- ✅ Comparison with previous builds
- ✅ Historical trends

## 🎯 Workflow

### Before Committing
```bash
npm run check:bundle
```
This will:
1. Build the project
2. Check all bundle sizes
3. Compare with previous build
4. Warn if thresholds exceeded

### During Development
```bash
npm run dev
```
No monitoring needed during development.

### For Detailed Analysis
```bash
npm run analyze
```
Opens interactive bundle visualizer in browser.

### To Track History
```bash
npm run bundle:full
```
Builds, monitors, and saves to history.

## ⚠️ When Warnings Appear

### Yellow Warning (80% of threshold)
```
⚠️  Warning: bundle.js is approaching max size
```
**Action:** Plan optimization, not urgent.

### Red Error (exceeds threshold)
```
❌ Error: bundle.js exceeds max size
```
**Action:** Must optimize before merging.

## 🔧 Quick Fixes

### 1. Large Bundle
```bash
# Find what's in it
npm run analyze

# Check specific imports
grep -r "import.*from" src/ | grep "large-library"
```

### 2. Code Splitting
```typescript
// Change static import
import Component from './Component';

// To dynamic import
const Component = lazy(() => import('./Component'));
```

### 3. Library Optimization
```typescript
// Instead of importing everything
import * as icons from 'lucide-react';

// Import only what you need
import { Home, User } from 'lucide-react';
```

## 📈 Reading Reports

### Console Output
```
📦 Bundle Size Report
JavaScript Bundles:
  vendor-misc.js     145.23 KB  ✅
  ui-vendor.js        89.45 KB  ✅
  ...
Total: 2.02 MB ✅
```

### JSON Report
Located at: `bundle-size-report.json`
- Used by CI/CD
- Contains detailed metrics
- Includes thresholds

### History
Located at: `bundle-size-history.json`
- Last 50 builds
- Trend analysis
- Git info (commit, branch)

## 🤖 CI/CD Integration

Automatic on every PR:
1. ✅ Builds project
2. ✅ Checks bundle sizes
3. ✅ Posts comment on PR
4. ✅ Fails if thresholds exceeded

## 📚 More Info

See [BUNDLE_SIZE_MONITORING.md](./BUNDLE_SIZE_MONITORING.md) for:
- Detailed optimization guide
- Threshold configuration
- Troubleshooting
- Best practices

## 🆘 Help

**Build fails in CI?**
```bash
npm run check:bundle
# Fix locally first, then push
```

**Can't find report?**
```bash
npm run build
npm run monitor:bundle
```

**Compare not working?**
```bash
# Need at least 2 builds in history
npm run bundle:full  # Run twice
npm run bundle:compare
```

## 🎓 Best Practices

✅ **DO:**
- Run `check:bundle` before committing large changes
- Review bundle size on every PR
- Use dynamic imports for large features
- Keep an eye on trends

❌ **DON'T:**
- Ignore bundle size warnings
- Import entire libraries when you only need parts
- Commit without checking bundle impact
- Increase thresholds without optimization attempts

---

**Need more help?** See full documentation in [BUNDLE_SIZE_MONITORING.md](./BUNDLE_SIZE_MONITORING.md)
