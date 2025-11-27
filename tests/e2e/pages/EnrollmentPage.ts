/**
 * Enrollment Page Object
 * Represents the course enrollment flow
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class EnrollmentPage extends BasePage {
  // Enrollment modal/page selectors
  private readonly enrollmentModal = '[data-testid="enrollment-modal"]';
  private readonly enrollmentForm = '[data-testid="enrollment-form"]';
  private readonly modalTitle = `${this.enrollmentModal} h2`;

  // Course information
  private readonly courseTitle = '[data-testid="enrollment-course-title"]';
  private readonly coursePrice = '[data-testid="enrollment-course-price"]';
  private readonly courseDuration = '[data-testid="enrollment-course-duration"]';

  // Enrollment type selection
  private readonly individualOption = 'input[value="individual"]';
  private readonly familyOption = 'input[value="family"]';
  private readonly corporateOption = 'input[value="corporate"]';

  // Individual enrollment
  private readonly enrollIndividualButton = 'button:has-text("Enroll Now")';
  private readonly startLearningButton = 'button:has-text("Start Learning")';

  // Family enrollment
  private readonly familyMemberCount = '[data-testid="family-member-count"]';
  private readonly addFamilyMemberButton = 'button:has-text("Add Family Member")';
  private readonly familyMemberInput = 'input[name*="familyMember"]';

  // Corporate enrollment
  private readonly companyNameInput = 'input[name="companyName"]';
  private readonly employeeCountInput = 'input[name="employeeCount"]';
  private readonly requestQuoteButton = 'button:has-text("Request Quote")';

  // Payment section
  private readonly proceedToPaymentButton = 'button:has-text("Proceed to Payment")';
  private readonly skipPaymentButton = 'button:has-text("Skip")';

  // Success/Error messages
  private readonly successMessage = '[role="alert"]:has-text("success")';
  private readonly errorMessage = '[role="alert"]:has-text("error")';
  private readonly enrollmentConfirmation = '[data-testid="enrollment-confirmation"]';

  // Free course enrollment
  private readonly freeCourseNotice = 'text=This course is free';
  private readonly enrollFreeButton = 'button:has-text("Enroll Free")';

  // Already enrolled
  private readonly alreadyEnrolledMessage = 'text=already enrolled';
  private readonly goToCourseButton = 'button:has-text("Go to Course")';

  // Loading states
  private readonly loadingSpinner = '[data-testid="loading-spinner"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for enrollment modal to appear
   */
  async waitForEnrollmentModal() {
    await this.waitForSelector(this.enrollmentModal, 10000);
  }

  /**
   * Get enrollment course title
   */
  async getCourseTitle(): Promise<string> {
    return await this.getText(this.courseTitle);
  }

  /**
   * Get enrollment course price
   */
  async getCoursePrice(): Promise<string> {
    return await this.getText(this.coursePrice);
  }

  /**
   * Select individual enrollment
   */
  async selectIndividualEnrollment() {
    await this.click(this.individualOption);
    await this.wait(500);
  }

  /**
   * Select family enrollment
   */
  async selectFamilyEnrollment() {
    await this.click(this.familyOption);
    await this.wait(500);
  }

  /**
   * Select corporate enrollment
   */
  async selectCorporateEnrollment() {
    await this.click(this.corporateOption);
    await this.wait(500);
  }

  /**
   * Enroll in free course
   */
  async enrollInFreeCourse() {
    await this.waitForSelector(this.freeCourseNotice, 5000);
    await this.click(this.enrollFreeButton);
    await this.waitForEnrollmentSuccess();
  }

  /**
   * Enroll as individual (paid course)
   */
  async enrollAsIndividual() {
    await this.selectIndividualEnrollment();
    await this.click(this.proceedToPaymentButton);
  }

  /**
   * Enroll as individual and skip payment (for testing)
   */
  async enrollAsIndividualSkipPayment() {
    await this.selectIndividualEnrollment();
    if (await this.isVisible(this.skipPaymentButton)) {
      await this.click(this.skipPaymentButton);
    } else {
      await this.click(this.proceedToPaymentButton);
    }
  }

  /**
   * Add family members
   */
  async addFamilyMembers(count: number) {
    await this.selectFamilyEnrollment();

    for (let i = 0; i < count; i++) {
      await this.click(this.addFamilyMemberButton);
      await this.wait(300);
      await this.fill(`input[name="familyMember${i}"]`, `family${i}@example.com`);
    }
  }

  /**
   * Enroll with family members
   */
  async enrollWithFamily(memberCount: number) {
    await this.addFamilyMembers(memberCount);
    await this.click(this.proceedToPaymentButton);
  }

  /**
   * Request corporate quote
   */
  async requestCorporateQuote(companyName: string, employeeCount: number) {
    await this.selectCorporateEnrollment();
    await this.fill(this.companyNameInput, companyName);
    await this.fill(this.employeeCountInput, employeeCount.toString());
    await this.click(this.requestQuoteButton);
  }

  /**
   * Wait for enrollment success
   */
  async waitForEnrollmentSuccess() {
    await this.waitForSelector(this.successMessage, 15000);
  }

  /**
   * Wait for enrollment error
   */
  async waitForEnrollmentError() {
    await this.waitForSelector(this.errorMessage, 10000);
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
   * Check if already enrolled
   */
  async isAlreadyEnrolled(): Promise<boolean> {
    return await this.isVisible(this.alreadyEnrolledMessage);
  }

  /**
   * Go to course (if already enrolled)
   */
  async goToCourse() {
    await this.click(this.goToCourseButton);
    await this.waitForNavigation();
  }

  /**
   * Start learning after enrollment
   */
  async startLearning() {
    await this.waitForSelector(this.startLearningButton);
    await this.click(this.startLearningButton);
    await this.waitForNavigation();
  }

  /**
   * Check if enrollment confirmation is displayed
   */
  async isEnrollmentConfirmationDisplayed(): Promise<boolean> {
    return await this.isVisible(this.enrollmentConfirmation);
  }

  /**
   * Check if loading
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(this.loadingSpinner);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    if (await this.isLoading()) {
      await this.waitForSelectorHidden(this.loadingSpinner, 30000);
    }
  }

  /**
   * Assert enrollment modal is open
   */
  async assertModalOpen() {
    await this.assertVisible(this.enrollmentModal);
  }

  /**
   * Assert enrollment successful
   */
  async assertEnrollmentSuccessful() {
    await this.assertVisible(this.successMessage);
  }

  /**
   * Assert enrollment failed
   */
  async assertEnrollmentFailed() {
    await this.assertVisible(this.errorMessage);
  }

  /**
   * Assert course title matches
   */
  async assertCourseTitle(expectedTitle: string) {
    await this.assertText(this.courseTitle, expectedTitle);
  }

  /**
   * Assert free course
   */
  async assertFreeCourse() {
    await this.assertVisible(this.freeCourseNotice);
  }

  /**
   * Complete full enrollment flow for free course
   */
  async completeFreeCourseEnrollment() {
    await this.waitForEnrollmentModal();
    await this.enrollInFreeCourse();
    await this.waitForEnrollmentSuccess();
  }

  /**
   * Complete full enrollment flow for paid course (skip payment)
   */
  async completePaidCourseEnrollment() {
    await this.waitForEnrollmentModal();
    await this.enrollAsIndividualSkipPayment();
  }

  /**
   * Check if proceed to payment button is visible
   */
  async hasProceedToPayment(): Promise<boolean> {
    return await this.isVisible(this.proceedToPaymentButton);
  }

  /**
   * Get family member count
   */
  async getFamilyMemberCount(): Promise<number> {
    const countText = await this.getText(this.familyMemberCount);
    return parseInt(countText) || 0;
  }
}
