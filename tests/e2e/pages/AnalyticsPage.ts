/**
 * Analytics Page Object
 * Represents analytics dashboard with reports, charts, and data exports
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class AnalyticsPage extends BasePage {
  // Page URL
  private readonly analyticsUrl = '/admin/analytics';

  // Header and navigation
  private readonly pageTitle = 'h1:has-text("Analytics")';
  private readonly overviewTab = 'button:has-text("Overview")';
  private readonly usersTab = 'button:has-text("Users")';
  private readonly coursesTab = 'button:has-text("Courses")';
  private readonly revenueTab = 'button:has-text("Revenue")';
  private readonly engagementTab = 'button:has-text("Engagement")';

  // Date range selector
  private readonly dateRangePicker = '[data-testid="date-range-picker"]';
  private readonly startDateInput = 'input[name="startDate"]';
  private readonly endDateInput = 'input[name="endDate"]';
  private readonly applyDateButton = 'button:has-text("Apply")';
  private readonly todayButton = 'button:has-text("Today")';
  private readonly last7DaysButton = 'button:has-text("Last 7 Days")';
  private readonly last30DaysButton = 'button:has-text("Last 30 Days")';
  private readonly last90DaysButton = 'button:has-text("Last 90 Days")';
  private readonly thisYearButton = 'button:has-text("This Year")';

  // Key metrics cards
  private readonly metricsSection = '[data-testid="metrics-section"]';
  private readonly metricCard = '[data-testid="metric-card"]';
  private readonly totalUsersMetric = '[data-testid="metric-total-users"]';
  private readonly activeUsersMetric = '[data-testid="metric-active-users"]';
  private readonly newUsersMetric = '[data-testid="metric-new-users"]';
  private readonly totalRevenueMetric = '[data-testid="metric-total-revenue"]';
  private readonly avgRevenueMetric = '[data-testid="metric-avg-revenue"]';
  private readonly enrollmentsMetric = '[data-testid="metric-enrollments"]';
  private readonly completionRateMetric = '[data-testid="metric-completion-rate"]';
  private readonly engagementScoreMetric = '[data-testid="metric-engagement-score"]';

  // Charts
  private readonly chartsSection = '[data-testid="charts-section"]';
  private readonly userGrowthChart = '[data-testid="chart-user-growth"]';
  private readonly revenueChart = '[data-testid="chart-revenue"]';
  private readonly enrollmentChart = '[data-testid="chart-enrollment"]';
  private readonly completionChart = '[data-testid="chart-completion"]';
  private readonly engagementChart = '[data-testid="chart-engagement"]';
  private readonly coursePopularityChart = '[data-testid="chart-course-popularity"]';
  private readonly deviceUsageChart = '[data-testid="chart-device-usage"]';
  private readonly geographicChart = '[data-testid="chart-geographic"]';

  // Chart controls
  private readonly chartTypeSelector = '[data-testid="chart-type"]';
  private readonly lineChartOption = 'button:has-text("Line")';
  private readonly barChartOption = 'button:has-text("Bar")';
  private readonly pieChartOption = 'button:has-text("Pie")';
  private readonly areaChartOption = 'button:has-text("Area")';

  // Filters
  private readonly filtersSection = '[data-testid="filters-section"]';
  private readonly courseFilter = 'select[name="course"]';
  private readonly instructorFilter = 'select[name="instructor"]';
  private readonly categoryFilter = 'select[name="category"]';
  private readonly levelFilter = 'select[name="level"]';
  private readonly statusFilter = 'select[name="status"]';
  private readonly applyFiltersButton = 'button:has-text("Apply Filters")';
  private readonly clearFiltersButton = 'button:has-text("Clear Filters")';

  // Reports section
  private readonly reportsSection = '[data-testid="reports-section"]';
  private readonly generateReportButton = 'button:has-text("Generate Report")';
  private readonly scheduleReportButton = 'button:has-text("Schedule Report")';
  private readonly savedReportsList = '[data-testid="saved-reports"]';
  private readonly reportItem = '[data-testid="report-item"]';
  private readonly reportName = '[data-testid="report-name"]';
  private readonly reportDate = '[data-testid="report-date"]';
  private readonly downloadReportButton = 'button:has-text("Download")';
  private readonly deleteReportButton = 'button:has-text("Delete")';

  // Export options
  private readonly exportButton = 'button:has-text("Export")';
  private readonly exportDropdown = '[data-testid="export-dropdown"]';
  private readonly exportCSVButton = 'button:has-text("Export CSV")';
  private readonly exportPDFButton = 'button:has-text("Export PDF")';
  private readonly exportExcelButton = 'button:has-text("Export Excel")';
  private readonly exportJSONButton = 'button:has-text("Export JSON")';

  // Data tables
  private readonly dataTable = '[data-testid="analytics-table"]';
  private readonly tableHeader = '[data-testid="table-header"]';
  private readonly tableRow = '[data-testid="table-row"]';
  private readonly sortButton = '[data-testid="sort-button"]';
  private readonly paginationControls = '[data-testid="pagination"]';

  // User analytics
  private readonly userRegistrationChart = '[data-testid="user-registration-chart"]';
  private readonly userRetentionChart = '[data-testid="user-retention-chart"]';
  private readonly userActivityChart = '[data-testid="user-activity-chart"]';
  private readonly topUsersTable = '[data-testid="top-users-table"]';
  private readonly userDemographics = '[data-testid="user-demographics"]';

  // Course analytics
  private readonly courseEnrollmentChart = '[data-testid="course-enrollment-chart"]';
  private readonly courseCompletionChart = '[data-testid="course-completion-chart"]';
  private readonly topCoursesTable = '[data-testid="top-courses-table"]';
  private readonly courseRatingsChart = '[data-testid="course-ratings-chart"]';
  private readonly courseRevenueChart = '[data-testid="course-revenue-chart"]';

  // Revenue analytics
  private readonly revenueOverTimeChart = '[data-testid="revenue-over-time-chart"]';
  private readonly revenueBySourceChart = '[data-testid="revenue-by-source-chart"]';
  private readonly revenueByCourseChart = '[data-testid="revenue-by-course-chart"]';
  private readonly monthlyRecurringRevenue = '[data-testid="mrr"]';
  private readonly averageOrderValue = '[data-testid="aov"]';
  private readonly conversionRate = '[data-testid="conversion-rate"]';

  // Engagement analytics
  private readonly sessionDurationChart = '[data-testid="session-duration-chart"]';
  private readonly pageViewsChart = '[data-testid="page-views-chart"]';
  private readonly bounceRateMetric = '[data-testid="bounce-rate"]';
  private readonly avgTimeOnSiteMetric = '[data-testid="avg-time-on-site"]';
  private readonly mostViewedContent = '[data-testid="most-viewed-content"]';

  // Comparison mode
  private readonly comparisonToggle = 'button:has-text("Compare")';
  private readonly compareWithDropdown = '[data-testid="compare-with"]';
  private readonly previousPeriodOption = 'button:has-text("Previous Period")';
  private readonly lastYearOption = 'button:has-text("Last Year")';
  private readonly customPeriodOption = 'button:has-text("Custom Period")';

  // Real-time analytics
  private readonly realTimeSection = '[data-testid="realtime-section"]';
  private readonly activeUsersNow = '[data-testid="active-users-now"]';
  private readonly currentSessions = '[data-testid="current-sessions"]';
  private readonly realtimeActivityFeed = '[data-testid="realtime-activity"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to analytics page
   */
  async navigate() {
    await this.goto(this.analyticsUrl);
    await this.waitForPageLoad();
  }

  /**
   * Switch to tab
   */
  async switchToTab(tab: 'overview' | 'users' | 'courses' | 'revenue' | 'engagement') {
    const tabMap = {
      overview: this.overviewTab,
      users: this.usersTab,
      courses: this.coursesTab,
      revenue: this.revenueTab,
      engagement: this.engagementTab,
    };

    await this.click(tabMap[tab]);
    await this.wait(1000);
  }

  /**
   * Set date range with quick select
   */
  async setQuickDateRange(range: 'today' | 'last7Days' | 'last30Days' | 'last90Days' | 'thisYear') {
    const rangeMap = {
      today: this.todayButton,
      last7Days: this.last7DaysButton,
      last30Days: this.last30DaysButton,
      last90Days: this.last90DaysButton,
      thisYear: this.thisYearButton,
    };

    await this.click(rangeMap[range]);
    await this.wait(1000);
  }

  /**
   * Set custom date range
   */
  async setCustomDateRange(startDate: string, endDate: string) {
    await this.click(this.dateRangePicker);
    await this.fill(this.startDateInput, startDate);
    await this.fill(this.endDateInput, endDate);
    await this.click(this.applyDateButton);
    await this.wait(1000);
  }

  /**
   * Get all key metrics
   */
  async getAllMetrics(): Promise<
    Array<{
      label: string;
      value: string;
    }>
  > {
    const cards = await this.page.locator(this.metricCard).all();
    const metrics = [];

    for (const card of cards) {
      const text = await card.textContent();
      if (text) {
        const lines = text.split('\n').filter(line => line.trim());
        metrics.push({
          label: lines[0] || '',
          value: lines[1] || '',
        });
      }
    }

    return metrics;
  }

  /**
   * Get specific metric value
   */
  async getMetricValue(
    metric:
      | 'totalUsers'
      | 'activeUsers'
      | 'newUsers'
      | 'totalRevenue'
      | 'enrollments'
      | 'completionRate'
  ): Promise<string> {
    const metricMap = {
      totalUsers: this.totalUsersMetric,
      activeUsers: this.activeUsersMetric,
      newUsers: this.newUsersMetric,
      totalRevenue: this.totalRevenueMetric,
      enrollments: this.enrollmentsMetric,
      completionRate: this.completionRateMetric,
    };

    return await this.getText(metricMap[metric]);
  }

  /**
   * Check if chart is visible
   */
  async isChartVisible(
    chartType: 'userGrowth' | 'revenue' | 'enrollment' | 'completion' | 'engagement'
  ): Promise<boolean> {
    const chartMap = {
      userGrowth: this.userGrowthChart,
      revenue: this.revenueChart,
      enrollment: this.enrollmentChart,
      completion: this.completionChart,
      engagement: this.engagementChart,
    };

    return await this.isVisible(chartMap[chartType]);
  }

  /**
   * Change chart type
   */
  async changeChartType(type: 'line' | 'bar' | 'pie' | 'area') {
    const typeMap = {
      line: this.lineChartOption,
      bar: this.barChartOption,
      pie: this.pieChartOption,
      area: this.areaChartOption,
    };

    await this.click(this.chartTypeSelector);
    await this.wait(300);
    await this.click(typeMap[type]);
    await this.wait(1000);
  }

  /**
   * Apply filters
   */
  async applyFilters(filters: {
    course?: string;
    instructor?: string;
    category?: string;
    level?: string;
    status?: string;
  }) {
    if (filters.course && (await this.isVisible(this.courseFilter))) {
      await this.selectOption(this.courseFilter, filters.course);
    }

    if (filters.instructor && (await this.isVisible(this.instructorFilter))) {
      await this.selectOption(this.instructorFilter, filters.instructor);
    }

    if (filters.category && (await this.isVisible(this.categoryFilter))) {
      await this.selectOption(this.categoryFilter, filters.category);
    }

    if (filters.level && (await this.isVisible(this.levelFilter))) {
      await this.selectOption(this.levelFilter, filters.level);
    }

    if (filters.status && (await this.isVisible(this.statusFilter))) {
      await this.selectOption(this.statusFilter, filters.status);
    }

    await this.click(this.applyFiltersButton);
    await this.wait(1000);
  }

  /**
   * Clear filters
   */
  async clearFilters() {
    await this.click(this.clearFiltersButton);
    await this.wait(1000);
  }

  /**
   * Generate report
   */
  async generateReport() {
    await this.click(this.generateReportButton);
    await this.wait(2000);
  }

  /**
   * Schedule report
   */
  async scheduleReport() {
    await this.click(this.scheduleReportButton);
    await this.wait(500);
  }

  /**
   * Get saved reports
   */
  async getSavedReports(): Promise<
    Array<{
      name: string;
      date: string;
    }>
  > {
    const items = await this.page.locator(this.reportItem).all();
    const reports = [];

    for (const item of items) {
      reports.push({
        name: (await item.locator(this.reportName).textContent()) || '',
        date: (await item.locator(this.reportDate).textContent()) || '',
      });
    }

    return reports;
  }

  /**
   * Download report
   */
  async downloadReport(index: number) {
    const items = await this.page.locator(this.reportItem).all();
    if (items[index]) {
      const downloadPromise = this.page.waitForEvent('download');
      await items[index].locator(this.downloadReportButton).click();
      return await downloadPromise;
    }
  }

  /**
   * Delete report
   */
  async deleteReport(index: number) {
    const items = await this.page.locator(this.reportItem).all();
    if (items[index]) {
      await items[index].locator(this.deleteReportButton).click();
      await this.wait(1000);
    }
  }

  /**
   * Export data
   */
  async exportData(format: 'csv' | 'pdf' | 'excel' | 'json') {
    const formatMap = {
      csv: this.exportCSVButton,
      pdf: this.exportPDFButton,
      excel: this.exportExcelButton,
      json: this.exportJSONButton,
    };

    await this.click(this.exportButton);
    await this.wait(300);

    const downloadPromise = this.page.waitForEvent('download');
    await this.click(formatMap[format]);
    return await downloadPromise;
  }

  /**
   * Get table data
   */
  async getTableData(): Promise<Array<Record<string, string>>> {
    const headers = await this.page.locator(`${this.tableHeader} th`).allTextContents();
    const rows = await this.page.locator(this.tableRow).all();
    const data = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      const rowData: Record<string, string> = {};

      headers.forEach((header, index) => {
        rowData[header] = cells[index] || '';
      });

      data.push(rowData);
    }

    return data;
  }

  /**
   * Sort table by column
   */
  async sortTableBy(columnIndex: number) {
    const sortButtons = await this.page.locator(this.sortButton).all();
    if (sortButtons[columnIndex]) {
      await sortButtons[columnIndex].click();
      await this.wait(1000);
    }
  }

  /**
   * Enable comparison mode
   */
  async enableComparison(compareTo: 'previousPeriod' | 'lastYear' | 'custom') {
    await this.click(this.comparisonToggle);
    await this.wait(300);

    const compareMap = {
      previousPeriod: this.previousPeriodOption,
      lastYear: this.lastYearOption,
      custom: this.customPeriodOption,
    };

    await this.click(compareMap[compareTo]);
    await this.wait(1000);
  }

  /**
   * Get real-time active users
   */
  async getActiveUsersNow(): Promise<number> {
    const text = await this.getText(this.activeUsersNow);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get current sessions
   */
  async getCurrentSessions(): Promise<number> {
    const text = await this.getText(this.currentSessions);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get real-time activity
   */
  async getRealtimeActivity(): Promise<string[]> {
    return await this.getAllTexts(`${this.realtimeActivityFeed} [data-testid="activity-item"]`);
  }

  // ==================== User Analytics ====================

  /**
   * Get top users
   */
  async getTopUsers(): Promise<Array<Record<string, string>>> {
    const rows = await this.page.locator(`${this.topUsersTable} ${this.tableRow}`).all();
    const users = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      users.push({
        name: cells[0] || '',
        enrollments: cells[1] || '',
        completions: cells[2] || '',
        timeSpent: cells[3] || '',
      });
    }

    return users;
  }

  // ==================== Course Analytics ====================

  /**
   * Get top courses
   */
  async getTopCourses(): Promise<Array<Record<string, string>>> {
    const rows = await this.page.locator(`${this.topCoursesTable} ${this.tableRow}`).all();
    const courses = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      courses.push({
        title: cells[0] || '',
        enrollments: cells[1] || '',
        completions: cells[2] || '',
        revenue: cells[3] || '',
        rating: cells[4] || '',
      });
    }

    return courses;
  }

  // ==================== Revenue Analytics ====================

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(): Promise<{
    mrr: string;
    aov: string;
    conversionRate: string;
  }> {
    return {
      mrr: await this.getText(this.monthlyRecurringRevenue),
      aov: await this.getText(this.averageOrderValue),
      conversionRate: await this.getText(this.conversionRate),
    };
  }

  // ==================== Engagement Analytics ====================

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(): Promise<{
    bounceRate: string;
    avgTimeOnSite: string;
  }> {
    return {
      bounceRate: await this.getText(this.bounceRateMetric),
      avgTimeOnSite: await this.getText(this.avgTimeOnSiteMetric),
    };
  }

  /**
   * Get most viewed content
   */
  async getMostViewedContent(): Promise<string[]> {
    return await this.getAllTexts(`${this.mostViewedContent} [data-testid="content-item"]`);
  }

  /**
   * Assert on analytics page
   */
  async assertOnAnalyticsPage() {
    await this.assertVisible(this.pageTitle);
    await this.assertUrl('/admin/analytics');
  }

  /**
   * Assert metrics loaded
   */
  async assertMetricsLoaded() {
    await this.assertVisible(this.metricsSection);
    const count = await this.count(this.metricCard);
    if (count === 0) {
      throw new Error('No metrics loaded');
    }
  }

  /**
   * Assert charts visible
   */
  async assertChartsVisible() {
    await this.assertVisible(this.chartsSection);
  }
}
