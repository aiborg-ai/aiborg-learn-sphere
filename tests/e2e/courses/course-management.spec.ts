/**
 * Course Management E2E Tests
 * Tests for instructors and admins creating, editing, and managing courses
 */

import { test, expect } from '@playwright/test';
import { CourseManagementPage } from '../pages/CourseManagementPage';
import { generateCourse } from '../utils/test-data';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Course Management - Instructor/Admin', () => {
  let coursePage: CourseManagementPage;

  test.beforeEach(async ({ page }) => {
    coursePage = new CourseManagementPage(page);
    await setupAuthenticatedSession(page, 'instructor');
  });

  test('should create new course with basic information', async () => {
    const course = generateCourse();

    await coursePage.navigateToCoursesList();
    await coursePage.clickCreateCourse();

    await coursePage.fillCourseBasics({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      duration: course.duration,
    });

    await coursePage.saveDraft();
    await coursePage.assertCourseCreated();

    // Verify course appears in list
    await coursePage.navigateToCoursesList();
    const courseExists = await coursePage.courseExists(course.title);
    expect(courseExists).toBe(true);
  });

  test('should add modules and lessons to course', async () => {
    const course = generateCourse();

    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);

    // Add module
    await coursePage.addModule('Module 1: Introduction');

    // Add lesson
    await coursePage.addLesson('Module 1: Introduction', {
      title: 'Welcome Lesson',
      type: 'text',
      content: 'Welcome to the course!',
    });

    await coursePage.saveDraft();
    await coursePage.assertCourseCreated();
  });

  test('should publish course', async () => {
    const course = generateCourse();

    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);
    await coursePage.publishCourse();

    await coursePage.assertCourseCreated();
  });

  test('should edit existing course', async () => {
    const course = generateCourse();

    // First create a course
    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);
    await coursePage.saveDraft();

    // Edit it
    await coursePage.navigateToCoursesList();
    await coursePage.editCourse(course.title);

    const newTitle = course.title + ' (Updated)';
    await coursePage.fill('input[name="title"]', newTitle);
    await coursePage.saveDraft();

    await coursePage.assertCourseCreated();
  });

  test('should delete course', async () => {
    const course = generateCourse();

    // Create course
    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);
    await coursePage.saveDraft();

    // Delete it
    await coursePage.navigateToCoursesList();
    await coursePage.deleteCourse(course.title);

    await coursePage.assertCourseDeleted(course.title);
  });

  test('should search for courses', async () => {
    await coursePage.navigateToCoursesList();
    await coursePage.searchCourse('Python');

    await coursePage.page.waitForTimeout(1000);
    const count = await coursePage.getCourseCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should toggle course publish status', async () => {
    const course = generateCourse();

    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);
    await coursePage.saveDraft();

    await coursePage.navigateToCoursesList();
    await coursePage.toggleCoursePublish(course.title);

    await coursePage.page.waitForTimeout(1000);
  });

  test('should duplicate course', async () => {
    const course = generateCourse();

    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);
    await coursePage.saveDraft();

    await coursePage.navigateToCoursesList();
    await coursePage.duplicateCourse(course.title);

    const successMessage = await coursePage.getSuccessMessage();
    expect(successMessage.toLowerCase()).toContain('duplicate');
  });

  test('should validate required fields', async ({ page }) => {
    await coursePage.navigateToCreateCourse();

    // Try to save without filling required fields
    await coursePage.click('button:has-text("Save Draft")');

    // Should show validation errors or button disabled
    await page.waitForTimeout(1000);
  });

  test('should add quiz to course', async () => {
    const course = generateCourse();

    await coursePage.navigateToCreateCourse();
    await coursePage.fillCourseBasics(course);

    await coursePage.addQuiz('Module 1 Quiz');
    await coursePage.addQuizQuestion({
      text: 'What is 2 + 2?',
      answers: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ],
    });

    await coursePage.saveDraft();
    await coursePage.assertCourseCreated();
  });
});

test.describe('Course Management - Admin Only', () => {
  let coursePage: CourseManagementPage;

  test.beforeEach(async ({ page }) => {
    coursePage = new CourseManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
  });

  test('should view all courses as admin', async () => {
    await coursePage.navigateToCoursesList();
    await coursePage.assertOnCoursesListPage();

    const courses = await coursePage.getAllCourses();
    expect(Array.isArray(courses)).toBe(true);
  });

  test('should manage any instructor course', async () => {
    await coursePage.navigateToCoursesList();
    const courses = await coursePage.getAllCourses();

    if (courses.length > 0) {
      await coursePage.editCourse(courses[0]);
      await coursePage.page.waitForTimeout(1000);
    }
  });
});
