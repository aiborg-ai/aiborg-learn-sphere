#!/usr/bin/env tsx

/**
 * Bundle Size Monitor
 *
 * Monitors bundle sizes after build and alerts if they exceed thresholds.
 * Run this script in CI/CD to prevent bundle size regressions.
 *
 * Usage:
 * ```bash
 * npm run build
 * npx tsx scripts/monitor-bundle-size.ts
 * ```
 */

import fs from 'fs';
import path from 'path';

interface BundleInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  type: 'js' | 'css';
}

interface BundleThresholds {
  maxJsSize: number; // in KB
  maxCssSize: number; // in KB
  maxTotalSize: number; // in KB
  warnThreshold: number; // percentage before max (e.g., 80 = warn at 80% of max)
}

const THRESHOLDS: BundleThresholds = {
  maxJsSize: 500, // 500 KB per JS bundle
  maxCssSize: 100, // 100 KB per CSS bundle
  maxTotalSize: 2000, // 2 MB total
  warnThreshold: 80, // Warn at 80% of max
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getFilesRecursively(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function analyzeBundles(distPath: string): BundleInfo[] {
  if (!fs.existsSync(distPath)) {
    console.error(`${COLORS.red}❌ Dist folder not found: ${distPath}${COLORS.reset}`);
    console.error('Please run "npm run build" first.');
    process.exit(1);
  }

  const files = getFilesRecursively(distPath);
  const bundles: BundleInfo[] = [];

  for (const file of files) {
    const ext = path.extname(file);

    if (ext === '.js' || ext === '.css') {
      const stats = fs.statSync(file);
      const relativePath = path.relative(distPath, file);

      bundles.push({
        name: relativePath,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        type: ext === '.js' ? 'js' : 'css',
      });
    }
  }

  return bundles.sort((a, b) => b.size - a.size);
}

function checkThresholds(bundles: BundleInfo[]): {
  passed: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  let totalJsSize = 0;
  let totalCssSize = 0;

  for (const bundle of bundles) {
    const sizeKB = bundle.size / 1024;

    if (bundle.type === 'js') {
      totalJsSize += sizeKB;

      const maxSize = THRESHOLDS.maxJsSize;
      const warnSize = (maxSize * THRESHOLDS.warnThreshold) / 100;

      if (sizeKB > maxSize) {
        errors.push(`${bundle.name}: ${bundle.sizeFormatted} exceeds max JS size (${maxSize} KB)`);
      } else if (sizeKB > warnSize) {
        warnings.push(
          `${bundle.name}: ${bundle.sizeFormatted} is approaching max JS size (${maxSize} KB)`
        );
      }
    } else if (bundle.type === 'css') {
      totalCssSize += sizeKB;

      const maxSize = THRESHOLDS.maxCssSize;
      const warnSize = (maxSize * THRESHOLDS.warnThreshold) / 100;

      if (sizeKB > maxSize) {
        errors.push(`${bundle.name}: ${bundle.sizeFormatted} exceeds max CSS size (${maxSize} KB)`);
      } else if (sizeKB > warnSize) {
        warnings.push(
          `${bundle.name}: ${bundle.sizeFormatted} is approaching max CSS size (${maxSize} KB)`
        );
      }
    }
  }

  // Check total size
  const totalSize = totalJsSize + totalCssSize;
  const maxTotal = THRESHOLDS.maxTotalSize;
  const warnTotal = (maxTotal * THRESHOLDS.warnThreshold) / 100;

  if (totalSize > maxTotal) {
    errors.push(
      `Total bundle size ${formatBytes(totalSize * 1024)} exceeds max total size (${maxTotal} KB)`
    );
  } else if (totalSize > warnTotal) {
    warnings.push(
      `Total bundle size ${formatBytes(totalSize * 1024)} is approaching max total size (${maxTotal} KB)`
    );
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  };
}

function printReport(bundles: BundleInfo[], results: ReturnType<typeof checkThresholds>) {
  console.log(`\n${COLORS.cyan}📦 Bundle Size Report${COLORS.reset}\n`);
  console.log('═'.repeat(80));

  // Group by type
  const jsBundles = bundles.filter(b => b.type === 'js');
  const cssBundles = bundles.filter(b => b.type === 'css');

  // JS Bundles
  if (jsBundles.length > 0) {
    console.log(`\n${COLORS.blue}JavaScript Bundles:${COLORS.reset}`);
    for (const bundle of jsBundles) {
      const sizeKB = bundle.size / 1024;
      const percentage = (sizeKB / THRESHOLDS.maxJsSize) * 100;
      const color = percentage > 100 ? COLORS.red : percentage > 80 ? COLORS.yellow : COLORS.green;

      console.log(
        `  ${color}${bundle.name.padEnd(50)} ${bundle.sizeFormatted.padStart(15)}${COLORS.reset}`
      );
    }

    const totalJs = jsBundles.reduce((sum, b) => sum + b.size, 0);
    console.log(`  ${'─'.repeat(67)}`);
    console.log(`  ${'Total JS'.padEnd(50)} ${formatBytes(totalJs).padStart(15)}`);
  }

  // CSS Bundles
  if (cssBundles.length > 0) {
    console.log(`\n${COLORS.blue}CSS Bundles:${COLORS.reset}`);
    for (const bundle of cssBundles) {
      const sizeKB = bundle.size / 1024;
      const percentage = (sizeKB / THRESHOLDS.maxCssSize) * 100;
      const color = percentage > 100 ? COLORS.red : percentage > 80 ? COLORS.yellow : COLORS.green;

      console.log(
        `  ${color}${bundle.name.padEnd(50)} ${bundle.sizeFormatted.padStart(15)}${COLORS.reset}`
      );
    }

    const totalCss = cssBundles.reduce((sum, b) => sum + b.size, 0);
    console.log(`  ${'─'.repeat(67)}`);
    console.log(`  ${'Total CSS'.padEnd(50)} ${formatBytes(totalCss).padStart(15)}`);
  }

  // Total
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  console.log(`\n${'═'.repeat(67)}`);
  console.log(`  ${'TOTAL SIZE'.padEnd(50)} ${formatBytes(totalSize).padStart(15)}`);
  console.log(`${'═'.repeat(67)}\n`);

  // Warnings
  if (results.warnings.length > 0) {
    console.log(`${COLORS.yellow}⚠️  Warnings:${COLORS.reset}`);
    for (const warning of results.warnings) {
      console.log(`  ${COLORS.yellow}•${COLORS.reset} ${warning}`);
    }
    console.log('');
  }

  // Errors
  if (results.errors.length > 0) {
    console.log(`${COLORS.red}❌ Errors:${COLORS.reset}`);
    for (const error of results.errors) {
      console.log(`  ${COLORS.red}•${COLORS.reset} ${error}`);
    }
    console.log('');
  }

  // Summary
  if (results.passed) {
    console.log(
      `${COLORS.green}✅ All bundle sizes are within acceptable limits!${COLORS.reset}\n`
    );
  } else {
    console.log(`${COLORS.red}❌ Bundle size check failed!${COLORS.reset}\n`);
  }

  // Recommendations
  if (results.errors.length > 0 || results.warnings.length > 0) {
    console.log(`${COLORS.cyan}💡 Recommendations:${COLORS.reset}`);
    console.log(`  • Use dynamic imports: const Component = lazy(() => import('./Component'))`);
    console.log(`  • Enable code splitting: Check your vite.config.ts`);
    console.log(`  • Analyze bundle: npm run analyze`);
    console.log(`  • Remove unused dependencies`);
    console.log(`  • Use tree shaking effectively\n`);
  }
}

function saveBundleReport(bundles: BundleInfo[], outputPath: string) {
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: bundles.reduce((sum, b) => sum + b.size, 0),
    totalSizeFormatted: formatBytes(bundles.reduce((sum, b) => sum + b.size, 0)),
    bundles: bundles.map(b => ({
      name: b.name,
      size: b.size,
      sizeFormatted: b.sizeFormatted,
      type: b.type,
    })),
    thresholds: THRESHOLDS,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`${COLORS.cyan}📄 Report saved to: ${outputPath}${COLORS.reset}\n`);
}

// Main execution
function main() {
  const distPath = path.join(process.cwd(), 'dist');
  const reportPath = path.join(process.cwd(), 'bundle-size-report.json');

  console.log(`${COLORS.cyan}📊 Analyzing bundles in: ${distPath}${COLORS.reset}\n`);

  const bundles = analyzeBundles(distPath);
  const results = checkThresholds(bundles);

  printReport(bundles, results);
  saveBundleReport(bundles, reportPath);

  // Exit with error code if checks failed
  if (!results.passed) {
    process.exit(1);
  }
}

main();
