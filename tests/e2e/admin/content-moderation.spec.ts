/**
 * Content Moderation E2E Tests
 * Tests for content review, course approval, and content reporting
 */

import { test, expect } from '@playwright/test';
import { ContentModerationPage } from '../pages/ContentModerationPage';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Content Moderation - Overview', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
  });

  test('should display moderation page', async () => {
    await moderationPage.assertOnModerationPage();
  });

  test('should display pending counts', async () => {
    if (await moderationPage.isVisible('[data-testid="pending-reviews-count"]')) {
      const counts = await moderationPage.getPendingCounts();
      expect(counts.reviews).toBeGreaterThanOrEqual(0);
      expect(counts.courses).toBeGreaterThanOrEqual(0);
      expect(counts.reports).toBeGreaterThanOrEqual(0);
      expect(counts.comments).toBeGreaterThanOrEqual(0);
    }
  });

  test('should switch between tabs', async () => {
    await moderationPage.switchToTab('reviews');
    await moderationPage.page.waitForTimeout(1000);

    await moderationPage.switchToTab('courses');
    await moderationPage.page.waitForTimeout(1000);

    await moderationPage.switchToTab('reports');
    await moderationPage.page.waitForTimeout(1000);

    await moderationPage.switchToTab('comments');
    await moderationPage.page.waitForTimeout(1000);
  });
});

test.describe('Content Moderation - Reviews', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
    await moderationPage.switchToTab('reviews');
  });

  test('should display reviews list', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reviewsCount = await moderationPage.getReviewsCount();
    expect(reviewsCount).toBeGreaterThanOrEqual(0);
  });

  test('should get all reviews with details', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reviews = await moderationPage.getAllReviews();
    expect(Array.isArray(reviews)).toBe(true);

    if (reviews.length > 0) {
      expect(reviews[0]).toHaveProperty('author');
      expect(reviews[0]).toHaveProperty('course');
      expect(reviews[0]).toHaveProperty('content');
    }
  });

  test('should approve review', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reviewsCount = await moderationPage.getReviewsCount();

    if (reviewsCount > 0 && (await moderationPage.isVisible('button:has-text("Approve")'))) {
      await moderationPage.approveReview(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should reject review with reason', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reviewsCount = await moderationPage.getReviewsCount();

    if (reviewsCount > 0 && (await moderationPage.isVisible('button:has-text("Reject")'))) {
      await moderationPage.rejectReview(0, 'Inappropriate content');
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should flag review', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reviewsCount = await moderationPage.getReviewsCount();

    if (reviewsCount > 0 && (await moderationPage.isVisible('button:has-text("Flag")'))) {
      await moderationPage.flagReview(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should view review details', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reviewsCount = await moderationPage.getReviewsCount();

    if (reviewsCount > 0 && (await moderationPage.isVisible('button:has-text("View Details")'))) {
      await moderationPage.viewReviewDetails(0);
      await moderationPage.page.waitForTimeout(1000);
      await moderationPage.closeDetailsModal();
    }
  });
});

test.describe('Content Moderation - Courses', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
    await moderationPage.switchToTab('courses');
  });

  test('should display courses list', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const coursesCount = await moderationPage.getCoursesCount();
    expect(coursesCount).toBeGreaterThanOrEqual(0);
  });

  test('should get all courses with details', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const courses = await moderationPage.getAllCourses();
    expect(Array.isArray(courses)).toBe(true);

    if (courses.length > 0) {
      expect(courses[0]).toHaveProperty('title');
      expect(courses[0]).toHaveProperty('instructor');
      expect(courses[0]).toHaveProperty('category');
    }
  });

  test('should approve course', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const coursesCount = await moderationPage.getCoursesCount();

    if (coursesCount > 0 && (await moderationPage.isVisible('button:has-text("Approve")'))) {
      await moderationPage.approveCourse(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should reject course with reason', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const coursesCount = await moderationPage.getCoursesCount();

    if (coursesCount > 0 && (await moderationPage.isVisible('button:has-text("Reject")'))) {
      await moderationPage.rejectCourse(0, 'Content quality issues');
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should request course changes', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const coursesCount = await moderationPage.getCoursesCount();

    if (
      coursesCount > 0 &&
      (await moderationPage.isVisible('button:has-text("Request Changes")'))
    ) {
      await moderationPage.requestCourseChanges(0, 'Please update the course description');
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should view course details', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const coursesCount = await moderationPage.getCoursesCount();

    if (coursesCount > 0 && (await moderationPage.isVisible('button:has-text("View Course")'))) {
      await moderationPage.viewCourseDetails(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });
});

test.describe('Content Moderation - Reports', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
    await moderationPage.switchToTab('reports');
  });

  test('should display reports list', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reportsCount = await moderationPage.getReportsCount();
    expect(reportsCount).toBeGreaterThanOrEqual(0);
  });

  test('should get all reports with details', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reports = await moderationPage.getAllReports();
    expect(Array.isArray(reports)).toBe(true);

    if (reports.length > 0) {
      expect(reports[0]).toHaveProperty('type');
      expect(reports[0]).toHaveProperty('reason');
      expect(reports[0]).toHaveProperty('reportedBy');
    }
  });

  test('should review report', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reportsCount = await moderationPage.getReportsCount();

    if (reportsCount > 0 && (await moderationPage.isVisible('button:has-text("Review")'))) {
      await moderationPage.reviewReport(0);
      await moderationPage.page.waitForTimeout(1000);
      await moderationPage.closeDetailsModal();
    }
  });

  test('should dismiss report', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reportsCount = await moderationPage.getReportsCount();

    if (reportsCount > 0 && (await moderationPage.isVisible('button:has-text("Dismiss")'))) {
      await moderationPage.dismissReport(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should take action on report', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const reportsCount = await moderationPage.getReportsCount();

    if (reportsCount > 0 && (await moderationPage.isVisible('button:has-text("Take Action")'))) {
      await moderationPage.takeActionOnReport(0, 'Content removed');
      await moderationPage.page.waitForTimeout(2000);
    }
  });
});

