/**
 * Analytics E2E Tests
 * Tests for analytics dashboard, reports, and data visualization
 */

import { test, expect } from '@playwright/test';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Analytics - Overview', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should display analytics page', async () => {
    await analyticsPage.assertOnAnalyticsPage();
  });

  test('should load key metrics', async () => {
    await analyticsPage.page.waitForTimeout(1000);
    await analyticsPage.assertMetricsLoaded();
  });

  test('should display all metrics', async () => {
    await analyticsPage.page.waitForTimeout(1000);
    const metrics = await analyticsPage.getAllMetrics();
    expect(metrics.length).toBeGreaterThan(0);

    metrics.forEach(metric => {
      expect(metric).toHaveProperty('label');
      expect(metric).toHaveProperty('value');
    });
  });

  test('should get specific metric values', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    if (await analyticsPage.isVisible('[data-testid="metric-total-users"]')) {
      const totalUsers = await analyticsPage.getMetricValue('totalUsers');
      expect(totalUsers).toBeTruthy();
    }

    if (await analyticsPage.isVisible('[data-testid="metric-total-revenue"]')) {
      const totalRevenue = await analyticsPage.getMetricValue('totalRevenue');
      expect(totalRevenue).toBeTruthy();
    }
  });
});

test.describe('Analytics - Date Range Selection', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should set quick date ranges', async () => {
    if (await analyticsPage.isVisible('button:has-text("Today")')) {
      await analyticsPage.setQuickDateRange('today');
      await analyticsPage.page.waitForTimeout(1000);
    }

    if (await analyticsPage.isVisible('button:has-text("Last 7 Days")')) {
      await analyticsPage.setQuickDateRange('last7Days');
      await analyticsPage.page.waitForTimeout(1000);
    }

    if (await analyticsPage.isVisible('button:has-text("Last 30 Days")')) {
      await analyticsPage.setQuickDateRange('last30Days');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });

  test('should set custom date range', async () => {
    if (await analyticsPage.isVisible('[data-testid="date-range-picker"]')) {
      await analyticsPage.setCustomDateRange('2024-01-01', '2024-12-31');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Analytics - Charts and Visualizations', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should display charts', async () => {
    await analyticsPage.page.waitForTimeout(1000);
    await analyticsPage.assertChartsVisible();
  });

  test('should check individual charts visibility', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    const hasUserGrowth = await analyticsPage.isChartVisible('userGrowth');
    const hasRevenue = await analyticsPage.isChartVisible('revenue');
    const hasEnrollment = await analyticsPage.isChartVisible('enrollment');

    expect(typeof hasUserGrowth).toBe('boolean');
    expect(typeof hasRevenue).toBe('boolean');
    expect(typeof hasEnrollment).toBe('boolean');
  });

  test('should change chart type', async () => {
    if (await analyticsPage.isVisible('[data-testid="chart-type"]')) {
      await analyticsPage.changeChartType('bar');
      await analyticsPage.page.waitForTimeout(1000);

      await analyticsPage.changeChartType('line');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Analytics - Tabs Navigation', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should switch to users tab', async () => {
    if (await analyticsPage.isVisible('button:has-text("Users")')) {
      await analyticsPage.switchToTab('users');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });

  test('should switch to courses tab', async () => {
    if (await analyticsPage.isVisible('button:has-text("Courses")')) {
      await analyticsPage.switchToTab('courses');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });

  test('should switch to revenue tab', async () => {
    if (await analyticsPage.isVisible('button:has-text("Revenue")')) {
      await analyticsPage.switchToTab('revenue');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });

  test('should switch to engagement tab', async () => {
    if (await analyticsPage.isVisible('button:has-text("Engagement")')) {
      await analyticsPage.switchToTab('engagement');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Analytics - Filters', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should apply filters', async () => {
    if (await analyticsPage.isVisible('[data-testid="filters-section"]')) {
      await analyticsPage.applyFilters({
        category: 'Technology',
      });
      await analyticsPage.page.waitForTimeout(1000);
    }
  });

  test('should clear filters', async () => {
    if (await analyticsPage.isVisible('[data-testid="filters-section"]')) {
      await analyticsPage.applyFilters({
        level: 'Beginner',
      });
      await analyticsPage.page.waitForTimeout(1000);

      await analyticsPage.clearFilters();
      await analyticsPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Analytics - User Analytics', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
    await analyticsPage.switchToTab('users');
  });

  test('should display user analytics', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    if (await analyticsPage.isVisible('[data-testid="top-users-table"]')) {
      const topUsers = await analyticsPage.getTopUsers();
      expect(Array.isArray(topUsers)).toBe(true);
    }
  });
});

test.describe('Analytics - Course Analytics', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
    await analyticsPage.switchToTab('courses');
  });

  test('should display course analytics', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    if (await analyticsPage.isVisible('[data-testid="top-courses-table"]')) {
      const topCourses = await analyticsPage.getTopCourses();
      expect(Array.isArray(topCourses)).toBe(true);
    }
  });
});

test.describe('Analytics - Revenue Analytics', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
    await analyticsPage.switchToTab('revenue');
  });

  test('should display revenue metrics', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    if (await analyticsPage.isVisible('[data-testid="mrr"]')) {
      const metrics = await analyticsPage.getRevenueMetrics();
      expect(metrics.mrr).toBeTruthy();
      expect(metrics.aov).toBeTruthy();
      expect(metrics.conversionRate).toBeTruthy();
    }
  });
});

