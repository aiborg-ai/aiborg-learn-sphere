/**
 * Courses Page Object
 * Represents the courses listing and browsing page
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class CoursesPage extends BasePage {
  // Page URL
  private readonly pageUrl = '/courses';

  // Header and navigation
  private readonly pageTitle = 'h1:has-text("Courses")';
  private readonly searchInput = 'input[placeholder*="Search"]';
  private readonly searchButton = 'button:has-text("Search")';

  // Filters and sorting
  private readonly categoryFilter = '[data-testid="category-filter"]';
  private readonly levelFilter = '[data-testid="level-filter"]';
  private readonly sortDropdown = '[data-testid="sort-dropdown"]';
  private readonly filterButton = 'button:has-text("Filter")';
  private readonly clearFiltersButton = 'button:has-text("Clear Filters")';

  // Course cards
  private readonly courseCard = '[data-testid="course-card"]';
  private readonly courseTitle = '[data-testid="course-title"]';
  private readonly coursePrice = '[data-testid="course-price"]';
  private readonly courseLevel = '[data-testid="course-level"]';
  private readonly courseInstructor = '[data-testid="course-instructor"]';
  private readonly courseDuration = '[data-testid="course-duration"]';
  private readonly enrollButton = 'button:has-text("Enroll")';
  private readonly viewDetailsButton = 'button:has-text("View Details")';

  // Course details modal
  private readonly courseModal = '[data-testid="course-modal"]';
  private readonly modalTitle = `${this.courseModal} h2`;
  private readonly modalDescription = `${this.courseModal} [data-testid="description"]`;
  private readonly modalEnrollButton = `${this.courseModal} button:has-text("Enroll")`;
  private readonly modalCloseButton = `${this.courseModal} button[aria-label="Close"]`;

  // Pagination
  private readonly pagination = '[data-testid="pagination"]';
  private readonly nextPageButton = 'button:has-text("Next")';
  private readonly prevPageButton = 'button:has-text("Previous")';
  private readonly pageNumber = '[data-testid="page-number"]';

  // Empty state
  private readonly emptyState = '[data-testid="empty-state"]';
  private readonly noResultsMessage = 'text=No courses found';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to courses page
   */
  async navigate() {
    await this.goto(this.pageUrl);
    await this.waitForPageLoad();
  }

  /**
   * Get all course titles
   */
  async getCourseTitles(): Promise<string[]> {
    return await this.getAllTexts(this.courseTitle);
  }

  /**
   * Get course count
   */
  async getCourseCount(): Promise<number> {
    return await this.count(this.courseCard);
  }

  /**
   * Search for courses
   */
  async searchCourses(query: string) {
    await this.fill(this.searchInput, query);
    await this.pressKey('Enter');
    await this.wait(1000); // Wait for search results
  }

  /**
   * Filter courses by category
   */
  async filterByCategory(category: string) {
    await this.click(this.categoryFilter);
    await this.wait(300);
    await this.click(`text=${category}`);
    await this.wait(1000); // Wait for filter results
  }

  /**
   * Filter courses by level
   */
  async filterByLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    await this.click(this.levelFilter);
    await this.wait(300);
    await this.click(`text=${level}`);
    await this.wait(1000);
  }

  /**
   * Sort courses
   */
  async sortBy(option: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'popular') {
    await this.click(this.sortDropdown);
    await this.wait(300);
    await this.click(`text=${option}`);
    await this.wait(1000);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.click(this.clearFiltersButton);
    await this.wait(1000);
  }

  /**
   * Click on a course by title
   */
  async clickCourse(title: string) {
    await this.click(`${this.courseCard}:has-text("${title}")`);
  }

  /**
   * Click enroll button on a course card
   */
  async clickEnrollOnCourse(title: string) {
    const courseCard = this.page.locator(this.courseCard).filter({ hasText: title });
    await courseCard.locator(this.enrollButton).click();
  }

  /**
   * Click view details on a course card
   */
  async clickViewDetails(title: string) {
    const courseCard = this.page.locator(this.courseCard).filter({ hasText: title });
    await courseCard.locator(this.viewDetailsButton).click();
    await this.waitForSelector(this.courseModal);
  }

  /**
   * Get course details from card
   */
  async getCourseDetails(title: string): Promise<{
    title: string;
    price: string;
    level: string;
    instructor: string;
    duration: string;
  }> {
    const courseCard = this.page.locator(this.courseCard).filter({ hasText: title });

    return {
      title: (await courseCard.locator(this.courseTitle).textContent()) || '',
      price: (await courseCard.locator(this.coursePrice).textContent()) || '',
      level: (await courseCard.locator(this.courseLevel).textContent()) || '',
      instructor: (await courseCard.locator(this.courseInstructor).textContent()) || '',
      duration: (await courseCard.locator(this.courseDuration).textContent()) || '',
    };
  }

  /**
   * Check if course is displayed
   */
  async isCourseDisplayed(title: string): Promise<boolean> {
    return await this.isVisible(`${this.courseCard}:has-text("${title}")`);
  }

  /**
   * Enroll from course details modal
   */
  async enrollFromModal() {
    await this.waitForSelector(this.courseModal);
    await this.click(this.modalEnrollButton);
  }

  /**
   * Close course details modal
   */
  async closeModal() {
    await this.click(this.modalCloseButton);
    await this.waitForSelectorHidden(this.courseModal);
  }

  /**
   * Get modal course title
   */
  async getModalTitle(): Promise<string> {
    return await this.getText(this.modalTitle);
  }

  /**
   * Get modal course description
   */
  async getModalDescription(): Promise<string> {
    return await this.getText(this.modalDescription);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.click(this.nextPageButton);
    await this.wait(1000);
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.click(this.prevPageButton);
    await this.wait(1000);
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const pageText = await this.getText(this.pageNumber);
    return parseInt(pageText) || 1;
  }

  /**
   * Check if pagination is visible
   */
  async hasPagination(): Promise<boolean> {
    return await this.isVisible(this.pagination);
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    return await this.isVisible(this.emptyState);
  }

  /**
   * Assert courses page loaded
   */
  async assertPageLoaded() {
    await this.assertVisible(this.pageTitle);
    await this.assertUrl('/courses');
  }

  /**
   * Assert course is displayed
   */
  async assertCourseDisplayed(title: string) {
    await this.assertVisible(`${this.courseCard}:has-text("${title}")`);
  }

  /**
   * Assert no courses found
   */
  async assertNoCoursesFound() {
    await this.assertVisible(this.noResultsMessage);
  }

  /**
   * Assert course count
   */
  async assertCourseCount(expectedCount: number) {
    await this.assertCount(this.courseCard, expectedCount);
  }

  /**
   * Get all visible courses
   */
  async getAllVisibleCourses(): Promise<
    Array<{
      title: string;
      price: string;
    }>
  > {
    const cards = await this.page.locator(this.courseCard).all();
    const courses = [];

    for (const card of cards) {
      const title = (await card.locator(this.courseTitle).textContent()) || '';
      const price = (await card.locator(this.coursePrice).textContent()) || '';
      courses.push({ title, price });
    }

    return courses;
  }

  /**
   * Check if course has enroll button
   */
  async hasEnrollButton(title: string): Promise<boolean> {
    const courseCard = this.page.locator(this.courseCard).filter({ hasText: title });
    return await courseCard.locator(this.enrollButton).isVisible();
  }

  /**
   * Get course price
   */
  async getCoursePrice(title: string): Promise<string> {
    const courseCard = this.page.locator(this.courseCard).filter({ hasText: title });
    return (await courseCard.locator(this.coursePrice).textContent()) || '';
  }

  /**
   * Check if course is free
   */
  async isCourseFree(title: string): Promise<boolean> {
    const price = await this.getCoursePrice(title);
    return price.toLowerCase().includes('free') || price.includes('$0');
  }
}