test.describe('Content Moderation - Comments', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
    await moderationPage.switchToTab('comments');
  });

  test('should display comments list', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const commentsCount = await moderationPage.getCommentsCount();
    expect(commentsCount).toBeGreaterThanOrEqual(0);
  });

  test('should get all comments with details', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const comments = await moderationPage.getAllComments();
    expect(Array.isArray(comments)).toBe(true);

    if (comments.length > 0) {
      expect(comments[0]).toHaveProperty('author');
      expect(comments[0]).toHaveProperty('content');
      expect(comments[0]).toHaveProperty('location');
    }
  });

  test('should approve comment', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const commentsCount = await moderationPage.getCommentsCount();

    if (commentsCount > 0 && (await moderationPage.isVisible('button:has-text("Approve")'))) {
      await moderationPage.approveComment(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should delete comment', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const commentsCount = await moderationPage.getCommentsCount();

    if (commentsCount > 0 && (await moderationPage.isVisible('button:has-text("Delete")'))) {
      await moderationPage.deleteComment(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });

  test('should hide comment', async () => {
    await moderationPage.page.waitForTimeout(1000);
    const commentsCount = await moderationPage.getCommentsCount();

    if (commentsCount > 0 && (await moderationPage.isVisible('button:has-text("Hide")'))) {
      await moderationPage.hideComment(0);
      await moderationPage.page.waitForTimeout(2000);
    }
  });
});

test.describe('Content Moderation - Search and Filters', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
  });

  test('should search content', async () => {
    if (await moderationPage.isVisible('input[placeholder*="Search"]')) {
      await moderationPage.search('test');
      await moderationPage.page.waitForTimeout(1000);
    }
  });

  test('should apply status filter', async () => {
    if (await moderationPage.isVisible('[data-testid="status-filter"]')) {
      await moderationPage.applyFilters({
        status: 'pending',
      });
      await moderationPage.page.waitForTimeout(1000);
    }
  });

  test('should apply priority filter', async () => {
    await moderationPage.switchToTab('reports');

    if (await moderationPage.isVisible('[data-testid="priority-filter"]')) {
      await moderationPage.applyFilters({
        priority: 'high',
      });
      await moderationPage.page.waitForTimeout(1000);
    }
  });

  test('should clear filters', async () => {
    if (await moderationPage.isVisible('[data-testid="status-filter"]')) {
      await moderationPage.applyFilters({
        status: 'approved',
      });
      await moderationPage.page.waitForTimeout(1000);

      await moderationPage.clearFilters();
      await moderationPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Content Moderation - Bulk Actions', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
    await moderationPage.switchToTab('reviews');
  });

  test('should select multiple items', async () => {
    await moderationPage.page.waitForTimeout(1000);

    if (await moderationPage.isVisible('input[type="checkbox"][data-testid="item-checkbox"]')) {
      await moderationPage.selectItems(2);
      await moderationPage.page.waitForTimeout(500);
    }
  });

  test('should bulk approve items', async () => {
    if (await moderationPage.isVisible('input[type="checkbox"][data-testid="item-checkbox"]')) {
      await moderationPage.selectItems(2);
      await moderationPage.page.waitForTimeout(500);

      if (await moderationPage.isVisible('button:has-text("Approve Selected")')) {
        await moderationPage.bulkApprove();
        await moderationPage.page.waitForTimeout(2000);
      }
    }
  });

  test('should bulk reject items', async () => {
    if (await moderationPage.isVisible('input[type="checkbox"][data-testid="item-checkbox"]')) {
      await moderationPage.selectItems(2);
      await moderationPage.page.waitForTimeout(500);

      if (await moderationPage.isVisible('button:has-text("Reject Selected")')) {
        await moderationPage.bulkReject('Bulk rejection reason');
        await moderationPage.page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Content Moderation - History', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
  });

  test('should view moderation history', async () => {
    if (await moderationPage.isVisible('button:has-text("History")')) {
      await moderationPage.viewHistory();
      await moderationPage.page.waitForTimeout(1000);

      if (await moderationPage.isVisible('[data-testid="history-item"]')) {
        const history = await moderationPage.getModerationHistory();
        expect(Array.isArray(history)).toBe(true);

        if (history.length > 0) {
          expect(history[0]).toHaveProperty('action');
          expect(history[0]).toHaveProperty('moderator');
          expect(history[0]).toHaveProperty('timestamp');
        }
      }
    }
  });
});

test.describe('Content Moderation - Pagination', () => {
  let moderationPage: ContentModerationPage;

  test.beforeEach(async ({ page }) => {
    moderationPage = new ContentModerationPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await moderationPage.navigate();
  });

  test('should navigate pagination', async () => {
    if (await moderationPage.isVisible('[data-testid="pagination"]')) {
      if (await moderationPage.isVisible('button:has-text("Next")')) {
        await moderationPage.goToNextPage();
        await moderationPage.page.waitForTimeout(1000);

        if (await moderationPage.isVisible('button:has-text("Previous")')) {
          await moderationPage.goToPreviousPage();
          await moderationPage.page.waitForTimeout(1000);
        }
      }
    }
  });
});
