#!/usr/bin/env tsx

/**
 * Bundle Size History Tracker
 *
 * Tracks bundle size changes over time and stores them in a history file.
 * This helps identify trends and regressions in bundle size.
 *
 * Usage:
 * ```bash
 * npm run build
 * npx tsx scripts/track-bundle-history.ts
 * ```
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface BundleReport {
  timestamp: string;
  totalSize: number;
  totalSizeFormatted: string;
  bundles: Array<{
    name: string;
    size: number;
    sizeFormatted: string;
    type: string;
  }>;
  thresholds: Record<string, number>;
}

interface HistoryEntry {
  timestamp: string;
  commit?: string;
  branch?: string;
  totalSize: number;
  totalSizeFormatted: string;
  bundleCount: number;
  largestBundle: {
    name: string;
    size: number;
    sizeFormatted: string;
  };
}

interface BundleHistory {
  entries: HistoryEntry[];
  stats: {
    averageSize: number;
    minSize: number;
    maxSize: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

const HISTORY_FILE = path.join(process.cwd(), 'bundle-size-history.json');
const REPORT_FILE = path.join(process.cwd(), 'bundle-size-report.json');
const MAX_HISTORY_ENTRIES = 50;

function getGitInfo(): { commit?: string; branch?: string } {
  try {
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return { commit, branch };
  } catch {
    return {};
  }
}

function loadHistory(): BundleHistory {
  if (!fs.existsSync(HISTORY_FILE)) {
    return {
      entries: [],
      stats: {
        averageSize: 0,
        minSize: 0,
        maxSize: 0,
        trend: 'stable',
      },
    };
  }

  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return {
      entries: [],
      stats: {
        averageSize: 0,
        minSize: 0,
        maxSize: 0,
        trend: 'stable',
      },
    };
  }
}

function calculateStats(entries: HistoryEntry[]): BundleHistory['stats'] {
  if (entries.length === 0) {
    return {
      averageSize: 0,
      minSize: 0,
      maxSize: 0,
      trend: 'stable',
    };
  }

  const sizes = entries.map(e => e.totalSize);
  const averageSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  // Calculate trend from last 5 entries
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (entries.length >= 5) {
    const recent = entries.slice(-5).map(e => e.totalSize);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';
  }

  return { averageSize, minSize, maxSize, trend };
}

function addToHistory(report: BundleReport, history: BundleHistory): BundleHistory {
  const gitInfo = getGitInfo();
  const largestBundle = report.bundles.reduce((prev, current) =>
    current.size > prev.size ? current : prev
  );

  const newEntry: HistoryEntry = {
    timestamp: report.timestamp,
    commit: gitInfo.commit,
    branch: gitInfo.branch,
    totalSize: report.totalSize,
    totalSizeFormatted: report.totalSizeFormatted,
    bundleCount: report.bundles.length,
    largestBundle: {
      name: largestBundle.name,
      size: largestBundle.size,
      sizeFormatted: largestBundle.sizeFormatted,
    },
  };

  // Add new entry and limit history size
  const entries = [...history.entries, newEntry].slice(-MAX_HISTORY_ENTRIES);

  return {
    entries,
    stats: calculateStats(entries),
  };
}

function printHistorySummary(history: BundleHistory) {
  console.log('\n📈 Bundle Size History\n');
  console.log('═'.repeat(80));

  if (history.entries.length === 0) {
    console.log('No history available yet.');
    return;
  }

  console.log(`\nTotal Entries: ${history.entries.length}`);
  console.log(`Average Size: ${formatBytes(history.stats.averageSize)}`);
  console.log(`Min Size: ${formatBytes(history.stats.minSize)}`);
  console.log(`Max Size: ${formatBytes(history.stats.maxSize)}`);
  console.log(`Trend: ${getTrendEmoji(history.stats.trend)} ${history.stats.trend}`);

  console.log('\n📊 Recent History (Last 10):\n');
  const recent = history.entries.slice(-10);

  console.log(
    '| Date/Time           | Branch     | Commit  | Total Size | Bundles | Largest Bundle          |'
  );
  console.log(
    '|---------------------|------------|---------|------------|---------|-------------------------|'
  );

  for (const entry of recent) {
    const date = new Date(entry.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const branch = entry.branch?.substring(0, 10).padEnd(10) || 'N/A       ';
    const commit = entry.commit?.substring(0, 7) || 'N/A    ';
    const size = entry.totalSizeFormatted.padEnd(10);
    const count = entry.bundleCount.toString().padEnd(7);
    const largest = entry.largestBundle.name.substring(0, 23);

    console.log(`| ${date} | ${branch} | ${commit} | ${size} | ${count} | ${largest} |`);
  }

  console.log('\n' + '═'.repeat(80) + '\n');
}

function getTrendEmoji(trend: string): string {
  switch (trend) {
    case 'increasing':
      return '📈';
    case 'decreasing':
      return '📉';
    default:
      return '➡️';
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function main() {
  // Check if report exists
  if (!fs.existsSync(REPORT_FILE)) {
    console.error('❌ Bundle size report not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Load current report
  const report: BundleReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));

  // Load and update history
  const history = loadHistory();
  const updatedHistory = addToHistory(report, history);

  // Save updated history
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(updatedHistory, null, 2));

  // Print summary
  printHistorySummary(updatedHistory);

  console.log(`✅ History updated and saved to: ${HISTORY_FILE}\n`);
}

main();
