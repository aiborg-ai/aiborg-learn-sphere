/**
 * Content Moderation Page Object
 * Represents content review, course approval, and content reporting
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class ContentModerationPage extends BasePage {
  // Page URL
  private readonly moderationUrl = '/admin/moderation';

  // Header and navigation
  private readonly pageTitle = 'h1:has-text("Content Moderation")';
  private readonly reviewsTab = 'button:has-text("Reviews")';
  private readonly coursesTab = 'button:has-text("Courses")';
  private readonly reportsTab = 'button:has-text("Reports")';
  private readonly commentsTab = 'button:has-text("Comments")';

  // Stats cards
  private readonly pendingReviewsCount = '[data-testid="pending-reviews-count"]';
  private readonly pendingCoursesCount = '[data-testid="pending-courses-count"]';
  private readonly openReportsCount = '[data-testid="open-reports-count"]';
  private readonly flaggedCommentsCount = '[data-testid="flagged-comments-count"]';

  // Reviews moderation
  private readonly reviewsList = '[data-testid="reviews-list"]';
  private readonly reviewItem = '[data-testid="review-item"]';
  private readonly reviewAuthor = '[data-testid="review-author"]';
  private readonly reviewCourse = '[data-testid="review-course"]';
  private readonly reviewRating = '[data-testid="review-rating"]';
  private readonly reviewContent = '[data-testid="review-content"]';
  private readonly reviewDate = '[data-testid="review-date"]';
  private readonly reviewStatus = '[data-testid="review-status"]';
  private readonly approveReviewButton = 'button:has-text("Approve")';
  private readonly rejectReviewButton = 'button:has-text("Reject")';
  private readonly flagReviewButton = 'button:has-text("Flag")';
  private readonly viewReviewDetailsButton = 'button:has-text("View Details")';

  // Course moderation
  private readonly coursesList = '[data-testid="courses-list"]';
  private readonly courseItem = '[data-testid="course-item"]';
  private readonly courseTitle = '[data-testid="course-title"]';
  private readonly courseInstructor = '[data-testid="course-instructor"]';
  private readonly courseCategory = '[data-testid="course-category"]';
  private readonly courseStatus = '[data-testid="course-status"]';
  private readonly courseSubmitDate = '[data-testid="course-submit-date"]';
  private readonly approveCourseButton = 'button:has-text("Approve")';
  private readonly rejectCourseButton = 'button:has-text("Reject")';
  private readonly requestChangesButton = 'button:has-text("Request Changes")';
  private readonly viewCourseDetailsButton = 'button:has-text("View Course")';

  // Content reports
  private readonly reportsList = '[data-testid="reports-list"]';
  private readonly reportItem = '[data-testid="report-item"]';
  private readonly reportType = '[data-testid="report-type"]';
  private readonly reportReason = '[data-testid="report-reason"]';
  private readonly reportedBy = '[data-testid="reported-by"]';
  private readonly reportedContent = '[data-testid="reported-content"]';
  private readonly reportDate = '[data-testid="report-date"]';
  private readonly reportPriority = '[data-testid="report-priority"]';
  private readonly reviewReportButton = 'button:has-text("Review")';
  private readonly dismissReportButton = 'button:has-text("Dismiss")';
  private readonly takeActionButton = 'button:has-text("Take Action")';

  // Comments moderation
  private readonly commentsList = '[data-testid="comments-list"]';
  private readonly commentItem = '[data-testid="comment-item"]';
  private readonly commentAuthor = '[data-testid="comment-author"]';
  private readonly commentContent = '[data-testid="comment-content"]';
  private readonly commentLocation = '[data-testid="comment-location"]';
  private readonly commentDate = '[data-testid="comment-date"]';
  private readonly approveCommentButton = 'button:has-text("Approve")';
  private readonly deleteCommentButton = 'button:has-text("Delete")';
  private readonly hideCommentButton = 'button:has-text("Hide")';

  // Filters and search
  private readonly searchInput = 'input[placeholder*="Search"]';
  private readonly statusFilter = '[data-testid="status-filter"]';
  private readonly dateFilter = '[data-testid="date-filter"]';
  private readonly priorityFilter = '[data-testid="priority-filter"]';
  private readonly categoryFilter = '[data-testid="category-filter"]';
  private readonly applyFiltersButton = 'button:has-text("Apply Filters")';
  private readonly clearFiltersButton = 'button:has-text("Clear Filters")';

  // Bulk actions
  private readonly selectAllCheckbox = 'input[type="checkbox"][aria-label="Select all"]';
  private readonly itemCheckbox = 'input[type="checkbox"][data-testid="item-checkbox"]';
  private readonly bulkApproveButton = 'button:has-text("Approve Selected")';
  private readonly bulkRejectButton = 'button:has-text("Reject Selected")';
  private readonly bulkDeleteButton = 'button:has-text("Delete Selected")';

  // Moderation details modal
  private readonly detailsModal = '[data-testid="moderation-details-modal"]';
  private readonly modalTitle = `${this.detailsModal} h2`;
  private readonly modalContent = `${this.detailsModal} [data-testid="modal-content"]`;
  private readonly modalActions = `${this.detailsModal} [data-testid="modal-actions"]`;
  private readonly closeModalButton = `${this.detailsModal} button[aria-label="Close"]`;

  // Action reason modal
  private readonly actionReasonModal = '[data-testid="action-reason-modal"]';
  private readonly reasonTextarea = 'textarea[name="reason"]';
  private readonly submitActionButton = 'button:has-text("Submit")';
  private readonly cancelActionButton = 'button:has-text("Cancel")';

  // Moderation history
  private readonly historyTab = 'button:has-text("History")';
  private readonly historyList = '[data-testid="history-list"]';
  private readonly historyItem = '[data-testid="history-item"]';
  private readonly historyAction = '[data-testid="history-action"]';
  private readonly historyModerator = '[data-testid="history-moderator"]';
  private readonly historyTimestamp = '[data-testid="history-timestamp"]';

  // Pagination
  private readonly pagination = '[data-testid="pagination"]';
  private readonly nextPageButton = 'button:has-text("Next")';
  private readonly prevPageButton = 'button:has-text("Previous")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to moderation page
   */
  async navigate() {
    await this.goto(this.moderationUrl);
    await this.waitForPageLoad();
  }

  /**
   * Switch to tab
   */
  async switchToTab(tab: 'reviews' | 'courses' | 'reports' | 'comments') {
    const tabMap = {
      reviews: this.reviewsTab,
      courses: this.coursesTab,
      reports: this.reportsTab,
      comments: this.commentsTab,
    };

    await this.click(tabMap[tab]);
    await this.wait(1000);
  }

  /**
   * Get pending counts
   */
  async getPendingCounts(): Promise<{
    reviews: number;
    courses: number;
    reports: number;
    comments: number;
  }> {
    return {
      reviews: parseInt((await this.getText(this.pendingReviewsCount)).match(/\d+/)?.[0] || '0'),
      courses: parseInt((await this.getText(this.pendingCoursesCount)).match(/\d+/)?.[0] || '0'),
      reports: parseInt((await this.getText(this.openReportsCount)).match(/\d+/)?.[0] || '0'),
      comments: parseInt((await this.getText(this.flaggedCommentsCount)).match(/\d+/)?.[0] || '0'),
    };
  }

  // ==================== Reviews Moderation ====================

  /**
   * Get all reviews
   */
  async getAllReviews(): Promise<
    Array<{
      author: string;
      course: string;
      rating: string;
      content: string;
      date: string;
      status: string;
    }>
  > {
    const items = await this.page.locator(this.reviewItem).all();
    const reviews = [];

    for (const item of items) {
      reviews.push({
        author: (await item.locator(this.reviewAuthor).textContent()) || '',
        course: (await item.locator(this.reviewCourse).textContent()) || '',
        rating: (await item.locator(this.reviewRating).textContent()) || '',
        content: (await item.locator(this.reviewContent).textContent()) || '',
        date: (await item.locator(this.reviewDate).textContent()) || '',
        status: (await item.locator(this.reviewStatus).textContent()) || '',
      });
    }

    return reviews;
  }

  /**
   * Get reviews count
   */
  async getReviewsCount(): Promise<number> {
    return await this.count(this.reviewItem);
  }

  /**
   * Approve review
   */
  async approveReview(index: number) {
    const items = await this.page.locator(this.reviewItem).all();
    if (items[index]) {
      await items[index].locator(this.approveReviewButton).click();
      await this.wait(1000);
    }
  }

  /**
   * Reject review with reason
   */
  async rejectReview(index: number, reason: string) {
    const items = await this.page.locator(this.reviewItem).all();
    if (items[index]) {
      await items[index].locator(this.rejectReviewButton).click();
      await this.waitForSelector(this.actionReasonModal);
      await this.fill(this.reasonTextarea, reason);
      await this.click(this.submitActionButton);
      await this.wait(1000);
    }
  }

  /**
   * Flag review
   */
  async flagReview(index: number) {
    const items = await this.page.locator(this.reviewItem).all();
    if (items[index]) {
      await items[index].locator(this.flagReviewButton).click();
      await this.wait(1000);
    }
  }

  /**
   * View review details
   */
  async viewReviewDetails(index: number) {
    const items = await this.page.locator(this.reviewItem).all();
    if (items[index]) {
      await items[index].locator(this.viewReviewDetailsButton).click();
      await this.waitForSelector(this.detailsModal);
    }
  }

  // ==================== Courses Moderation ====================

  /**
   * Get all courses
   */
  async getAllCourses(): Promise<
    Array<{
      title: string;
      instructor: string;
      category: string;
      status: string;
      submitDate: string;
    }>
  > {
    const items = await this.page.locator(this.courseItem).all();
    const courses = [];

    for (const item of items) {
      courses.push({
        title: (await item.locator(this.courseTitle).textContent()) || '',
        instructor: (await item.locator(this.courseInstructor).textContent()) || '',
        category: (await item.locator(this.courseCategory).textContent()) || '',
        status: (await item.locator(this.courseStatus).textContent()) || '',
        submitDate: (await item.locator(this.courseSubmitDate).textContent()) || '',
      });
    }

    return courses;
  }

  /**
   * Get courses count
   */
  async getCoursesCount(): Promise<number> {
    return await this.count(this.courseItem);
  }

  /**
   * Approve course
   */
  async approveCourse(index: number) {
    const items = await this.page.locator(this.courseItem).all();
    if (items[index]) {
      await items[index].locator(this.approveCourseButton).click();
      await this.wait(1000);
    }
  }

  /**
   * Reject course with reason
   */
  async rejectCourse(index: number, reason: string) {
    const items = await this.page.locator(this.courseItem).all();
    if (items[index]) {
      await items[index].locator(this.rejectCourseButton).click();
      await this.waitForSelector(this.actionReasonModal);
      await this.fill(this.reasonTextarea, reason);
      await this.click(this.submitActionButton);
      await this.wait(1000);
    }
  }

  /**
   * Request changes for course
   */
  async requestCourseChanges(index: number, changes: string) {
    const items = await this.page.locator(this.courseItem).all();
    if (items[index]) {
      await items[index].locator(this.requestChangesButton).click();
      await this.waitForSelector(this.actionReasonModal);
      await this.fill(this.reasonTextarea, changes);
      await this.click(this.submitActionButton);
      await this.wait(1000);
    }
  }

  /**
   * View course details
   */
  async viewCourseDetails(index: number) {
    const items = await this.page.locator(this.courseItem).all();
    if (items[index]) {
      await items[index].locator(this.viewCourseDetailsButton).click();
      await this.waitForNavigation();
    }
  }

  // ==================== Reports Moderation ====================

  /**
   * Get all reports
   */
  async getAllReports(): Promise<
    Array<{
      type: string;
      reason: string;
      reportedBy: string;
      content: string;
      date: string;
      priority: string;
    }>
  > {
    const items = await this.page.locator(this.reportItem).all();
    const reports = [];

    for (const item of items) {
      reports.push({
        type: (await item.locator(this.reportType).textContent()) || '',
        reason: (await item.locator(this.reportReason).textContent()) || '',
        reportedBy: (await item.locator(this.reportedBy).textContent()) || '',
        content: (await item.locator(this.reportedContent).textContent()) || '',
        date: (await item.locator(this.reportDate).textContent()) || '',
        priority: (await item.locator(this.reportPriority).textContent()) || '',
      });
    }

    return reports;
  }

  /**
   * Get reports count
   */
  async getReportsCount(): Promise<number> {
    return await this.count(this.reportItem);
  }

  /**
   * Review report
   */
  async reviewReport(index: number) {
    const items = await this.page.locator(this.reportItem).all();
    if (items[index]) {
      await items[index].locator(this.reviewReportButton).click();
      await this.waitForSelector(this.detailsModal);
    }
  }

  /**
   * Dismiss report
   */
  async dismissReport(index: number) {
    const items = await this.page.locator(this.reportItem).all();
    if (items[index]) {
      await items[index].locator(this.dismissReportButton).click();
      await this.wait(1000);
    }
  }

  /**
   * Take action on report
   */
  async takeActionOnReport(index: number, action: string) {
    const items = await this.page.locator(this.reportItem).all();
    if (items[index]) {
      await items[index].locator(this.takeActionButton).click();
      await this.waitForSelector(this.actionReasonModal);
      await this.fill(this.reasonTextarea, action);
      await this.click(this.submitActionButton);
      await this.wait(1000);
    }
  }

  // ==================== Comments Moderation ====================

  /**
   * Get all comments
   */
  async getAllComments(): Promise<
    Array<{
      author: string;
      content: string;
      location: string;
      date: string;
    }>
  > {
    const items = await this.page.locator(this.commentItem).all();
    const comments = [];

    for (const item of items) {
      comments.push({
        author: (await item.locator(this.commentAuthor).textContent()) || '',
        content: (await item.locator(this.commentContent).textContent()) || '',
        location: (await item.locator(this.commentLocation).textContent()) || '',
        date: (await item.locator(this.commentDate).textContent()) || '',
      });
    }

    return comments;
  }

  /**
   * Get comments count
   */
  async getCommentsCount(): Promise<number> {
    return await this.count(this.commentItem);
  }

  /**
   * Approve comment
   */
  async approveComment(index: number) {
    const items = await this.page.locator(this.commentItem).all();
    if (items[index]) {
      await items[index].locator(this.approveCommentButton).click();
      await this.wait(1000);
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(index: number) {
    const items = await this.page.locator(this.commentItem).all();
    if (items[index]) {
      await items[index].locator(this.deleteCommentButton).click();
      await this.wait(1000);
    }
  }

  /**
   * Hide comment
   */
  async hideComment(index: number) {
    const items = await this.page.locator(this.commentItem).all();
    if (items[index]) {
      await items[index].locator(this.hideCommentButton).click();
      await this.wait(1000);
    }
  }

  // ==================== Common Actions ====================

  /**
   * Search content
   */
  async search(query: string) {
    await this.fill(this.searchInput, query);
    await this.pressKey('Enter');
    await this.wait(1000);
  }

  /**
   * Apply filters
   */
  async applyFilters(filters: {
    status?: string;
    date?: string;
    priority?: string;
    category?: string;
  }) {
    if (filters.status && (await this.isVisible(this.statusFilter))) {
      await this.selectOption(this.statusFilter, filters.status);
    }

    if (filters.date && (await this.isVisible(this.dateFilter))) {
      await this.selectOption(this.dateFilter, filters.date);
    }

    if (filters.priority && (await this.isVisible(this.priorityFilter))) {
      await this.selectOption(this.priorityFilter, filters.priority);
    }

    if (filters.category && (await this.isVisible(this.categoryFilter))) {
      await this.selectOption(this.categoryFilter, filters.category);
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
   * Select items
   */
  async selectItems(count: number) {
    const checkboxes = await this.page.locator(this.itemCheckbox).all();
    for (let i = 0; i < Math.min(count, checkboxes.length); i++) {
      await checkboxes[i].click();
      await this.wait(200);
    }
  }

  /**
   * Bulk approve
   */
  async bulkApprove() {
    await this.click(this.bulkApproveButton);
    await this.wait(1000);
  }

  /**
   * Bulk reject
   */
  async bulkReject(reason: string) {
    await this.click(this.bulkRejectButton);
    await this.waitForSelector(this.actionReasonModal);
    await this.fill(this.reasonTextarea, reason);
    await this.click(this.submitActionButton);
    await this.wait(1000);
  }

  /**
   * Close details modal
   */
  async closeDetailsModal() {
    await this.click(this.closeModalButton);
    await this.waitForSelectorHidden(this.detailsModal);
  }

  /**
   * View moderation history
   */
  async viewHistory() {
    await this.click(this.historyTab);
    await this.wait(1000);
  }

  /**
   * Get moderation history
   */
  async getModerationHistory(): Promise<
    Array<{
      action: string;
      moderator: string;
      timestamp: string;
    }>
  > {
    const items = await this.page.locator(this.historyItem).all();
    const history = [];

    for (const item of items) {
      history.push({
        action: (await item.locator(this.historyAction).textContent()) || '',
        moderator: (await item.locator(this.historyModerator).textContent()) || '',
        timestamp: (await item.locator(this.historyTimestamp).textContent()) || '',
      });
    }

    return history;
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
   * Assert on moderation page
   */
  async assertOnModerationPage() {
    await this.assertVisible(this.pageTitle);
    await this.assertUrl('/admin/moderation');
  }

  /**
   * Assert pending counts visible
   */
  async assertPendingCountsVisible() {
    await this.assertVisible(this.pendingReviewsCount);
    await this.assertVisible(this.pendingCoursesCount);
  }
}
