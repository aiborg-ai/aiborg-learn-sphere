/**
 * Admin Dashboard Page Object
 * Represents the main admin dashboard with overview stats and quick actions
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class AdminDashboardPage extends BasePage {
  // Page URL
  private readonly dashboardUrl = '/admin';

  // Header and navigation
  private readonly pageTitle = 'h1:has-text("Admin Dashboard")';
  private readonly adminNavMenu = '[data-testid="admin-nav"]';

  // Dashboard sections
  private readonly overviewSection = '[data-testid="overview-section"]';
  private readonly statsCards = '[data-testid="stats-card"]';
  private readonly recentActivitySection = '[data-testid="recent-activity"]';
  private readonly quickActionsSection = '[data-testid="quick-actions"]';

  // Stats cards
  private readonly totalUsersCard = '[data-testid="stat-total-users"]';
  private readonly activeCoursesCard = '[data-testid="stat-active-courses"]';
  private readonly totalEnrollmentsCard = '[data-testid="stat-total-enrollments"]';
  private readonly revenueCard = '[data-testid="stat-revenue"]';
  private readonly pendingReviewsCard = '[data-testid="stat-pending-reviews"]';
  private readonly activeStudentsCard = '[data-testid="stat-active-students"]';

  // Charts and graphs
  private readonly enrollmentChart = '[data-testid="enrollment-chart"]';
  private readonly revenueChart = '[data-testid="revenue-chart"]';
  private readonly userGrowthChart = '[data-testid="user-growth-chart"]';
  private readonly courseCompletionChart = '[data-testid="completion-chart"]';

  // Chart filters
  private readonly chartPeriodFilter = '[data-testid="chart-period-filter"]';
  private readonly todayFilter = 'button:has-text("Today")';
  private readonly weekFilter = 'button:has-text("Week")';
  private readonly monthFilter = 'button:has-text("Month")';
  private readonly yearFilter = 'button:has-text("Year")';

  // Recent activity
  private readonly activityList = '[data-testid="activity-list"]';
  private readonly activityItem = '[data-testid="activity-item"]';
  private readonly activityType = '[data-testid="activity-type"]';
  private readonly activityUser = '[data-testid="activity-user"]';
  private readonly activityTimestamp = '[data-testid="activity-timestamp"]';
  private readonly viewAllActivityButton = 'button:has-text("View All Activity")';

  // Quick actions
  private readonly createUserButton = 'button:has-text("Create User")';
  private readonly createCourseButton = 'button:has-text("Create Course")';
  private readonly manageContentButton = 'button:has-text("Manage Content")';
  private readonly viewReportsButton = 'button:has-text("View Reports")';
  private readonly moderateReviewsButton = 'button:has-text("Moderate Reviews")';
  private readonly manageEnrollmentsButton = 'button:has-text("Manage Enrollments")';

  // Alerts and notifications
  private readonly alertsSection = '[data-testid="alerts-section"]';
  private readonly alertItem = '[data-testid="alert-item"]';
  private readonly criticalAlert = '[data-testid="alert-critical"]';
  private readonly warningAlert = '[data-testid="alert-warning"]';
  private readonly infoAlert = '[data-testid="alert-info"]';
  private readonly dismissAlertButton = '[data-testid="dismiss-alert"]';

  // System status
  private readonly systemStatusSection = '[data-testid="system-status"]';
  private readonly databaseStatus = '[data-testid="status-database"]';
  private readonly apiStatus = '[data-testid="status-api"]';
  private readonly storageStatus = '[data-testid="status-storage"]';

  // Top performers
  private readonly topCoursesSection = '[data-testid="top-courses"]';
  private readonly topInstructorsSection = '[data-testid="top-instructors"]';
  private readonly topStudentsSection = '[data-testid="top-students"]';

  // Navigation links
  private readonly usersLink = 'a[href*="/admin/users"]';
  private readonly coursesLink = 'a[href*="/admin/courses"]';
  private readonly analyticsLink = 'a[href*="/admin/analytics"]';
  private readonly settingsLink = 'a[href*="/admin/settings"]';
  private readonly moderationLink = 'a[href*="/admin/moderation"]';

  // Date range picker
  private readonly dateRangePicker = '[data-testid="date-range-picker"]';
  private readonly startDateInput = 'input[name="startDate"]';
  private readonly endDateInput = 'input[name="endDate"]';
  private readonly applyDateRangeButton = 'button:has-text("Apply")';

  // Export and download
  private readonly exportButton = 'button:has-text("Export")';
  private readonly downloadReportButton = 'button:has-text("Download Report")';

  // Search and filters
  private readonly globalSearch = 'input[placeholder*="Search"]';
  private readonly filterButton = 'button:has-text("Filters")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to admin dashboard
   */
  async navigate() {
    await this.goto(this.dashboardUrl);
    await this.waitForPageLoad();
  }

  /**
   * Check if on admin dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    return await this.isVisible(this.pageTitle);
  }

  /**
   * Get total users count
   */
  async getTotalUsers(): Promise<number> {
    const text = await this.getText(this.totalUsersCard);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get active courses count
   */
  async getActiveCourses(): Promise<number> {
    const text = await this.getText(this.activeCoursesCard);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get total enrollments count
   */
  async getTotalEnrollments(): Promise<number> {
    const text = await this.getText(this.totalEnrollmentsCard);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get revenue amount
   */
  async getRevenue(): Promise<number> {
    const text = await this.getText(this.revenueCard);
    const match = text.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Get pending reviews count
   */
  async getPendingReviews(): Promise<number> {
    const text = await this.getText(this.pendingReviewsCard);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get active students count
   */
  async getActiveStudents(): Promise<number> {
    const text = await this.getText(this.activeStudentsCard);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get all stats cards
   */
  async getAllStats(): Promise<
    Array<{
      label: string;
      value: string;
    }>
  > {
    const cards = await this.page.locator(this.statsCards).all();
    const stats = [];

    for (const card of cards) {
      const text = await card.textContent();
      if (text) {
        stats.push({
          label: text.split('\n')[0] || '',
          value: text.split('\n')[1] || '',
        });
      }
    }

    return stats;
  }

  /**
   * Filter charts by period
   */
  async filterChartsByPeriod(period: 'today' | 'week' | 'month' | 'year') {
    const periodMap = {
      today: this.todayFilter,
      week: this.weekFilter,
      month: this.monthFilter,
      year: this.yearFilter,
    };

    await this.click(periodMap[period]);
    await this.wait(1000);
  }

  /**
   * Check if chart is visible
   */
  async isChartVisible(
    chartType: 'enrollment' | 'revenue' | 'growth' | 'completion'
  ): Promise<boolean> {
    const chartMap = {
      enrollment: this.enrollmentChart,
      revenue: this.revenueChart,
      growth: this.userGrowthChart,
      completion: this.courseCompletionChart,
    };

    return await this.isVisible(chartMap[chartType]);
  }

  /**
   * Get recent activity items
   */
  async getRecentActivity(): Promise<
    Array<{
      type: string;
      user: string;
      timestamp: string;
    }>
  > {
    const items = await this.page.locator(this.activityItem).all();
    const activities = [];

    for (const item of items) {
      activities.push({
        type: (await item.locator(this.activityType).textContent()) || '',
        user: (await item.locator(this.activityUser).textContent()) || '',
        timestamp: (await item.locator(this.activityTimestamp).textContent()) || '',
      });
    }

    return activities;
  }

  /**
   * View all activity
   */
  async viewAllActivity() {
    await this.click(this.viewAllActivityButton);
    await this.waitForNavigation();
  }

  /**
   * Click quick action
   */
  async clickQuickAction(
    action:
      | 'createUser'
      | 'createCourse'
      | 'manageContent'
      | 'viewReports'
      | 'moderateReviews'
      | 'manageEnrollments'
  ) {
    const actionMap = {
      createUser: this.createUserButton,
      createCourse: this.createCourseButton,
      manageContent: this.manageContentButton,
      viewReports: this.viewReportsButton,
      moderateReviews: this.moderateReviewsButton,
      manageEnrollments: this.manageEnrollmentsButton,
    };

    await this.click(actionMap[action]);
    await this.waitForNavigation();
  }

  /**
   * Get alerts count
   */
  async getAlertsCount(): Promise<number> {
    return await this.count(this.alertItem);
  }

  /**
   * Get critical alerts count
   */
  async getCriticalAlertsCount(): Promise<number> {
    return await this.count(this.criticalAlert);
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(index: number) {
    const alerts = await this.page.locator(this.alertItem).all();
    if (alerts[index]) {
      await alerts[index].locator(this.dismissAlertButton).click();
      await this.wait(500);
    }
  }

  /**
   * Check system status
   */
  async getSystemStatus(): Promise<{
    database: string;
    api: string;
    storage: string;
  }> {
    return {
      database: await this.getText(this.databaseStatus),
      api: await this.getText(this.apiStatus),
      storage: await this.getText(this.storageStatus),
    };
  }

  /**
   * Navigate to section
   */
  async navigateToSection(section: 'users' | 'courses' | 'analytics' | 'settings' | 'moderation') {
    const sectionMap = {
      users: this.usersLink,
      courses: this.coursesLink,
      analytics: this.analyticsLink,
      settings: this.settingsLink,
      moderation: this.moderationLink,
    };

    await this.click(sectionMap[section]);
    await this.waitForNavigation();
  }

  /**
   * Search globally
   */
  async globalSearchFor(query: string) {
    await this.fill(this.globalSearch, query);
    await this.pressKey('Enter');
    await this.wait(1000);
  }

  /**
   * Set date range
   */
  async setDateRange(startDate: string, endDate: string) {
    await this.click(this.dateRangePicker);
    await this.fill(this.startDateInput, startDate);
    await this.fill(this.endDateInput, endDate);
    await this.click(this.applyDateRangeButton);
    await this.wait(1000);
  }

  /**
   * Export data
   */
  async exportData() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.exportButton);
    return await downloadPromise;
  }

  /**
   * Download report
   */
  async downloadReport() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.downloadReportButton);
    return await downloadPromise;
  }

  /**
   * Get top courses
   */
  async getTopCourses(): Promise<string[]> {
    return await this.getAllTexts(`${this.topCoursesSection} [data-testid="course-title"]`);
  }

  /**
   * Get top instructors
   */
  async getTopInstructors(): Promise<string[]> {
    return await this.getAllTexts(`${this.topInstructorsSection} [data-testid="instructor-name"]`);
  }

  /**
   * Get top students
   */
  async getTopStudents(): Promise<string[]> {
    return await this.getAllTexts(`${this.topStudentsSection} [data-testid="student-name"]`);
  }

  /**
   * Assert on dashboard
   */
  async assertOnDashboard() {
    await this.assertVisible(this.pageTitle);
    await this.assertUrl('/admin');
  }

  /**
   * Assert stats are loaded
   */
  async assertStatsLoaded() {
    await this.assertVisible(this.overviewSection);
    await this.assertVisible(this.statsCards);
    const count = await this.count(this.statsCards);
    if (count === 0) {
      throw new Error('No stats cards found on dashboard');
    }
  }

  /**
   * Assert charts are visible
   */
  async assertChartsVisible() {
    const hasEnrollmentChart = await this.isVisible(this.enrollmentChart);
    const hasRevenueChart = await this.isVisible(this.revenueChart);

    if (!hasEnrollmentChart && !hasRevenueChart) {
      throw new Error('No charts visible on dashboard');
    }
  }
}
