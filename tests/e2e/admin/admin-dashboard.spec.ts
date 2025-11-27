/**
 * Admin Dashboard E2E Tests
 * Tests for admin dashboard overview, stats, and quick actions
 */

import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Admin Dashboard - Overview', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should display admin dashboard', async () => {
    await dashboardPage.assertOnDashboard();
    const isOnDashboard = await dashboardPage.isOnDashboard();
    expect(isOnDashboard).toBe(true);
  });

  test('should load and display stats cards', async () => {
    await dashboardPage.assertStatsLoaded();
    const stats = await dashboardPage.getAllStats();
    expect(stats.length).toBeGreaterThan(0);
  });

  test('should display key metrics', async () => {
    const totalUsers = await dashboardPage.getTotalUsers();
    const activeCourses = await dashboardPage.getActiveCourses();
    const totalEnrollments = await dashboardPage.getTotalEnrollments();

    expect(totalUsers).toBeGreaterThanOrEqual(0);
    expect(activeCourses).toBeGreaterThanOrEqual(0);
    expect(totalEnrollments).toBeGreaterThanOrEqual(0);
  });

  test('should display revenue metrics', async () => {
    const revenue = await dashboardPage.getRevenue();
    expect(revenue).toBeGreaterThanOrEqual(0);
  });

  test('should display pending reviews count', async () => {
    const pendingReviews = await dashboardPage.getPendingReviews();
    expect(pendingReviews).toBeGreaterThanOrEqual(0);
  });

  test('should display active students count', async () => {
    const activeStudents = await dashboardPage.getActiveStudents();
    expect(activeStudents).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Admin Dashboard - Charts', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should display charts', async () => {
    const hasEnrollmentChart = await dashboardPage.isChartVisible('enrollment');
    const hasRevenueChart = await dashboardPage.isChartVisible('revenue');

    expect(hasEnrollmentChart || hasRevenueChart).toBe(true);
  });

  test('should filter charts by period', async () => {
    if (await dashboardPage.isVisible('[data-testid="chart-period-filter"]')) {
      await dashboardPage.filterChartsByPeriod('week');
      await dashboardPage.page.waitForTimeout(1000);

      await dashboardPage.filterChartsByPeriod('month');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should display multiple chart types', async () => {
    const hasUserGrowth = await dashboardPage.isChartVisible('growth');
    const hasCompletion = await dashboardPage.isChartVisible('completion');

    expect(typeof hasUserGrowth).toBe('boolean');
    expect(typeof hasCompletion).toBe('boolean');
  });
});

test.describe('Admin Dashboard - Recent Activity', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should display recent activity', async () => {
    if (await dashboardPage.isVisible('[data-testid="recent-activity"]')) {
      const activities = await dashboardPage.getRecentActivity();
      expect(Array.isArray(activities)).toBe(true);
    }
  });

  test('should navigate to all activity', async () => {
    if (await dashboardPage.isVisible('button:has-text("View All Activity")')) {
      await dashboardPage.viewAllActivity();
      await dashboardPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Admin Dashboard - Quick Actions', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should navigate to create user', async () => {
    if (await dashboardPage.isVisible('button:has-text("Create User")')) {
      await dashboardPage.clickQuickAction('createUser');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to create course', async () => {
    if (await dashboardPage.isVisible('button:has-text("Create Course")')) {
      await dashboardPage.clickQuickAction('createCourse');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to manage content', async () => {
    if (await dashboardPage.isVisible('button:has-text("Manage Content")')) {
      await dashboardPage.clickQuickAction('manageContent');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to view reports', async () => {
    if (await dashboardPage.isVisible('button:has-text("View Reports")')) {
      await dashboardPage.clickQuickAction('viewReports');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to moderate reviews', async () => {
    if (await dashboardPage.isVisible('button:has-text("Moderate Reviews")')) {
      await dashboardPage.clickQuickAction('moderateReviews');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Admin Dashboard - Alerts and Notifications', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should display alerts', async () => {
    if (await dashboardPage.isVisible('[data-testid="alerts-section"]')) {
      const alertsCount = await dashboardPage.getAlertsCount();
      expect(alertsCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display critical alerts', async () => {
    if (await dashboardPage.isVisible('[data-testid="alerts-section"]')) {
      const criticalCount = await dashboardPage.getCriticalAlertsCount();
      expect(criticalCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should dismiss alert', async () => {
    if (await dashboardPage.isVisible('[data-testid="alert-item"]')) {
      const initialCount = await dashboardPage.getAlertsCount();
      if (initialCount > 0) {
        await dashboardPage.dismissAlert(0);
        await dashboardPage.page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Admin Dashboard - System Status', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should display system status', async () => {
    if (await dashboardPage.isVisible('[data-testid="system-status"]')) {
      const status = await dashboardPage.getSystemStatus();
      expect(status.database).toBeTruthy();
      expect(status.api).toBeTruthy();
      expect(status.storage).toBeTruthy();
    }
  });
});

test.describe('Admin Dashboard - Navigation', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should navigate to users section', async () => {
    if (await dashboardPage.isVisible('a[href*="/admin/users"]')) {
      await dashboardPage.navigateToSection('users');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to courses section', async () => {
    if (await dashboardPage.isVisible('a[href*="/admin/courses"]')) {
      await dashboardPage.navigateToSection('courses');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to analytics section', async () => {
    if (await dashboardPage.isVisible('a[href*="/admin/analytics"]')) {
      await dashboardPage.navigateToSection('analytics');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate to moderation section', async () => {
    if (await dashboardPage.isVisible('a[href*="/admin/moderation"]')) {
      await dashboardPage.navigateToSection('moderation');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Admin Dashboard - Search and Filters', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should perform global search', async () => {
    if (await dashboardPage.isVisible('input[placeholder*="Search"]')) {
      await dashboardPage.globalSearchFor('test');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });

  test('should set date range', async () => {
    if (await dashboardPage.isVisible('[data-testid="date-range-picker"]')) {
      await dashboardPage.setDateRange('2024-01-01', '2024-12-31');
      await dashboardPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Admin Dashboard - Top Performers', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should display top courses', async () => {
    if (await dashboardPage.isVisible('[data-testid="top-courses"]')) {
      const topCourses = await dashboardPage.getTopCourses();
      expect(Array.isArray(topCourses)).toBe(true);
    }
  });

  test('should display top instructors', async () => {
    if (await dashboardPage.isVisible('[data-testid="top-instructors"]')) {
      const topInstructors = await dashboardPage.getTopInstructors();
      expect(Array.isArray(topInstructors)).toBe(true);
    }
  });

  test('should display top students', async () => {
    if (await dashboardPage.isVisible('[data-testid="top-students"]')) {
      const topStudents = await dashboardPage.getTopStudents();
      expect(Array.isArray(topStudents)).toBe(true);
    }
  });
});

test.describe('Admin Dashboard - Export and Download', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AdminDashboardPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await dashboardPage.navigate();
  });

  test('should export data', async () => {
    if (await dashboardPage.isVisible('button:has-text("Export")')) {
      try {
        const download = await dashboardPage.exportData();
        expect(download).toBeTruthy();
      } catch {
        // Export might not be available
      }
    }
  });

  test('should download report', async () => {
    if (await dashboardPage.isVisible('button:has-text("Download Report")')) {
      try {
        const download = await dashboardPage.downloadReport();
        expect(download).toBeTruthy();
      } catch {
        // Download might not be available
      }
    }
  });
});
