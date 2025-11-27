/**
 * Course Learning Page Object
 * Represents the course content consumption page
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class CourseLearningPage extends BasePage {
  // Page URL pattern
  private readonly courseUrlPattern = /\/courses\/[^/]+\/learn/;

  // Course header
  private readonly courseTitle = '[data-testid="course-title"]';
  private readonly progressBar = '[data-testid="progress-bar"]';
  private readonly progressPercentage = '[data-testid="progress-percentage"]';

  // Course navigation
  private readonly sidebar = '[data-testid="course-sidebar"]';
  private readonly moduleList = '[data-testid="module-list"]';
  private readonly lessonItem = '[data-testid="lesson-item"]';
  private readonly currentLesson = '[data-testid="current-lesson"]';
  private readonly completedLesson = '[data-testid="completed-lesson"]';

  // Video player
  private readonly videoPlayer = '[data-testid="video-player"]';
  private readonly playButton = 'button[aria-label="Play"]';
  private readonly pauseButton = 'button[aria-label="Pause"]';
  private readonly videoProgress = '[data-testid="video-progress"]';
  private readonly fullscreenButton = 'button[aria-label="Fullscreen"]';
  private readonly volumeControl = '[data-testid="volume-control"]';

  // Content area
  private readonly contentArea = '[data-testid="content-area"]';
  private readonly lessonTitle = '[data-testid="lesson-title"]';
  private readonly lessonDescription = '[data-testid="lesson-description"]';
  private readonly lessonContent = '[data-testid="lesson-content"]';

  // Navigation buttons
  private readonly nextLessonButton = 'button:has-text("Next Lesson")';
  private readonly previousLessonButton = 'button:has-text("Previous Lesson")';
  private readonly markCompleteButton = 'button:has-text("Mark as Complete")';
  private readonly backToCourseButton = 'button:has-text("Back to Course")';

  // Resources and downloads
  private readonly resourcesTab = 'button:has-text("Resources")';
  private readonly downloadButton = '[data-testid="download-button"]';
  private readonly resourceList = '[data-testid="resource-list"]';

  // Notes
  private readonly notesTab = 'button:has-text("Notes")';
  private readonly notesTextarea = 'textarea[placeholder*="note"]';
  private readonly saveNoteButton = 'button:has-text("Save Note")';
  private readonly notesList = '[data-testid="notes-list"]';

  // Q&A / Discussion
  private readonly discussionTab = 'button:has-text("Discussion")';
  private readonly questionInput = 'textarea[placeholder*="question"]';
  private readonly postQuestionButton = 'button:has-text("Post Question")';
  private readonly discussionList = '[data-testid="discussion-list"]';

  // Assessments
  private readonly quizTab = 'button:has-text("Quiz")';
  private readonly startQuizButton = 'button:has-text("Start Quiz")';
  private readonly quizQuestion = '[data-testid="quiz-question"]';
  private readonly quizAnswer = '[data-testid="quiz-answer"]';
  private readonly submitQuizButton = 'button:has-text("Submit Quiz")';
  private readonly quizResults = '[data-testid="quiz-results"]';
  private readonly quizScore = '[data-testid="quiz-score"]';

  // Certificate
  private readonly certificateSection = '[data-testid="certificate-section"]';
  private readonly downloadCertificateButton = 'button:has-text("Download Certificate")';

  // Completion status
  private readonly courseCompletedBadge = '[data-testid="course-completed"]';
  private readonly completionPercentage = '[data-testid="completion-percentage"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to course learning page
   */
  async navigateToCourse(courseId: string) {
    await this.goto(`/courses/${courseId}/learn`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for course page to load
   */
  async waitForCourseLoad() {
    await this.waitForSelector(this.courseTitle, 10000);
    await this.waitForSelector(this.contentArea, 10000);
  }

  /**
   * Get course title
   */
  async getCourseTitle(): Promise<string> {
    return await this.getText(this.courseTitle);
  }

  /**
   * Get current lesson title
   */
  async getCurrentLessonTitle(): Promise<string> {
    return await this.getText(this.lessonTitle);
  }

  /**
   * Get course progress percentage
   */
  async getCourseProgress(): Promise<number> {
    const progressText = await this.getText(this.progressPercentage);
    return parseInt(progressText.replace('%', '')) || 0;
  }

  /**
   * Get list of all lessons
   */
  async getAllLessons(): Promise<string[]> {
    return await this.getAllTexts(this.lessonItem);
  }

  /**
   * Click on a specific lesson
   */
  async clickLesson(lessonTitle: string) {
    await this.click(`${this.lessonItem}:has-text("${lessonTitle}")`);
    await this.wait(1000); // Wait for lesson to load
  }

  /**
   * Play video
   */
  async playVideo() {
    if (await this.isVisible(this.playButton)) {
      await this.click(this.playButton);
      await this.wait(500);
    }
  }

  /**
   * Pause video
   */
  async pauseVideo() {
    if (await this.isVisible(this.pauseButton)) {
      await this.click(this.pauseButton);
      await this.wait(500);
    }
  }

  /**
   * Check if video is playing
   */
  async isVideoPlaying(): Promise<boolean> {
    return await this.isVisible(this.pauseButton);
  }

  /**
   * Go to next lesson
   */
  async goToNextLesson() {
    await this.click(this.nextLessonButton);
    await this.wait(1000);
  }

  /**
   * Go to previous lesson
   */
  async goToPreviousLesson() {
    await this.click(this.previousLessonButton);
    await this.wait(1000);
  }

  /**
   * Mark lesson as complete
   */
  async markLessonComplete() {
    await this.click(this.markCompleteButton);
    await this.wait(500);
  }

  /**
   * Check if lesson is marked as complete
   */
  async isLessonComplete(lessonTitle: string): Promise<boolean> {
    return await this.isVisible(
      `${this.lessonItem}:has-text("${lessonTitle}") ${this.completedLesson}`
    );
  }

  /**
   * Open resources tab
   */
  async openResources() {
    await this.click(this.resourcesTab);
    await this.waitForSelector(this.resourceList);
  }

  /**
   * Download a resource
   */
  async downloadResource(resourceName: string) {
    await this.openResources();
    const resource = this.page.locator(this.resourceList).filter({ hasText: resourceName });
    await resource.locator(this.downloadButton).click();
  }

  /**
   * Open notes tab
   */
  async openNotes() {
    await this.click(this.notesTab);
    await this.waitForSelector(this.notesTextarea);
  }

  /**
   * Add a note
   */
  async addNote(noteText: string) {
    await this.openNotes();
    await this.fill(this.notesTextarea, noteText);
    await this.click(this.saveNoteButton);
    await this.wait(500);
  }

  /**
   * Get all notes
   */
  async getAllNotes(): Promise<string[]> {
    await this.openNotes();
    return await this.getAllTexts(`${this.notesList} [data-testid="note-item"]`);
  }

  /**
   * Open discussion tab
   */
  async openDiscussion() {
    await this.click(this.discussionTab);
    await this.waitForSelector(this.questionInput);
  }

  /**
   * Post a question in discussion
   */
  async postQuestion(question: string) {
    await this.openDiscussion();
    await this.fill(this.questionInput, question);
    await this.click(this.postQuestionButton);
    await this.wait(500);
  }

  /**
   * Open quiz tab
   */
  async openQuiz() {
    await this.click(this.quizTab);
    await this.waitForSelector(this.startQuizButton);
  }

  /**
   * Start quiz
   */
  async startQuiz() {
    await this.openQuiz();
    await this.click(this.startQuizButton);
    await this.waitForSelector(this.quizQuestion);
  }

  /**
   * Answer quiz question
   */
  async answerQuizQuestion(answerIndex: number) {
    const answers = await this.page.locator(this.quizAnswer).all();
    if (answers[answerIndex]) {
      await answers[answerIndex].click();
      await this.wait(300);
    }
  }

  /**
   * Submit quiz
   */
  async submitQuiz() {
    await this.click(this.submitQuizButton);
    await this.waitForSelector(this.quizResults);
  }

  /**
   * Get quiz score
   */
  async getQuizScore(): Promise<number> {
    const scoreText = await this.getText(this.quizScore);
    return parseInt(scoreText) || 0;
  }

  /**
   * Complete entire course
   */
  async completeCourse() {
    const lessons = await this.getAllLessons();

    for (const lesson of lessons) {
      await this.clickLesson(lesson);
      await this.wait(1000);

      // Play video if present
      if (await this.isVisible(this.videoPlayer)) {
        await this.playVideo();
        await this.wait(2000); // Watch for 2 seconds
        await this.pauseVideo();
      }

      // Mark as complete
      await this.markLessonComplete();
      await this.wait(500);
    }
  }

  /**
   * Check if course is completed
   */
  async isCourseCompleted(): Promise<boolean> {
    return await this.isVisible(this.courseCompletedBadge);
  }

  /**
   * Download certificate
   */
  async downloadCertificate() {
    await this.scrollToElement(this.certificateSection);
    await this.click(this.downloadCertificateButton);
  }

  /**
   * Check if certificate is available
   */
  async isCertificateAvailable(): Promise<boolean> {
    return await this.isVisible(this.downloadCertificateButton);
  }

  /**
   * Back to course overview
   */
  async backToCourse() {
    await this.click(this.backToCourseButton);
    await this.waitForNavigation();
  }

  /**
   * Assert on course learning page
   */
  async assertOnCoursePage() {
    await this.assertUrl(this.courseUrlPattern);
    await this.assertVisible(this.courseTitle);
  }

  /**
   * Assert lesson is current
   */
  async assertCurrentLesson(lessonTitle: string) {
    await this.assertVisible(`${this.lessonItem}:has-text("${lessonTitle}") ${this.currentLesson}`);
  }

  /**
   * Assert course progress
   */
  async assertCourseProgress(expectedPercentage: number) {
    const actualProgress = await this.getCourseProgress();
    if (actualProgress !== expectedPercentage) {
      throw new Error(
        `Expected course progress to be ${expectedPercentage}%, but got ${actualProgress}%`
      );
    }
  }

  /**
   * Assert course completed
   */
  async assertCourseCompleted() {
    await this.assertVisible(this.courseCompletedBadge);
  }

  /**
   * Get completion percentage
   */
  async getCompletionPercentage(): Promise<number> {
    const percentText = await this.getText(this.completionPercentage);
    return parseInt(percentText.replace('%', '')) || 0;
  }

  /**
   * Toggle fullscreen
   */
  async toggleFullscreen() {
    await this.click(this.fullscreenButton);
    await this.wait(500);
  }
}
