/**
 * Course Management Page Object
 * Represents the instructor/admin course creation and management interface
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class CourseManagementPage extends BasePage {
  // Page URLs
  private readonly coursesListUrl = '/admin/courses';
  private readonly createCourseUrl = '/admin/courses/create';

  // Course list page
  private readonly pageTitle = 'h1:has-text("Courses")';
  private readonly createCourseButton = 'button:has-text("Create Course")';
  private readonly courseTable = '[data-testid="courses-table"]';
  private readonly courseRow = '[data-testid="course-row"]';
  private readonly searchInput = 'input[placeholder*="Search"]';
  private readonly filterDropdown = '[data-testid="filter-dropdown"]';

  // Course actions
  private readonly editButton = '[data-testid="edit-button"]';
  private readonly deleteButton = '[data-testid="delete-button"]';
  private readonly publishButton = '[data-testid="publish-button"]';
  private readonly unpublishButton = '[data-testid="unpublish-button"]';
  private readonly duplicateButton = '[data-testid="duplicate-button"]';

  // Create/Edit course form
  private readonly courseForm = '[data-testid="course-form"]';
  private readonly titleInput = 'input[name="title"]';
  private readonly descriptionTextarea = 'textarea[name="description"]';
  private readonly categorySelect = 'select[name="category"]';
  private readonly levelSelect = 'select[name="level"]';
  private readonly priceInput = 'input[name="price"]';
  private readonly durationInput = 'input[name="duration"]';
  private readonly thumbnailUpload = 'input[type="file"][name="thumbnail"]';
  private readonly publishCheckbox = 'input[name="published"]';

  // Course content sections
  private readonly addModuleButton = 'button:has-text("Add Module")';
  private readonly moduleList = '[data-testid="module-list"]';
  private readonly moduleItem = '[data-testid="module-item"]';
  private readonly addLessonButton = 'button:has-text("Add Lesson")';
  private readonly lessonItem = '[data-testid="lesson-item"]';

  // Lesson form
  private readonly lessonTitleInput = 'input[name="lessonTitle"]';
  private readonly lessonTypeSelect = 'select[name="lessonType"]';
  private readonly videoUrlInput = 'input[name="videoUrl"]';
  private readonly videoUpload = 'input[type="file"][name="videoFile"]';
  private readonly documentUpload = 'input[type="file"][name="document"]';
  private readonly lessonContentEditor = '[data-testid="lesson-content-editor"]';

  // Assessment/Quiz
  private readonly addQuizButton = 'button:has-text("Add Quiz")';
  private readonly quizTitleInput = 'input[name="quizTitle"]';
  private readonly addQuestionButton = 'button:has-text("Add Question")';
  private readonly questionInput = 'textarea[name="question"]';
  private readonly answerInput = 'input[name="answer"]';
  private readonly correctAnswerCheckbox = 'input[name="isCorrect"]';

  // Form actions
  private readonly saveDraftButton = 'button:has-text("Save Draft")';
  private readonly publishCourseButton = 'button:has-text("Publish Course")';
  private readonly cancelButton = 'button:has-text("Cancel")';
  private readonly backButton = 'button:has-text("Back")';

  // Success/Error messages
  private readonly successMessage = '[role="alert"]:has-text("success")';
  private readonly errorMessage = '[role="alert"]:has-text("error")';

  // Delete confirmation
  private readonly deleteConfirmModal = '[data-testid="delete-confirm-modal"]';
  private readonly confirmDeleteButton = 'button:has-text("Confirm")';
  private readonly cancelDeleteButton = 'button:has-text("Cancel")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to courses list page
   */
  async navigateToCoursesList() {
    await this.goto(this.coursesListUrl);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to create course page
   */
  async navigateToCreateCourse() {
    await this.goto(this.createCourseUrl);
    await this.waitForPageLoad();
  }

  /**
   * Click create course button
   */
  async clickCreateCourse() {
    await this.click(this.createCourseButton);
    await this.waitForNavigation();
  }

  /**
   * Fill basic course information
   */
  async fillCourseBasics(course: {
    title: string;
    description: string;
    category: string;
    level: string;
    price: number;
    duration: number;
  }) {
    await this.fill(this.titleInput, course.title);
    await this.fill(this.descriptionTextarea, course.description);
    await this.selectOption(this.categorySelect, course.category);
    await this.selectOption(this.levelSelect, course.level);
    await this.fill(this.priceInput, course.price.toString());
    await this.fill(this.durationInput, course.duration.toString());
  }

  /**
   * Upload course thumbnail
   */
  async uploadThumbnail(filePath: string) {
    await this.page.setInputFiles(this.thumbnailUpload, filePath);
    await this.wait(1000);
  }

  /**
   * Add a module to course
   */
  async addModule(moduleName: string) {
    await this.click(this.addModuleButton);
    await this.wait(500);
    await this.fill('input[placeholder*="Module name"]', moduleName);
    await this.pressKey('Enter');
  }

  /**
   * Add a lesson to module
   */
  async addLesson(
    moduleName: string,
    lesson: {
      title: string;
      type: 'video' | 'document' | 'text';
      content?: string;
    }
  ) {
    // Find module and click add lesson
    const module = this.page.locator(this.moduleItem).filter({ hasText: moduleName });
    await module.locator(this.addLessonButton).click();
    await this.wait(500);

    // Fill lesson details
    await this.fill(this.lessonTitleInput, lesson.title);
    await this.selectOption(this.lessonTypeSelect, lesson.type);

    if (lesson.type === 'video' && lesson.content) {
      await this.fill(this.videoUrlInput, lesson.content);
    } else if (lesson.type === 'text' && lesson.content) {
      await this.fill(this.lessonContentEditor, lesson.content);
    }
  }

  /**
   * Upload video for lesson
   */
  async uploadVideo(filePath: string) {
    await this.page.setInputFiles(this.videoUpload, filePath);
    await this.wait(2000); // Wait for upload
  }

  /**
   * Upload document for lesson
   */
  async uploadDocument(filePath: string) {
    await this.page.setInputFiles(this.documentUpload, filePath);
    await this.wait(2000);
  }

  /**
   * Add quiz to course
   */
  async addQuiz(quizTitle: string) {
    await this.click(this.addQuizButton);
    await this.wait(500);
    await this.fill(this.quizTitleInput, quizTitle);
  }

  /**
   * Add question to quiz
   */
  async addQuizQuestion(question: {
    text: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
  }) {
    await this.click(this.addQuestionButton);
    await this.wait(500);
    await this.fill(this.questionInput, question.text);

    // Add answers
    for (let i = 0; i < question.answers.length; i++) {
      const answer = question.answers[i];
      await this.fill(`${this.answerInput}[data-index="${i}"]`, answer.text);

      if (answer.isCorrect) {
        await this.check(`${this.correctAnswerCheckbox}[data-index="${i}"]`);
      }
    }
  }

  /**
   * Save course as draft
   */
  async saveDraft() {
    await this.click(this.saveDraftButton);
    await this.waitForSelector(this.successMessage);
  }

  /**
   * Publish course
   */
  async publishCourse() {
    await this.click(this.publishCourseButton);
    await this.waitForSelector(this.successMessage);
  }

  /**
   * Create complete course with modules and lessons
   */
  async createCompleteCourse(courseData: {
    title: string;
    description: string;
    category: string;
    level: string;
    price: number;
    duration: number;
    modules: Array<{
      name: string;
      lessons: Array<{
        title: string;
        type: 'video' | 'document' | 'text';
        content: string;
      }>;
    }>;
  }) {
    // Fill basic info
    await this.fillCourseBasics(courseData);

    // Add modules and lessons
    for (const module of courseData.modules) {
      await this.addModule(module.name);

      for (const lesson of module.lessons) {
        await this.addLesson(module.name, lesson);
      }
    }

    // Save
    await this.saveDraft();
  }

  /**
   * Search for course
   */
  async searchCourse(query: string) {
    await this.fill(this.searchInput, query);
    await this.pressKey('Enter');
    await this.wait(1000);
  }

  /**
   * Edit course by title
   */
  async editCourse(courseTitle: string) {
    const courseRow = this.page.locator(this.courseRow).filter({ hasText: courseTitle });
    await courseRow.locator(this.editButton).click();
    await this.waitForNavigation();
  }

  /**
   * Delete course by title
   */
  async deleteCourse(courseTitle: string) {
    const courseRow = this.page.locator(this.courseRow).filter({ hasText: courseTitle });
    await courseRow.locator(this.deleteButton).click();
    await this.waitForSelector(this.deleteConfirmModal);
    await this.click(this.confirmDeleteButton);
    await this.waitForSelector(this.successMessage);
  }

  /**
   * Publish/unpublish course
   */
  async toggleCoursePublish(courseTitle: string) {
    const courseRow = this.page.locator(this.courseRow).filter({ hasText: courseTitle });

    // Check if course is published
    const isPublished = await courseRow.locator(this.unpublishButton).isVisible();

    if (isPublished) {
      await courseRow.locator(this.unpublishButton).click();
    } else {
      await courseRow.locator(this.publishButton).click();
    }

    await this.wait(1000);
  }

  /**
   * Duplicate course
   */
  async duplicateCourse(courseTitle: string) {
    const courseRow = this.page.locator(this.courseRow).filter({ hasText: courseTitle });
    await courseRow.locator(this.duplicateButton).click();
    await this.waitForSelector(this.successMessage);
  }

  /**
   * Get all courses
   */
  async getAllCourses(): Promise<string[]> {
    return await this.getAllTexts(`${this.courseRow} [data-testid="course-title"]`);
  }

  /**
   * Get course count
   */
  async getCourseCount(): Promise<number> {
    return await this.count(this.courseRow);
  }

  /**
   * Check if course exists
   */
  async courseExists(courseTitle: string): Promise<boolean> {
    return await this.isVisible(`${this.courseRow}:has-text("${courseTitle}")`);
  }

  /**
   * Assert on courses list page
   */
  async assertOnCoursesListPage() {
    await this.assertVisible(this.pageTitle);
    await this.assertVisible(this.createCourseButton);
  }

  /**
   * Assert course created successfully
   */
  async assertCourseCreated() {
    await this.assertVisible(this.successMessage);
  }

  /**
   * Assert course deleted
   */
  async assertCourseDeleted(courseTitle: string) {
    await this.assertHidden(`${this.courseRow}:has-text("${courseTitle}")`);
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  /**
   * Cancel course creation/editing
   */
  async cancel() {
    await this.click(this.cancelButton);
    await this.waitForNavigation();
  }
}
