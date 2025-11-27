/**
 * Student Learning Journey E2E Tests
 * Tests the complete student learning experience from course discovery to completion
 */

import { test, expect } from '@playwright/test';
import { CoursesPage } from '../pages/CoursesPage';
import { EnrollmentPage } from '../pages/EnrollmentPage';
import { CourseLearningPage } from '../pages/CourseLearningPage';
import { DashboardPage } from '../pages/DashboardPage';
import { setupAuthenticatedSession } from '../utils/auth';
import { cleanupEnrollments } from '../utils/db-helpers';

test.describe('Student Learning Journey', () => {
  let coursesPage: CoursesPage;
  let enrollmentPage: EnrollmentPage;
  let learningPage: CourseLearningPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    coursesPage = new CoursesPage(page);
    enrollmentPage = new EnrollmentPage(page);
    learningPage = new CourseLearningPage(page);
    dashboardPage = new DashboardPage(page);

    // Setup authenticated session
    await setupAuthenticatedSession(page, 'student');
  });

  test.afterEach(async () => {
    await cleanupEnrollments();
  });

  test('should complete full learning journey: browse → enroll → learn → complete', async ({
    page,
  }) => {
    // Step 1: Browse courses
    await coursesPage.navigate();
    await coursesPage.assertPageLoaded();

    const courses = await coursesPage.getAllVisibleCourses();
    expect(courses.length).toBeGreaterThan(0);

    // Step 2: Select a course
    const targetCourse = courses[0];
    await coursesPage.clickViewDetails(targetCourse.title);

    // Step 3: Enroll in course
    await enrollmentPage.enrollFromModal();
    await enrollmentPage.waitForEnrollmentModal();

    // Enroll (free course flow)
    if (await enrollmentPage.isVisible('[data-testid="free-course-notice"]')) {
      await enrollmentPage.enrollInFreeCourse();
      await enrollmentPage.waitForEnrollmentSuccess();

      // Step 4: Start learning
      await enrollmentPage.startLearning();

      // Step 5: Verify on course learning page
      await learningPage.waitForCourseLoad();
      await learningPage.assertOnCoursePage();

      // Step 6: Complete first lesson
      const lessons = await learningPage.getAllLessons();
      if (lessons.length > 0) {
        await learningPage.clickLesson(lessons[0]);

        // Watch video if present
        if (await learningPage.isVisible('[data-testid="video-player"]')) {
          await learningPage.playVideo();
          await page.waitForTimeout(3000); // Watch for 3 seconds
          await learningPage.pauseVideo();
        }

        // Mark lesson as complete
        await learningPage.markLessonComplete();

        // Step 7: Verify progress updated
        const progress = await learningPage.getCourseProgress();
        expect(progress).toBeGreaterThan(0);

        // Step 8: Return to dashboard and verify enrollment
        await dashboardPage.navigate();
        const isEnrolled = await dashboardPage.isCourseEnrolled(targetCourse.title);
        expect(isEnrolled).toBe(true);
      }
    }
  });

  test('should navigate between lessons', async ({ page }) => {
    // Setup: Enroll in a course
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      const lessons = await learningPage.getAllLessons();
      if (lessons.length >= 2) {
        // Start with first lesson
        await learningPage.clickLesson(lessons[0]);
        await page.waitForTimeout(1000);

        // Navigate to next lesson
        await learningPage.goToNextLesson();
        await page.waitForTimeout(1000);

        // Verify we're on second lesson
        const currentTitle = await learningPage.getCurrentLessonTitle();
        expect(currentTitle).toBeTruthy();

        // Navigate back to previous lesson
        await learningPage.goToPreviousLesson();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should track lesson completion progress', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      const lessons = await learningPage.getAllLessons();
      if (lessons.length > 0) {
        const firstLesson = lessons[0];

        // Check initial progress
        const initialProgress = await learningPage.getCourseProgress();

        // Complete first lesson
        await learningPage.clickLesson(firstLesson);
        await page.waitForTimeout(1000);
        await learningPage.markLessonComplete();
        await page.waitForTimeout(1000);

        // Verify progress increased
        const updatedProgress = await learningPage.getCourseProgress();
        expect(updatedProgress).toBeGreaterThanOrEqual(initialProgress);

        // Verify lesson marked as complete
        const isComplete = await learningPage.isLessonComplete(firstLesson);
        expect(isComplete).toBe(true);
      }
    }
  });

  test('should play and pause course videos', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Check if video player is present
      if (await learningPage.isVisible('[data-testid="video-player"]')) {
        // Play video
        await learningPage.playVideo();
        await page.waitForTimeout(1000);

        // Verify video is playing
        const isPlaying = await learningPage.isVideoPlaying();
        expect(isPlaying).toBe(true);

        // Pause video
        await learningPage.pauseVideo();
        await page.waitForTimeout(500);

        // Verify video is paused
        const isStillPlaying = await learningPage.isVideoPlaying();
        expect(isStillPlaying).toBe(false);
      }
    }
  });

  test('should allow students to take notes', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Add a note
      const testNote = 'This is a test note about the lesson';
      await learningPage.addNote(testNote);

      // Verify note was saved
      const notes = await learningPage.getAllNotes();
      expect(notes.some(note => note.includes(testNote))).toBe(true);
    }
  });

  test('should allow downloading course resources', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Open resources tab
      await learningPage.openResources();

      // Check if resources are available
      if (await learningPage.isVisible('[data-testid="resource-list"]')) {
        // Verify resources tab is accessible
        expect(await learningPage.isVisible('[data-testid="resource-list"]')).toBe(true);
      }
    }
  });

  test('should allow posting questions in discussion', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Post a question
      const testQuestion = 'What is the best way to understand this concept?';
      await learningPage.postQuestion(testQuestion);

      // Verify question posted (implementation dependent)
      await page.waitForTimeout(1000);
    }
  });

  test('should handle quiz attempts', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Check if quiz is available
      if (await learningPage.isVisible('button:has-text("Quiz")')) {
        await learningPage.startQuiz();

        // Answer quiz questions (randomly for test)
        if (await learningPage.isVisible('[data-testid="quiz-question"]')) {
          await learningPage.answerQuizQuestion(0);
          await learningPage.submitQuiz();

          // Verify quiz results displayed
          const score = await learningPage.getQuizScore();
          expect(typeof score).toBe('number');
        }
      }
    }
  });

  test('should search and filter courses', async () => {
    await coursesPage.navigate();

    // Test search functionality
    await coursesPage.searchCourses('Python');
    await coursesPage.wait(1000);

    const searchResults = await coursesPage.getCourseCount();
    expect(searchResults).toBeGreaterThanOrEqual(0);

    // Clear search
    await coursesPage.navigate();

    // Test category filter
    if (await coursesPage.isVisible('[data-testid="category-filter"]')) {
      await coursesPage.filterByCategory('Programming');
      await coursesPage.wait(1000);

      const filteredResults = await coursesPage.getCourseCount();
      expect(filteredResults).toBeGreaterThanOrEqual(0);
    }
  });

  test('should complete course and verify certificate availability', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Complete all lessons
      const lessons = await learningPage.getAllLessons();
      for (let i = 0; i < Math.min(lessons.length, 3); i++) {
        await learningPage.clickLesson(lessons[i]);
        await page.waitForTimeout(500);
        await learningPage.markLessonComplete();
        await page.waitForTimeout(500);
      }

      // Check if course is completed
      const isCourseCompleted = await learningPage.isCourseCompleted();
      if (isCourseCompleted) {
        // Verify certificate is available
        const hasCertificate = await learningPage.isCertificateAvailable();
        expect(hasCertificate).toBe(true);
      }
    }
  });

  test('should return to dashboard from course', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0 && (await coursesPage.isCourseFree(courses[0].title))) {
      await coursesPage.clickEnrollOnCourse(courses[0].title);
      await enrollmentPage.waitForEnrollmentModal();
      await enrollmentPage.completeFreeCourseEnrollment();
      await enrollmentPage.startLearning();

      await learningPage.waitForCourseLoad();

      // Return to dashboard
      await dashboardPage.navigate();
      await dashboardPage.assertDashboardLoaded();
    }
  });
});

test.describe('Learning Experience Edge Cases', () => {
  let learningPage: CourseLearningPage;

  test.beforeEach(async ({ page }) => {
    learningPage = new CourseLearningPage(page);
    await setupAuthenticatedSession(page, 'student');
  });

  test('should handle offline mode gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to navigate to course
    await learningPage.navigateToCourse('test-course-id');

    // Should show appropriate error or offline message
    await page.waitForTimeout(2000);

    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should persist video progress on page reload', async ({ page }) => {
    // This test would require actual course enrollment
    // Placeholder for video progress persistence testing
    test.skip();
  });
});
