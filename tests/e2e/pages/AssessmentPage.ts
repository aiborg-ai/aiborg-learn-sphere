/**
 * Assessment Page Object
 * Represents assessment and quiz taking interface
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class AssessmentPage extends BasePage {
  // Assessment list page
  private readonly assessmentsListUrl = '/assessments';
  private readonly pageTitle = 'h1:has-text("Assessments")';
  private readonly assessmentCard = '[data-testid="assessment-card"]';
  private readonly startAssessmentButton = 'button:has-text("Start Assessment")';
  private readonly continueAssessmentButton = 'button:has-text("Continue")';
  private readonly viewResultsButton = 'button:has-text("View Results")';

  // Assessment details
  private readonly assessmentTitle = '[data-testid="assessment-title"]';
  private readonly assessmentDescription = '[data-testid="assessment-description"]';
  private readonly assessmentDuration = '[data-testid="assessment-duration"]';
  private readonly assessmentQuestionCount = '[data-testid="question-count"]';
  private readonly passingScore = '[data-testid="passing-score"]';
  private readonly attemptsRemaining = '[data-testid="attempts-remaining"]';

  // Assessment taking interface
  private readonly questionContainer = '[data-testid="question-container"]';
  private readonly questionNumber = '[data-testid="question-number"]';
  private readonly questionText = '[data-testid="question-text"]';
  private readonly questionImage = '[data-testid="question-image"]';
  private readonly questionOptions = '[data-testid="question-options"]';
  private readonly optionRadio = 'input[type="radio"]';
  private readonly optionCheckbox = 'input[type="checkbox"]';
  private readonly textAnswerInput = 'textarea[name="textAnswer"]';

  // Navigation
  private readonly nextQuestionButton = 'button:has-text("Next")';
  private readonly prevQuestionButton = 'button:has-text("Previous")';
  private readonly submitAssessmentButton = 'button:has-text("Submit Assessment")';
  private readonly saveProgressButton = 'button:has-text("Save Progress")';
  private readonly exitButton = 'button:has-text("Exit")';

  // Timer
  private readonly timerDisplay = '[data-testid="timer"]';
  private readonly timeWarning = '[data-testid="time-warning"]';

  // Question navigation sidebar
  private readonly questionNavSidebar = '[data-testid="question-nav"]';
  private readonly questionNavItem = '[data-testid="question-nav-item"]';
  private readonly answeredQuestion = '[data-testid="answered"]';
  private readonly flaggedQuestion = '[data-testid="flagged"]';
  private readonly flagQuestionButton = 'button[aria-label="Flag question"]';

  // Results page
  private readonly resultsContainer = '[data-testid="results-container"]';
  private readonly scoreDisplay = '[data-testid="score-display"]';
  private readonly percentageScore = '[data-testid="percentage"]';
  private readonly passFailStatus = '[data-testid="pass-fail-status"]';
  private readonly correctAnswersCount = '[data-testid="correct-answers"]';
  private readonly incorrectAnswersCount = '[data-testid="incorrect-answers"]';
  private readonly timeTaken = '[data-testid="time-taken"]';
  private readonly retakeButton = 'button:has-text("Retake Assessment")';
  private readonly reviewAnswersButton = 'button:has-text("Review Answers")';
  private readonly certificateButton = 'button:has-text("Download Certificate")';

  // Answer review
  private readonly reviewQuestion = '[data-testid="review-question"]';
  private readonly userAnswer = '[data-testid="user-answer"]';
  private readonly correctAnswer = '[data-testid="correct-answer"]';
  private readonly explanation = '[data-testid="explanation"]';

  // Confirmation dialogs
  private readonly submitConfirmModal = '[data-testid="submit-confirm-modal"]';
  private readonly confirmSubmitButton = 'button:has-text("Yes, Submit")';
  private readonly cancelSubmitButton = 'button:has-text("Cancel")';
  private readonly exitConfirmModal = '[data-testid="exit-confirm-modal"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to assessments list
   */
  async navigateToAssessments() {
    await this.goto(this.assessmentsListUrl);
    await this.waitForPageLoad();
  }

  /**
   * Start an assessment by title
   */
  async startAssessment(title: string) {
    const card = this.page.locator(this.assessmentCard).filter({ hasText: title });
    await card.locator(this.startAssessmentButton).click();
    await this.waitForSelector(this.questionContainer);
  }

  /**
   * Continue a saved assessment
   */
  async continueAssessment(title: string) {
    const card = this.page.locator(this.assessmentCard).filter({ hasText: title });
    await card.locator(this.continueAssessmentButton).click();
    await this.waitForSelector(this.questionContainer);
  }

  /**
   * Get assessment title
   */
  async getAssessmentTitle(): Promise<string> {
    return await this.getText(this.assessmentTitle);
  }

  /**
   * Get current question number
   */
  async getCurrentQuestionNumber(): Promise<number> {
    const text = await this.getText(this.questionNumber);
    return parseInt(text.match(/\d+/)?.[0] || '1');
  }

  /**
   * Get total question count
   */
  async getTotalQuestions(): Promise<number> {
    const text = await this.getText(this.questionNumber);
    const match = text.match(/of (\d+)/);
    return parseInt(match?.[1] || '0');
  }

  /**
   * Get question text
   */
  async getQuestionText(): Promise<string> {
    return await this.getText(this.questionText);
  }

  /**
   * Select answer for multiple choice (single selection)
   */
  async selectAnswer(optionIndex: number) {
    const options = await this.page.locator(this.optionRadio).all();
    if (options[optionIndex]) {
      await options[optionIndex].click();
      await this.wait(300);
    }
  }

  /**
   * Select multiple answers (checkboxes)
   */
  async selectMultipleAnswers(optionIndices: number[]) {
    for (const index of optionIndices) {
      const checkboxes = await this.page.locator(this.optionCheckbox).all();
      if (checkboxes[index]) {
        await checkboxes[index].click();
        await this.wait(200);
      }
    }
  }

  /**
   * Enter text answer
   */
  async enterTextAnswer(answer: string) {
    await this.fill(this.textAnswerInput, answer);
  }

  /**
   * Go to next question
   */
  async goToNextQuestion() {
    await this.click(this.nextQuestionButton);
    await this.wait(500);
  }

  /**
   * Go to previous question
   */
  async goToPreviousQuestion() {
    await this.click(this.prevQuestionButton);
    await this.wait(500);
  }

  /**
   * Jump to specific question number
   */
  async jumpToQuestion(questionNumber: number) {
    const navItems = await this.page.locator(this.questionNavItem).all();
    if (navItems[questionNumber - 1]) {
      await navItems[questionNumber - 1].click();
      await this.wait(500);
    }
  }

  /**
   * Flag current question for review
   */
  async flagQuestion() {
    await this.click(this.flagQuestionButton);
    await this.wait(300);
  }

  /**
   * Save progress and exit
   */
  async saveProgress() {
    await this.click(this.saveProgressButton);
    await this.wait(1000);
  }

  /**
   * Submit assessment
   */
  async submitAssessment() {
    await this.click(this.submitAssessmentButton);
    await this.waitForSelector(this.submitConfirmModal);
    await this.click(this.confirmSubmitButton);
    await this.waitForSelector(this.resultsContainer, 30000);
  }

  /**
   * Complete full assessment
   */
  async completeAssessment(answers: Array<number | number[] | string>) {
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];

      if (typeof answer === 'number') {
        // Single choice
        await this.selectAnswer(answer);
      } else if (Array.isArray(answer)) {
        // Multiple choice
        await this.selectMultipleAnswers(answer);
      } else if (typeof answer === 'string') {
        // Text answer
        await this.enterTextAnswer(answer);
      }

      // Go to next question (unless it's the last one)
      if (i < answers.length - 1) {
        await this.goToNextQuestion();
      }
    }

    // Submit assessment
    await this.submitAssessment();
  }

  /**
   * Get remaining time
   */
  async getRemainingTime(): Promise<string> {
    return await this.getText(this.timerDisplay);
  }

  /**
   * Check if time warning is shown
   */
  async isTimeWarningShown(): Promise<boolean> {
    return await this.isVisible(this.timeWarning);
  }

  /**
   * Get assessment score
   */
  async getScore(): Promise<number> {
    const scoreText = await this.getText(this.scoreDisplay);
    return parseInt(scoreText.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get percentage score
   */
  async getPercentageScore(): Promise<number> {
    const percentText = await this.getText(this.percentageScore);
    return parseInt(percentText.replace('%', ''));
  }

  /**
   * Check if passed assessment
   */
  async didPassAssessment(): Promise<boolean> {
    const statusText = await this.getText(this.passFailStatus);
    return statusText.toLowerCase().includes('pass');
  }

  /**
   * Get correct answers count
   */
  async getCorrectAnswersCount(): Promise<number> {
    const text = await this.getText(this.correctAnswersCount);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  /**
   * Get time taken
   */
  async getTimeTaken(): Promise<string> {
    return await this.getText(this.timeTaken);
  }

  /**
   * Retake assessment
   */
  async retakeAssessment() {
    await this.click(this.retakeButton);
    await this.waitForSelector(this.questionContainer);
  }

  /**
   * Review answers
   */
  async reviewAnswers() {
    await this.click(this.reviewAnswersButton);
    await this.waitForSelector(this.reviewQuestion);
  }

  /**
   * Download certificate
   */
  async downloadCertificate() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.certificateButton);
    return await downloadPromise;
  }

  /**
   * Exit assessment with confirmation
   */
  async exitAssessment() {
    await this.click(this.exitButton);
    if (await this.isVisible(this.exitConfirmModal)) {
      await this.click('button:has-text("Yes, Exit")');
    }
    await this.waitForNavigation();
  }

  /**
   * Get answered questions count
   */
  async getAnsweredQuestionsCount(): Promise<number> {
    return await this.count(this.answeredQuestion);
  }

  /**
   * Get flagged questions count
   */
  async getFlaggedQuestionsCount(): Promise<number> {
    return await this.count(this.flaggedQuestion);
  }

  /**
   * Assert on assessment page
   */
  async assertOnAssessmentPage() {
    await this.assertVisible(this.questionContainer);
    await this.assertVisible(this.questionText);
  }

  /**
   * Assert on results page
   */
  async assertOnResultsPage() {
    await this.assertVisible(this.resultsContainer);
    await this.assertVisible(this.scoreDisplay);
  }

  /**
   * Assert assessment passed
   */
  async assertPassed() {
    const passed = await this.didPassAssessment();
    if (!passed) {
      throw new Error('Assessment was not passed');
    }
  }

  /**
   * Assert assessment failed
   */
  async assertFailed() {
    const passed = await this.didPassAssessment();
    if (passed) {
      throw new Error('Assessment was passed (expected to fail)');
    }
  }

  /**
   * Get user answer for review
   */
  async getUserAnswer(questionIndex: number): Promise<string> {
    const reviews = await this.page.locator(this.reviewQuestion).all();
    if (reviews[questionIndex]) {
      return (await reviews[questionIndex].locator(this.userAnswer).textContent()) || '';
    }
    return '';
  }

  /**
   * Get correct answer for review
   */
  async getCorrectAnswerForQuestion(questionIndex: number): Promise<string> {
    const reviews = await this.page.locator(this.reviewQuestion).all();
    if (reviews[questionIndex]) {
      return (await reviews[questionIndex].locator(this.correctAnswer).textContent()) || '';
    }
    return '';
  }

  /**
   * Check if question has explanation
   */
  async hasExplanation(questionIndex: number): Promise<boolean> {
    const reviews = await this.page.locator(this.reviewQuestion).all();
    if (reviews[questionIndex]) {
      return await reviews[questionIndex].locator(this.explanation).isVisible();
    }
    return false;
  }
}