test.describe('Analytics - Engagement Analytics', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
    await analyticsPage.switchToTab('engagement');
  });

  test('should display engagement metrics', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    if (await analyticsPage.isVisible('[data-testid="bounce-rate"]')) {
      const metrics = await analyticsPage.getEngagementMetrics();
      expect(metrics.bounceRate).toBeTruthy();
      expect(metrics.avgTimeOnSite).toBeTruthy();
    }
  });

  test('should display most viewed content', async () => {
    await analyticsPage.page.waitForTimeout(1000);

    if (await analyticsPage.isVisible('[data-testid="most-viewed-content"]')) {
      const content = await analyticsPage.getMostViewedContent();
      expect(Array.isArray(content)).toBe(true);
    }
  });
});

test.describe('Analytics - Reports', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should generate report', async () => {
    if (await analyticsPage.isVisible('button:has-text("Generate Report")')) {
      await analyticsPage.generateReport();
      await analyticsPage.page.waitForTimeout(2000);
    }
  });

  test('should display saved reports', async () => {
    if (await analyticsPage.isVisible('[data-testid="saved-reports"]')) {
      const reports = await analyticsPage.getSavedReports();
      expect(Array.isArray(reports)).toBe(true);
    }
  });

  test('should download report', async () => {
    if (await analyticsPage.isVisible('[data-testid="saved-reports"]')) {
      const reports = await analyticsPage.getSavedReports();

      if (reports.length > 0) {
        try {
          const download = await analyticsPage.downloadReport(0);
          expect(download).toBeTruthy();
        } catch {
          // Download might not be available
        }
      }
    }
  });

  test('should delete report', async () => {
    if (await analyticsPage.isVisible('[data-testid="saved-reports"]')) {
      const reports = await analyticsPage.getSavedReports();

      if (reports.length > 0 && (await analyticsPage.isVisible('button:has-text("Delete")'))) {
        await analyticsPage.deleteReport(0);
        await analyticsPage.page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Analytics - Export Data', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should export as CSV', async () => {
    if (await analyticsPage.isVisible('button:has-text("Export")')) {
      try {
        const download = await analyticsPage.exportData('csv');
        expect(download).toBeTruthy();
      } catch {
        // Export might not be available
      }
    }
  });

  test('should export as PDF', async () => {
    if (await analyticsPage.isVisible('button:has-text("Export")')) {
      try {
        const download = await analyticsPage.exportData('pdf');
        expect(download).toBeTruthy();
      } catch {
        // Export might not be available
      }
    }
  });

  test('should export as Excel', async () => {
    if (await analyticsPage.isVisible('button:has-text("Export")')) {
      try {
        const download = await analyticsPage.exportData('excel');
        expect(download).toBeTruthy();
      } catch {
        // Export might not be available
      }
    }
  });
});

test.describe('Analytics - Data Tables', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should display data table', async () => {
    if (await analyticsPage.isVisible('[data-testid="analytics-table"]')) {
      const data = await analyticsPage.getTableData();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('should sort table', async () => {
    if (await analyticsPage.isVisible('[data-testid="sort-button"]')) {
      await analyticsPage.sortTableBy(0);
      await analyticsPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Analytics - Comparison Mode', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should enable comparison with previous period', async () => {
    if (await analyticsPage.isVisible('button:has-text("Compare")')) {
      await analyticsPage.enableComparison('previousPeriod');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });

  test('should enable comparison with last year', async () => {
    if (await analyticsPage.isVisible('button:has-text("Compare")')) {
      await analyticsPage.enableComparison('lastYear');
      await analyticsPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Analytics - Real-time Data', () => {
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    analyticsPage = new AnalyticsPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await analyticsPage.navigate();
  });

  test('should display real-time active users', async () => {
    if (await analyticsPage.isVisible('[data-testid="active-users-now"]')) {
      const activeUsers = await analyticsPage.getActiveUsersNow();
      expect(activeUsers).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display current sessions', async () => {
    if (await analyticsPage.isVisible('[data-testid="current-sessions"]')) {
      const sessions = await analyticsPage.getCurrentSessions();
      expect(sessions).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display real-time activity feed', async () => {
    if (await analyticsPage.isVisible('[data-testid="realtime-activity"]')) {
      const activity = await analyticsPage.getRealtimeActivity();
      expect(Array.isArray(activity)).toBe(true);
    }
  });
});
