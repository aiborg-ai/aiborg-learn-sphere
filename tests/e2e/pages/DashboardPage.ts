/**
 * Dashboard Page Object
 * Represents the main user dashboard
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class DashboardPage extends BasePage {
  // Page URL
  private readonly pageUrl = '/dashboard';

  // Header selectors
  private readonly userMenu = '[data-testid="user-menu"]';
  private readonly userMenuButton = 'button[aria-label="User menu"]';
  private readonly logoutButton = 'text=Logout';
  private readonly profileLink = 'text=Profile';

  // Navigation selectors
  private readonly coursesLink = 'a[href="/courses"]';
  private readonly vaultLink = 'a[href="/vault"]';
  private readonly eventsLink = 'a[href="/events"]';
  private readonly dashboardLink = 'a[href="/dashboard"]';

  // Dashboard content selectors
  private readonly welcomeMessage = '[data-testid="welcome-message"]';
  private readonly enrolledCourses = '[data-testid="enrolled-courses"]';
  private readonly courseCard = '[data-testid="course-card"]';
  private readonly progressSection = '[data-testid="progress-section"]';
  private readonly upcomingEvents = '[data-testid="upcoming-events"]';
  private readonly eventCard = '[data-testid="event-card"]';
  private readonly achievements = '[data-testid="achievements"]';
  private readonly recentActivity = '[data-testid="recent-activity"]';

  // Quick actions
  private readonly browseCoursesButton = 'button:has-text("Browse Courses")';
  private readonly viewVaultButton = 'button:has-text("View Vault")';
  private readonly claimFreePassButton = 'button:has-text("Claim Free Pass")';

  // Stats selectors
  private readonly totalCoursesCount = '[data-testid="total-courses"]';
  private readonly completedCoursesCount = '[data-testid="completed-courses"]';
  private readonly hoursLearned = '[data-testid="hours-learned"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard
   */
  async navigate() {
    await this.goto(this.pageUrl);
    await this.waitForPageLoad();
  }

  /**
   * Check if user is logged in (dashboard is visible)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.waitForSelector(this.welcomeMessage, 3000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getText(this.welcomeMessage);
  }

  /**
   * Get enrolled courses count
   */
  async getEnrolledCoursesCount(): Promise<number> {
    return await this.count(this.courseCard);
  }

  /**
   * Get course titles
   */
  async getCourseTitles(): Promise<string[]> {
    return await this.getAllTexts(`${this.courseCard} h3`);
  }

  /**
   * Click on a course by title
   */
  async clickCourse(title: string) {
    await this.click(`${this.courseCard}:has-text("${title}")`);
  }

  /**
   * Get upcoming events count
   */
  async getUpcomingEventsCount(): Promise<number> {
    return await this.count(this.eventCard);
  }

  /**
   * Get total courses stat
   */
  async getTotalCoursesStat(): Promise<string> {
    return await this.getText(this.totalCoursesCount);
  }

  /**
   * Get completed courses stat
   */
  async getCompletedCoursesStat(): Promise<string> {
    return await this.getText(this.completedCoursesCount);
  }

  /**
   * Get hours learned stat
   */
  async getHoursLearnedStat(): Promise<string> {
    return await this.getText(this.hoursLearned);
  }

  /**
   * Navigate to courses page
   */
  async navigateToCourses() {
    await this.click(this.coursesLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to vault page
   */
  async navigateToVault() {
    await this.click(this.vaultLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to events page
   */
  async navigateToEvents() {
    await this.click(this.eventsLink);
    await this.waitForNavigation();
  }

  /**
   * Navigate to profile page
   */
  async navigateToProfile() {
    await this.click(this.userMenuButton);
    await this.waitForSelector(this.profileLink);
    await this.click(this.profileLink);
    await this.waitForNavigation();
  }

  /**
   * Logout user
   */
  async logout() {
    await this.click(this.userMenuButton);
    await this.waitForSelector(this.logoutButton);
    await this.click(this.logoutButton);
    await this.waitForNavigation();
  }

  /**
   * Click browse courses button
   */
  async clickBrowseCourses() {
    await this.click(this.browseCoursesButton);
    await this.waitForNavigation();
  }

  /**
   * Click view vault button
   */
  async clickViewVault() {
    await this.click(this.viewVaultButton);
    await this.waitForNavigation();
  }

  /**
   * Click claim free pass button
   */
  async clickClaimFreePass() {
    await this.click(this.claimFreePassButton);
    await this.waitForNavigation();
  }

  /**
   * Assert dashboard is loaded
   */
  async assertDashboardLoaded() {
    await this.assertVisible(this.welcomeMessage);
    await this.assertUrl('/dashboard');
  }

  /**
   * Assert welcome message contains user name
   */
  async assertWelcomeMessageContains(name: string) {
    await this.assertText(this.welcomeMessage, name);
  }

  /**
   * Assert enrolled courses section is visible
   */
  async assertEnrolledCoursesVisible() {
    await this.assertVisible(this.enrolledCourses);
  }

  /**
   * Assert upcoming events section is visible
   */
  async assertUpcomingEventsVisible() {
    await this.assertVisible(this.upcomingEvents);
  }

  /**
   * Assert progress section is visible
   */
  async assertProgressSectionVisible() {
    await this.assertVisible(this.progressSection);
  }

  /**
   * Assert specific course is enrolled
   */
  async assertCourseEnrolled(courseTitle: string) {
    await this.assertVisible(`${this.courseCard}:has-text("${courseTitle}")`);
  }

  /**
   * Assert no courses enrolled
   */
  async assertNoCoursesEnrolled() {
    await this.assertCount(this.courseCard, 0);
  }

  /**
   * Check if course is enrolled
   */
  async isCourseEnrolled(courseTitle: string): Promise<boolean> {
    return await this.isVisible(`${this.courseCard}:has-text("${courseTitle}")`);
  }

  /**
   * Get progress percentage for a course
   */
  async getCourseProgress(courseTitle: string): Promise<number> {
    const progressText = await this.getText(
      `${this.courseCard}:has-text("${courseTitle}") [data-testid="course-progress"]`
    );
    return parseInt(progressText.replace('%', '')) || 0;
  }

  /**
   * Search for content (if search is available on dashboard)
   */
  async search(query: string) {
    const searchInput = 'input[placeholder*="Search"]';
    await this.fill(searchInput, query);
    await this.pressKey('Enter');
    await this.wait(500);
  }

  /**
   * Check if vault access is available
   */
  async hasVaultAccess(): Promise<boolean> {
    return await this.isVisible(this.viewVaultButton);
  }

  /**
   * Get recent activity items
   */
  async getRecentActivityCount(): Promise<number> {
    return await this.count(`${this.recentActivity} [data-testid="activity-item"]`);
  }

  /**
   * Assert user menu is accessible
   */
  async assertUserMenuAccessible() {
    await this.assertVisible(this.userMenuButton);
  }

  /**
   * Assert navigation links are visible
   */
  async assertNavigationLinksVisible() {
    await this.assertVisible(this.coursesLink);
    await this.assertVisible(this.dashboardLink);
  }
}
