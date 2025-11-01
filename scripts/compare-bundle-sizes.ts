#!/usr/bin/env tsx

/**
 * Bundle Size Comparison Tool
 *
 * Compares current bundle sizes with a previous report or baseline.
 * Useful for PR reviews and continuous monitoring.
 *
 * Usage:
 * ```bash
 * # Compare with previous report
 * npx tsx scripts/compare-bundle-sizes.ts
 *
 * # Compare with baseline
 * npx tsx scripts/compare-bundle-sizes.ts --baseline baseline-report.json
 * ```
 */

import fs from 'fs';
import path from 'path';

interface Bundle {
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
}

interface BundleReport {
  timestamp: string;
  totalSize: number;
  totalSizeFormatted: string;
  bundles: Bundle[];
}

interface Comparison {
  bundle: string;
  currentSize: number;
  previousSize: number;
  diff: number;
  diffFormatted: string;
  percentChange: number;
  status: 'increased' | 'decreased' | 'same' | 'new' | 'removed';
}

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
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function loadReport(filePath: string): BundleReport | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return null;
  }
}

function compareBundles(current: BundleReport, previous: BundleReport): Comparison[] {
  const comparisons: Comparison[] = [];
  const previousMap = new Map(previous.bundles.map(b => [b.name, b]));
  const currentMap = new Map(current.bundles.map(b => [b.name, b]));

  // Compare existing bundles
  for (const bundle of current.bundles) {
    const prev = previousMap.get(bundle.name);

    if (!prev) {
      comparisons.push({
        bundle: bundle.name,
        currentSize: bundle.size,
        previousSize: 0,
        diff: bundle.size,
        diffFormatted: `+${formatBytes(bundle.size)}`,
        percentChange: 100,
        status: 'new',
      });
    } else {
      const diff = bundle.size - prev.size;
      const percentChange = prev.size === 0 ? 0 : (diff / prev.size) * 100;

      comparisons.push({
        bundle: bundle.name,
        currentSize: bundle.size,
        previousSize: prev.size,
        diff,
        diffFormatted: diff === 0 ? '0 B' : `${diff > 0 ? '+' : ''}${formatBytes(diff)}`,
        percentChange,
        status: diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'same',
      });
    }
  }

  // Check for removed bundles
  for (const bundle of previous.bundles) {
    if (!currentMap.has(bundle.name)) {
      comparisons.push({
        bundle: bundle.name,
        currentSize: 0,
        previousSize: bundle.size,
        diff: -bundle.size,
        diffFormatted: `-${formatBytes(bundle.size)}`,
        percentChange: -100,
        status: 'removed',
      });
    }
  }

  return comparisons.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

function printComparison(current: BundleReport, previous: BundleReport) {
  console.log(`\n${COLORS.cyan}📊 Bundle Size Comparison${COLORS.reset}\n`);
  console.log('═'.repeat(100));

  const totalDiff = current.totalSize - previous.totalSize;
  const totalPercent =
    previous.totalSize === 0 ? 0 : (totalDiff / previous.totalSize) * 100;

  console.log(`\n${COLORS.blue}Total Size:${COLORS.reset}`);
  console.log(`  Previous: ${previous.totalSizeFormatted}`);
  console.log(`  Current:  ${current.totalSizeFormatted}`);

  const diffColor = totalDiff > 0 ? COLORS.red : totalDiff < 0 ? COLORS.green : COLORS.reset;
  const diffSign = totalDiff > 0 ? '+' : '';
  console.log(
    `  Change:   ${diffColor}${diffSign}${formatBytes(totalDiff)} (${diffSign}${totalPercent.toFixed(2)}%)${COLORS.reset}`
  );

  const comparisons = compareBundles(current, previous);

  // Significant changes (> 10KB or > 10%)
  const significant = comparisons.filter(
    c =>
      (Math.abs(c.diff) > 10240 || Math.abs(c.percentChange) > 10) &&
      c.status !== 'same'
  );

  if (significant.length > 0) {
    console.log(`\n${COLORS.yellow}⚠️  Significant Changes (> 10 KB or > 10%):${COLORS.reset}\n`);
    console.log(
      '| Bundle                                      | Previous    | Current     | Change          | % Change |'
    );
    console.log(
      '|---------------------------------------------|-------------|-------------|-----------------|----------|'
    );

    for (const comp of significant.slice(0, 15)) {
      const bundle = comp.bundle.substring(0, 43).padEnd(43);
      const previous = formatBytes(comp.previousSize).padEnd(11);
      const current = formatBytes(comp.currentSize).padEnd(11);
      const change = comp.diffFormatted.padEnd(15);
      const percent = `${comp.percentChange > 0 ? '+' : ''}${comp.percentChange.toFixed(1)}%`;

      const color =
        comp.status === 'increased'
          ? COLORS.red
          : comp.status === 'decreased'
            ? COLORS.green
            : comp.status === 'new'
              ? COLORS.blue
              : COLORS.yellow;

      console.log(
        `| ${bundle} | ${previous} | ${current} | ${color}${change}${COLORS.reset} | ${color}${percent}${COLORS.reset} |`
      );
    }
  }

  // New bundles
  const newBundles = comparisons.filter(c => c.status === 'new');
  if (newBundles.length > 0) {
    console.log(`\n${COLORS.blue}✨ New Bundles (${newBundles.length}):${COLORS.reset}`);
    for (const comp of newBundles.slice(0, 5)) {
      console.log(`  • ${comp.bundle}: ${formatBytes(comp.currentSize)}`);
    }
    if (newBundles.length > 5) {
      console.log(`  ... and ${newBundles.length - 5} more`);
    }
  }

  // Removed bundles
  const removedBundles = comparisons.filter(c => c.status === 'removed');
  if (removedBundles.length > 0) {
    console.log(`\n${COLORS.yellow}🗑️  Removed Bundles (${removedBundles.length}):${COLORS.reset}`);
    for (const comp of removedBundles.slice(0, 5)) {
      console.log(`  • ${comp.bundle}: ${formatBytes(comp.previousSize)}`);
    }
    if (removedBundles.length > 5) {
      console.log(`  ... and ${removedBundles.length - 5} more`);
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(100)}\n`);

  const increased = comparisons.filter(c => c.status === 'increased').length;
  const decreased = comparisons.filter(c => c.status === 'decreased').length;
  const same = comparisons.filter(c => c.status === 'same').length;

  console.log(`${COLORS.cyan}Summary:${COLORS.reset}`);
  console.log(`  Total bundles: ${current.bundles.length}`);
  console.log(`  ${COLORS.red}Increased: ${increased}${COLORS.reset}`);
  console.log(`  ${COLORS.green}Decreased: ${decreased}${COLORS.reset}`);
  console.log(`  Unchanged: ${same}`);
  console.log(`  ${COLORS.blue}New: ${newBundles.length}${COLORS.reset}`);
  console.log(`  ${COLORS.yellow}Removed: ${removedBundles.length}${COLORS.reset}`);

  // Warnings
  if (totalDiff > 102400) {
    // 100 KB
    console.log(
      `\n${COLORS.red}⚠️  WARNING: Total bundle size increased by more than 100 KB!${COLORS.reset}`
    );
  } else if (totalDiff > 51200) {
    // 50 KB
    console.log(
      `\n${COLORS.yellow}⚠️  NOTICE: Total bundle size increased by more than 50 KB${COLORS.reset}`
    );
  } else if (totalDiff < -51200) {
    console.log(
      `\n${COLORS.green}✨ Great! Total bundle size decreased by more than 50 KB${COLORS.reset}`
    );
  }

  console.log('');
}

function main() {
  const args = process.argv.slice(2);
  const currentFile = path.join(process.cwd(), 'bundle-size-report.json');

  // Determine comparison file
  let previousFile: string;
  if (args.includes('--baseline')) {
    const baselineIndex = args.indexOf('--baseline');
    previousFile = args[baselineIndex + 1];
  } else {
    // Try to find in bundle-size-history.json
    const historyFile = path.join(process.cwd(), 'bundle-size-history.json');
    if (fs.existsSync(historyFile)) {
      try {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        if (history.entries && history.entries.length > 1) {
          // Create a temporary file with the previous entry
          const prevEntry = history.entries[history.entries.length - 2];
          previousFile = path.join(process.cwd(), '.previous-bundle-report.json');
          fs.writeFileSync(
            previousFile,
            JSON.stringify(
              {
                timestamp: prevEntry.timestamp,
                totalSize: prevEntry.totalSize,
                totalSizeFormatted: prevEntry.totalSizeFormatted,
                bundles: [], // We don't store individual bundles in history
              },
              null,
              2
            )
          );
        } else {
          console.log('No previous report found in history. Need at least 2 entries.');
          process.exit(0);
        }
      } catch (e) {
        console.error('Error reading history file:', e);
        process.exit(1);
      }
    } else {
      console.log('No baseline specified and no history file found.');
      console.log('Usage: npx tsx scripts/compare-bundle-sizes.ts --baseline <file>');
      process.exit(0);
    }
  }

  // Load reports
  const current = loadReport(currentFile);
  const previous = loadReport(previousFile);

  if (!current) {
    console.error('❌ Current bundle report not found. Run "npm run build" first.');
    process.exit(1);
  }

  if (!previous) {
    console.error('❌ Previous bundle report not found.');
    process.exit(1);
  }

  // Compare and print
  printComparison(current, previous);

  // Cleanup temp file if created
  if (previousFile.includes('.previous-bundle-report.json')) {
    fs.unlinkSync(previousFile);
  }
}

main();
